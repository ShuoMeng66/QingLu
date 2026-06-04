/** Session debug perf logs (NDJSON ingest). */
export function debugPerf(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
): void {
  // #region agent log
  fetch('http://127.0.0.1:7530/ingest/077fc56f-9998-421e-953f-c0c89307702f', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '9a6481',
    },
    body: JSON.stringify({
      sessionId: '9a6481',
      location,
      message,
      data,
      hypothesisId,
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
}
