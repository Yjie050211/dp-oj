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
- [x] M1 题库管理：A1 采药 / A2 疯狂的采药上线（题面含 KaTeX 公式、每题 12 组测试数据、seed 导入、列表/详情 API、前端列表与详情页）（✅ 2026-08-16 验收通过）
- [x] M2 判题引擎核心：packages/judge（编译/沙箱运行/输出比对/首败终态判题）+ CLI + 15 项单元测试全过 + A1 端到端 AC/WA/TLE/CE 验证（判题标准定为 C++14，规避 MinGW g++ 8.1 filesystem 缺陷）（✅ 2026-08-16 验收通过）
- [x] M3 多语言 + 结果反馈：四语言（C++/Python/Go/Java）HTTP 全链路 AC，SubmissionsModule + 判题队列 + 提交/轮询 API，前端编辑器（textarea）+ 提交 + 结果面板（CE 全文/逐组明细/WA 对比）（✅ 2026-08-16 验收通过）
- [x] M4 编辑器 + 即时测试：Monaco 编辑器（四语言高亮/主题/草稿）、POST /api/judge/run、运行样例与自定义测试面板（四语言端到端 <2s，CE 即时反馈）（✅ 2026-08-16 验收通过）
- [x] M5 题库全量：九讲 12 道基础题（A1-A12）+ 8 道扩展题（B1-B8）全部上线（原创题面含公式、固定种子生成器、C++ 参考解对拍 20/20 AC、列表排序修复）（✅ 2026-08-16 验收通过）
- [ ] M6 打磨收尾
