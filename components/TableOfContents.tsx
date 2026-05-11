'use client'

import { useEffect, useState } from 'react'

interface Heading { id: string; text: string; num: string }

export default function TableOfContents({ headings, color }: { headings: Heading[]; color: string }) {
  const [active, setActive] = useState<string>('')

  useEffect(() => {
    if (headings.length === 0) return
    const observers: IntersectionObserver[] = []

    // Use a single observer for all headings, track which is most visible
    const visible = new Map<string, number>()

    headings.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            visible.set(id, entry.intersectionRatio)
          } else {
            visible.delete(id)
          }
          // Pick the heading highest on the screen
          if (visible.size > 0) {
            let best = ''
            let bestRatio = -1
            visible.forEach((ratio, hid) => {
              if (ratio > bestRatio) { bestRatio = ratio; best = hid }
            })
            setActive(best)
          }
        },
        { rootMargin: '-60px 0px -60% 0px', threshold: [0, 0.25, 0.5, 1] }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach(o => o.disconnect())
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav aria-label="Table of contents">
      <p
        className="text-[0.55rem] uppercase tracking-widest mb-4"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}
      >
        Contents
      </p>
      <ol className="flex flex-col gap-1">
        {headings.map(({ id, text, num }) => {
          const isActive = active === id
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                className="flex items-baseline gap-2 py-1 transition-colors group"
                style={{ textDecoration: 'none' }}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  setActive(id)
                }}
              >
                <span
                  className="flex-shrink-0 text-[0.55rem]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: isActive ? color : 'var(--text-faint)',
                    transition: 'color 0.15s',
                  }}
                >
                  {num}
                </span>
                <span
                  className="text-[0.7rem] leading-snug"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: isActive ? 'var(--text-hi)' : 'var(--text-lo)',
                    transition: 'color 0.15s',
                  }}
                >
                  {text}
                </span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
