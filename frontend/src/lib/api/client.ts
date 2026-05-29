const AUTH_TOKEN_KEY = 'burnpal.auth.token'
const AUTH_USER_KEY = 'burnpal.auth.user'

import { agentLog } from '../debugLog'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'
const REQUEST_TIMEOUT_MS = 22_000

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function requestWithRetry<T>(
  path: string,
  init?: RequestInit,
  options?: { maxAttempts?: number; retryStatuses?: number[] },
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 1
  const retryStatuses = options?.retryStatuses ?? [502, 503, 504]
  let lastError: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      agentLog('client.ts:requestWithRetry', 'attempt start', { path, attempt, maxAttempts }, 'C')
      const result = await request<T>(path, init)
      agentLog('client.ts:requestWithRetry', 'attempt ok', { path, attempt }, 'C')
      return result
    } catch (error) {
      lastError = error
      const status = error instanceof ApiError ? error.status : -1
      agentLog('client.ts:requestWithRetry', 'attempt error', { path, attempt, status }, 'C')
      const retryable =
        error instanceof ApiError &&
        retryStatuses.includes(error.status) &&
        attempt < maxAttempts - 1
      if (!retryable) break
      await sleep(1500 * (attempt + 1))
    }
  }

  throw lastError
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`
  const started = Date.now()
  agentLog('client.ts:request', 'fetch start', { path, method: init?.method ?? 'GET' }, 'A')

  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })
  } catch (error) {
    agentLog('client.ts:request', 'fetch threw', {
      path,
      ms: Date.now() - started,
      err: error instanceof Error ? error.name : 'unknown',
    }, 'D')
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new ApiError(
        '连接认证服务超时（后端可能正在唤醒）。请稍后再试，或切换到「注册」用验证码登录。',
        504,
      )
    }
    throw error
  }

  agentLog('client.ts:request', 'fetch done', {
    path,
    status: response.status,
    ms: Date.now() - started,
  }, 'A')

  const raw = await response.text()
  let payload: { error?: string } = {}
  if (raw) {
    const trimmed = raw.trimStart()
    if (trimmed.startsWith('<!') || trimmed.startsWith('<html')) {
      throw new ApiError(
        '认证接口返回了网页而非 JSON。请确认 Vercel 已设置 BACKEND_URL 并完成重新部署。',
        response.status || 502,
      )
    }
    try {
      payload = JSON.parse(raw) as { error?: string }
    } catch {
      const snippet = raw.replace(/\s+/g, ' ').slice(0, 80)
      throw new ApiError(
        response.status === 405
          ? 'Auth API unavailable (405). Check Vercel BACKEND_URL and redeploy.'
          : `Server returned non-JSON (${response.status}): ${snippet}`,
        response.status,
      )
    }
  }

  if (!response.ok) {
    const hint = typeof (payload as { hint?: string }).hint === 'string' ? (payload as { hint?: string }).hint : undefined
    const message = [payload.error, hint].filter(Boolean).join(' ') || `Request failed (${response.status})`
    throw new ApiError(message, response.status)
  }

  return payload as T
}

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function getStoredUser(): { id: string; email: string; displayName: string | null } | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    return raw ? (JSON.parse(raw) as { id: string; email: string; displayName: string | null }) : null
  } catch {
    return null
  }
}

export function saveAuthSession(token: string, user: { id: string; email: string; displayName: string | null }) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

export async function pingAuthHealth() {
  return request<{
    ok: boolean
    emailProvider?: 'resend' | 'smtp' | 'none'
    emailConfigured?: boolean
    emailReachable?: boolean
    smtp?: boolean
    smtpReachable?: boolean
    resend?: boolean
    resendReachable?: boolean
    hint?: string
    verifyError?: string
  }>('/auth/health')
}

export async function sendVerificationCode(email: string) {
  return requestWithRetry<{ ok: boolean; emailProvider?: string; existing?: boolean }>(
    '/auth/send-verification-code',
    {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    },
    { maxAttempts: 3 },
  )
}

export async function registerAccount(input: {
  email: string
  password: string
  verificationCode: string
  displayName?: string
}) {
  return requestWithRetry<{
    token: string
    user: { id: string; email: string; displayName: string | null }
    created?: boolean
  }>(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        password: input.password,
        code: input.verificationCode.trim(),
        displayName: input.displayName,
      }),
    },
    { maxAttempts: 3 },
  )
}

export async function loginAccount(input: { email: string; password: string }) {
  return requestWithRetry<{
    token: string
    user: { id: string; email: string; displayName: string | null }
    hint?: string
  }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        password: input.password,
      }),
    },
    { maxAttempts: 2 },
  )
}

export async function fetchRemoteUserData(token: string) {
  return request<{ data: unknown; updatedAt: number | null }>('/user/data', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function pushRemoteUserData(token: string, data: unknown) {
  return request<{ ok: boolean; updatedAt: number }>('/user/data', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ data }),
  })
}

export async function fetchMe(token: string) {
  return request<{ user: { id: string; email: string; displayName: string | null; createdAt: number } }>(
    '/auth/me',
    { headers: { Authorization: `Bearer ${token}` } },
  )
}

export async function updateAccountProfile(
  token: string,
  input: { displayName?: string | null },
) {
  return request<{ user: { id: string; email: string; displayName: string | null } }>(
    '/auth/profile',
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    },
  )
}

export async function changeAccountPassword(
  token: string,
  input: { currentPassword: string; newPassword: string },
) {
  return request<{ ok: boolean }>('/auth/change-password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  })
}
