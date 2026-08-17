@echo off
chcp 65001 >nul
title DP 背包 OJ 停止
echo 正在停止 DP 背包 OJ ...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
echo 已停止前后端服务。
timeout /t 2 /nobreak >nul
