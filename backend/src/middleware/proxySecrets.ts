import { AsyncLocalStorage } from 'node:async_hooks'
import type { NextFunction, Request, Response } from 'express'

interface RequestStore {
  resendApiKey?: string
  resendFrom?: string
}

export const requestStore = new AsyncLocalStorage<RequestStore>()

function headerValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0]?.trim() ?? ''
  return String(value ?? '').trim()
}

/** Trust Resend credentials forwarded by Vercel Edge (same BURNPAL_PROXY_SECRET on both sides) */
export function proxySecretsMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const expected = String(process.env.BURNPAL_PROXY_SECRET ?? '').trim()
  const secret = headerValue(req.headers['x-burnpal-proxy-secret'])
  const resendKey = headerValue(req.headers['x-burnpal-resend-key'])
  const resendFrom = headerValue(req.headers['x-burnpal-resend-from'])

  const store: RequestStore = {}

  if (expected && secret === expected) {
    if (resendKey) store.resendApiKey = resendKey
    if (resendFrom) store.resendFrom = resendFrom
  }

  requestStore.run(store, () => next())
}

export function getProxyResendApiKey(): string | undefined {
  return requestStore.getStore()?.resendApiKey
}

export function getProxyResendFrom(): string | undefined {
  return requestStore.getStore()?.resendFrom
}
