import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About | Mind Report',
  description: 'Mind Report publishes psychological maps of public figures, cultural events, creative works, and archetypes. Each map reads its subject as terrain.',
}

export default function AboutPage() {
  return (
    <div className="px-8 py-16">
      <div className="mx-auto" style={{ maxWidth: '680px' }}>

        <div className="mb-12">
          <p
            className="text-xs uppercase tracking-widest mb-4"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-lo)' }}
          >
            About
          </p>
          <h1
            className="font-bold leading-tight tracking-tight mb-6"
            style={{ color: 'var(--text-hi)', fontSize: '2rem' }}
          >
            Psychological cartography
          </h1>
          <p
            className="text-base leading-relaxed"
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-deck)', fontSize: '1.1rem' }}
          >
            Mind Report reads its subjects as terrain: not judging, not diagnosing, but mapping
            the wound beneath the pattern and the architecture beneath the behavior.
          </p>
        </div>

        <div className="flex flex-col gap-10" style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', lineHeight: '1.9', color: 'var(--text-body)' }}>

          <div>
            <h2 className="text-xs uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-lo)' }}>
              What this is
            </h2>
            <p className="mb-4">
              Mind Report publishes psychological maps of public figures, cultural events, creative works, and recurring human archetypes. Each map identifies the core orientation of its subject, the primary wound that shaped it, the dominant pattern it produces, and the terrain markers that make it legible.
            </p>
            <p>
              The maps are interpretive opinion, not clinical assessment. They are built from the public record: published interviews, documented histories, the subject&apos;s own words, and the pattern of observable behavior over time. Every map carries a disclaimer because the framework is a reading, not a diagnosis.
            </p>
          </div>

          <div>
            <h2 className="text-xs uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-lo)' }}>
              The terrain method
            </h2>
            <p className="mb-4">
              Terrain reading asks: what is the underlying shape of this psychology? Not what did this person do, but what kind of internal landscape produces this behavior reliably, across contexts, over time?
            </p>
            <p className="mb-4">
              The method draws on attachment theory, depth psychology, and the clinical literature on character structure. It is particularly interested in the wound beneath the pattern: the formative experience that organized the psychology into its current shape. Understanding the wound does not excuse the behavior. It explains the mechanism, which is more useful.
            </p>
            <p>
              Key insight labels in each map are interpretive summaries, not diagnoses. The terrain markers are analytical categories, not clinical classifications. The goal is legibility, not judgment.
            </p>
          </div>

          <div>
            <h2 className="text-xs uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-lo)' }}>
              Who makes this
            </h2>
            <p className="mb-4">
              Mind Report is a publication of{' '}
              <a
                href="https://www.relohu.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--text-hi)' }}
              >
                ReLoHu
              </a>
              , a practice that applies the same terrain-reading framework to individuals in private sessions. The maps published here are the public-facing expression of the same methodology: what happens when you apply a rigorous psychological lens to subjects whose interior has become, through their public lives, partially legible.
            </p>
            <p>
              The figures and works chosen for mapping are selected because something in their public record is psychologically instructive. The maps are not profiles or criticism. They are readings.
            </p>
          </div>

          <div>
            <h2 className="text-xs uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-lo)' }}>
              Get your own map
            </h2>
            <p className="mb-6">
              The same quality of analysis available in these public maps is available for private individuals through ReLoHu sessions. A personal terrain reading uses your own history, relationships, and patterns as the material, with full information rather than reconstructed signal.
            </p>
            <a
              href="https://www.relohu.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded text-xs uppercase tracking-widest transition-colors"
              style={{ border: '0.5px solid var(--border)', color: 'var(--text-nav)', fontFamily: 'var(--font-mono)' }}
            >
              ReLoHu.com
            </a>
          </div>

        </div>

        <div
          className="mt-16 pt-6 text-xs"
          style={{ borderTop: '0.5px solid var(--border)', fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}
        >
          <Link href="/legal" style={{ color: 'var(--text-faint)' }}>
            Legal and disclaimer
          </Link>
          {' '}·{' '}
          <Link href="/contact" style={{ color: 'var(--text-faint)' }}>
            Contact
          </Link>
        </div>

      </div>
    </div>
  )
}
