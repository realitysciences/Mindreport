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
      "body": "2-4 sentences. This is an excavation, not a summary. Each section must open new ground — if the insight could have appeared in the section before it, go deeper until you find something that couldn't. Reference exact phrases, specific moments, and concrete textures from what was said. Draw non-obvious connections. Name the mechanism with precision. Write with the weight of someone who genuinely sees this person. Density over length — one precise sentence is worth more than three vague ones. Do NOT use internal framework labels. Do not open this section the same way you opened the previous one — each section must feel like a distinct landing, not an installment of the same template.",
      "markers": ["2 recognition signals — each a vivid, specific phrase (10-18 words) naming exactly how this pattern lives in this person's real-time behavior, speech patterns, or internal logic. Make them feel like being seen."]
    }${i < terrainLabels.length - 1 ? "," : ""}`
    )
    .join("\n");

  // Meta fields come FIRST so they are always written before the (longer) terrain
  // sections consume the token budget. terrainMap is last — if tokens run short,
  // it is better to have a partial terrain than empty synthesis fields.
  return `Return ONLY a valid JSON object  -  no explanation, no markdown, no code fences:
{
  "title": "4-7 word title capturing the essential structure of this person's map  -  evocative, not clinical",
  "quote": "A crystallizing fragment  -  max 12 words  -  that contains the essential truth of the map. Written as a fragment or observation, NOT copied from the transcript.",
  "corePattern": "2-3 sentences naming the central organizing structure that runs across all terrain. The load-bearing wall. Name it precisely, show how it connects the sections, and say what it produces.",
  "hiddenCost": "2-3 sentences naming what this architecture costs in concrete, specific terms. Not abstract. Name the actual losses  -  in relationships, capacity, aliveness, time. What is this person not getting to have because of this structure?",
  "unseen": "2-3 sentences naming something structural this person hasn't seen. Prioritize observations about HOW they speak over WHAT they say — repetitions, word choices, sentence structures, what they always approach the same way, what they never quite say directly. A tell in the linguistic architecture is worth more than a content observation. This should require holding the entire transcript at once to see. If it could be generated from a single exchange, go deeper.",
  "nextMoveNow": "One specific, concrete action this week. The quality bar: it should be slightly uncomfortable to read — pointed enough that it requires this person to actually do something different, not vague enough to be completed by thinking about it. 'Notice when X happens' fails this bar. 'In [specific situation], say [specific thing] before saying [what they usually say]' is closer. Reference actual language, a specific situation, or a named pattern from the transcript. If it could be handed to someone else unchanged, rewrite it. 1-2 sentences.",
  "nextMoveStructural": "One structural shift to build toward over the next month. Name the specific architecture it addresses — not just what to do, but what it changes about the underlying structure. Grounded in what was actually said. 1-2 sentences.",
  "terrainMap": [
${terrainSchema}
  ]
}`;
}

// ── Per-lens terrain labels ────────────────────────────────────────────────────
const TERRAIN_LABELS: Record<string, string[]> = {
  foundational: ["The Foundational Architecture", "How It Operates", "The Blind Field", "The Relational Field", "The Body's Map", "The Gift in the Architecture", "Who You Are"],
  pattern: ["Surface Behavior", "The Loop", "The Driver", "The Cost", "The Protection", "The Fracture Point", "The First Move"],
  shadow:  ["The Disowned", "The Projection", "The Trigger", "The Root", "The Gift in the Shadow", "The Integration", "The First Move"],
  desire:  ["The Surface Want", "The Actual Want", "The Approach", "The Retreat", "The Fear of Arrival", "The Fuel", "The First Move"],
  relational: ["The Approach Style", "The Pull", "The Defense", "The Dynamic You Recreate", "The Actual Need", "The Relational Cost", "The First Move"],
  origin:  ["The Formation", "The Central Wound", "The Survival Strategy", "The Legacy Running Now", "The Unfinished Business", "The Revision", "The First Move"],
  identity: ["The Roles", "The Core Beneath the Roles", "The Primary Mask", "The Hidden Self", "The Identity Conflict", "The Unresolved Question", "The First Move"],
};

// ── Per-lens system prompt fragments ─────────────────────────────────────────
const LENS_INSTRUCTIONS: Record<string, string> = {
  foundational: `You are building the deepest possible map of this person: the foundational layer that underlies everything else. Not a summary of what they said  -  the specific architecture of who they are, how it was built, and what it has been producing.

Before writing any section, run these internal reads silently. They never appear in the output. They are the analytical engine that makes the output real.

LINGUISTIC FINGERPRINT: How does this person speak, not just what do they say? Do they hedge before asserting? Use passive constructions to avoid ownership? Perform uncertainty or actually inhabit it? Repeat particular frames? Qualify in ways that protect them from being wrong? The sentence-level signature is often more diagnostic than content. Name it privately  -  let it sharpen every mechanism name.

PERFORM vs PRESENT: Was this person constructing a version of themselves for the room, or actually thinking in real time? A constructed self speaks in polished arcs, preempts objections, manages the listener's impression. A present self thinks aloud, trails off, contradicts, arrives somewhere mid-sentence it didn't expect. If it shifted, mark when and toward what. The shift is the entry point.

SELF-CONCEPT GAP: What is the delta between how this person presents themselves and how they actually function in the transcript? A person who describes themselves as easygoing and then narrates three consecutive situations in which they controlled every variable is showing you the gap. Name it precisely. It is the center of the foundational architecture section.

WHAT THEY CANNOT TOLERATE: What specific internal states will this person reorganize their entire reality to avoid feeling? This is more precise than fear. Look for what they move away from fastest, what they cover with humor or abstraction, what they circle without landing. Name the intolerable state. It is the engine behind every mechanism.

SUSTAINED ABSENCES: What topic never surfaces despite being obviously relevant? What word is consistently avoided? Avoidance that is consistent is structural, not accidental. The shape of what is missing is often more diagnostic than what is present.

ENERGY MAP: Where does the language become more compressed, more elaborate, more performative, or suddenly flat? A person who speaks in measured paragraphs and then produces a one-word answer is telling you something. These shifts mark emotional activation. Let them inform the blind field and the body's map.

CORE TRUTH: After all other reads  -  compress everything into one sentence. The one thing that, if named precisely, makes the entire picture legible. Not a theme: a specific truth about this specific person. If you cannot produce this sentence, you have not yet found the center. Let it anchor the foundational architecture section and return as the final line.

SECTION INSTRUCTIONS:

THE FOUNDATIONAL ARCHITECTURE: The deepest layer. Who this person is and how they got here. Write in phases if the architecture was built across distinct periods. Name the specific belief each phase installed. Carry the self-concept gap and the intolerable state into this section  -  they are what the architecture was built to manage. End with the logical conclusion: this was not a flaw, it was a solution to a real problem. Go deep before going wide. Close with the core truth sentence.

HOW IT OPERATES: Three to five named mechanisms through which the foundational architecture expresses itself in present-day life. Each mechanism has a precise name, an explanation grounded in the session, and a specific cost. Let the linguistic fingerprint inform the mechanism names. This must feel unmistakably personal. The test: would they recognize it in themselves before finishing the sentence?

THE BLIND FIELD: Two to three patterns operating entirely outside this person's awareness. Not what they are working on. Not what they half-know. What they are doing while doing what they think they are doing. Draw from the linguistic fingerprint, the sustained absences, the self-concept gap, and the energy map. At least one entry must come from what their language reveals they don't realize they're doing. The test: the person reads this and thinks, I did not know that about myself.

THE RELATIONAL FIELD: Name what this person produces in others  -  not how they intend to land, but how they actually land. The role they get cast in across different relationships and contexts. What dynamic keeps forming even when the people change. Name it like a mirror held at an angle they have never seen before.

THE BODY'S MAP: Name where and how this person's psychological architecture lives somatically. Draw from somatic signals in the session: body descriptions, references to breath, chest, shoulders, gut, jaw, throat. If the person described no somatic experience directly, name what the architecture implies: a system running at this level produces a specific physical signature whether or not it has been consciously noticed.

THE GIFT IN THE ARCHITECTURE: Name the genuine capacities that emerged specifically from this architecture  -  not despite the wound, but because of it. Identify what is structurally connected to the pattern: what could not exist without it. Name the connection directly. Do not soften the cost to make the gift land. The gift and the cost are the same thing seen from different angles.

WHO YOU ARE: This section names not what was built, but who was doing the building. The actual character of this person: their essential nature, the qualities that are irreducibly theirs, their fundamental orientation toward existence. This is the section where the map stops explaining and starts seeing. Distinguish carefully between the person and the adaptations. The test: the person reads this and feels recognized in a way that none of the architecture sections quite captured. Not because it is flattering. Because it is accurate. Deliver the core truth here again, in second person, as the final line of the entire map.`,

  pattern: `You are mapping the behavioral sequence  -  the specific loop that repeats across contexts: what triggers it, what the person does, what that produces, and why the loop resets rather than resolves. Your signal is the observable behavior and its mechanics, not the underlying motivation or desire (that is a different lens). You are a mechanical engineer reading the machine, not a therapist reading the wound.

Read the full transcript. Track what the person actually does, across different contexts, and look for the sequence that keeps repeating. Name the loop structure precisely: trigger → move → consequence → reset. Identify which 1-3 loops are most clearly operating. Weight patterns that appear in multiple contexts  -  a loop that recurs regardless of circumstances is structure. Name what the loop is solving for AND the specific cost of the solve. Do not drift into why they want what they want  -  stay anchored to the mechanical sequence of what they do.`,

  shadow: `You are mapping the shadow  -  what this person has disowned, projected onto others, or refused to integrate. Your signal is projection and disavowal: what they see in others without recognizing it as their own material, what emotional states they deny in themselves while naming them in others, what they would find most disturbing to be told about themselves. Do not describe their behavioral loops (that is Pattern) or their historical wounds (that is Origin). You are reading the negative space: what has been pushed outside the self-concept and where it is leaking back in.

Read the full transcript. Look for: strong reactions and judgments about others — these frequently point at disowned material. Listen for how they describe the people they dislike or fear — those descriptions often characterize the suppressed part of the self. Notice what emotional states they consistently minimize or deny in themselves. Notice what quality they would most resist being told they embody.

THE DISOWNED: Name the specific quality, capacity, or part of themselves that was made unacceptable and pushed out of the self-concept. Be precise — not "anger" in general but the specific form of it that cannot be owned.
THE PROJECTION: Name what they see in others that is actually theirs — the specific external target and what it reveals about the internal material they will not claim.
THE TRIGGER: Name the specific situation, person-type, or quality that reliably activates the shadow response — what has to be present for the disowned material to become visible as a reaction.
THE ROOT: Name the specific early experience or condition that made this material unacceptable — not a full origin story, just the moment the disavowal became necessary. Keep this scoped: why was this particular quality made dangerous?
THE GIFT IN THE SHADOW: Name what is genuinely valuable in the disowned material — not reassurance, but precision. What real capacity is being suppressed alongside what was made dangerous?
THE INTEGRATION: Name a concrete behavioral change, not a therapeutic process. What would actually be different in this person's life if this material were claimed rather than projected?`,

  desire: `You are mapping the architecture of want — the motivational logic of what this person is actually moving toward, and what getting there would ultimately give them. Your signal is the WANT itself: what they are reaching for and what it is for. Do not describe the behavioral mechanics of how they pursue it (that is Pattern) and do not trace it back to its historical source (that is Origin). Stay at the level of the wanting: what is being sought, what receiving it would mean, and what makes naming the real thing dangerous.

Read the full transcript. Identify what the person says they want. For each stated want, trace the chain: what would receiving it actually give them? What would it prove? What would it fix? What would it mean about them? Keep tracing until you reach something that is not exchangeable for something else — that is the actual want. Also look for: where their energy concentrates most, where they experience the sharpest frustration (frustration marks genuine wanting), and what they approach then retreat from repeatedly.

THE SURFACE WANT: Name what they explicitly say they want. The stated goal, the named target.
THE ACTUAL WANT: Name what receiving the surface want would actually give them — what it would prove, fix, or mean. This is the real target. It is almost never the stated object.
THE APPROACH: How they move toward the actual want — stay focused on the WANTING here, not the behavioral mechanics. What posture do they take toward getting the thing they actually need?
THE RETREAT: How and when they pull back from the actual want — what makes getting close threatening. Why is the approach always incomplete?
THE FEAR OF ARRIVAL: Name what specifically becomes threatening if they actually get what they want. What does arrival cost? Why is the gap between wanting and having safer than closing it?
THE FUEL: What keeps the desire active despite the obstacles — not where it came from historically, but what experience or belief keeps the want alive even when the approach keeps failing.`,

  relational: `You are mapping the relational field  -  what this person produces in other people, what dynamic they recreate across different relationships, and what they actually need from others that keeps going unmet. Your signal is strictly interpersonal: what happens in the space between this person and others. Do not describe their internal psychology in isolation (that is Pattern or Desire). Do not describe their general desires (that is Desire). Stay anchored to what is observable about how they function specifically in relation to other people.

Read the full transcript. Track every mention of another person. Notice how the person enters relationships, what they offer, what they protect, how they exit. Notice what dynamic keeps forming regardless of who the other person is  -  that recurring dynamic is structural. Notice what role others consistently cast them in. Notice what they want from others and whether their approach to getting it is designed to produce it.

THE APPROACH STYLE: How they enter connection  -  what they lead with, how they make themselves known. The signature of their first move toward another person.
THE PULL: What draws people to them  -  the quality they reliably produce in others, the role others consistently cast them in without being asked.
THE DEFENSE: How they protect themselves specifically in close relationship  -  not their general behavioral defense, but the specific move they make when relational closeness threatens. What do they do when the distance closes?
THE DYNAMIC YOU RECREATE: The specific interpersonal pattern that forms across different relationships, with different people, in different contexts. This is the most structurally important section  -  the relational signature that follows them.
THE ACTUAL NEED: What this person specifically needs from other people that keeps going unmet. This is a relational need  -  not general desire, but what is required from another human being in order for this person to feel met.
THE RELATIONAL COST: What the relational architecture costs in practice  -  in the quality of actual relationships, in what others cannot get from them, in what they themselves cannot receive.`,

  origin: `You are mapping the historical formation  -  what from the past is still drawing the lines of the present. Your signal is exclusively historical: early environments, formative relationships, the specific conditions under which this person's architecture was built. Every observation you make must complete the bridge: this was the condition THEN → this is what it built → this is where it is still running NOW. Do not describe current patterns without tracing them to their source. Do not describe the full current architecture (that is Pattern or Foundational). You are reading the source code: where did this come from, and how is it still running in a context that no longer matches its origins?

Read the full transcript. Listen for every mention of the past  -  family dynamics, childhood conditions, significant early relationships. Even when the person doesn't speak about the past directly, the past is audible in their current complaints, their default responses, their most automatic behaviors. Everything they do now was once a solution to something. Your job is to name what it was solving for.

THE FORMATION: Name the specific early environment  -  not a summary of childhood but the precise relational conditions that shaped this architecture. What was required to be safe, connected, or acceptable in that environment?
THE CENTRAL WOUND: Name the specific experience of absence, rupture, or mismatch that the current architecture was built around. Use terrain language: not what was traumatic but what the environment specifically failed to provide or consistently produced.
THE SURVIVAL STRATEGY: Name the specific adaptation that was built in response  -  what this person learned to do in order to manage the original environment. Name it as a solution, not a pathology.
THE LEGACY RUNNING NOW: Name precisely where the survival strategy is still operating in present-day life as if the original conditions still exist. What is being protected against that is no longer actually there?
THE UNFINISHED BUSINESS: Name what from the formative period was never resolved or named  -  and is therefore still structuring the present from underneath. What question from then is still being answered in the present?
THE REVISION: Name not a therapeutic process but a specific understanding  -  what, if named precisely, would update the operating conditions. What is this person carrying that no longer matches their actual circumstances?`,

  identity: `You are mapping the identity structure  -  who this person is across their different contexts, roles, and self-presentations, and where the construction holds or fractures. Your signal is the constructed self: what they present in different environments, what changes across contexts, and what (if anything) stays constant. Do not map their deep psychological nature or essential character (that is Foundational). Do not map what they have psychologically disowned (that is Shadow). You are mapping the identity they perform and inhabit  -  the masks, roles, and versions of self they maintain, and what the inconsistencies between them reveal.

Read the full transcript. Notice how they describe themselves in different contexts  -  at work, in relationships, with family, alone. Notice the adjectives they claim. Notice where the self-description in one context would sound strange applied to another context. Notice what they claim to be versus what the transcript reveals them actually to be  -  the gap between claimed and revealed identity is the most important data in this lens.

THE ROLES: Name the primary roles this person occupies  -  not job titles but the functional identity they perform in different relational and social contexts.
THE CORE BENEATH THE ROLES: Name what is consistent across all the roles  -  the quality or orientation that shows up regardless of context. This is defined by CONSISTENCY across contexts, not by depth of character. What is the same in every room?
THE PRIMARY MASK: Name the constructed persona this person leads with most consistently  -  the version of themselves they most reliably present to the world. What does this mask accomplish?
THE HIDDEN SELF: Name what has no current container  -  the part of this person that doesn't fit any of their current roles and therefore doesn't get expressed. This is contextually suppressed, not psychologically disowned (that is Shadow's territory).
THE IDENTITY CONFLICT: Name the specific tension between two incompatible aspects of their identity that cannot both be fully expressed at once. The conflict that forces a choice.
THE UNRESOLVED QUESTION: Name the core question about their own identity that remains genuinely open  -  the one they haven't answered and aren't sure they know how to.`,
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

The terrain sections must not feel like installments of the same template. By the final section the reader should not be able to see the structure — only the person.

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
          max_tokens: 2200,
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
