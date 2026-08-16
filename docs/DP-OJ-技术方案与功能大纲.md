# DP 背包 OJ —— 整体技术方案与功能大纲（v1.0）

> 基于《背包问题九讲》（崔添翼，CC BY-NC-SA）构建的个人自学用在线评测与练习平台
> 阶段：第一阶段交付物（技术方案 + 功能大纲）；第二阶段按 §9 迭代开发

## 0. 需求结论摘要（已确认）

| 项 | 结论 |
|---|---|
| 部署定位 | 个人自学自用，单机运行，无需上线/登录/排行榜 |
| 语言支持 | C++、Python、Go、Java（主流语言，沙箱预留扩展） |
| 题目来源 | 由开发方（本助手）设计：先九讲对应经典题，再加扩展题 |
| 判题模式 | 标准输入输出（贴合 PDF 与蓝桥杯风格） |
| 本机环境 | Windows；g++ 8.1(MinGW)、JDK 21、Python 3.14、Docker 29 ✅；Go 缺失（M0 补装） |

## 1. 项目概述

- **目标**：把《背包问题九讲》转化为可在线练习的 OJ：浏览器看题 → 写码 → 即时测试 → 提交判题 → 查看编译错误/每组耗时与通过情况。
- **范围**：题目管理、代码编辑（Monaco）、判题沙箱、判题引擎、结果反馈、提交记录。
- **非目标（MVP 不做）**：用户账号、排行榜、竞赛模式、代码查重、防作弊、分布式判题。

## 2. 总体架构与技术选型

### 2.1 架构图

\`\`\`
┌──────────────────────────── 浏览器（前端 SPA）───────────────────────────┐
│ 题目列表/详情 │ Monaco 编辑器 │ 运行样例/自定义测试 │ 提交结果面板 │ 提交记录 │
└──────────────────────────────────┬──────────────────────────────────────┘
                            REST (HTTP/JSON)
┌──────────────────────────────────┴──────────────────────────────────────┐
│                        apps/server（NestJS 后端）                        │
│   ProblemsModule │ SubmissionsModule │ JudgeModule │ SystemModule        │
│   ├─ SQLite（元数据：题目/提交/结果）                                      │
│   └─ JudgeQueue（内存队列，单机自用足够）                                  │
└──────────────────────────────────┬──────────────────────────────────────┘
                        packages/judge（判题引擎库）
          Compile → SandboxRun(逐组) → Compare → 汇总 Verdict
┌────────────────────┬────────────────────────┬───────────────────────────┐
│ LocalProcessRunner │ DockerRunner（可选）    │ languages 配置             │
│ spawn+超时+输出截断 │ --memory --cpus        │ C++ / Python / Go / Java  │
│ （Windows 默认）    │ --network=none 等       │                           │
└────────────────────┴────────────────────────┴───────────────────────────┘
\`\`\`

### 2.2 选型总表

| 层 | 选型 | 理由 |
|---|---|---|
| 仓库 | pnpm monorepo（apps/web、apps/server、packages/judge、packages/common） | 判题引擎独立可测、可 CLI 调试 |
| 前端 | React 18 + TypeScript + Vite；**Monaco Editor**；react-markdown + KaTeX | Monaco 原生支持 C++/Python/Go/Java 高亮与补全；KaTeX 渲染题面公式 |
| 后端 | NestJS + TypeScript | 模块化天然对应"模块划分"；全栈同语言 |
| 数据库 | SQLite（better-sqlite3，零配置单文件） | 单机自用零运维；模型层隔离，预留 PostgreSQL |
| 判题引擎 | 自研 TS 库 packages/judge（编译/运行/比对/资源限制） | 核心难点必须可控、可单元测试 |
| 沙箱 | Runner 抽象：LocalProcessRunner（默认）+ DockerRunner（可选开关） | 自用场景进程级足够；Docker 提供精确内存限制与网络隔离，Linux/Windows 均可用 |
| 判题队列 | 自实现内存队列（提交表即队列，worker 轮询） | 单用户串行足够，不引入 Redis/BullMQ |
| 通信 | REST + 提交结果短轮询（1s），预留 SSE | MVP 最简，闭环优先 |

### 2.3 目录结构

\`\`\`
dp-oj/
├─ pnpm-workspace.yaml
├─ apps/
│  ├─ web/            # React+Vite 前端
│  └─ server/         # NestJS 后端（含 JudgeQueue 与 worker）
├─ packages/
│  ├─ judge/          # 判题引擎：compile/run/compare/limits/runners
│  └─ common/         # 共享类型、判题结果码、语言配置
├─ data/
│  ├─ oj.db           # SQLite（运行时生成）
│  ├─ problems/       # 题库文件：A1/config.json + statement.md + cases/*.in/out
│  └─ seeds/          # 题库导入脚本 + 测试数据生成器
└─ docs/              # 本方案、题目设计说明、判题结果码
\`\`\`

## 3. 模块划分

| 模块 | 位置 | 职责 | 关键接口 |
|---|---|---|---|
| 题库管理 | server ProblemsModule | 题目元数据 CRUD（MVP 只需导入+查询）、seed 导入 | GET /api/problems、GET /api/problems/:id |
| 提交管理 | server SubmissionsModule | 提交入队、状态流转、结果持久化 | POST /api/submissions、GET /api/submissions/:id |
| 判题引擎 | packages/judge | 编译、逐组运行、输出比对、资源限制、结果汇总 | judge(submission, testcases) |
| 沙箱运行器 | packages/judge/runners | 可插拔执行环境：本地进程 / Docker | Runner.run(cmd, stdin, limits) |
| 即时测试 | server JudgeModule | 用户自定义输入快速运行（不判题） | POST /api/judge/run |
| 前端界面 | apps/web | 列表/详情/编辑器/结果面板/提交记录 | 见 §7 |
| 系统自检 | server SystemModule | 报告本机编译器/解释器/Docker 可用性 | GET /api/system/health |

## 4. 判题引擎设计（核心）

### 4.1 判题状态机

\`\`\`
PENDING → COMPILING → ┬→ COMPILE_ERROR(CE)   [终态]
                        └→ RUNNING ──逐测试组──┐
                                              ├─ AC（全部通过）       [终态]
                                              ├─ WA（首个输出不匹配）  [终态]
                                              ├─ TLE（超时，杀掉进程） [终态]
                                              ├─ MLE（内存超限）      [终态]
                                              ├─ RE（非零退出/崩溃）   [终态]
                                              └─ SE（判题机内部错误）  [终态]
\`\`\`

- 规则：**首个失败组即定终态**（记录该组序号与详情），不再跑后续组；只有全部通过才 AC。保留每组的耗时与内存明细供前端展示。
- 每组独立运行（重启进程），stdin 重定向输入文件，stdout 与期望输出做**去行尾空白 + 行末空格不敏感**的严格比对（可选精确比对开关）。
- 预留 Special Judge 接口：比较器可插拔（默认 ExactComparer）。

### 4.2 判题结果码（packages/common）

| 码 | 含义 | 典型反馈 |
|---|---|---|
| AC | 通过 | 总耗时 + 峰值内存 |
| WA | 答案错误 | 失败组号、期望/实际输出节选 |
| TLE | 超时 | 超时组号、单组限时 |
| MLE | 内存超限 | 内存峰值 |
| RE | 运行时错误 | 退出码、stderr |
| CE | 编译错误 | 编译器完整输出（首 200 行） |
| SE | 系统错误 | 判题机日志（自用定位） |

### 4.3 多语言适配器

| 语言 | 编译 | 运行 | 说明 |
|---|---|---|---|
| C++17 | `g++ -O2 -std=c++17 main.cpp -o main` | `./main` | MinGW 8.1 兼容；参考解也用它对拍 |
| Python | 无 | `python main.py` | 启动快；内存按进程峰值估算 |
| Go | `go build -o main main.go` | `./main` | M0 补装 Go 工具链 |
| Java | `javac Main.java` | `java -Xss64m -Xmx256m Main` | 类名强制 Main；时限系数 ×2（JVM 启动开销），内存靠 -Xmx |

每种语言独立配置：文件名约定、编译/运行命令模板、时限系数、内存上限；**新增语言 = 新增一条配置**，不动引擎代码。

### 4.4 沙箱方案（Runner 抽象）

- **LocalProcessRunner（Windows 默认）**：Node spawn 子进程；超时用定时器强杀（含进程树清理）；stdout/stderr 按上限截断（防无限输出）；内存尽力而为（周期采样，Windows 上非精确）。
- **DockerRunner（可选开关，环境变量 JUDGE_RUNNER=docker）**：判题镜像 `dp-oj/judge-env`（g++、python、go、openjdk），`docker run --memory --cpus=1 --network=none --read-only -i`，精确资源限制与隔离。
- 判定优先级：单机自用默认 Local；需要精确 MLE 判罚或验证安全边界时切 Docker。

### 4.5 资源限制策略（每道题可配置，默认值）

| 项 | 默认 | 备注 |
|---|---|---|
| 时间 | 1000 ms（Java ×2） | 单组限制 |
| 内存 | 256 MB | Docker 精确；本地尽力 |
| 输出 | 10 MB | 超出截断并判 OLE→WA |
| 编译时间 | 10 s | 超时判 CE |

## 5. 数据模型（SQLite）

\`\`\`
problems(id, slug, title, lecture_no, difficulty, description_md, input_format,
         output_format, samples_json, time_limit_ms, memory_limit_mb, tags, enabled)
testcases(id, problem_id, group_no, input_path, output_path, score)
submissions(id, problem_id, language, code_path, status, verdict,
            compile_output, time_ms, memory_kb, created_at)
submission_results(id, submission_id, group_no, verdict, time_ms, memory_kb, detail)
\`\`\`

- 题目正文与测试数据存文件系统（`data/problems/<slug>/`：config.json、statement.md、cases/N.in|N.out），SQLite 仅存元数据 → 题库可通过 git 版本化。

## 6. API 设计（REST 大纲）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /api/problems | 题目列表（id/slug/标题/难度/讲次/标签） |
| GET | /api/problems/:slug | 题目详情（含 statement.md 渲染源、样例、限制） |
| POST | /api/submissions | 提交：{problemSlug, language, code} → 返回 submissionId（PENDING） |
| GET | /api/submissions/:id | 轮询判题状态与结果（含逐组明细） |
| GET | /api/submissions | 提交历史（按时间倒序） |
| POST | /api/judge/run | 即时测试：{language, code, stdin} → 编译错误或 stdout/stderr/耗时（不判 AC/WA） |
| GET | /api/languages | 可用语言列表（含本机工具链可用性，缺失的置 unavailable） |
| GET | /api/system/health | 判题机自检：g++/python/go/java/docker 版本与状态 |

## 7. 前端页面与交互流程

### 7.1 页面清单

| 页面 | 内容 |
|---|---|
| 题目列表 | 题号/标题/难度/讲次标签/AC 标记（本地记录） |
| 题目详情 | 题面（Markdown+公式）、输入输出格式、样例、时空限制；内嵌编辑器 |
| 结果面板 | 编译错误全文 / 逐组状态表（组号、判题码、耗时、内存）/ 失败组期望与实际输出对比 |
| 提交记录 | 历史列表 + 详情抽屉（代码快照、逐组明细） |

### 7.2 判题交互时序

\`\`\`
用户点「提交」→ POST /api/submissions → server 落库(status=PENDING)+入队
  → 前端开始轮询 GET /api/submissions/:id（1s 间隔）
  → judge worker 取队 → 编译(CE?) → 逐组沙箱运行比对
  → 终态写库 → 轮询返回 → 前端渲染结果面板（自动停止轮询）
\`\`\`

- 「运行样例」= POST /api/judge/run 注入题面样例输入；「自定义测试」= 用户自己填 stdin，两者都直接展示原始输出，不判对错。
- 编辑器草稿按「题目+语言」存 localStorage；提供每语言代码模板（读题→写码零模板负担）。

## 8. 题库建设规划（九讲 → 题目）

### 8.1 基础题（每讲对应经典题，共 12 道）

| 编号 | 讲次 | 题名 | 考察点 | 难度 |
|---|---|---|---|---|
| A1 | 01 背包 | 采药 | 基本方程、一维逆序循环 | 入门 |
| A2 | 完全背包 | 疯狂的采药 | v 顺序循环 O(VN) | 入门 |
| A3 | 多重背包 | 宝物筛选 | 二进制拆分（加强版要求单调队列 O(VN)） | 普及+ |
| A4 | 混合背包 | 樱花 | 按物品类别分派三种过程 | 普及 |
| A5 | 二维费用 | 榨取 kkksc03 | 状态加一维、两种容量 | 普及 |
| A6 | 分组背包 | 通天之分组背包 | 三层循环、组内互斥 | 普及 |
| A7 | 依赖背包 | 金明的预算方案 | 主附件集合→物品组（NOIP2006） | 普及+/提高 |
| A8 | 泛化物品 | 选课 | 树形 DP + 分组背包（森林依赖） | 提高 |
| A9 | 问法变化① | 装箱问题 | 恰好装满、初始化细节（F[0]=0 其余 -INF） | 普及 |
| A10 | 问法变化② | 货币面值方案数 | 计数 DP（max→sum）、完全背包计数 | 普及 |
| A11 | 问法变化③ | 第 K 优解 | 有序队列合并（O(VNK)） | 提高 |
| A12 | 问法变化④ | 最优方案回溯 | 输出具体选择方案（G 数组回溯） | 普及+ |

### 8.2 扩展题（8 道，覆盖组合与进阶）

| 编号 | 题名 | 考察点 | 难度 |
|---|---|---|---|
| B1 | 多重背包·单调队列专项 | 数据加强，逼出 O(VN) 队列优化 | 提高 |
| B2 | 有线电视网 | 树形背包上界优化（依赖森林进阶） | 提高+ |
| B3 | 二维费用 + 分组 | 两种变体叠加 | 提高 |
| B4 | 混合背包·求最优方案总数 | 判题 + 计数双数组 | 提高 |
| B5 | 恰好装满·字典序最小方案 | 编号变换 + 回溯策略 | 提高 |
| B6 | 子集和 / 整除同余背包 | 背包与数论结合 | 提高 |
| B7 | 分组背包·依赖链 | 多级依赖（森林推广） | 提高+ |
| B8 | 泛化物品显式建模 | 直接对泛化物品求和 O(V²) | 提高 |

### 8.3 测试数据策略

- 每道题 10–20 组：边界组（N=0、V=0、单件超容量、全部放不下）、小样例组（题面示例）、随机中规模组、**大数据压力组**（卡暴力与错误复杂度，保证 TLE 判罚有效）。
- 答案由参考解（C++）生成并人工抽查；生成器脚本放 data/seeds/generators 可复现。
- 版权说明：题面为原创改写，测试数据自行生成；平台仅供个人学习，遵循原文档 CC BY-NC-SA 要求（保留署名与协议声明）。

## 9. 迭代开发计划（第二阶段里程碑）

| 里程碑 | 内容 | 交付物 | 验收要点 |
|---|---|---|---|
| M0 | 环境与脚手架 | monorepo 骨架、Go 安装、/api/system/health 自检 | 四语言环境自检接口全部 ready |
| M1 | 题库管理 | 数据模型、seed 导入（先入 A1/A2）、列表/详情 API、前端列表+详情页 | A1/A2 题面正确渲染（含公式） |
| M2 | 判题引擎核心 | packages/judge、C++ 端到端（AC/WA/TLE/CE）、CLI 可调试 | 对 A1 手工提交 4 类代码均得到正确结果码 |
| M3 | 多语言+结果反馈 | Python/Go/Java 适配、逐组明细、提交 API+轮询、结果面板 | 四语言各 AC 一题；CE 全文可见 |
| M4 | 编辑器+即时测试 | Monaco 集成、模板、草稿、run API、自定义测试面板 | 运行样例与自定义测试 <2s 出结果 |
| M5 | 题库全量 | 12 基础题 + 8 扩展题、数据生成器、对拍验证、（按需）Special Judge | 20 题全部可提交且数据经对拍验证 |
| M6 | 打磨收尾 | 提交记录页、耗时统计、DockerRunner 开关、README、验收清单 | §10 整体验收全过 |

## 10. 整体验收标准（DoD）

1. 四个语言（C++/Python/Go/Java）各提交 A1 均 AC，耗时正确显示；
2. 故意提交 CE / WA / TLE 代码，反馈分别为编译错误全文 / 失败组对比 / 超时组号，判罚正确；
3. 九讲对应的 12 道基础题全部上线，题面（含公式）、样例、测试数据完整；
4. 前端完整闭环：浏览 → 写码 → 运行样例 → 自定义测试 → 提交 → 逐组结果详情；
5. Windows 单机零外部服务启动（`pnpm dev` 一条命令）即可全流程可用；
6. 判题引擎通过单元测试（结果码判定、输出比对、超时杀进程）。

## 11. 风险与应对

| 风险 | 影响 | 应对 |
|---|---|---|
| Windows 精确内存限制困难 | MLE 判罚不精确 | 本地采样尽力而为；需要精确时开 JUDGE_RUNNER=docker（已装 Docker） |
| MinGW g++ 8.1 较老 | 个别 C++17 特性编译失败 | 判题标准定 C++17；必要时降 -std=c++14；建议后续装 MSYS2 最新 g++ |
| Go 工具链缺失 | Go 无法判题 | M0 安装；未装前 /api/languages 标记 unavailable，前端禁用 |
| Java JVM 启动开销 | 误判 TLE | Java 时限系数 ×2，-Xmx 控制内存 |
| 数据太弱被暴力混过 | 评测失去意义 | 压力组 + 复杂度对拍校验 |
| 判题队列阻塞 | 提交堆积 | 单机串行 + 队列深度提示；后续可并行 worker |

---

**下一步**：按 M0 → M6 顺序迭代开发。建议从 M0+M1 开始（脚手架 + 题库管理 + 前端骨架），每完成一个里程碑与您确认后再进入下一个。
