import nodemailer from 'nodemailer'

type MailTransporter = ReturnType<typeof nodemailer.createTransport>
export type EmailProvider = 'resend' | 'smtp' | 'none'

let cachedTransporter: MailTransporter | null = null

function envTrim(key: string): string {
  return String(process.env[key] ?? '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
}

export function isResendConfigured(): boolean {
  return Boolean(envTrim('RESEND_API_KEY'))
}

export function resendKeyDiagnostics(): {
  present: boolean
  formatOk: boolean
  prefix: string | null
} {
  const key = envTrim('RESEND_API_KEY')
  return {
    present: Boolean(key),
    formatOk: /^re_[a-zA-Z0-9_]{8,}$/.test(key),
    prefix: key ? `${key.slice(0, 6)}…` : null,
  }
}

export function isSmtpConfigured(): boolean {
  return Boolean(
    envTrim('SMTP_HOST') && envTrim('SMTP_USER') && envTrim('SMTP_PASS'),
  )
}

export function getEmailProvider(): EmailProvider {
  if (isResendConfigured()) return 'resend'
  if (isSmtpConfigured()) return 'smtp'
  return 'none'
}

export function isEmailConfigured(): boolean {
  return getEmailProvider() !== 'none'
}

function smtpUser(): string {
  return envTrim('SMTP_USER')
}

function resolveFromAddress(): string | { name: string; address: string } {
  const user = smtpUser()
  const raw = envTrim('SMTP_FROM')

  if (!user) return raw || 'BurnPal'

  if (!raw || raw === user) {
    return { name: 'BurnPal', address: user }
  }

  const bracketed = raw.match(/^(.+?)\s*<([^>]+)>$/)
  if (bracketed) {
    return { name: bracketed[1].trim(), address: bracketed[2].trim() }
  }

  if (raw.includes('@')) return raw

  return { name: raw, address: user }
}

function resendFromAddress(): string {
  return envTrim('RESEND_FROM') || 'BurnPal <onboarding@resend.dev>'
}

function verificationContent(code: string): { subject: string; text: string; html: string } {
  return {
    subject: '轻鹭 BurnPal 注册验证码',
    text: `您的注册验证码是：${code}\n\n10 分钟内有效，请勿泄露给他人。\n\n如非本人操作，请忽略此邮件。`,
    html: `<p>您的注册验证码是：<strong style="font-size:20px;letter-spacing:2px">${code}</strong></p><p>10 分钟内有效，请勿泄露给他人。</p><p style="color:#666;font-size:12px">如非本人操作，请忽略此邮件。</p>`,
  }
}

function createTransporter(): MailTransporter {
  const port = Number(envTrim('SMTP_PORT') || '587')
  return nodemailer.createTransport({
    host: envTrim('SMTP_HOST'),
    port,
    secure: port === 465,
    auth: {
      user: envTrim('SMTP_USER'),
      pass: envTrim('SMTP_PASS'),
    },
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 15_000,
    tls: port === 465 ? { minVersion: 'TLSv1.2' } : undefined,
  })
}

function getTransporter(): MailTransporter {
  if (!cachedTransporter) {
    cachedTransporter = createTransporter()
  }
  return cachedTransporter
}

export async function verifySmtpConnection(): Promise<void> {
  if (!isSmtpConfigured()) {
    throw new Error('SMTP is not configured')
  }
  await getTransporter().verify()
}

function parseResendApiError(status: number, body: string): string {
  try {
    const json = JSON.parse(body) as { message?: string; name?: string }
    if (json.message) return `Resend ${status}: ${json.message}`
  } catch {
    /* plain text */
  }
  return `Resend API ${status}: ${body.slice(0, 200)}`
}

export async function verifyResendConnection(): Promise<void> {
  const apiKey = envTrim('RESEND_API_KEY')
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const { formatOk } = resendKeyDiagnostics()
  if (!formatOk) {
    throw new Error(
      'RESEND_API_KEY 格式不正确，应以 re_ 开头（在 Render 环境变量中填写，不要加引号）',
    )
  }

  const response = await fetch('https://api.resend.com/domains', {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(12_000),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(parseResendApiError(response.status, body))
  }
}

export async function verifyEmailDelivery(): Promise<void> {
  const provider = getEmailProvider()
  if (provider === 'resend') return verifyResendConnection()
  if (provider === 'smtp') return verifySmtpConnection()
  throw new Error('No email provider configured')
}

async function sendViaResend(email: string, code: string): Promise<void> {
  const apiKey = envTrim('RESEND_API_KEY')
  const { subject, html } = verificationContent(code)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: resendFromAddress(),
      to: [email],
      subject,
      html,
    }),
    signal: AbortSignal.timeout(20_000),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(parseResendApiError(response.status, body))
  }

  const payload = (await response.json()) as { id?: string }
  console.log(`[BurnPal] Verification email sent via Resend (${email}) id=${payload.id ?? 'n/a'}`)
}

async function sendViaSmtp(email: string, code: string): Promise<void> {
  const user = smtpUser()
  const { subject, text, html } = verificationContent(code)
  const transporter = getTransporter()

  const info = await transporter.sendMail({
    from: resolveFromAddress(),
    to: email,
    envelope: { from: user, to: email },
    subject,
    text,
    html,
  })

  console.log(
    `[BurnPal] Verification email accepted by SMTP (${email}) messageId=${info.messageId ?? 'n/a'}`,
  )
}

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const provider = getEmailProvider()

  if (provider === 'none') {
    console.log('')
    console.log('='.repeat(72))
    console.log('[DEV] Email is not configured — verification code (registration):')
    console.log(`  Email: ${email}`)
    console.log(`  Code:  ${code}`)
    console.log('')
    console.log('Set RESEND_API_KEY (recommended on Render free tier) or SMTP_* in .env')
    console.log('='.repeat(72))
    console.log('')
    return
  }

  if (provider === 'resend') {
    await sendViaResend(email, code)
    return
  }

  await sendViaSmtp(email, code)
}

export function formatSmtpError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)

  if (/EAUTH|535|authentication/i.test(message)) {
    return 'SMTP 认证失败，请检查 SMTP_USER / SMTP_PASS（QQ 邮箱需使用授权码）'
  }

  if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND|timeout/i.test(message)) {
    if (process.env.RENDER) {
      return 'Render 免费实例已封锁 SMTP 端口(465/587)。请配置 RESEND_API_KEY（HTTPS 发信），或升级 Render 付费实例。'
    }
    return '无法连接邮件服务器，请检查 SMTP_HOST / SMTP_PORT'
  }

  return message
}

export function formatResendError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (/格式不正确|re_/i.test(message)) return message
  if (/Resend 401|API 401|invalid.*key|unauthorized/i.test(message)) {
    return 'Resend API 密钥无效。请在 Render（后端）环境变量设置 RESEND_API_KEY，并重新 Deploy'
  }
  if (/Resend 403|API 403/i.test(message)) {
    return 'Resend API 权限不足，请重新创建具备 Sending access 的 API Key'
  }
  if (/domain|from|sender/i.test(message)) {
    return 'Resend 发件地址无效：验证域名后设置 RESEND_FROM，测试可用 BurnPal <onboarding@resend.dev>'
  }
  return message.slice(0, 240)
}

export function formatEmailError(error: unknown): string {
  if (getEmailProvider() === 'smtp') {
    return formatSmtpError(error)
  }
  return formatResendError(error)
}

export function emailHealthHint(provider: EmailProvider, reachable: boolean): string | undefined {
  if (reachable) return undefined
  if (provider === 'smtp' && process.env.RENDER) {
    return 'Render 免费版无法使用 QQ/Gmail SMTP。请在 Render 添加 RESEND_API_KEY（resend.com 免费注册），并重新部署。'
  }
  if (provider === 'smtp') {
    return 'SMTP 无法连接，请核对授权码与端口(465)，或改用 RESEND_API_KEY。'
  }
  if (provider === 'resend') {
    return 'Resend 不可用：在 Render 后端（非 Vercel）配置 RESEND_API_KEY 并 Redeploy；测试发件可用 BurnPal <onboarding@resend.dev>'
  }
  return '未配置邮件：设置 RESEND_API_KEY 或 SMTP_*。'
}
