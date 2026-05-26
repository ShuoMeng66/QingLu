import { Router } from 'express'
import { db, type UserDataRow } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

export const userDataRouter = Router()

userDataRouter.get('/', requireAuth, (req, res) => {
  const row = db
    .prepare('SELECT data_json, updated_at FROM user_data WHERE user_id = ?')
    .get(req.auth!.sub) as Pick<UserDataRow, 'data_json' | 'updated_at'> | undefined

  if (!row) {
    res.json({ data: null, updatedAt: null })
    return
  }

  try {
    res.json({
      data: JSON.parse(row.data_json),
      updatedAt: row.updated_at,
    })
  } catch {
    res.status(500).json({ error: 'Corrupted user data on server' })
  }
})

userDataRouter.put('/', requireAuth, (req, res) => {
  const data = req.body?.data
  if (data == null || typeof data !== 'object') {
    res.status(400).json({ error: 'Request body must include a data object' })
    return
  }

  const now = Date.now()
  const json = JSON.stringify(data)

  db.prepare(
    `INSERT INTO user_data (user_id, data_json, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at`,
  ).run(req.auth!.sub, json, now)

  db.prepare('UPDATE users SET updated_at = ? WHERE id = ?').run(now, req.auth!.sub)

  res.json({ ok: true, updatedAt: now })
})
