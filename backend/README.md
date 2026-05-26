# BurnPal Backend

Express API for BurnPal authentication and user data sync.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

## Email verification (registration)

Registration requires a 6-digit email verification code:

1. `POST /api/auth/send-verification-code` with `{ "email": "user@example.com" }`
2. `POST /api/auth/register` with `{ "email", "password", "code", "displayName?" }`

Codes expire after 10 minutes. Resend is limited to once per 60 seconds. After 5 failed verify attempts, request a new code.

### SMTP configuration

Set these environment variables to send real verification emails:

| Variable | Required | Description |
|----------|----------|-------------|
| `SMTP_HOST` | Yes* | SMTP server hostname |
| `SMTP_PORT` | No | Port (default `587`; use `465` for implicit TLS) |
| `SMTP_USER` | Yes* | SMTP username |
| `SMTP_PASS` | Yes* | SMTP password |
| `SMTP_FROM` | No | From address (defaults to `SMTP_USER`) |

\* If `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` are not all set, the server logs the verification code to the console instead (useful for local development).

Example providers: Gmail (app password), **QQ Mail** (authorization code), SendGrid, Mailgun, Amazon SES.

### QQ 邮箱（3067938917@qq.com）

1. 登录 [QQ 邮箱](https://mail.qq.com) → **设置** → **账户**
2. 开启 **POP3/SMTP 服务**，按提示用手机验证
3. 点击 **生成授权码**，复制 16 位授权码（不是 QQ 登录密码）
4. 编辑 `backend/.env`，填入：

```env
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_USER=3067938917@qq.com
SMTP_PASS=你的16位授权码
SMTP_FROM=轻鹭 BurnPal <3067938917@qq.com>
```

5. 重启后端：`npm run dev`

启动后若看到 `SMTP ready — sending mail as 3067938917@qq.com` 即表示配置成功。

## Scripts

- `npm run dev` — start with hot reload
- `npm start` — start server
- `npm run build` — compile TypeScript to `dist/`
