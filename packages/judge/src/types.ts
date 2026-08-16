import type { Verdict } from "@dp-oj/common";

/** 单组运行资源限制 */
export interface JudgeLimits {
  /** 单组时间上限（ms，最终值 = 题目限时 x 语言系数） */
  timeMs: number;
  /** 内存上限（MB，本地运行器尽力而为） */
  memoryMb: number;
  /** stdout/stderr 输出上限（字节），超出即截断并判 WA（OLE 归 WA） */
  outputBytes: number;
  /** 编译超时（ms） */
  compileTimeoutMs: number;
}

/** 一组测试用例 */
export interface TestCaseInput {
  groupNo: number;
  inputPath: string;
  outputPath: string;
}

/** 单组判题结果 */
export interface CaseResult {
  groupNo: number;
  verdict: Verdict;
  timeMs: number;
  memoryKb: number | null;
  exitCode: number | null;
  /** 输出节选（WA 时用于对比展示） */
  actualOutput: string | null;
  expectedOutput: string | null;
  stderr: string | null;
  outputTruncated: boolean;
}

/** 一次提交的整体判题结果 */
export interface SubmissionResult {
  verdict: Verdict;
  /** CE 时的编译器输出（截断至 200KB） */
  compileOutput: string | null;
  /** 已运行各组的耗时总和（ms） */
  totalTimeMs: number;
  maxMemoryKb: number | null;
  cases: CaseResult[];
  /** SE 时的内部错误描述 */
  error: string | null;
}

/** 判题请求（引擎入口） */
export interface JudgeRequest {
  /** 语言 id：cpp / python / go / java */
  languageId: string;
  /** 用户源码文件路径 */
  sourcePath: string;
  /** 编译与运行的临时工作目录（引擎会把源码按语言约定文件名写入其中） */
  workDir: string;
  /** 测试用例列表 */
  testcases: TestCaseInput[];
  /** 可选的资源限制覆盖 */
  limits?: Partial<JudgeLimits>;
  /** 可注入的运行器（默认 LocalProcessRunner；M6 可换 DockerRunner） */
  runner?: Runner;
}

/** 沙箱运行器抽象：编译与运行共用的执行原语 */
export interface RunInput {
  command: string;
  args: string[];
  cwd: string;
  stdin: string;
  timeLimitMs: number;
  outputLimitBytes: number;
}

export interface RunResult {
  ok: boolean;
  exitCode: number | null;
  timedOut: boolean;
  stdout: string;
  stderr: string;
  timeMs: number;
  memoryKb: number | null;
  outputTruncated: boolean;
  /** 系统级错误（spawn 失败等） */
  error: string | null;
}

export interface Runner {
  run(input: RunInput): Promise<RunResult>;
}
