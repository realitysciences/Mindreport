import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Methodology | Mind Report',
  description: 'How Mind Report reads its subjects: the terrain method, sources, and the difference between interpretation and diagnosis.',
  alternates: {
    canonical: 'https://mindreport.ai/methodology',
  },
}

const qa: { q: string; a: string }[] = [
  {
    q: 'What is a terrain map?',
    a: 'A terrain map is a structured psychological reading of a subject based entirely on the public record. Rather than narrating events chronologically, it identifies the underlying shape of the psychology: the core orientation, the primary wound that formed it, the dominant behavioral pattern, and the relational style that pattern produces. The goal is legibility rather than judgment. The map asks what kind of interior landscape produces this behavior reliably, across contexts, over time.',
  },
  {
    q: 'What is the "primary wound"?',
    a: 'The primary wound is the formative experience that organized the psychology into its current shape. It is not necessarily a single event. It is often a sustained condition: years of conditional love, a parent\'s emotional absence, an early experience of abandonment or humiliation that the developing self had no framework to integrate. The wound is the origin of the pattern. Understanding it does not excuse what the pattern produces. It explains the mechanism, which is more useful than moral accounting alone.',
  },
  {
    q: 'What sources do the maps use?',
    a: 'Every map is built from the public record: published memoirs, authorized biographies, documented interviews, court records, public statements, and journalism of record. No private communications, off-record sources, or unverified claims are used. Each map includes a references section listing the primary sources. Where direct quotes are attributed, the source is identified.',
  },
  {
    q: 'Is this the same as a psychological diagnosis?',
    a: 'No. A clinical diagnosis requires a direct therapeutic relationship, formal evaluation under standardized criteria, and access to private history that public maps cannot have. Mind Report\'s terrain maps are interpretive readings, not diagnoses. Phrases like "the wound suggests" or "the pattern indicates" are analytical shorthand for interpretive framing, not clinical conclusions. The disclaimer at the top of every map is not boilerplate. It means exactly what it says.',
  },
  {
    q: 'Why public figures specifically?',
    a: 'Public figures have, through their public lives, made aspects of their psychology legible in ways private individuals have not. Years of interviews, documented behavior, public crises, and the accounts of people who knew them create a partial but meaningful record. The maps do not claim to be complete. They claim to be a reading of what the public record makes available.',
  },
  {
    q: 'What theoretical framework does the method use?',
    a: 'The terrain method draws primarily on attachment theory, object relations, and depth psychology, particularly the work of John Bowlby, Donald Winnicott, Heinz Kohut, and Carl Jung. It is also informed by the clinical literature on character structure and trauma. It is not doctrinally committed to any single school. Where different frameworks illuminate different aspects of the same subject, the map uses both.',
  },
  {
    q: 'Why are some subjects uncomfortable to read about?',
    a: 'Because the method does not sort subjects into good and bad. It applies the same lens to figures who are widely admired and figures who caused serious harm. A psychological reading of Jeffrey Dahmer and a psychological reading of Simone Biles use the same framework, because the framework is about legibility, not moral ranking. This does not mean all behaviors are equivalent. It means understanding what produces a behavior is a distinct question from evaluating the behavior itself.',
  },
  {
    q: 'How is this different from pop psychology or online psychoanalysis?',
    a: 'Three things. First, every interpretive claim is anchored in documented, sourced behavior rather than speculation. Second, the maps maintain consistent epistemic humility: they are readings, not verdicts. Third, the theoretical framework is explicit and traceable. Pop psychology tends to name pathology without explaining mechanism. Terrain maps are interested in mechanism first.',
  },
  {
    q: 'Can I get a terrain map of myself?',
    a: 'Yes. The private session version of this analysis is available through ReLoHu. A personal terrain reading uses your own history, relationships, and patterns as the material, with full information rather than reconstructed signal from the public record. The quality of the reading is significantly deeper.',
  },
]

export default function MethodologyPage() {
  return (
    <div className="px-8 py-16">
      <div className="mx-auto" style={{ maxWidth: '680px' }}>

        <div className="mb-12">
          <span
            className="text-[0.65rem] uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}
          >
            Methodology
          </span>
          <h1
            className="font-bold leading-tight mt-3 mb-5"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: '2.25rem', letterSpacing: '-0.02em' }}
          >
            How the maps work
          </h1>
          <p
            className="text-base leading-relaxed"
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-deck)', fontSize: '1.05rem' }}
          >
            The method, the framework, the sources, and answers to the questions most readers ask after reading their first map.
          </p>
        </div>

        <div className="flex flex-col gap-10">
          {qa.map(({ q, a }) => (
            <div key={q} style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
              <h2
                className="font-bold mb-4 leading-snug"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: '1.15rem' }}
              >
                {q}
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-body)', lineHeight: '1.9' }}
              >
                {a}
              </p>
            </div>
          ))}
        </div>

        <div
          className="mt-16 pt-8 flex flex-col gap-5"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <a
            href="https://www.relohu.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-sm text-sm self-start transition-opacity hover:opacity-85"
            style={{ background: 'var(--accent-dark)', color: '#F0ECE4', fontFamily: 'var(--font-sans)' }}
          >
            Get your own map at ReLoHu.com →
          </a>
          <div className="text-xs flex gap-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
            <Link href="/about" style={{ color: 'var(--text-faint)' }}>About Mind Report</Link>
            <span>·</span>
            <Link href="/legal" style={{ color: 'var(--text-faint)' }}>Legal and disclaimer</Link>
          </div>
        </div>

      </div>
    </div>
  )
}
