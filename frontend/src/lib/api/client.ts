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

  const payload = (await response.json().catch(() => ({}))) as { error?: string }

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

export async function sendVerificationCode(email: string) {
  return request<{ ok: boolean }>('/auth/send-verification-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
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
