import nodemailer from 'nodemailer'

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
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

  const port = Number(process.env.SMTP_PORT ?? 587)
  const transporter = nodemailer.createTransport({
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
  })

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER

  await transporter.sendMail({
    from,
    to: email,
    subject: '轻鹭 BurnPal 注册验证码',
    text: `您的注册验证码是：${code}\n\n10 分钟内有效，请勿泄露给他人。\n\n如非本人操作，请忽略此邮件。`,
    html: `<p>您的注册验证码是：<strong style="font-size:20px;letter-spacing:2px">${code}</strong></p><p>10 分钟内有效，请勿泄露给他人。</p><p style="color:#666;font-size:12px">如非本人操作，请忽略此邮件。</p>`,
  })
}
