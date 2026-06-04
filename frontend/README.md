# QingLu 轻鹭 Frontend

基于 OpenClaw / 百炼的前端，美团黑客松「本地生活全天候私人管家」赛道。

## 功能

- Demo 旅程：首页 → 建档 → 档案反馈 → 今日管家 → 对话 + 推荐卡片
- OpenClaw 兼容 API（流式对话、输出守门、门面检索）
- 五类生活任务快捷入口（外卖 / 聚餐 / 去哪练 / 恢复 / 一起动）
- 账户注册登录与云同步（需 `backend`）

## 启动

```bash
cd frontend
npm install
npm run dev
```

`dev` / `build` 会自动执行 `npm run bundle:skill`，从 `../Agent/burnpal_skill/` 生成：

- `src/generated/qingluSkillModules.ts`（按模块注入，运行时由 `src/lib/skillRouter.ts` 路由）
- `src/data/qingluVenues.generated.ts`

## 环境变量

见 `.env.example`。生产构建使用 Vercel 环境变量 `OPENCLAW_TOKEN`（服务端注入），勿将 API Key 写入 `VITE_OPENCLAW_TOKEN`。

## 路由

| 路径 | 说明 |
|------|------|
| `/` | 首页 |
| `/onboard` | Demo 档案选择 |
| `/ready` | 建档完成反馈 |
| `/chat` | 今日管家 + 对话 |
| `/settings` | 设置与 AI 偏好 |
