# QingLu Backend

Express API for QingLu（轻鹭）authentication and user data sync.

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
   `RESEND_FROM=QingLu <noreply@你的域名.com>`
4. 环境变量二选一（或两处都配同一 Key）：
   - **仅 Render**：`RESEND_API_KEY` + `RESEND_FROM` → Manual Deploy Render
   - **仅 Vercel**（推荐若你一直在 Vercel 配 Key）：在 **Vercel** 填 `RESEND_API_KEY`；在 **Vercel 与 Render** 填相同 `BURNPAL_PROXY_SECRET`（随机字符串，历史 env 名保留）；然后 **Redeploy Vercel + Render**
5. **Manual Deploy** 两侧（改 env 后必须部署才生效）
6. 检查 `GET /api/auth/health`（经 Vercel 转发到 Render）：

| 字段 | 含义 |
|------|------|
| `resend: true` | 已配置 Resend |
| `resendReachable: true` | Resend API 可达 |
| `resendKeySource: "vercel-proxy"` | 使用 Vercel 转发的 Key（需 `BURNPAL_PROXY_SECRET` 配对） |

### 仍收不到验证码？

1. 查 **垃圾邮件**、**推广** 标签，搜索「轻鹭 QingLu」
2. 确认 Render / Vercel 已 **Redeploy**（改 env 后必须重新部署）
3. 用 `onboarding@resend.dev` 测试时，Resend 可能只允许发往注册邮箱

## API

- `GET /api/auth/health` — 邮件服务状态
- `POST /api/auth/send-verification-code`
- `POST /api/auth/register` / `POST /api/auth/login`
- `GET /api/user/profile` — 需 Bearer token（云同步档案）

Default port: `8787`.
