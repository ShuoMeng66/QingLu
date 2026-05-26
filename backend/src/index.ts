import 'dotenv/config'
import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { authRouter } from './routes/auth.js'
import { userDataRouter } from './routes/userData.js'

const PORT = Number(process.env.PORT ?? 8787)

const app = express()

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '2mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'burnpal-backend' })
})

app.use('/api/auth', authRouter)
app.use('/api/user/data', userDataRouter)

app.listen(PORT, () => {
  const smtpReady = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  )
  console.log(`BurnPal backend listening on http://127.0.0.1:${PORT}`)
  if (smtpReady) {
    console.log(`SMTP ready — sending mail as ${process.env.SMTP_USER}`)
  } else {
    console.log('SMTP not configured — verification codes will print to console')
    console.log('Set SMTP_PASS in backend/.env (QQ mail authorization code) to send real emails')
  }
})
