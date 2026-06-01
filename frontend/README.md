# 小爪 Frontend

基于 OpenClaw Gateway 的前端对话页，用于美团黑客松「本地生活全天候私人管家」赛道。

## 功能

- OpenClaw Gateway 接入配置（URL / Token / Agent）
- 连接测试（`GET /v1/models`）
- IM 风格对话（`POST /v1/chat/completions`，支持 SSE 流式）
- PRD 高频场景快捷入口（聚餐、外卖、练后恢复、出差应酬）

## 前置条件

1. 本地已安装并运行 OpenClaw Gateway（默认 `http://127.0.0.1:18789`）
2. 在 `D:\OpenClaw\.openclaw\openclaw.json` 中启用 Chat Completions：

```json
{
  "gateway": {
    "http": {
      "endpoints": {
        "chatCompletions": {
          "enabled": true
        }
      }
    }
  }
}
```

3. 确认 Hackathon Agent 已配置（默认目标：`openclaw/hackathon-dev`）

## 启动

```bash
cd frontend
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`。

## 配置方式

- 页面内填写 Gateway Token 并保存（写入 localStorage）
- 或复制 `.env.example` 为 `.env.local`：

```env
VITE_OPENCLAW_BASE_URL=/openclaw-api/v1
VITE_OPENCLAW_TOKEN=你的gateway.auth.token
VITE_OPENCLAW_AGENT=openclaw/hackathon-dev
```

开发环境下 Vite 会将 `/openclaw-api` 代理到 `127.0.0.1:18789`，避免浏览器跨域。

## 项目结构

```
frontend/
├── src/
│   ├── components/     # SetupPanel, ChatView, MessageBubble
│   ├── lib/            # OpenClaw API 客户端
│   └── types/          # 类型与常量
└── vite.config.ts      # 开发代理
```

## 与 Agent 工作区关系

- Agent 代码与 Skill：`D:\Hackathod\Agent\`
- 前端代码：`D:\Hackathod\frontend\`
- OpenClaw 全局配置：`D:\OpenClaw\.openclaw\openclaw.json`

## 生产环境 Skill（system prompt 全量注入）

Vercel 的 `/api/openclaw` 只代理百炼/DeepSeek，**不会**运行 OpenClaw Gateway。线上对话通过构建脚本注入完整 Skill 包：

```bash
npm run bundle:skill   # 生成 src/generated/burnpalSkillContext.ts
```

`npm run build` / `npm run dev` 会自动执行。内容来自 `../Agent/burnpal_skill/`（路由 + 四模块 SKILL + references + assets JSON）。
