// Types and helpers shared between the upload page and document preview component.

export interface ParseResult {
  text:      string
  wordCount: number
  filename:  string
  method:    string
  speakers?: string[]   // present when conversation/transcript detected
}

export function fileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const icons: Record<string, string> = {
    pdf: '⬛', docx: '📄', rtf: '📄', txt: '📝', md: '📝',
    png: '🖼', jpg: '🖼', jpeg: '🖼', webp: '🖼',
    vtt: '🎙', srt: '🎙',
    html: '🌐', htm: '🌐',
    json: '{}', csv: '📊', zip: '📦',
  }
  return icons[ext] ?? '📄'
}

export function methodLabel(method: string): string {
  const map: Record<string, string> = {
    pdf:       'PDF document',
    docx:      'Word document',
    rtf:       'RTF document',
    text:      'Text file',
    image:     'Image (vision)',
    vtt:       'VTT transcript',
    srt:       'SRT transcript',
    html:      'HTML export',
    json:      'Data export',
    csv:       'CSV file',
    zip:       'ZIP archive',
  }
  return map[method] ?? 'Document'
}
