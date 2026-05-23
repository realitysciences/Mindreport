import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { sanitizeInput, sanitizeLlmOutput, scrubProprietaryTerms } from "@/lib/sanitize";

export const maxDuration = 60;

// ── ReLoHu internal vocabulary (never exposed to client) ──────────────────────
const RELOHU_VOCAB = `
CRITICAL  -  INTERNAL FRAMEWORK, NEVER APPEAR IN OUTPUT: The pattern names below are proprietary and must NEVER appear verbatim in any output field. Translate every finding into plain, specific language derived from this person's actual words. If any label below appears word-for-word in your response, you have failed this instruction.

- Peer Wound: early experience of not fitting within a peer group; isolation felt as a fixed condition; reaching toward belonging and finding the door closed before the self had structure to absorb it
- Father Wound: being seen incorrectly or not at all by the primary figure whose recognition was supposed to confirm existence; performing for an audience that never acknowledged the performance
- Insufficient Self: baseline assumption that the unadorned self must be justified, earned, or decorated before it is acceptable; compulsive productivity; apologizing for presence; needing accomplishment to feel entitled to a room
- Candy Shell: constructed exterior replacing an authentic self that was repeatedly rejected; real competence and wit assembled as protection, now the primary mode of contact; sounds slightly too composed for what is being described
- Offering Pattern: compulsive giving to earn presence, secure connection, or justify existence; leading with what can be provided before establishing what is needed; an implicit ledger expecting reciprocity that never quite clears
- Precision of Receipt: hunger not for warmth but for accuracy  -  to be seen correctly and named precisely; frustration with being misread; dismissing affirmation that doesn't land on the actual thing; close to being seen but not quite
- Salt Water Pattern: repeatedly reaching toward receivers who demonstrably cannot provide what is needed, and drinking from that source anyway; the saltiness is known; the reaching continues; disappointment framed as surprise despite established history
- Wrong Container: staying in a familiar role, relationship, or structure that no longer fits; familiar suffering beats unfamiliar freedom; optimizing the wrong container rather than entering a more suitable one
- Community Hunger: sustained structural deficit of aligned peers who operate at the same frequency; not general loneliness  -  the specific starvation of being too precise for most containers; always the most awake person in the room
- Dissolved Self: states where the constructed self temporarily releases  -  through flow, substances, intimacy, nature  -  and the person beneath the architecture becomes briefly accessible; often the most honest data point in the map
- Node Highway: associative cognitive architecture in which thoughts move rapidly across terrain through pattern-recognition, not linear logic; ideas arrive assembled rather than constructed; synthesizes across unrelated domains spontaneously
- The Reaching: compulsive transmission of interior states toward receivers, often the wrong ones, often prematurely; urgency of transmission overrides discrimination about timing and target; offering something precious and having it inadequately held
- Insight-Action Gap: insight functioning as a substitute for structural change rather than a precursor to it; accurate self-analysis coexisting with unchanged behavior; the relief of comprehension temporarily mimics the relief actual change would produce
- Coasting on Potential: living from the assumed value of unrealized capacity; extraordinary capability paired with incomplete projects; sophisticated beginnings without completions; comfort in the approach that does not extend to arrival
- Vomit Commit: releasing interior material in a single large discharge toward an unprepared receiver before it has been processed by the speaker; temporary relief; receiver overwhelmed; speaker left exposed and misread; said too much, felt worse
- Mastery Drive: deep orientation toward precision, competence, and full understanding of whatever is touched; not ambition  -  closer to compulsion toward completeness; goes significantly deeper than required; discomfort with half-answers
- Shame Signal: pre-verbal structural belief that something is fundamentally wrong with the self, not just the behavior; self-punishment exceeds the scale of the error; collapses when criticized as if it confirmed a pre-existing verdict
- Control/Perfectionism: managing outcomes with precision because uncertainty  -  not failure  -  is what is actually intolerable; difficulty delegating; relaxation requires conditions rather than arising; must know the outcome before beginning
- Fawn Response: compulsive appeasement  -  adjusting, softening, agreeing, disappearing  -  to prevent conflict or maintain approval; self reorganized around the other's comfort; leaves interactions unsure what they actually said
- Collapse/Helplessness: learned helplessness; strategic giving-up when sustained effort has produced no reliable change; resignation without peace; flat affect about things that clearly matter; a history of effort followed by withdrawal
- Merger Pattern: loss of the self-other boundary; over-identifying with another's emotional state until the distinction between what I feel and what you feel becomes unclear; describes others' pain as if happening in their own body
- Scarcity Engine: chronic insufficiency belief  -  never enough time, love, recognition, money, safety; structural conviction the supply is finite and the self's claim on it is precarious; difficulty receiving because receiving feels like depletion
- Splitting: all-or-nothing perception; idealization followed by devaluation with no middle ground; absolute language  -  always, never, everyone, no one  -  in relational contexts; intense attachments followed by complete severance
- Grandiosity: inflation of self as defense against the insufficiency beneath; oscillates with shame  -  grandiosity is the shame's pressure valve; claiming exceptionality in ways that feel more like a request than a statement
- Hypervigilance: nervous system continuously scanning for threat signals  -  tone, timing, micro-expressions; the body never fully lands; specific exhaustion of someone who cannot stop watching; interpreting neutrality as a threat
- Self-Sabotage: unconsciously undermining what the stated self says it wants because arrival is more threatening than approach; patterns of near-completion followed by withdrawal; success produces more anxiety than failure
- Invisibility Preference: active choice  -  often beneath awareness  -  to not be seen, even when recognition is the stated desire; being truly seen requires being truly present, which is threatening; shrinks in contexts that offer visibility
- Compulsive Self-Sufficiency: refusing to need; building elaborate internal systems to eliminate dependency; independence as armor rather than preference; difficulty receiving help even when offered; the loneliness of someone who has made themselves impossible to help`.trim();

// ── Output schema ──────────────────────────────────────────────────────────────
function buildOutputSchema(terrainLabels: string[]): string {
  const terrainSchema = terrainLabels
    .map(
      (label, i) => `    {
      "label": "${label}",
      "prominence": "primary, secondary, or supporting — how central this section is to this person's overall map",
      "summary": "one sentence characterizing this terrain for this specific person",
      "body": "3-5 sentences. This is an excavation, not a summary. Reference exact phrases, specific moments, and concrete textures from what was said. Draw non-obvious connections. Name the mechanism with precision. Write with the weight of someone who genuinely sees this person. Do NOT use internal framework labels.",
      "markers": ["2 recognition signals — each a vivid, specific phrase (12-20 words) naming exactly how this pattern lives in this person's real-time behavior, speech patterns, or internal logic. Make them feel like being seen."]
    }${i < terrainLabels.length - 1 ? "," : ""}`
    )
    .join("\n");

  return `Return ONLY a valid JSON object  -  no explanation, no markdown, no code fences:
{
  "title": "4-7 word title capturing the essential structure of this person's map  -  evocative, not clinical",
  "quote": "A crystallizing fragment  -  max 12 words  -  that contains the essential truth of the map. Written as a fragment or observation, NOT copied from the transcript.",
  "terrainMap": [
${terrainSchema}
  ],
  "corePattern": "2-3 sentences naming the central organizing structure that runs across all terrain. The load-bearing wall. Name it precisely, show how it connects the sections, and say what it produces.",
  "hiddenCost": "2-4 sentences naming what this architecture costs in concrete, specific terms. Not abstract. Name the actual losses  -  in relationships, capacity, aliveness, time. What is this person not getting to have because of this structure?",
  "unseen": "2-3 sentences on something this person is probably not conscious of  -  a contradiction in what they shared, a tell, a pattern-within-the-pattern. Something that would genuinely land if they noticed it. Not a restatement of what they already know about themselves.",
  "nextMoveNow": "One specific, concrete action this person could take this week. 1-2 sentences. Earned by the transcript, not generic advice.",
  "nextMoveStructural": "One structural change to build toward over the next month. 1-2 sentences. Something that addresses the architecture itself, not just one symptom of it."
}`;
}

// ── Per-lens terrain labels ────────────────────────────────────────────────────
const TERRAIN_LABELS: Record<string, string[]> = {
  pattern: ["Surface Behavior", "The Loop", "The Driver", "The Cost", "The Protection", "The Fracture Point", "The First Move"],
  shadow:  ["The Disowned", "The Projection", "The Trigger", "The Root", "The Gift in the Shadow", "The Integration", "The First Move"],
  desire:  ["The Surface Want", "The Actual Want", "The Approach", "The Retreat", "The Fear of Arrival", "The Fuel", "The First Move"],
  relational: ["The Approach Style", "The Pull", "The Defense", "The Dynamic You Recreate", "The Actual Need", "The Relational Cost", "The First Move"],
  origin:  ["The Formation", "The Central Wound", "The Survival Strategy", "The Legacy Running Now", "The Unfinished Business", "The Revision", "The First Move"],
  identity: ["The Roles", "The Core Beneath the Roles", "The Primary Mask", "The Hidden Self", "The Identity Conflict", "The Unresolved Question", "The First Move"],
};

// ── Per-lens system prompt fragments ─────────────────────────────────────────
const LENS_INSTRUCTIONS: Record<string, string> = {
  pattern: `You are mapping the person's recurring behavioral and emotional architecture  -  the loops that repeat across contexts regardless of circumstances. Your job is not to describe what they said but to name what their saying reveals about the structure running them.

Read the full transcript. Identify which 1-3 patterns are most clearly operating. Weight patterns that appear repeatedly  -  a pattern that recurs across contexts is structure, not just a signal. Every dominant pattern exists because it is solving a problem. Name the problem it solves AND what it costs.`,

  shadow: `You are mapping the person's shadow  -  what they resist, avoid, disown, or project outward. The shadow is not what is wrong with them; it is what they have refused to integrate. Your job is to trace what is hidden from their self-concept but visible in their reactions, judgments, and what they never mention.

Read the full transcript. Notice what is conspicuously absent. Notice strong reactions and judgments  -  they frequently point at disowned material. Notice where the person's language about others sounds like an unacknowledged description of themselves.`,

  desire: `You are mapping the architecture of what this person actually wants  -  the real want beneath the stated want. Most people pursue stand-ins for their actual desire because naming the real thing directly feels too dangerous. Your job is to trace what is actually driving their choices, energy, and attention underneath the surface narrative.

Read the full transcript. Identify what the person says they want. Then trace what receiving it would actually give them  -  what it would prove, what it would fix, what it would mean about them. That is the actual want.`,

  relational: `You are mapping this person's relational architecture  -  the style, patterns, and dynamics that organize how they connect with and distance from others. This includes how they enter connection, what they offer, what they protect, and the relational dynamic they tend to recreate.

Read the full transcript. Map the attachment and relational signature. Notice how the person talks about others  -  with warmth, caution, longing, frustration, or idealization. Notice what they want from others and whether their approach is likely to produce it.`,

  origin: `You are mapping the formative territory  -  what from this person's past is still drawing the lines of the present. Psychological architecture is always historically sourced. Every adult adaptation was once a survival strategy. Your job is to identify the formation, the wound, and the adaptation  -  and trace where that adaptation is still running today.

Read the full transcript. Listen for moments that reveal formative conditions  -  family dynamics, early experiences, the environments that shaped how safety, love, belonging, and worth were defined. Every current pattern has an origin story.`,

  identity: `You are mapping this person's identity architecture  -  who they are across contexts, roles, and masks. Identity is not a fixed thing; it is a construction maintained through behavior, presentation, and avoidance. Your job is to map what is coherent in their self-concept, where the self fractures across contexts, and what remains unresolved at the center.

Read the full transcript. Notice how the person describes themselves in different contexts. Notice what they claim to be and what they reveal themselves to actually be. Notice the discrepancies  -  those are often the most important data.`,
};

// ── Input limits ───────────────────────────────────────────────────────────────
// MAX_TRANSCRIPT applies to the *compacted* transcript (user words only for
// voice, raw text for uploads). 12,000 chars ≈ 1,800 tokens of input — enough
// to represent a 60-minute interview without blowing the generation budget.
const MAX_TRANSCRIPT = 12_000;
const MAX_LENS       = 50;

function sanitize(s: string, max: number): string {
  return sanitizeInput(s, max);
}

// ── Voice transcript compaction ───────────────────────────────────────────────
// Voice interviews include both sides of the conversation. The interviewer's
// questions can be long and elaborate — good for the conversation, but wasteful
// as model input since we're only mapping the *subject's* words.
//
// This runs BEFORE the length cap so that the cap applies to the subject's
// actual words, not the combined raw conversation. For a 60-minute interview
// the raw transcript might be 80,000+ chars; after compaction the subject's
// responses are typically 15,000-25,000 chars, which then get capped cleanly.
//
// Interviewer turns are replaced with a short [Q] placeholder so Claude knows
// a question was asked without having to process the full text.
//
// Only applied when the transcript matches the voice format ("Interviewer:").
function compactVoiceTranscript(transcript: string): string {
  if (!transcript.includes('Interviewer:')) return transcript;

  const blocks = transcript.split(/\n\n+/);
  const out: string[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('Interviewer:')) {
      out.push('[Q]');
    } else {
      out.push(trimmed);
    }
  }

  return out.join('\n\n');
}

// ── Escape literal newlines inside JSON string values ─────────────────────────
// LLMs sometimes output raw \n / \t inside string values instead of \\n / \\t.
// JSON.parse rejects these. Walk the string and escape them only while inside a
// quoted value (not at structural level).
function escapeJsonStrings(s: string): string {
  let out      = "";
  let inString = false;
  let escaped  = false;

  for (const ch of s) {
    if (escaped)                   { escaped = false; out += ch; continue; }
    if (ch === "\\" && inString)   { escaped = true;  out += ch; continue; }
    if (ch === '"')                { inString = !inString; out += ch; continue; }
    if (inString) {
      if      (ch === "\n") { out += "\\n";  continue; }
      else if (ch === "\r") { out += "\\r";  continue; }
      else if (ch === "\t") { out += "\\t";  continue; }
    }
    out += ch;
  }
  return out;
}

// ── JSON truncation repair ─────────────────────────────────────────────────────
// When max_tokens cuts the response mid-JSON, close any open string then close
// open delimiters in the correct reverse-stack order (not just all ] then all }).
function repairTruncatedJson(s: string): string {
  const stack: ("{" | "[")[] = [];
  let inString = false;
  let escaped  = false;

  for (const ch of s) {
    if (escaped)                   { escaped = false; continue; }
    if (ch === "\\" && inString)   { escaped = true;  continue; }
    if (ch === '"')                { inString = !inString; continue; }
    if (inString)                  continue;
    if      (ch === "{") stack.push("{");
    else if (ch === "[") stack.push("[");
    else if (ch === "}" || ch === "]") stack.pop();
  }

  let out = s;
  if (inString) out += '"';
  for (let i = stack.length - 1; i >= 0; i--) {
    out += stack[i] === "{" ? "}" : "]";
  }
  return out;
}

// ── Frame markers  -  globally unique prefix, no special chars that could be stripped ──
const RESULT_MARKER = "MINDREPORT_RESULT:";
const ERROR_MARKER  = "MINDREPORT_ERROR:";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid request");
  }

  if (typeof body !== "object" || body === null) {
    return errorResponse("Invalid request");
  }

  const b = body as Record<string, unknown>;
  // Compact first so the length cap applies to the subject's words, not the
  // combined raw conversation. For a 60-min voice interview this turns ~80,000
  // chars of raw transcript into ~20,000 chars of user responses, then caps
  // cleanly at MAX_TRANSCRIPT. For uploaded documents nothing changes.
  const rawTranscript = sanitize(typeof b.transcript === "string" ? b.transcript : "", 200_000);
  const transcript    = sanitize(compactVoiceTranscript(rawTranscript), MAX_TRANSCRIPT);
  const lens          = sanitize(typeof b.lens === "string" ? b.lens : "pattern", MAX_LENS);
  const subject       = sanitize(typeof b.subject === "string" ? b.subject : "the person", 200);

  if (transcript.length < 50) {
    return errorResponse("Transcript too short to map.");
  }

  const terrainLabels   = TERRAIN_LABELS[lens]   ?? TERRAIN_LABELS.pattern;
  const lensInstruction = LENS_INSTRUCTIONS[lens] ?? LENS_INSTRUCTIONS.pattern;

  const subjectInstruction = subject === 'you'
    ? `POINT OF VIEW: Write in second person throughout. Address the subject directly as "you" and "your" in every field. Never write "they", "them", "this person", or "the person" when referring to the subject — it is always "you". Every observation is addressed to them personally.`
    : `SUBJECT: You are mapping ${subject}. Write in third person throughout — "they", "them", "their". Do not address the subject directly.`;

  const systemPrompt = `You are a psychological cartographer trained in a precise framework for reading human behavior and interior structure. You create personal psychological maps  -  not diagnoses, not therapy, but accurate, incisive cartography of a person's interior terrain.

${RELOHU_VOCAB}

${lensInstruction}

${subjectInstruction}

Write with specificity. Reference the actual texture of what was said. Be incisive  -  avoid vague clinical phrases. Name exact mechanisms. Every observation must be earned by the transcript  -  nothing generic, nothing that could apply to anyone.

Write with the precision of a psychologist and the voice of a great writer. The map should feel like being accurately seen for the first time.

Every field must be completed. Write with density and weight  -  every sentence should earn its place. The goal is depth, not length: be specific and incisive rather than comprehensive and vague.

${buildOutputSchema(terrainLabels)}`;

  const encoder = new TextEncoder();

  // ── SSE streaming response ────────────────────────────────────────────────────
  // Use Anthropic stream: true so the first token arrives at the client within ~1s.
  // This keeps the Vercel edge proxy alive (no idle timeout) while the full
  // generation runs. We send each Anthropic event as an SSE keepalive tick, then
  // send one final SSE event carrying the parsed result.
  //
  // SSE format:  data: <json>\n\n
  // Markers:     { done: true, result: ... }  |  { error: "..." }
  const sseEvent = (payload: object) =>
    encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropic = new Anthropic();
        const aiStream = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 2000,
          stream: true,
          system: systemPrompt,
          messages: [{ role: "user", content: `<transcript>\n${transcript}\n</transcript>` }],
        });

        let raw = "";
        for await (const event of aiStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            raw += event.delta.text;
          }
          // Emit one dot per Anthropic event  -  keeps proxy alive with real data flow.
          controller.enqueue(encoder.encode("."));
        }

        raw = raw.trim();
        raw = sanitizeLlmOutput(raw);
        raw = scrubProprietaryTerms(raw);

        // Extract JSON: slice from first { to last }
        let parsed: unknown;
        const jsonStart = raw.indexOf("{");
        const jsonEnd   = raw.lastIndexOf("}");
        const jsonSlice = jsonStart !== -1 && jsonEnd > jsonStart
          ? raw.slice(jsonStart, jsonEnd + 1)
          : raw;

        // Escape any literal \n / \t inside string values (common LLM output quirk)
        const jsonStr = escapeJsonStrings(jsonSlice);

        const tryParse = (s: string) => {
          try { return JSON.parse(s) as unknown; } catch { return null; }
        };

        // 1. Try clean extract (escaped version first, then raw slice)
        parsed = tryParse(jsonStr) ?? tryParse(jsonSlice);

        // 2. Truncation repair  -  stack-based so closing order is correct
        if (!parsed) {
          const base    = jsonStart !== -1 ? raw.slice(jsonStart) : raw;
          const repaired = repairTruncatedJson(escapeJsonStrings(base));
          parsed = tryParse(repaired);
        }

        if (!parsed) {
          // Include tail of raw so we can diagnose truncation vs. wrapping
          const tail = raw.slice(-120).replace(/\n/g, "↵");
          controller.enqueue(encoder.encode("\nMINDREPORT_ERROR:JSON parse failed. Tail: " + tail));
        } else {
          controller.enqueue(encoder.encode("\nMINDREPORT_RESULT:" + JSON.stringify(parsed)));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Generation failed";
        console.error("[generate-map] error:", msg);
        controller.enqueue(encoder.encode("\nMINDREPORT_ERROR:" + msg));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

function errorResponse(msg: string) {
  const encoder = new TextEncoder();
  const s = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("\nMINDREPORT_ERROR:" + msg));
      controller.close();
    },
  });
  return new Response(s, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
