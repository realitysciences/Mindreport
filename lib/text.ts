// Speaker detection and alias utilities for transcript/conversation files.

// Detects unique speaker names from a "Speaker: message" formatted transcript.
// Returns up to 2 speakers, ordered by frequency.
export function detectSpeakers(text: string): string[] {
  const lines  = text.split('\n').map(l => l.trim()).filter(Boolean)
  const counts = new Map<string, number>()
  const bump   = (name: string) => counts.set(name, (counts.get(name) ?? 0) + 1)

  const isDateLike = (s: string) =>
    /^\d/.test(s) || /\d{1,2}[/:]\d{1,2}/.test(s) || /^\d{2}:\d{2}/.test(s)

  for (const line of lines) {
    // WhatsApp Android: "12/3/24, 10:00 - Name: message"
    const whatsappAndroid = line.match(/^\d[\d/., :-]+ - (.+?):\s/)
    if (whatsappAndroid) { bump(whatsappAndroid[1].trim()); continue }

    // WhatsApp iOS: "[3/12/24, 10:00:00] Name: message"
    const whatsappIOS = line.match(/^\[[^\]]+\]\s+(.+?):\s/)
    if (whatsappIOS) { bump(whatsappIOS[1].trim()); continue }

    // ISO date bracket: "[2024-03-12 10:00:00] Name: message"
    const isoDateBracket = line.match(/^\[\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}[^\]]*\]\s+(.+?):\s/)
    if (isoDateBracket) { bump(isoDateBracket[1].trim()); continue }

    // Simple "Name: message" pattern (1–6 words, capitalised first letter)
    const simple = line.match(/^([A-Z][^:\n]{0,35}):\s/)
    if (simple && !isDateLike(simple[1])) {
      const name      = simple[1].trim()
      const wordCount = name.split(/\s+/).length
      if (
        wordCount <= 6 &&
        !/^(The|An?|This|That|These|Those|It|So|And|But|If|My|Your|Our|Their)\s/.test(name)
      ) {
        bump(name)
        continue
      }
    }

    // Phone / email as speaker label
    const phoneOrEmail = line.match(/^(\+?[\d(][\d\s().+-]{4,20}|[^\s@:]+@[^\s@:]+):\s/)
    if (phoneOrEmail) { bump(phoneOrEmail[1].trim()); continue }

    // Bracketed speaker: "[Name] message"
    const bracket = line.match(/^\[([^\]]{1,30})\]/)
    if (bracket && !isDateLike(bracket[1])) bump(bracket[1].trim())
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([name]) => name)
}

// Replaces raw speaker labels in text with user-supplied aliases.
// e.g. "+447911 123456:" → "Jamie:"
export function applyAliases(
  text:    string,
  aliases: Record<string, string>,
): string {
  const active = Object.entries(aliases)
    .filter(([, a]) => a.trim())
    .sort(([a], [b]) => b.length - a.length)
  if (!active.length) return text
  const escaped = active.map(([r]) => r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escaped.join('|')})\\s*:`, 'g')
  const map     = new Map(active.map(([r, a]) => [r, a.trim()]))
  return text.replace(pattern, (_, r) => `${map.get(r) ?? r}:`)
}
