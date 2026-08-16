# 构建判题沙箱镜像（PowerShell）
# 用法：.\data\docker\build-judge-image.ps1
$ErrorActionPreference = "Stop"
docker build -t dp-oj/judge-env -f data/docker/judge-env.Dockerfile .
Write-Host "镜像构建完成。启用方式："
Write-Host "  设置环境变量 JUDGE_RUNNER = docker 后运行 pnpm dev:server"
