# BurnPal 轻鹭

AI 减脂管家 — 美团黑客松 · React + Vite 前端 · Express 账户后端 · OpenClaw / 百炼 AI

## 一键启动（本地）

### Windows（推荐）

双击或在 PowerShell 中运行：

```powershell
.\scripts\start.ps1
```

或：

```powershell
.\scripts\start.bat
```

会自动：

1. 安装 `backend` / `frontend` 依赖（若缺失）
2. 从 `frontend\.env.example` 生成 `frontend\.env.local`（若缺失）
3. 打开两个终端：后端 `8787`、前端 `5173`
4. 浏览器打开 http://127.0.0.1:5173

### 手动启动

```powershell
# 终端 1 — 账户 API
cd backend
npm install
npm run dev

# 终端 2 — 前端 + OpenClaw 代理
cd frontend
npm install
copy .env.example .env.local
# 编辑 .env.local，填入 VITE_OPENCLAW_TOKEN（百炼 API Key）
npm run dev
```

### OpenClaw / 百炼配置

`frontend/.env.local`：

```env
VITE_OPENCLAW_BASE_URL=/openclaw-api/v1
VITE_OPENCLAW_PROXY_TARGET=https://dashscope.aliyuncs.com
VITE_OPENCLAW_PROXY_PATH=/compatible-mode
VITE_OPENCLAW_TOKEN=你的百炼API_Key
VITE_OPENCLAW_AGENT=qwen-plus
```

本地开发时，Vite 将 `/openclaw-api` 代理到百炼，避免浏览器 CORS。

---

## 部署到 Vercel

### 1. 推送到 GitHub

```bash
git remote add origin git@github.com:ShuoMeng66/BurnPal.git
git push -u origin main
```

### 2. 在 Vercel 导入仓库

1. 打开 [vercel.com/new](https://vercel.com/new) → Import `ShuoMeng66/BurnPal`
2. **Framework Preset**: Other（已配置 `vercel.json`）
3. 无需改 Build 命令（根目录 `vercel.json` 已指定 `frontend` 构建）

### 3. 环境变量（Vercel Project → Settings → Environment Variables）

| 变量 | 说明 | 示例 |
|------|------|------|
| `OPENCLAW_TOKEN` | 百炼 API Key（**服务端**代理注入，必填） | `sk-xxx` |
| `OPENCLAW_PROXY_TARGET` | 可选，服务端上游 | `https://dashscope.aliyuncs.com` |
| `OPENCLAW_PROXY_PATH` | 可选，服务端路径前缀 | `/compatible-mode` |
| `VITE_OPENCLAW_BASE_URL` | **构建时**写入前端，需 redeploy | `/api/openclaw/v1`（推荐；勿用 `/openclaw-api`） |
| `VITE_OPENCLAW_AGENT` | **构建时**默认模型，需 redeploy | `deepseek-v4-flash`（百炼免费 DeepSeek V4）或 `qwen-plus` |

勿在生产设置 `VITE_OPENCLAW_TOKEN`（会打进前端 bundle）。`VITE_OPENCLAW_PROXY_*` 仅本地 Vite 开发代理用，Vercel 上请用 `OPENCLAW_PROXY_*`。
| `BACKEND_URL` | 已部署的后端公网地址（账户/云同步） | `https://your-api.onrender.com` |
| `RESEND_API_KEY` | 验证码发信（可只配在 Vercel，见下） | `re_…` |
| `BURNPAL_PROXY_SECRET` | Vercel→Render 转发 Resend 密钥时的共享口令（随机长字符串） | 与 Render 相同 |

生产环境 **Edge Middleware** 代理：

- OpenClaw：`/api/openclaw`、`/openclaw-api`（`OPENCLAW_TOKEN` 仅服务端）
- 账户 API：`/api/auth`、`/api/user`（转发到 `BACKEND_URL`，勿再依赖易崩溃的 Serverless 子路径）

API Key 不要写进前端 bundle。

### 部署后自检（OpenClaw）

在 Vercel **Redeploy** 最新 `main` 后，浏览器打开：

| URL | 期望 |
|-----|------|
| `https://你的域名/api/openclaw/health` | JSON：`ok: true`，`runtime: edge-middleware`，`hasToken: true` |
| `https://你的域名/api/openclaw/v1/models` | JSON：`data` 模型列表（200） |
| `https://你的域名/openclaw-api/v1/models` | 同上（兼容别名，经 rewrite） |

若返回整页 HTML 或 404，说明路由/部署未更新；若 `hasToken: false`，说明 `OPENCLAW_TOKEN` 未注入当前 Production 部署。

若设置页报 **502 `fetch failed`**：多半是 Vercel 里 `OPENCLAW_PROXY_TARGET` 误填了 `127.0.0.1` / 本地地址。请设为 `https://dashscope.aliyuncs.com` + `OPENCLAW_PROXY_PATH=/compatible-mode`，`OPENCLAW_TOKEN` 填**百炼**控制台 API Key（不是 DeepSeek 官网 Key），然后 Redeploy。

**百炼免费 DeepSeek V4**：模型 ID 用 `deepseek-v4-flash` 或 `deepseek-v4-pro`（见[百炼 DeepSeek 文档](https://help.aliyun.com/zh/model-studio/deepseek-api)），`VITE_OPENCLAW_AGENT=deepseek-v4-flash`。不要填 `api.deepseek.com` 作为代理地址。

账户 API 自检（需已设置 `BACKEND_URL` 并完成 Redeploy）：

| URL | 期望 |
|-----|------|
| `https://你的域名/api/auth/health` | JSON：`emailReachable: true`（Render 免费版请用 `RESEND_API_KEY`，QQ SMTP 会 `smtpReachable: false`） |
| `POST /api/auth/send-verification-code` | JSON：`{"ok":true,"smtp":true}`（未注册邮箱） |

聊天页若仍演示模式，横幅会显示具体失败原因；也可清除站点 localStorage 后硬刷新。

### 4. 账户后端（云同步 / 注册）

SQLite 后端不适合 Vercel Serverless 持久化，请单独部署 `backend/` 到 Render、Railway、Fly.io 等，然后在 Vercel 设置 `BACKEND_URL`。

Render 示例：

- Root: `backend`
- Build: `npm install && npm run build`
- Start: `npm start`
- 环境变量：`JWT_SECRET`、**`RESEND_API_KEY`**、**`BURNPAL_PROXY_SECRET`**（见 `backend/.env.example`）
- **Resend 可只配在 Vercel**：在 Vercel 与 Render 填相同的 `BURNPAL_PROXY_SECRET`，Middleware 会把 `RESEND_API_KEY` 安全转给 Render 发信（避免「Vercel 配对了但 Render 用的是旧 Key」）

---

## 项目结构

```
BurnPal/
├── frontend/     # Vite + React 前端
├── backend/      # Express + SQLite 账户与云同步
├── api/          # Vercel Serverless 代理（OpenClaw + 后端转发）
├── scripts/      # 一键启动脚本
└── vercel.json
```

## License

Private — Hackathon project
