import nodemailer from 'nodemailer'

type MailTransporter = ReturnType<typeof nodemailer.createTransport>

let cachedTransporter: MailTransporter | null = null

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

function smtpUser(): string {
  return String(process.env.SMTP_USER ?? '').trim()
}

/** QQ 等邮箱要求发件人地址与 SMTP_USER 同域 */
function resolveFromAddress(): string | { name: string; address: string } {
  const user = smtpUser()
  const raw = String(process.env.SMTP_FROM ?? '').trim()

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

function createTransporter(): MailTransporter {
  const port = Number(process.env.SMTP_PORT ?? 587)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
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

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  if (!isSmtpConfigured()) {
    console.log('')
    console.log('='.repeat(72))
    console.log('[DEV] SMTP is not configured — email verification code (registration):')
    console.log(`  Email: ${email}`)
    console.log(`  Code:  ${code}`)
    console.log('')
    console.log('Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (and optional SMTP_FROM)')
    console.log('to send real verification emails.')
    console.log('='.repeat(72))
    console.log('')
    return
  }

  const user = smtpUser()
  const from = resolveFromAddress()
  const transporter = getTransporter()

  const info = await transporter.sendMail({
    from,
    to: email,
    envelope: {
      from: user,
      to: email,
    },
    subject: '轻鹭 BurnPal 注册验证码',
    text: `您的注册验证码是：${code}\n\n10 分钟内有效，请勿泄露给他人。\n\n如非本人操作，请忽略此邮件。`,
    html: `<p>您的注册验证码是：<strong style="font-size:20px;letter-spacing:2px">${code}</strong></p><p>10 分钟内有效，请勿泄露给他人。</p><p style="color:#666;font-size:12px">如非本人操作，请忽略此邮件。</p>`,
  })

  console.log(`[BurnPal] Verification email accepted by SMTP (${email}) messageId=${info.messageId ?? 'n/a'}`)
}

export function formatSmtpError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (/EAUTH|535|authentication/i.test(message)) {
    return 'SMTP 认证失败，请检查 SMTP_USER / SMTP_PASS（QQ 邮箱需使用授权码）'
  }
  if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND|timeout/i.test(message)) {
    return '无法连接邮件服务器，请检查 SMTP_HOST / SMTP_PORT'
  }
  return message
}
