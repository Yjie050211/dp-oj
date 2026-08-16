/**
 * @dp-oj/judge —— 判题引擎（M2 实现核心逻辑，M0 仅占位）
 * 规划接口（技术方案 §3、§4）：
 *   compile(config, sourceDir) -> { ok, artifactPath, output }
 *   run(runner, runCmd, stdin, limits) -> { exitCode, stdout, stderr, timeMs, memoryKB, timedOut }
 *   compare(expected, actual) -> boolean
 *   judge(submission, testcases) -> SubmissionResult
 */
export {};

export const JUDGE_VERSION = "0.1.0";
