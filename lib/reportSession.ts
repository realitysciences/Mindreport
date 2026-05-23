// Reads the sessionStorage keys written by the voice/upload/lens pages.
// Centralising here means a key rename only requires one edit.
//
// Call this inside useEffect (or other browser-only callbacks) — sessionStorage
// is not available during SSR.

export function getReportSession() {
  return {
    transcript: sessionStorage.getItem('mindreport_transcript') ?? '',
    lens:       sessionStorage.getItem('mindreport_lens')       ?? 'pattern',
    subject:    sessionStorage.getItem('mindreport_subject')    ?? 'the person',
  }
}
