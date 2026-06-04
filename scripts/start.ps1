# QingLu 轻鹭 一键启动：后端 + 前端（OpenClaw 经 Vite 代理到百炼 / 本地网关）
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  QingLu 轻鹭 — 一键启动" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "backend\node_modules")) {
  Write-Host "[1/4] 安装 backend 依赖..." -ForegroundColor Yellow
  npm install --prefix backend
} else {
  Write-Host "[1/4] backend 依赖已就绪" -ForegroundColor Green
}

if (-not (Test-Path "frontend\node_modules")) {
  Write-Host "[2/4] 安装 frontend 依赖..." -ForegroundColor Yellow
  npm install --prefix frontend
} else {
  Write-Host "[2/4] frontend 依赖已就绪" -ForegroundColor Green
}

if (-not (Test-Path "frontend\.env.local")) {
  Write-Host "[3/4] 从 .env.example 创建 frontend\.env.local" -ForegroundColor Yellow
  Copy-Item "frontend\.env.example" "frontend\.env.local"
  Write-Host "      请在 frontend\.env.local 填入 VITE_OPENCLAW_TOKEN（百炼 API Key）" -ForegroundColor Magenta
} else {
  Write-Host "[3/4] frontend\.env.local 已存在" -ForegroundColor Green
}

if (-not (Test-Path "backend\.env")) {
  if (Test-Path "backend\.env.example") {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "      已创建 backend\.env，请配置 SMTP / JWT 等" -ForegroundColor Magenta
  }
}

Write-Host "[4/4] 启动服务..." -ForegroundColor Yellow
Write-Host "      后端 API:  http://127.0.0.1:8787" -ForegroundColor Gray
Write-Host "      前端页面:  http://127.0.0.1:5173" -ForegroundColor Gray
Write-Host "      OpenClaw:  /openclaw-api -> 百炼 DashScope（见 .env.local）" -ForegroundColor Gray
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$Root\backend'; npm run dev"
Start-Sleep -Seconds 1
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$Root\frontend'; npm run dev"

Start-Sleep -Seconds 3
Start-Process "http://127.0.0.1:5173"

Write-Host "已在独立窗口启动 backend 与 frontend。" -ForegroundColor Green
