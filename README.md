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
| `VITE_OPENCLAW_AGENT` | **构建时**默认模型，需 redeploy | `qwen-plus` |

勿在生产设置 `VITE_OPENCLAW_TOKEN`（会打进前端 bundle）。`VITE_OPENCLAW_PROXY_*` 仅本地 Vite 开发代理用，Vercel 上请用 `OPENCLAW_PROXY_*`。
| `BACKEND_URL` | 已部署的后端公网地址（账户/云同步） | `https://your-api.onrender.com` |

生产环境 OpenClaw 走 Vercel Serverless 代理（`/api/openclaw`），API Key 放在 `OPENCLAW_TOKEN`，不要写进前端 bundle。

### 部署后自检（OpenClaw）

在 Vercel **Redeploy** 最新 `main` 后，浏览器打开：

| URL | 期望 |
|-----|------|
| `https://你的域名/api/openclaw/health` | JSON：`ok: true`，`hasToken: true` |
| `https://你的域名/api/openclaw/v1/models` | JSON：`data` 模型列表（200） |
| `https://你的域名/openclaw-api/v1/models` | 同上（兼容别名，经 rewrite） |

若返回整页 HTML 或 404，说明路由/部署未更新；若 `hasToken: false`，说明 `OPENCLAW_TOKEN` 未注入当前 Production 部署。

聊天页若仍演示模式，横幅会显示具体失败原因；也可清除站点 localStorage 后硬刷新。

### 4. 账户后端（云同步 / 注册）

SQLite 后端不适合 Vercel Serverless 持久化，请单独部署 `backend/` 到 Render、Railway、Fly.io 等，然后在 Vercel 设置 `BACKEND_URL`。

Render 示例：

- Root: `backend`
- Build: `npm install && npm run build`
- Start: `npm start`
- 环境变量：`JWT_SECRET`、`SMTP_*`（见 `backend/.env.example`）

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
