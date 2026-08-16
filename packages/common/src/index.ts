/**
 * @dp-oj/common —— 全仓共享的判题常量、类型与语言配置
 * 判题结果码参考《背包问题九讲》平台技术方案 §4.2
 */

/** 判题结果码 */
export const Verdict = {
  AC: "AC", // Accepted 通过
  WA: "WA", // Wrong Answer 答案错误
  TLE: "TLE", // Time Limit Exceeded 超时
  MLE: "MLE", // Memory Limit Exceeded 内存超限
  RE: "RE", // Runtime Error 运行时错误
  CE: "CE", // Compile Error 编译错误
  SE: "SE", // System Error 判题机内部错误
} as const;

export type Verdict = (typeof Verdict)[keyof typeof Verdict];

/** 判题结果码的中文说明（供前端展示） */
export const VERDICT_LABELS: Record<Verdict, string> = {
  AC: "通过",
  WA: "答案错误",
  TLE: "超出时间限制",
  MLE: "超出内存限制",
  RE: "运行时错误",
  CE: "编译错误",
  SE: "系统错误",
};

/** 提交状态（非判题结果） */
export const SubmissionStatus = {
  PENDING: "PENDING",
  COMPILING: "COMPILING",
  RUNNING: "RUNNING",
  FINISHED: "FINISHED",
} as const;

export type SubmissionStatus = (typeof SubmissionStatus)[keyof typeof SubmissionStatus];

/** 语言配置：新增语言 = 新增一条配置，判题引擎代码不动 */
export interface LanguageConfig {
  /** 语言 id，如 cpp / python / go / java */
  id: string;
  /** 前端展示名 */
  label: string;
  /** 源文件约定名 */
  sourceFile: string;
  /** 编译产物名（解释型语言为 null） */
  artifact: string | null;
  /** 编译命令（解释型语言为 null） */
  compileCmd: string[] | null;
  /** 运行命令模板，__MAIN__ 替换为产物/脚本路径 */
  runCmd: string[];
  /** 时限系数（Java 因 JVM 启动开销为 2） */
  timeFactor: number;
  /** 运行时内存上限 MB（-Xmx 等） */
  memoryLimitMB: number;
}

/** 内置语言表（平台首发 C++ / Python / Go / Java） */
export const LANGUAGES: LanguageConfig[] = [
  {
    id: "cpp",
    label: "C++14",
    sourceFile: "main.cpp",
    artifact: "main",
    compileCmd: ["g++", "-O2", "-std=c++14", "main.cpp", "-o", "main"],
    runCmd: ["./main"],
    timeFactor: 1,
    memoryLimitMB: 256,
  },
  {
    id: "python",
    label: "Python 3",
    sourceFile: "main.py",
    artifact: null,
    compileCmd: null,
    runCmd: ["python", "main.py"],
    timeFactor: 1,
    memoryLimitMB: 256,
  },
  {
    id: "go",
    label: "Go",
    sourceFile: "main.go",
    artifact: "main",
    compileCmd: ["go", "build", "-o", "main", "main.go"],
    runCmd: ["./main"],
    timeFactor: 1,
    memoryLimitMB: 256,
  },
  {
    id: "java",
    label: "Java",
    sourceFile: "Main.java",
    artifact: "Main.class",
    compileCmd: ["javac", "Main.java"],
    runCmd: ["java", "-Xss64m", "-Xmx256m", "Main"],
    timeFactor: 2,
    memoryLimitMB: 256,
  },
];

/** 沙箱资源限制默认值（每题可覆盖） */
export const DEFAULT_LIMITS = {
  timeMs: 1000,
  memoryMb: 256,
  outputBytes: 10 * 1024 * 1024,
  compileTimeoutMs: 10_000,
} as const;

/** 系统环境自检返回结构 */
export interface EngineStatus {
  id: string;
  label: string;
  available: boolean;
  version: string | null;
  error: string | null;
}

export interface SystemHealth {
  status: "ok" | "degraded";
  checkedAt: string;
  engines: EngineStatus[];
  docker: { available: boolean; version: string | null; error: string | null };
}
