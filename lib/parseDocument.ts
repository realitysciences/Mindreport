// Types and helpers shared between the upload page and document preview component.

export interface ParseResult {
  text:      string
  wordCount: number
  filename:  string
  method:    string
}

export function fileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const icons: Record<string, string> = { pdf: '⬛', docx: '📄', rtf: '📄', txt: '📝', md: '📝' }
  return icons[ext] ?? '📄'
}

export function methodLabel(method: string): string {
  const map: Record<string, string> = {
    pdf:  'PDF document',
    docx: 'Word document',
    rtf:  'RTF document',
    text: 'Text file',
  }
  return map[method] ?? 'Document'
}
