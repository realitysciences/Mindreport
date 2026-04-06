import { TerrainMap } from '@/lib/types'

interface Props {
  terrain: TerrainMap
  color: string
  subject: string
}

export function TerrainDiagram({ terrain, color, subject }: Props) {
  const flow = [
    { key: 'wound', label: 'Primary Wound', value: terrain.primaryWound },
    { key: 'pattern', label: 'Dominant Pattern', value: terrain.dominantPattern },
    { key: 'relational', label: 'Relational Style', value: terrain.relationalStyle },
  ]

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: '#0e0e0e', border: '0.5px solid #2a2a2a' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '0.5px solid #2a2a2a' }}
      >
        <span
          className="text-[0.6rem] uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-mono)', color: '#555' }}
        >
          Terrain Topology
        </span>
        <span
          className="text-[0.6rem] uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-mono)', color: color, opacity: 0.7 }}
        >
          {subject}
        </span>
      </div>

      <div className="p-6 flex flex-col gap-8">

        {/* Core orientation — top statement */}
        <div
          className="rounded px-5 py-4"
          style={{ background: color + '12', border: `0.5px solid ${color}40` }}
        >
          <div
            className="text-[0.55rem] uppercase tracking-widest mb-1.5"
            style={{ fontFamily: 'var(--font-mono)', color: color }}
          >
            Core Orientation
          </div>
          <div
            className="text-sm leading-relaxed"
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#e8e4dc' }}
          >
            {terrain.coreOrientation}
          </div>
        </div>

        {/* Flow: Wound → Pattern → Relational Style */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch">
          {flow.map((node, i) => (
            <div key={node.key} className="flex md:flex-row flex-col items-center gap-3 flex-1">
              <div
                className="rounded p-4 flex flex-col gap-1.5 w-full"
                style={{ background: '#141414', border: `0.5px solid #2a2a2a`, flex: 1 }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-1 h-1 rounded-full flex-shrink-0"
                    style={{ background: color }}
                  />
                  <span
                    className="text-[0.55rem] uppercase tracking-widest"
                    style={{ fontFamily: 'var(--font-mono)', color: '#555' }}
                  >
                    {node.label}
                  </span>
                </div>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: '#c8c4bc', paddingLeft: '1rem' }}
                >
                  {node.value}
                </p>
              </div>
              {i < flow.length - 1 && (
                <span
                  className="md:rotate-0 rotate-90 text-xs flex-shrink-0"
                  style={{ color: color, opacity: 0.5 }}
                >
                  →
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Secondary pattern */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-1 h-1 rounded-full flex-shrink-0"
              style={{ background: color, opacity: 0.6 }}
            />
            <span
              className="text-[0.55rem] uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-mono)', color: '#555' }}
            >
              Secondary Pattern
            </span>
          </div>
          <p
            className="text-xs leading-relaxed"
            style={{ color: '#999', paddingLeft: '1rem' }}
          >
            {terrain.secondaryPattern}
          </p>
        </div>

        {/* Markers */}
        <div className="flex flex-col gap-2.5">
          <span
            className="text-[0.55rem] uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)', color: '#555' }}
          >
            Terrain Markers
          </span>
          <div className="flex flex-wrap gap-2">
            {terrain.markers.map((m) => (
              <span
                key={m}
                className="px-3 py-1 rounded-full text-[0.6rem] tracking-wide"
                style={{
                  background: color + '14',
                  border: `0.5px solid ${color}44`,
                  color: color,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
