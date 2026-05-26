import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { db, type UserRow } from '../db.js'
import { requireAuth, signToken } from '../middleware/auth.js'
import {
  emailHealthHint,
  formatEmailError,
  formatSmtpError,
  getEmailProvider,
  isEmailConfigured,
  isResendConfigured,
  isSmtpConfigured,
  resendKeyDiagnostics,
  verifyResendConnection,
  verifySmtpConnection,
} from '../mail.js'
import {
  normalizeEmail,
  requestVerificationCode,
  VerificationError,
  verifyRegistrationCode,
} from '../verification.js'

export const authRouter = Router()

authRouter.get('/health', async (_req, res) => {
  const provider = getEmailProvider()
  const smtp = isSmtpConfigured()
  const resend = isResendConfigured()
  let smtpReachable = false
  let resendReachable = false
  let smtpError: string | undefined
  let resendError: string | undefined

  // When Resend is active, skip SMTP verify (Render free tier always fails — avoids misleading errors)
  if (smtp && provider !== 'resend') {
    try {
      await verifySmtpConnection()
      smtpReachable = true
    } catch (error) {
      smtpError = formatSmtpError(error)
      console.warn('[BurnPal] SMTP verify failed:', error)
    }
  }

  if (resend) {
    try {
      await verifyResendConnection()
      resendReachable = true
    } catch (error) {
      resendError = formatEmailError(error)
      console.warn('[BurnPal] Resend verify failed:', error)
    }
  }

  const emailReachable = provider === 'resend' ? resendReachable : smtpReachable
  const verifyError = provider === 'resend' ? resendError : smtpError
  const hint = emailHealthHint(provider, emailReachable)
  const resendKey = resendKeyDiagnostics()

  res.json({
    ok: true,
    emailProvider: provider,
    emailConfigured: isEmailConfigured(),
    emailReachable,
    smtp,
    smtpReachable: provider === 'resend' ? false : smtpReachable,
    smtpSkipped: smtp && provider === 'resend',
    resend,
    resendReachable,
    resendKeyPresent: resendKey.present,
    resendKeyFormatOk: resendKey.formatOk,
    resendKeyLooksPlaceholder: resendKey.looksPlaceholder,
    resendKeyLength: resendKey.length,
    resendKeyPrefix: resendKey.prefix,
    resendKeySuffix: resendKey.suffix,
    resendFrom: resend ? (process.env.RESEND_FROM?.trim() || 'BurnPal <onboarding@resend.dev>') : undefined,
    onRender: Boolean(process.env.RENDER),
    hint,
    verifyError,
    smtpError: provider === 'resend' ? undefined : smtpError,
    resendError,
  })
})

authRouter.post('/send-verification-code', async (req, res) => {
  const email = normalizeEmail(String(req.body?.email ?? ''))

  if (!email) {
    res.status(400).json({ error: 'Email is required' })
    return
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    res.status(409).json({ error: 'Email already registered' })
    return
  }

  try {
    await requestVerificationCode(email)
    res.json({
      ok: true,
      message: 'Verification code sent',
      emailProvider: getEmailProvider(),
    })
  } catch (err) {
    if (err instanceof VerificationError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    console.error('Failed to send verification code:', err)
    const detail = err instanceof Error ? err.message : String(err)
    const smtpIssue = /SMTP|timeout|ETIMEDOUT|ECONNREFUSED|ENOTFOUND|EAUTH/i.test(detail)
    res.status(smtpIssue ? 503 : 500).json({
      error: smtpIssue
        ? '邮件服务暂时不可用，请稍后重试或联系管理员检查 SMTP 配置'
        : 'Failed to send verification code',
    })
  }
})

authRouter.post('/register', (req, res) => {
  const email = normalizeEmail(String(req.body?.email ?? ''))
  const password = String(req.body?.password ?? '')
  const code = String(req.body?.code ?? req.body?.verificationCode ?? '')
  const displayName = String(req.body?.displayName ?? '').trim() || null

  if (!email || !password || !code) {
    res.status(400).json({ error: 'Email, password, and verification code are required' })
    return
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' })
    return
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    res.status(409).json({ error: 'Email already registered' })
    return
  }

  try {
    verifyRegistrationCode(email, code)
  } catch (err) {
    if (err instanceof VerificationError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    res.status(500).json({ error: 'Verification failed' })
    return
  }

  const now = Date.now()
  const id = randomUUID()
  const passwordHash = bcrypt.hashSync(password, 10)

  db.prepare(
    `INSERT INTO users (id, email, password_hash, display_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, email, passwordHash, displayName, now, now)

  const token = signToken({ sub: id, email })
  res.status(201).json({
    token,
    user: { id, email, displayName },
  })
})

authRouter.post('/login', (req, res) => {
  const email = normalizeEmail(String(req.body?.email ?? ''))
  const password = String(req.body?.password ?? '')

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  const token = signToken({ sub: user.id, email: user.email })
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
    },
  })
})

authRouter.patch('/profile', requireAuth, (req, res) => {
  const displayName = String(req.body?.displayName ?? '').trim() || null
  const now = Date.now()

  db.prepare('UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?').run(
    displayName,
    now,
    req.auth!.sub,
  )

  const user = db.prepare('SELECT id, email, display_name FROM users WHERE id = ?').get(
    req.auth!.sub,
  ) as Pick<UserRow, 'id' | 'email' | 'display_name'> | undefined

  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
    },
  })
})

authRouter.post('/change-password', requireAuth, (req, res) => {
  const currentPassword = String(req.body?.currentPassword ?? '')
  const newPassword = String(req.body?.newPassword ?? '')

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current and new password are required' })
    return
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' })
    return
  }

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.auth!.sub) as
    | Pick<UserRow, 'password_hash'>
    | undefined

  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    res.status(401).json({ error: 'Current password is incorrect' })
    return
  }

  const passwordHash = bcrypt.hashSync(newPassword, 10)
  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
    passwordHash,
    Date.now(),
    req.auth!.sub,
  )

  res.json({ ok: true })
})

authRouter.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, display_name, created_at FROM users WHERE id = ?').get(
    req.auth!.sub,
  ) as Pick<UserRow, 'id' | 'email' | 'display_name' | 'created_at'> | undefined

  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      createdAt: user.created_at,
    },
  })
})
