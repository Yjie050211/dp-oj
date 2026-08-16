import type { LanguageConfig } from "@dp-oj/common";
import type { Runner } from "./types";

export interface CompileResult {
  ok: boolean;
  /** 运行入口（可执行文件或脚本完整路径） */
  artifactPath: string | null;
  /** 编译输出（成功时为编译器 stdout+stderr，失败时为完整错误信息） */
  output: string;
}

/**
 * 编译源码：
 * - 解释型语言（无 compileCmd）直接通过
 * - 编译型语言在 workDir 下执行 compileCmd，非零退出 / 超时 → CE
 */
export async function compileSource(
  lang: LanguageConfig,
  workDir: string,
  runner: Runner,
  compileTimeoutMs: number
): Promise<CompileResult> {
  if (!lang.compileCmd || lang.compileCmd.length === 0) {
    return { ok: true, artifactPath: null, output: "" };
  }

  const r = await runner.run({
    command: lang.compileCmd[0],
    args: lang.compileCmd.slice(1),
    cwd: workDir,
    stdin: "",
    timeLimitMs: compileTimeoutMs,
    outputLimitBytes: 1024 * 1024,
  });

  const output = (r.stdout + (r.stderr ? "\n" + r.stderr : "")).slice(0, 200 * 1024);

  if (r.timedOut) {
    return { ok: false, artifactPath: null, output: "编译超时（" + compileTimeoutMs + "ms）\n" + output };
  }
  if (r.error) {
    return { ok: false, artifactPath: null, output: "无法启动编译器: " + r.error };
  }
  if (r.exitCode !== 0) {
    return { ok: false, artifactPath: null, output };
  }
  return { ok: true, artifactPath: null, output };
}
