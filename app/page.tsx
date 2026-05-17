import Link from 'next/link'
import { getAllMaps } from '@/lib/content'
import { getCategoryColor, categoryLabels } from '@/lib/categoryUtils'
import { MapArticle } from '@/lib/types'
import NewsletterForm from '@/components/NewsletterForm'

export const dynamic = 'force-dynamic'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Decorative compass/terrain SVG for the hero
function HeroDiagram() {
  return (
    <div className="relative w-full h-full flex items-center justify-center" style={{ minHeight: '360px' }}>
      <svg
        viewBox="0 0 440 440"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        style={{ maxWidth: '440px' }}
      >
        {/* Organic topographic contour rings */}
        <path d="M 215,35 C 340,28 415,130 408,225 C 401,318 328,412 218,408 C 108,404 28,315 32,215 C 36,118 92,42 215,35 Z" stroke="#C09230" strokeWidth="0.8" strokeOpacity="0.42" fill="none"/>
        <path d="M 216,76 C 314,70 372,150 367,224 C 361,296 304,370 218,367 C 133,364 70,294 73,216 C 77,140 120,81 216,76 Z" stroke="#C09230" strokeWidth="0.75" strokeOpacity="0.38" fill="none"/>
        <path d="M 217,113 C 290,109 333,168 329,223 C 325,277 283,331 219,329 C 155,327 109,275 111,217 C 113,161 146,117 217,113 Z" stroke="#C09230" strokeWidth="0.7" strokeOpacity="0.34" fill="none"/>
        <path d="M 218,150 C 266,147 294,186 291,222 C 289,257 261,293 219,291 C 177,290 147,256 149,218 C 150,181 171,152 218,150 Z" stroke="#C09230" strokeWidth="0.65" strokeOpacity="0.3" fill="none"/>
        {/* Inner precision circles */}
        {[80, 45, 18].map((r, i) => (
          <circle key={r} cx="220" cy="220" r={r} stroke="#C09230" strokeWidth={0.6} strokeOpacity={0.5 - i * 0.1} />
        ))}
        {/* Cross hairs */}
        <line x1="220" y1="20" x2="220" y2="420" stroke="#C09230" strokeWidth="0.6" strokeOpacity="0.4" />
        <line x1="20" y1="220" x2="420" y2="220" stroke="#C09230" strokeWidth="0.6" strokeOpacity="0.4" />
        {/* Diagonal lines */}
        <line x1="79" y1="79" x2="361" y2="361" stroke="#C09230" strokeWidth="0.5" strokeOpacity="0.25" />
        <line x1="361" y1="79" x2="79" y2="361" stroke="#C09230" strokeWidth="0.5" strokeOpacity="0.25" />
        {/* Scattered field dots */}
        {([
          [60,80],[88,42],[152,28],[292,32],[378,58],[420,108],
          [428,195],[418,298],[382,378],[318,420],[210,432],[128,415],
          [55,368],[22,285],[28,165],[55,115],[380,165],[415,245],
          [135,155],[305,142],[138,288],[308,298],[168,355],[278,360],
          [348,215],[315,340],[95,175],[92,358],[345,348],[175,68],
        ] as [number,number][]).map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i % 5 === 0 ? 1.8 : 1.1} fill="#C09230" fillOpacity={i % 4 === 0 ? 0.6 : 0.35} />
        ))}
        {/* Center dot */}
        <circle cx="220" cy="220" r="7" fill="#C09230" fillOpacity="0.15" />
        <circle cx="220" cy="220" r="4.5" fill="#C09230" fillOpacity="0.9" />
        <circle cx="220" cy="220" r="2" fill="#C09230" />
        {/* Callout: PATTERN */}
        <line x1="220" y1="140" x2="330" y2="110" stroke="#C09230" strokeWidth="0.8" strokeOpacity="0.7" />
        <circle cx="220" cy="140" r="3" fill="#C09230" fillOpacity="0.85" />
        <line x1="330" y1="110" x2="390" y2="110" stroke="#C09230" strokeWidth="0.8" strokeOpacity="0.55" />
        <text x="394" y="107" fill="#C09230" fontSize="8" fontFamily="ui-monospace, monospace" letterSpacing="0.12em" fillOpacity="1">PATTERN</text>
        <text x="394" y="119" fill="#C09230" fontSize="6.5" fontFamily="ui-serif, Georgia, serif" fontStyle="italic" fillOpacity="0.7">Observable</text>
        <text x="394" y="129" fill="#C09230" fontSize="6.5" fontFamily="ui-serif, Georgia, serif" fontStyle="italic" fillOpacity="0.7">behavior</text>
        {/* Callout: ARCHITECTURE */}
        <line x1="240" y1="210" x2="340" y2="195" stroke="#C09230" strokeWidth="0.8" strokeOpacity="0.7" />
        <circle cx="240" cy="210" r="3" fill="#C09230" fillOpacity="0.85" />
        <line x1="340" y1="195" x2="390" y2="195" stroke="#C09230" strokeWidth="0.8" strokeOpacity="0.55" />
        <text x="394" y="192" fill="#C09230" fontSize="8" fontFamily="ui-monospace, monospace" letterSpacing="0.12em" fillOpacity="1">ARCHITECTURE</text>
        <text x="394" y="204" fill="#C09230" fontSize="6.5" fontFamily="ui-serif, Georgia, serif" fontStyle="italic" fillOpacity="0.7">Internal</text>
        <text x="394" y="214" fill="#C09230" fontSize="6.5" fontFamily="ui-serif, Georgia, serif" fontStyle="italic" fillOpacity="0.7">structure</text>
        {/* Callout: WOUND */}
        <line x1="230" y1="290" x2="340" y2="310" stroke="#C09230" strokeWidth="0.8" strokeOpacity="0.7" />
        <circle cx="230" cy="290" r="3" fill="#C09230" fillOpacity="0.85" />
        <line x1="340" y1="310" x2="390" y2="310" stroke="#C09230" strokeWidth="0.8" strokeOpacity="0.55" />
        <text x="394" y="307" fill="#C09230" fontSize="8" fontFamily="ui-monospace, monospace" letterSpacing="0.12em" fillOpacity="1">WOUND</text>
        <text x="394" y="319" fill="#C09230" fontSize="6.5" fontFamily="ui-serif, Georgia, serif" fontStyle="italic" fillOpacity="0.7">Original</text>
        <text x="394" y="329" fill="#C09230" fontSize="6.5" fontFamily="ui-serif, Georgia, serif" fontStyle="italic" fillOpacity="0.7">injury</text>
      </svg>
    </div>
  )
}

// Full-bleed featured card (dark or light variant)
function FeaturedCard({ map, dark = false }: { map: MapArticle; dark?: boolean }) {
  const color = getCategoryColor(map.category)
  const label = categoryLabels[map.category]
  return (
    <Link
      href={`/${map.category}/${map.slug}`}
      className="relative flex flex-col justify-end overflow-hidden rounded-sm group"
      style={{
        minHeight: '420px',
        background: dark ? '#1A1814' : 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Image */}
      {map.image && (
        <div className="absolute inset-0">
          <img
            src={map.image.url}
            alt={map.title}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              opacity: dark ? 0.55 : 0.75,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: dark
                ? 'linear-gradient(to top, rgba(20,18,14,0.95) 0%, rgba(20,18,14,0.5) 50%, transparent 100%)'
                : 'linear-gradient(to top, rgba(250,248,245,0.97) 0%, rgba(250,248,245,0.65) 50%, transparent 100%)',
            }}
          />
        </div>
      )}
      {!map.image && (
        <div
          className="absolute inset-0"
          style={{ background: dark ? `linear-gradient(135deg, ${color}44 0%, #1A1814 100%)` : `linear-gradient(135deg, ${color}22 0%, var(--surface) 100%)` }}
        />
      )}

      {/* Content */}
      <div className="relative p-7 flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-[0.6rem] uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.18em' }}
          >
            {label} · {map.fileNumber}
          </span>
        </div>
        <h2
          className="font-bold leading-tight"
          style={{
            fontFamily: 'var(--font-serif)',
            color: dark ? '#F0ECE4' : 'var(--text-hi)',
            fontSize: 'clamp(1.6rem, 3vw, 2.25rem)',
            letterSpacing: '-0.01em',
          }}
        >
          {map.title}
        </h2>
        <div
          className="w-8 h-px"
          style={{ background: 'var(--accent)', opacity: 0.7 }}
        />
        <p
          className="text-sm leading-relaxed line-clamp-3"
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            color: dark ? '#b0aca4' : 'var(--text-deck)',
          }}
        >
          {map.deck}
        </p>
        <span
          className="mt-2 text-xs transition-opacity group-hover:opacity-70"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.08em' }}
        >
          Explore map →
        </span>
      </div>
    </Link>
  )
}

// Horizontal card with circular image thumbnail
function BrowseCard({ map }: { map: MapArticle }) {
  const color = getCategoryColor(map.category)
  const label = categoryLabels[map.category]
  return (
    <Link
      href={`/${map.category}/${map.slug}`}
      className="flex items-center gap-5 p-5 rounded-sm group transition-colors"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Circular thumbnail */}
      <div className="flex-shrink-0 relative" style={{ width: '88px', height: '88px' }}>
        <div
          className="overflow-hidden rounded-full w-full h-full"
          style={{ border: `1px solid var(--border)` }}
        >
          {map.image ? (
            <img
              src={map.image.url}
              alt={map.title}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${color}33 0%, ${color}11 100%)` }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
                <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
                <circle cx="12" cy="12" r="2" fill={color} fillOpacity="0.4" />
              </svg>
            </div>
          )}
        </div>
        {/* Category icon badge */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center rounded-full"
          style={{ width: '22px', height: '22px', background: 'var(--accent-dark)', border: '2px solid var(--bg)', color: '#F0ECE4', transform: 'translate(-3px, 3px)' }}
        >
          {map.category === 'people' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
          {map.category === 'events' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>}
          {map.category === 'relationships' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
          {map.category === 'works' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
          {map.category === 'archetypes' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
        </div>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <span
          className="text-[0.6rem] uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.14em' }}
        >
          {label} · {map.fileNumber}
        </span>
        <h3
          className="font-bold leading-snug"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: '1.15rem' }}
        >
          {map.title}
        </h3>
        <p
          className="text-xs leading-relaxed line-clamp-2"
          style={{ color: 'var(--text-mid)' }}
        >
          {map.deck}
        </p>
        <span
          className="text-xs mt-1 transition-opacity group-hover:opacity-60"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: '0.65rem', letterSpacing: '0.08em' }}
        >
          Explore →
        </span>
      </div>
    </Link>
  )
}

export default function HomePage() {
  const all = getAllMaps()
  const shuffled = shuffle(all)
  const featured1 = shuffled[0]
  const featured2 = shuffled[1]
  const browse = shuffled.slice(2, 5)

  return (
    <div>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="px-8 pt-16 pb-14" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="mx-auto" style={{ maxWidth: '1200px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-center">

            {/* Left: headline + CTAs */}
            <div className="flex flex-col gap-6">
              <span
                className="text-[0.65rem] uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.2em' }}
              >
                Psychological Maps
              </span>

              <h1
                className="font-bold leading-tight"
                style={{
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--text-hi)',
                  fontSize: 'clamp(2.4rem, 5vw, 3.75rem)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}
              >
                Understand the{' '}
                <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>patterns</em>
                <br />
                behind people, culture,
                <br />
                creativity, and connection.
              </h1>

              <div className="w-12 h-px" style={{ background: 'var(--accent)', opacity: 0.6 }} />

              <p
                className="text-base leading-relaxed"
                style={{ color: 'var(--text-mid)', maxWidth: '480px' }}
              >
                Each map reveals the unseen forces shaping behavior, meaning, and
                impact—across public figures, events, creative works, relationships, and archetypes.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-2">
                <a
                  href="https://www.relohu.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-sm text-sm font-medium transition-opacity hover:opacity-85"
                  style={{
                    background: 'var(--accent-dark)',
                    color: '#F0ECE4',
                    fontFamily: 'var(--font-sans)',
                    letterSpacing: '0.01em',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  Get your own map
                </a>
                <Link
                  href="/search"
                  className="text-sm transition-opacity hover:opacity-70"
                  style={{ color: 'var(--text-mid)', fontFamily: 'var(--font-sans)' }}
                >
                  Explore recent maps →
                </Link>
              </div>
            </div>

            {/* Right: decorative diagram */}
            <div className="hidden lg:flex items-center justify-center">
              <HeroDiagram />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="mx-auto px-8" style={{ maxWidth: '1200px' }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x" style={{ borderColor: 'var(--border)' }}>
            {[
              {
                value: `${all.length}`, label: 'Maps',
                icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>,
              },
              {
                value: '5', label: 'Categories',
                icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
              },
              {
                value: 'People', label: 'to Archetypes',
                icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
              },
              {
                value: 'Free', label: 'to read',
                icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>,
              },
            ].map(({ value, label, icon }) => (
              <div key={label} className="flex flex-col gap-2 px-6 py-5" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--accent)', opacity: 0.75 }}>{icon}</span>
                <span
                  className="font-bold"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: '1.5rem' }}
                >
                  {value}
                </span>
                <span
                  className="text-[0.65rem] uppercase tracking-widest"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured maps ─────────────────────────────────────────────────── */}
      <section className="px-8 py-10" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="mx-auto" style={{ maxWidth: '1200px' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FeaturedCard map={featured1} dark />
            <FeaturedCard map={featured2} dark={false} />
          </div>
        </div>
      </section>

      {/* ── Browse by theme ───────────────────────────────────────────────── */}
      <section className="px-8 py-12" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="mx-auto" style={{ maxWidth: '1200px' }}>
          <div className="flex items-baseline justify-between mb-8">
            <h2
              className="font-bold"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: '1.75rem' }}
            >
              Browse by theme
            </h2>
            <Link
              href="/search"
              className="text-xs transition-opacity hover:opacity-70"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.08em' }}
            >
              View all maps →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {browse.map((m) => (
              <BrowseCard key={m.slug} map={m} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA strip ──────────────────────────────────────────────── */}
      <section className="px-8 py-14" style={{ background: 'var(--surface)' }}>
        <div className="mx-auto" style={{ maxWidth: '1200px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 items-start">

            {/* Brand statement */}
            <div className="flex flex-col gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-full" style={{ border: '1px solid var(--border)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="var(--accent)" strokeWidth="1.5" strokeOpacity="0.7"/>
                  <line x1="12" y1="3" x2="12" y2="21" stroke="var(--accent)" strokeWidth="1" strokeOpacity="0.4"/>
                  <line x1="3" y1="12" x2="21" y2="12" stroke="var(--accent)" strokeWidth="1" strokeOpacity="0.4"/>
                </svg>
              </div>
              <p
                className="font-bold leading-tight"
                style={{
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--text-hi)',
                  fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                  lineHeight: 1.2,
                }}
              >
                We do not map to judge.
                <br />
                We map to{' '}
                <em style={{ color: 'var(--accent)' }}>understand.</em>
              </p>
            </div>

            {/* 3-column links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="flex flex-col gap-3">
                <span className="text-[0.6rem] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>Method</span>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-mid)' }}>Our approach to psychological cartography.</p>
                <Link href="/methodology" className="text-xs transition-opacity hover:opacity-70" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>Learn more →</Link>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-[0.6rem] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>About</span>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-mid)' }}>What Mind Report is and why it exists.</p>
                <Link href="/about" className="text-xs transition-opacity hover:opacity-70" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>Learn more →</Link>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-[0.6rem] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>In The Loop</span>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-mid)' }}>Thoughts, new maps, and cultural analyses.</p>
                <NewsletterForm />
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  )
}
