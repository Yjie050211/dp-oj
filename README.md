# DP 背包 OJ

基于《背包问题九讲》（崔添翼，CC BY-NC-SA）的个人自学用在线评测与练习平台。
技术方案详见 `docs/DP-OJ-技术方案与功能大纲.md`。

## 快速开始

```bash
pnpm install
pnpm dev        # server: http://localhost:3000/api/system/health ｜ web: http://localhost:5173
```

## 目录

- `apps/web`  React + Vite 前端（Monaco 编辑器 M4 接入）
- `apps/server` NestJS 后端（题库/提交/判题编排）
- `packages/judge` 判题引擎（M2 实现）
- `packages/common` 判题结果码、语言配置、共享类型
- `data/` 题库与测试数据（M1 起）

## 里程碑进度

- [x] M0 环境与脚手架：monorepo 骨架、Go 1.26.5 安装、/api/system/health 环境自检（✅ 2026-08-16 验收通过：cpp/python/go/java/docker 全部可用，前端+代理打通）
- [ ] M1 题库管理
- [ ] M2 判题引擎核心
- [ ] M3 多语言 + 结果反馈
- [ ] M4 编辑器 + 即时测试
- [ ] M5 题库全量（12 基础 + 8 扩展）
- [ ] M6 打磨收尾
