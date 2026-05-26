const AUTH_TOKEN_KEY = 'burnpal.auth.token'
const AUTH_USER_KEY = 'burnpal.auth.user'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const raw = await response.text()
  let payload: { error?: string } = {}
  if (raw) {
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
    throw new ApiError(payload.error ?? `Request failed (${response.status})`, response.status)
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
  return request<{ ok: boolean; smtp: boolean }>('/auth/health')
}

export async function sendVerificationCode(email: string) {
  const maxAttempts = 3
  let lastError: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await request<{ ok: boolean }>('/auth/send-verification-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    } catch (error) {
      lastError = error
      const retryable =
        error instanceof ApiError && [502, 503, 504].includes(error.status) && attempt < maxAttempts - 1
      if (!retryable) break
      await sleep(1500 * (attempt + 1))
    }
  }

  throw lastError
}

export async function registerAccount(input: {
  email: string
  password: string
  verificationCode: string
  displayName?: string
}) {
  return request<{ token: string; user: { id: string; email: string; displayName: string | null } }>(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        code: input.verificationCode,
        displayName: input.displayName,
      }),
    },
  )
}

export async function loginAccount(input: { email: string; password: string }) {
  return request<{ token: string; user: { id: string; email: string; displayName: string | null } }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify(input) },
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
