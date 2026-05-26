import { randomInt } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { db, type EmailVerificationRow } from './db.js'
import { formatSmtpError, sendVerificationEmail } from './mail.js'

const RESEND_COOLDOWN_MS = 60_000
const EXPIRY_MS = 10 * 60_000
const MAX_ATTEMPTS = 5

export class VerificationError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'VerificationError'
    this.status = status
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function generateCode(): string {
  return String(randomInt(100_000, 1_000_000))
}

export async function requestVerificationCode(email: string): Promise<void> {
  const normalized = normalizeEmail(email)
  const now = Date.now()

  const existing = db
    .prepare('SELECT * FROM email_verifications WHERE email = ?')
    .get(normalized) as EmailVerificationRow | undefined

  if (existing && now - existing.last_sent_at < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.last_sent_at)) / 1000)
    throw new VerificationError(`Please wait ${waitSec}s before requesting a new code`, 429)
  }

  const code = generateCode()
  const codeHash = bcrypt.hashSync(code, 10)
  const expiresAt = now + EXPIRY_MS

  db.prepare(
    `INSERT INTO email_verifications (email, code_hash, expires_at, last_sent_at, attempts)
     VALUES (?, ?, ?, ?, 0)
     ON CONFLICT(email) DO UPDATE SET
       code_hash = excluded.code_hash,
       expires_at = excluded.expires_at,
       last_sent_at = excluded.last_sent_at,
       attempts = 0`,
  ).run(normalized, codeHash, expiresAt, now)

  try {
    await sendVerificationEmail(normalized, code)
  } catch (error) {
    console.error('[BurnPal] Verification email delivery failed:', error)
    throw new VerificationError(formatSmtpError(error), 503)
  }
}

export function verifyRegistrationCode(email: string, code: string): void {
  const normalized = normalizeEmail(email)
  const now = Date.now()

  const row = db
    .prepare('SELECT * FROM email_verifications WHERE email = ?')
    .get(normalized) as EmailVerificationRow | undefined

  if (!row) {
    throw new VerificationError('No verification code found. Request a new code.', 400)
  }

  if (now > row.expires_at) {
    throw new VerificationError('Verification code expired. Request a new code.', 400)
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    throw new VerificationError('Too many failed attempts. Request a new code.', 429)
  }

  const submitted = String(code ?? '').trim()
  if (!/^\d{6}$/.test(submitted) || !bcrypt.compareSync(submitted, row.code_hash)) {
    db.prepare('UPDATE email_verifications SET attempts = attempts + 1 WHERE email = ?').run(normalized)
    throw new VerificationError('Invalid verification code', 400)
  }

  db.prepare('DELETE FROM email_verifications WHERE email = ?').run(normalized)
}
