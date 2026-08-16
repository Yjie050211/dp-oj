/** 题目列表项 */
export interface ProblemSummary {
  slug: string;
  displayId: string;
  title: string;
  lectureNo: number;
  lectureTitle: string;
  difficulty: string;
  tags: string[];
}

/** 题目详情 */
export interface ProblemDetail {
  slug: string;
  displayId: string;
  title: string;
  lectureNo: number;
  lectureTitle: string;
  difficulty: string;
  tags: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  samples: { input: string; output: string; note?: string }[];
  statement: string;
  testcaseCount: number;
}

/** 难度对应的徽章样式 */
export function difficultyClass(d: string): string {
  if (d.includes("入门")) return "easy";
  if (d.includes("普及")) return "medium";
  return "hard";
}

/** 单组判题结果 */
export interface CaseResult {
  groupNo: number;
  verdict: string;
  timeMs: number;
  memoryKb: number | null;
  exitCode: number | null;
  actualOutput: string | null;
  expectedOutput: string | null;
  stderr: string | null;
  outputTruncated: boolean;
}

/** 判题结果汇总 */
export interface JudgeResult {
  verdict: string;
  compileOutput: string | null;
  totalTimeMs: number;
  maxMemoryKb: number | null;
  cases: CaseResult[];
  error: string | null;
}

/** 一次提交 */
export interface SubmissionDetail {
  id: number;
  problemSlug: string;
  problemDisplayId: string;
  problemTitle: string;
  languageId: string;
  status: string;
  verdict: string | null;
  result: JudgeResult | null;
  createdAt: string;
}

/** 判题结果码徽章样式 */
export const VERDICT_CLASS: Record<string, string> = {
  AC: "v-ac",
  WA: "v-wa",
  TLE: "v-tle",
  MLE: "v-mle",
  RE: "v-re",
  CE: "v-ce",
  SE: "v-se",
};
