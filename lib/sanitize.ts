/** Strip control characters, trim, cap length */
export function sanitizeInput(s: string, max: number): string {
  return s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "").trim().slice(0, max);
}

/** Strip em-dashes and en-dashes from LLM output so they never surface in reports */
export function sanitizeLlmOutput(raw: string): string {
  return raw.replace(/—|–/g, " - ");
}

/**
 * Scrub proprietary ReLoHu framework category names from LLM output
 * before it leaves the server. The analysis uses these as internal scaffolding;
 * the output replaces each with plain-English description so the insight is
 * preserved but the proprietary label is never transmitted to the client.
 */
const RELOHU_SCRUB: [RegExp, string][] = [
  [/\bpeer\s+wound\b/gi,                         "the early wound of not fitting within a peer group"],
  [/\bfather\s+wound\b/gi,                        "the wound of being unseen by the primary figure whose recognition mattered most"],
  [/\binsufficient\s+self\b/gi,                   "the assumption that the unadorned self must be earned or decorated before it is acceptable"],
  [/\bcandy\s+shell\b/gi,                         "a constructed exterior assembled to replace an authentic self that was repeatedly rejected"],
  [/\boffering\s+pattern\b/gi,                    "the compulsive need to give in order to earn presence or justify existence"],
  [/\bprecision\s+of\s+receipt\b/gi,              "the hunger to be seen correctly and named precisely, not merely warmly"],
  [/\bsalt\s*[-\s]?water\s+pattern\b/gi,          "reaching toward receivers who cannot provide what is needed, and continuing anyway"],
  [/\bwrong\s+container\b/gi,                     "staying in a familiar structure that no longer fits because the right one feels more threatening"],
  [/\bcommunity\s+hunger\b/gi,                    "the sustained deficit of aligned peers who operate at the same frequency"],
  [/\bdissolved\s+self\b/gi,                      "the state in which the constructed self temporarily releases and the person beneath becomes briefly accessible"],
  [/\bnode\s+highway\b/gi,                        "an associative cognitive architecture that moves rapidly across terrain through pattern-recognition"],
  [/\bthe\s+reaching\b/gi,                        "the compulsive transmission of interior states toward receivers, often prematurely"],
  [/\binsight[\s\-–]+action\s+gap\b/gi,           "insight functioning as a substitute for structural change rather than a precursor to it"],
  [/\bcoasting\s+on\s+potential\b/gi,             "living from the assumed value of unrealized capacity rather than building toward specific outcomes"],
  [/\bvomit\s+commit\b/gi,                        "releasing interior material in a large discharge toward an unprepared receiver before it has been processed"],
  [/\bmastery\s+drive\b/gi,                       "a deep orientation toward precision and full understanding of whatever is touched"],
  [/\bshame\s+signal\b/gi,                        "the pre-verbal belief that something is fundamentally wrong with the self, not just the behavior"],
  [/\bcontrol\s*[\/]\s*perfectionism\b/gi,        "managing outcomes with precision because uncertainty, not failure, is what is actually intolerable"],
  [/\bfawn\s+response\b/gi,                       "compulsive appeasement - adjusting, softening, agreeing - to prevent conflict or maintain approval"],
  [/\bcollapse\s*[\/]\s*helplessness\b/gi,        "learned helplessness - the strategic giving-up when sustained effort produces no reliable change"],
  [/\bmerger\s+pattern\b/gi,                      "loss of the self-other boundary, over-identifying with another's emotional state"],
  [/\bscarcity\s+engine\b/gi,                     "the chronic belief that there is never enough of whatever matters most"],
  [/\bsplitting\b/gi,                             "all-or-nothing perception with no middle ground"],
  [/\bgrandiosity\b/gi,                           "inflation of the self as a defense against the insufficiency beneath"],
  [/\bhypervigilance\b/gi,                        "the nervous system continuously scanning for threat, never fully landing"],
  [/\bself[\s\-–]+sabotage\b/gi,                  "unconsciously undermining what is wanted because arrival is more threatening than approach"],
  [/\binvisibility\s+preference\b/gi,             "the active choice to not be seen, even when recognition is the stated desire"],
  [/\bcompulsive\s+self[\s\-–]+sufficiency\b/gi,  "refusing to need - building systems to eliminate dependency"],
];

export function scrubProprietaryTerms(raw: string): string {
  let out = raw;
  for (const [pattern, replacement] of RELOHU_SCRUB) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
