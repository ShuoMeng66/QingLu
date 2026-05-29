/** Debug session 9a6481 — remove after auth hang is verified fixed */
export function agentLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
) {
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
