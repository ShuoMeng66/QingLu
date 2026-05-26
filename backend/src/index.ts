import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { getEmailProvider } from './mail.js'
import { proxySecretsMiddleware } from './middleware/proxySecrets.js'
import { authRouter } from './routes/auth.js'
import { userDataRouter } from './routes/userData.js'

const PORT = Number(process.env.PORT ?? 8787)

const app = express()

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '2mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'burnpal-backend' })
})

app.use('/api/auth', proxySecretsMiddleware, authRouter)
app.use('/api/user/data', userDataRouter)

app.listen(PORT, () => {
  const provider = getEmailProvider()
  console.log(`BurnPal backend listening on http://127.0.0.1:${PORT}`)
  if (provider === 'resend') {
    console.log('Email: Resend API (HTTPS)')
  } else if (provider === 'smtp') {
    console.log(`Email: SMTP as ${process.env.SMTP_USER}`)
    if (process.env.RENDER) {
      console.warn(
        'Warning: Render free tier blocks SMTP ports — set RESEND_API_KEY or upgrade Render plan.',
      )
    }
  } else {
    console.log('Email not configured — verification codes will print to console')
    console.log('Set RESEND_API_KEY (Render) or SMTP_* (local) in environment')
  }
})
