import { DEFAULT_LIMITS } from "@dp-oj/common";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compileSource } from "./compile";
import { DockerRunner } from "./docker-runner";
import { artifactPathIn, getLanguage, resolveRunCmd } from "./language";
import { LocalProcessRunner } from "./runner";
import type { JudgeLimits, RunResult, Runner } from "./types";

export interface RunCodeRequest {
  languageId: string;
  sourcePath: string;
  workDir: string;
  /** 注入 stdin 的内容（即时测试用） */
  stdin: string;
  limits?: Partial<JudgeLimits>;
  runner?: Runner;
}

export interface RunCodeResult {
  /** 未知语言时为 null */
  languageLabel: string | null;
  /** 编译是否通过（false 表示 CE，看 compileOutput） */
  compiled: boolean;
  compileOutput: string;
  /** 编译失败为 null */
  run: RunResult | null;
}

/**
 * 单次运行（即时测试）：写源码 → 编译 → 以给定 stdin 运行一次。
 * 不读取测试用例、不做输出比对（判题请用 judge()）。
 */
export async function runCode(req: RunCodeRequest): Promise<RunCodeResult> {
  const lang = getLanguage(req.languageId);
  if (!lang) {
    return { languageLabel: null, compiled: false, compileOutput: "未知语言: " + req.languageId, run: null };
  }

  const runner = req.runner ?? new LocalProcessRunner();
  const limits: JudgeLimits = { ...DEFAULT_LIMITS, ...req.limits };

  mkdirSync(req.workDir, { recursive: true });
  writeFileSync(join(req.workDir, lang.sourceFile), readFileSync(req.sourcePath, "utf8"));

  const isDocker = req.runner instanceof DockerRunner;
  // Docker 容器内是 Linux：Go 编译产物名必须是 main
  const compLang = isDocker && lang.id === "go"
    ? { ...lang, compileCmd: ["go", "build", "-o", "main", "main.go"] }
    : lang;

  const comp = await compileSource(compLang, req.workDir, runner, limits.compileTimeoutMs);
  if (!comp.ok) {
    return { languageLabel: lang.label, compiled: false, compileOutput: comp.output, run: null };
  }

  const artifactPath = isDocker ? null : artifactPathIn(compLang, req.workDir);
  let runCmd = isDocker ? [...compLang.runCmd] : resolveRunCmd(compLang.runCmd, artifactPath, req.workDir);
  if (compLang.id === "java") {
    runCmd = runCmd.map((arg) => {
      if (arg.startsWith("-Xmx")) return "-Xmx" + limits.memoryMb + "m";
      if (arg.startsWith("-Xss")) return "-Xss16m";
      return arg;
    });
  }
  const run = await runner.run({
    command: runCmd[0],
    args: runCmd.slice(1),
    cwd: req.workDir,
    stdin: req.stdin,
    timeLimitMs: limits.timeMs * compLang.timeFactor,
    outputLimitBytes: limits.outputBytes,
    memoryLimitMb: limits.memoryMb,
  });

  return { languageLabel: lang.label, compiled: true, compileOutput: comp.output, run };
}
