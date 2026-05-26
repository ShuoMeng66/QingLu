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
4. 环境变量二选一（或两处都配同一 Key）：
   - **仅 Render**：`RESEND_API_KEY` + `RESEND_FROM` → Manual Deploy Render
   - **仅 Vercel**（推荐若你一直在 Vercel 配 Key）：在 **Vercel** 填 `RESEND_API_KEY`；在 **Vercel 与 Render** 填相同 `BURNPAL_PROXY_SECRET`（随机字符串）；然后 **Redeploy Vercel + Render**
5. **Manual Deploy** 两侧（改 env 后必须部署才生效）
6. 检查 `GET /api/auth/health`（经 Vercel 转发到 Render）：

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
| `resendKeySource: "render-env"` 且 invalid | Render 上的 Key 与 Resend 控制台不一致 |
| `resendKeySource: "vercel-proxy"` | 使用 Vercel 转发的 Key（需 `BURNPAL_PROXY_SECRET` 配对） |
| `resendReachable: false` + `resendError` | Key 被 Resend 拒绝，或改 env 后未 Redeploy |
| `Resend 400: API key is invalid` | Render 里的 Key **不是** Resend 控制台当前有效的完整密钥（见下方） |
| `resendKeyLooksPlaceholder: true` | 仍在使用 `re_xxxxxxxx` 等示例，非真实 Key |
| `verifyError` 仍是 SMTP 文案 | 请部署最新后端（已修复诊断逻辑） |

#### `API key is invalid` 逐步排查

1. 打开 https://resend.com/api-keys → **Create API Key** → 权限选 **Full access** / Sending  
2. **立即复制整段** `re_……`（只显示一次；漏字符就会 400 invalid）  
3. Render → 你的 **backend Web Service** → Environment → `RESEND_API_KEY` → **粘贴覆盖**（不要 `Bearer `，不要引号）  
4. 点 **Save Changes** → **Manual Deploy**（改环境变量后必须重新部署）  
5. 在 Resend 控制台对比 Key 旁显示的末几位，与 health 里的 `resendKeySuffix` 是否一致  
6. 本地自测（可选）：`curl -H "Authorization: Bearer re_你的key" https://api.resend.com/domains` 应返回 200 JSON  

**注意：** Vercel 的 `RESEND_API_KEY` 对发验证码 **无效**；必须写在 **Render 后端**。

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
