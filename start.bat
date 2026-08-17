@echo off
chcp 65001 >nul
title DP 背包 OJ 一键启动
setlocal
cd /d "%~dp0"

echo ============================================
echo   DP 背包 OJ —— 一键启动
echo ============================================
echo.

rem ---------- 1. 前置检查 ----------
where node >nul 2>&1
if errorlevel 1 (
  echo [错误] 未找到 Node.js，请先安装 Node.js 22 或更高版本。
  echo         https://nodejs.org/
  pause
  exit /b 1
)
where pnpm >nul 2>&1
if errorlevel 1 (
  echo [错误] 未找到 pnpm，请先运行：npm install -g pnpm
  pause
  exit /b 1
)
echo [1/5] Node.js 与 pnpm 已就绪。

rem ---------- 2. Go 工具链（可选，判 Go 题需要） ----------
if exist "C:\Program Files\Go\bin\go.exe" (
  set "PATH=C:\Program Files\Go\bin;%PATH%"
  echo [2/5] Go 工具链已加入 PATH。
) else (
  echo [2/5] 未检测到 Go（Go 题将不可用，C++/Python/Java 不受影响）。
)

rem ---------- 3. 构建后端 ----------
echo [3/5] 正在构建判题引擎与后端（首次约 10-30 秒）...
call pnpm --filter @dp-oj/common build >nul 2>&1
if errorlevel 1 ( echo [错误] common 构建失败，请运行 pnpm install 后重试。 & pause & exit /b 1 )
call pnpm --filter @dp-oj/judge build >nul 2>&1
if errorlevel 1 ( echo [错误] judge 构建失败，请运行 pnpm install 后重试。 & pause & exit /b 1 )
call pnpm --filter @dp-oj/server build >nul 2>&1
if errorlevel 1 ( echo [错误] server 构建失败，请运行 pnpm install 后重试。 & pause & exit /b 1 )
echo        构建完成。

rem ---------- 4. 启动前后端（各一个窗口） ----------
echo [4/5] 正在启动服务...
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
  start "DP-OJ 后端 (3000)" cmd /k "cd /d "%~dp0apps\server" && node dist\main.js"
) else (
  echo        检测到 3000 端口已有服务，跳过启动后端（沿用现有实例）。
)
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
  start "DP-OJ 前端 (5173)" cmd /k "cd /d "%~dp0" && pnpm --filter @dp-oj/web dev"
) else (
  echo        检测到 5173 端口已有服务，跳过启动前端（沿用现有实例）。
)

rem ---------- 5. 打开浏览器 ----------
echo [5/5] 3 秒后自动打开浏览器 http://localhost:5173
timeout /t 3 /nobreak >nul
start "" http://localhost:5173

echo.
echo 启动完成！后端/前端分别运行在两个独立窗口中。
echo 关闭方法：运行 stop.bat，或直接关闭那两个窗口。
echo.
pause
