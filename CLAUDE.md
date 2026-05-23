@AGENTS.md

# Mind Report — Project Context

Mind Report is a psychological mapping tool. Users bring personal material (voice interview or uploaded document/conversation) and receive a structured psychological report viewed through one or more analytical lenses.

## Two input paths

**Voice interview** (`/your-map/voice`)
ElevenLabs WebRTC agent conducts a free-form interview. Transcript is saved to sessionStorage and forwarded to the lens page.

**Document upload** (`/your-map/upload`)
Supports 15 file formats (PDF, DOCX, RTF, TXT, images, VTT/SRT, JSON platform exports, HTML, CSV, ZIP). If 2+ speakers are detected, the user selects which speaker to focus on before generating a map.

Both paths write to sessionStorage:
- `mindreport_transcript` — the raw or alias-applied text
- `mindreport_subject` — `'you'` (second person) or a name (third person)
- `mindreport_input_method` — `'voice'` or `'upload'`

---

## Hard constraints — do not change these without reading why

### Vercel Hobby plan: 60-second execution limit

`export const maxDuration = 60` in every API route is not arbitrary. The free Vercel tier kills serverless functions after 60 seconds. The generate-map route streams the Anthropic response as SSE precisely to keep the edge proxy alive — without streaming, a 30-second generation would time out.

`max_tokens: 2200` in generate-map is the direct consequence. Higher token counts push generation time past 60 seconds. If the project moves to Vercel Pro (`maxDuration: 300`), raise max_tokens to 4000+ and raise `MAX_TRANSCRIPT` proportionally.

### ElevenLabs `overrides` — do not add this key

The `startSession()` call in `app/your-map/voice/page.tsx` intentionally has no `overrides` key. The ElevenLabs SDK's `constructOverrides()` function always emits `{ tts: {}, conversation: {} }` when any overrides key is present. The ElevenLabs backend interprets empty sub-objects as "reset to null" and **disconnects the session immediately** with 0 responses. Use only `dynamicVariables` for runtime customisation.

### JSON schema field ordering in generate-map

The output schema in `buildOutputSchema()` puts all synthesis fields (`title`, `quote`, `corePattern`, `hiddenCost`, `unseen`, `nextMoveNow`, `nextMoveStructural`) **before** `terrainMap`. This is intentional token-budget management. The 7 terrain sections are long. When the model writes them first and runs out of tokens, the high-value synthesis fields end up empty. Writing synthesis first guarantees they are complete even if terrain sections are truncated.

Do not reorder these fields.

### ReLoHu vocabulary — internal only

`RELOHU_VOCAB` in generate-map is a set of proprietary pattern names (Peer Wound, Insufficient Self, Salt Water Pattern, etc.) used as the analytical engine. The model uses them to recognise what it's reading, but the prompt **explicitly forbids them from appearing in any output field**. They must translate into plain, person-specific language in the report. If these names leak into output, the report reads as jargon and the framework is exposed. Never remove the suppression instruction.

---

## Lens architecture

Lenses are defined in `lib/lenses/`. Each lens has:
- An `id`, `label`, `description`, `badge`, and color
- `terrainLabels` — 7 section names that anchor the report structure

The generate-map API has two parallel structures keyed by lens id:
- `TERRAIN_LABELS` — the 7 section names passed to the model
- `LENS_INSTRUCTIONS` — the per-lens analytical instructions

When adding a new lens, update both, and also add it to `LENS_MENU` in `app/api/suggest-lens/route.ts` (omitting it from that file means it can never be AI-recommended).

---

## Speaker detection flow

`lib/text.ts` exports `detectSpeakers` and `applyAliases`.

`detectSpeakers` handles WhatsApp, iMessage, Telegram, ISO-timestamp, and plain `Name:` formats. It returns up to 2 speaker names ordered by frequency.

When ≥ 2 speakers are detected in the parse-document API, `speakers` is included in the response. The upload page enters conversation mode: the user selects which speaker to focus on (or "the dynamic between both"). `applyAliases` is called before writing to sessionStorage so the AI receives the renamed names.

For images and PDFs, speaker detection comes from Claude vision (the model extracts them from the visual structure). For all other formats, `detectSpeakers` runs on the extracted text.

---

## Report generation flow

1. `/your-map/lens` — user selects a lens, sessionStorage is written
2. `/your-map/report` — on mount, reads sessionStorage, calls `/api/generate-map`, streams SSE response
3. The report page accumulates SSE ticks, parses the final JSON event, and renders the map
4. Additional lenses can be run from the report page without leaving it

The generate-map route uses `repairTruncatedJson()` to close any JSON truncated by the token limit before parsing. This is defensive — it handles the case where terrain sections ran long and the model hit max_tokens mid-object.

---

## Key files

| File | Purpose |
|------|---------|
| `app/api/generate-map/route.ts` | Core map generation — lens instructions, schema, streaming |
| `app/api/parse-document/route.ts` | Multi-format file parsing with speaker detection |
| `app/api/suggest-lens/route.ts` | AI lens recommendation (runs in background on upload) |
| `app/your-map/voice/page.tsx` | ElevenLabs WebRTC interview |
| `app/your-map/upload/page.tsx` | File upload + speaker selection |
| `app/your-map/report/page.tsx` | Report rendering + additional lens runner |
| `lib/lenses/` | Lens definitions (id, labels, colors) |
| `lib/text.ts` | Speaker detection and alias utilities |
| `lib/generateMap.ts` | `fetchMap()` client-side helper that reads the SSE stream |
| `lib/reportSession.ts` | sessionStorage read/write helpers |
