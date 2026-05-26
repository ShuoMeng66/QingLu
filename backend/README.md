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

### Render 免费版 + Gmail 收不到邮件？

**Render 自 2025-09 起封锁免费实例的 SMTP 出站端口 `25` / `465` / `587`。**

因此 QQ 邮箱 SMTP 在 Render 上会出现：

- `GET /api/auth/health` → `"smtp": true, "smtpReachable": false`
- 本地 `npm run dev` 正常，线上永远超时

**解决办法（二选一）：**

| 方案 | 说明 |
|------|------|
| **A. Resend（推荐）** | HTTPS API，免费层可用。在 Render 环境变量添加 `RESEND_API_KEY` |
| **B. Render 付费实例** | 升级后 465/587 可用，可继续用 QQ SMTP |

### Resend 配置（推荐）

1. 打开 [resend.com](https://resend.com) 注册
2. **API Keys** → 创建密钥 → 填入 Render：`RESEND_API_KEY`
3. **Domains** → 添加并验证你的域名 → 设置  
   `RESEND_FROM=BurnPal <noreply@你的域名.com>`
4. **在 Render 后端服务**（不是 Vercel）添加上述环境变量，然后 **Manual Deploy**
5. 检查 `GET /api/auth/health`（经 Vercel 转发到 Render）：

```json
{
  "ok": true,
  "emailProvider": "resend",
  "emailReachable": true,
  "resend": true,
  "resendReachable": true
}
```

若同时配置了 `RESEND_API_KEY` 与 `SMTP_*`，**优先使用 Resend**（健康检查会跳过 SMTP，避免 Render 误报）。

**常见错误：**

| health 字段 | 含义 |
|-------------|------|
| `resendKeyFormatOk: false` | Key 不是 `re_` 开头，或 Render 里多加了引号/空格 |
| `resendReachable: false` + `resendError` | Key 无效、过期，或填在了 Vercel 而非 Render |
| `verifyError` 仍是 SMTP 文案 | 请部署最新后端（已修复诊断逻辑） |

### QQ 邮箱 SMTP（本地或 Render 付费）

| Variable | Required | Description |
|----------|----------|-------------|
| `SMTP_HOST` | Yes* | e.g. `smtp.qq.com` |
| `SMTP_PORT` | No | `465` (SSL) or `587` (STARTTLS) |
| `SMTP_USER` | Yes* | Full QQ email |
| `SMTP_PASS` | Yes* | **授权码**（不是 QQ 密码） |
| `SMTP_FROM` | No | Defaults to `SMTP_USER` |

1. QQ 邮箱 → 设置 → 账户 → 开启 POP3/SMTP → 生成 **16 位授权码**
2. 填入 `SMTP_PASS`（Render 里不要加多余引号）

### Gmail 仍收不到？

1. 查 **垃圾邮件**、**推广** 标签，搜索「轻鹭 BurnPal」
2. 看 Render **Logs**：`Verification email sent via Resend` 或 `delivery failed`
3. `health` 里 `verifyError` 字段会写明失败原因

## Scripts

- `npm run dev` — start with hot reload
- `npm run build` — compile TypeScript
- `npm start` — run production server
