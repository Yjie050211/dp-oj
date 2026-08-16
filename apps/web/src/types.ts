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
