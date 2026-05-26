import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { db, type UserRow } from '../db.js'
import { requireAuth, signToken } from '../middleware/auth.js'
import {
  normalizeEmail,
  requestVerificationCode,
  VerificationError,
  verifyRegistrationCode,
} from '../verification.js'

export const authRouter = Router()

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
    res.json({ ok: true, message: 'Verification code sent' })
  } catch (err) {
    if (err instanceof VerificationError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    console.error('Failed to send verification code:', err)
    res.status(500).json({ error: 'Failed to send verification code' })
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
