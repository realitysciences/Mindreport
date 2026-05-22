import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeInput, sanitizeLlmOutput, scrubProprietaryTerms } from "@/lib/sanitize";

export const maxDuration = 60;

const anthropic = new Anthropic();

// ── ReLoHu internal vocabulary (never exposed to client) ──────────────────────
const RELOHU_VOCAB = `
CRITICAL — INTERNAL FRAMEWORK, NEVER APPEAR IN OUTPUT: The pattern names below are proprietary and must NEVER appear verbatim in any output field. Translate every finding into plain, specific language derived from this person's actual words. If any label below appears word-for-word in your response, you have failed this instruction.

- Peer Wound: early experience of not fitting within a peer group; isolation felt as a fixed condition
- Father Wound: being seen incorrectly or not at all by the primary recognition figure
- Insufficient Self: baseline assumption that the unadorned self must be justified before it is acceptable; compulsive productivity; apologizing for presence
- Candy Shell: constructed exterior replacing an authentic self that was repeatedly rejected; real competence assembled as protection
- Offering Pattern: compulsive giving to earn presence, secure connection, or justify existence; implicit ledger expecting reciprocity
- Precision of Receipt: hunger not for warmth but for accuracy — to be seen correctly and named precisely
- Salt Water Pattern: repeatedly reaching toward receivers who cannot provide what is needed, and drinking from that source anyway
- Wrong Container: staying in a familiar role or structure that no longer fits; familiar suffering beats unfamiliar freedom
- Community Hunger: sustained structural deficit of aligned peers who operate at the same frequency
- Dissolved Self: states where the constructed self temporarily releases and the person beneath becomes briefly accessible
- Node Highway: associative cognitive architecture moving rapidly across terrain through pattern-recognition
- The Reaching: compulsive transmission of interior states toward receivers, often the wrong ones, often prematurely
- Insight-Action Gap: insight functioning as a substitute for structural change rather than a precursor to it
- Coasting on Potential: living from the assumed value of unrealized capacity; extraordinary capability with incomplete projects
- Vomit Commit: releasing interior material in a single large discharge toward an unprepared receiver before it has been processed
- Mastery Drive: deep orientation toward precision and full understanding of whatever is touched
- Shame Signal: pre-verbal structural belief that something is fundamentally wrong with the self
- Control/Perfectionism: managing outcomes because uncertainty, not failure, is what is actually intolerable
- Fawn Response: compulsive appeasement to prevent conflict or maintain approval; self reorganized around the other's comfort
- Collapse/Helplessness: learned helplessness; strategic giving-up when sustained effort produces no reliable change
- Merger Pattern: loss of self-other boundary; over-identifying with another's emotional state
- Scarcity Engine: chronic insufficiency belief — never enough time, love, recognition, money, safety
- Splitting: all-or-nothing perception; idealization followed by devaluation
- Grandiosity: inflation of self as defense against insufficiency beneath; oscillates with shame
- Hypervigilance: nervous system continuously scanning for threat; the body never fully lands
- Self-Sabotage: unconsciously undermining what the stated self wants because arrival is more threatening than approach
- Invisibility Preference: active choice to not be seen, even when recognition is the stated desire
- Compulsive Self-Sufficiency: refusing to need; building elaborate internal systems to eliminate dependency`.trim();

// ── Output schema ──────────────────────────────────────────────────────────────
function buildOutputSchema(terrainLabels: string[]): string {
  const terrainSchema = terrainLabels
    .map(
      (label, i) => `    {
      "label": "${label}",
      "summary": "one sentence characterizing this terrain for this specific person",
      "body": "2-3 paragraphs of specific analysis. Reference the actual texture of what was said. Do NOT use the internal framework labels.",
      "markers": ["2-3 short phrases naming specific features of this terrain in this person"]
    }${i < terrainLabels.length - 1 ? "," : ""}`
    )
    .join("\n");

  return `Return ONLY a valid JSON object — no explanation, no markdown, no code fences:
{
  "title": "4-7 word title capturing the essential structure of this person's map — evocative, not clinical",
  "quote": "A crystallizing fragment — max 12 words — that contains the essential truth of the map. Written as a fragment or observation, NOT copied from the transcript.",
  "terrainMap": [
${terrainSchema}
  ],
  "corePattern": "1-2 sentences naming the central organizing structure that runs across all terrain. The load-bearing wall.",
  "hiddenCost": "1-2 sentences naming what this architecture costs in concrete terms — not abstract, not generic.",
  "nextMove": "One specific, concrete action this particular person could actually take based on what you saw. 1-2 sentences. Never generic advice. Never empty."
}`;
}

// ── Per-lens terrain labels (must match lib/lenses/) ──────────────────────────
const TERRAIN_LABELS: Record<string, string[]> = {
  pattern: [
    "Surface Behavior",
    "The Loop",
    "The Driver",
    "The Cost",
    "The Protection",
    "The Fracture Point",
    "The First Move",
  ],
  shadow: [
    "The Disowned",
    "The Projection",
    "The Trigger",
    "The Root",
    "The Gift in the Shadow",
    "The Integration",
    "The First Move",
  ],
  desire: [
    "The Surface Want",
    "The Actual Want",
    "The Approach",
    "The Retreat",
    "The Fear of Arrival",
    "The Fuel",
    "The First Move",
  ],
  relational: [
    "The Approach Style",
    "The Pull",
    "The Defense",
    "The Dynamic You Recreate",
    "The Actual Need",
    "The Relational Cost",
    "The First Move",
  ],
  origin: [
    "The Formation",
    "The Central Wound",
    "The Survival Strategy",
    "The Legacy Running Now",
    "The Unfinished Business",
    "The Revision",
    "The First Move",
  ],
  identity: [
    "The Roles",
    "The Core Beneath the Roles",
    "The Primary Mask",
    "The Hidden Self",
    "The Identity Conflict",
    "The Unresolved Question",
    "The First Move",
  ],
};

// ── Per-lens system prompt fragments ─────────────────────────────────────────
const LENS_INSTRUCTIONS: Record<string, string> = {
  pattern: `You are mapping the person's recurring behavioral and emotional architecture — the loops that repeat across contexts regardless of circumstances. Your job is not to describe what they said but to name what their saying reveals about the structure running them.

Read the full transcript. Identify which 1-3 patterns are most clearly operating. Weight patterns that appear repeatedly — a pattern that recurs across contexts is structure, not just a signal. Every dominant pattern exists because it is solving a problem. Name the problem it solves AND what it costs.`,

  shadow: `You are mapping the person's shadow — what they resist, avoid, disown, or project outward. The shadow is not what is wrong with them; it is what they have refused to integrate. Your job is to trace what is hidden from their self-concept but visible in their reactions, judgments, and what they never mention.

Read the full transcript. Notice what is conspicuously absent. Notice strong reactions and judgments — they frequently point at disowned material. Notice where the person's language about others sounds like an unacknowledged description of themselves.`,

  desire: `You are mapping the architecture of what this person actually wants — the real want beneath the stated want. Most people pursue stand-ins for their actual desire because naming the real thing directly feels too dangerous. Your job is to trace what is actually driving their choices, energy, and attention underneath the surface narrative.

Read the full transcript. Identify what the person says they want. Then trace what receiving it would actually give them — what it would prove, what it would fix, what it would mean about them. That is the actual want.`,

  relational: `You are mapping this person's relational architecture — the style, patterns, and dynamics that organize how they connect with and distance from others. This includes how they enter connection, what they offer, what they protect, and the relational dynamic they tend to recreate.

Read the full transcript. Map the attachment and relational signature. Notice how the person talks about others — with warmth, caution, longing, frustration, or idealization. Notice what they want from others and whether their approach is likely to produce it.`,

  origin: `You are mapping the formative territory — what from this person's past is still drawing the lines of the present. Psychological architecture is always historically sourced. Every adult adaptation was once a survival strategy. Your job is to identify the formation, the wound, and the adaptation — and trace where that adaptation is still running today.

Read the full transcript. Listen for moments that reveal formative conditions — family dynamics, early experiences, the environments that shaped how safety, love, belonging, and worth were defined. Every current pattern has an origin story.`,

  identity: `You are mapping this person's identity architecture — who they are across contexts, roles, and masks. Identity is not a fixed thing; it is a construction maintained through behavior, presentation, and avoidance. Your job is to map what is coherent in their self-concept, where the self fractures across contexts, and what remains unresolved at the center.

Read the full transcript. Notice how the person describes themselves in different contexts. Notice what they claim to be and what they reveal themselves to actually be. Notice the discrepancies — those are often the most important data.`,
};

// ── Input limits ───────────────────────────────────────────────────────────────
const MAX_TRANSCRIPT = 20_000;
const MAX_LENS       = 50;

// ── Sanitize function ─────────────────────────────────────────────────────────
function sanitize(s: string, max: number): string {
  return sanitizeInput(s, max);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const transcript = sanitize(typeof b.transcript === "string" ? b.transcript : "", MAX_TRANSCRIPT);
  const lens       = sanitize(typeof b.lens       === "string" ? b.lens       : "pattern", MAX_LENS);

  if (transcript.length < 50) {
    return NextResponse.json({ error: "Transcript too short to map." }, { status: 400 });
  }

  const terrainLabels = TERRAIN_LABELS[lens] ?? TERRAIN_LABELS.pattern;
  const lensInstruction = LENS_INSTRUCTIONS[lens] ?? LENS_INSTRUCTIONS.pattern;

  const systemPrompt = `You are a psychological cartographer trained in a precise framework for reading human behavior and interior structure. You create personal psychological maps — not diagnoses, not therapy, but accurate, incisive cartography of a person's interior terrain.

${RELOHU_VOCAB}

${lensInstruction}

Write with specificity. Reference the actual texture of what was said. Be incisive — avoid vague clinical phrases. Name exact mechanisms. Every observation must be earned by the transcript — nothing generic, nothing that could apply to anyone.

Write with the precision of a psychologist and the voice of a great writer. The map should feel like being accurately seen for the first time.

${buildOutputSchema(terrainLabels)}`;

  let raw = "";
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 3000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `<transcript>\n${transcript}\n</transcript>`,
        },
      ],
    });
    raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    raw = sanitizeLlmOutput(raw);
    raw = scrubProprietaryTerms(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch { /* fall through */ }
    }
    if (!parsed) {
      return NextResponse.json({ error: "Could not parse map result." }, { status: 500 });
    }
  }

  return NextResponse.json(parsed);
}
