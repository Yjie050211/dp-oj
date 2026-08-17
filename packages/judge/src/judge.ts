import { DEFAULT_LIMITS, Verdict } from "@dp-oj/common";
import type { Verdict as VerdictCode } from "@dp-oj/common";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compileSource } from "./compile";
import { compareOutput } from "./compare";
import { DockerRunner } from "./docker-runner";
import { artifactPathIn, getLanguage, resolveRunCmd } from "./language";
import { LocalProcessRunner } from "./runner";
import type { CaseResult, JudgeLimits, JudgeRequest, SubmissionResult } from "./types";

const CASE_OUTPUT_CAP = 4096; // WA 时保留的期望/实际输出节选长度

/** 判题主流程：编译 → 逐组运行比对 → 首败终态 → 汇总 */
export async function judge(req: JudgeRequest): Promise<SubmissionResult> {
  const lang = getLanguage(req.languageId);
  if (!lang) {
    return {
      verdict: Verdict.SE, compileOutput: null, totalTimeMs: 0, maxMemoryKb: null,
      cases: [], error: "未知语言: " + req.languageId,
    };
  }

  const runner = req.runner ?? new LocalProcessRunner();
  const limits: JudgeLimits = { ...DEFAULT_LIMITS, ...req.limits };

  if (req.testcases.length === 0) {
    return {
      verdict: Verdict.SE, compileOutput: null, totalTimeMs: 0, maxMemoryKb: null,
      cases: [], error: "该题没有测试用例",
    };
  }

  // 0. 准备工作目录并写入源码（按语言约定的文件名）
  try {
    mkdirSync(req.workDir, { recursive: true });
    const source = readFileSync(req.sourcePath, "utf8");
    writeFileSync(join(req.workDir, lang.sourceFile), source);
  } catch (err) {
    return {
      verdict: Verdict.SE, compileOutput: null, totalTimeMs: 0, maxMemoryKb: null,
      cases: [], error: "工作目录准备失败: " + String(err),
    };
  }

  // Docker 容器模式下运行命令保持容器内相对路径（镜像内 toolchain 编译 Linux 产物）
  const isDocker = req.runner instanceof DockerRunner;
  // Docker 容器内是 Linux：Go 编译产物名必须是 main（-o main.exe 会导致运行找不到文件）
  const compLang = isDocker && lang.id === "go"
    ? { ...lang, compileCmd: ["go", "build", "-o", "main", "main.go"] }
    : lang;

  // 1. 编译
  let compileOutput = "";
  try {
    const comp = await compileSource(compLang, req.workDir, runner, limits.compileTimeoutMs);
    compileOutput = comp.output;
    if (!comp.ok) {
      return {
        verdict: comp.systemError ? Verdict.SE : Verdict.CE,
        compileOutput: comp.systemError ? null : compileOutput,
        totalTimeMs: 0, maxMemoryKb: null,
        cases: [],
        error: comp.systemError ? "编译器不可用: " + comp.output : null,
      };
    }
  } catch (err) {
    return {
      verdict: Verdict.SE, compileOutput: null, totalTimeMs: 0, maxMemoryKb: null,
      cases: [], error: "编译阶段异常: " + String(err),
    };
  }

  const artifactPath = isDocker ? null : artifactPathIn(compLang, req.workDir);
  // 本地模式产物缺失：编译配置异常，判 CE 而非运行后 SE
  if (!isDocker && compLang.artifact && !artifactPath) {
    return {
      verdict: Verdict.CE, compileOutput, totalTimeMs: 0, maxMemoryKb: null,
      cases: [], error: null,
    };
  }
  const runCmd = isDocker ? [...compLang.runCmd] : resolveRunCmd(compLang.runCmd, artifactPath, req.workDir);
  const timeLimitMs = limits.timeMs * compLang.timeFactor;

  // Java 按题目内存上限动态设置 -Xmx（Docker 场景容器 --memory 与 JVM 堆联动）
  let finalRunCmd = runCmd;
  if (compLang.id === "java") {
    finalRunCmd = runCmd.map((arg) => {
      if (arg.startsWith("-Xmx")) return "-Xmx" + limits.memoryMb + "m";
      if (arg.startsWith("-Xss")) return "-Xss16m";
      return arg;
    });
  }

  // 2. 逐组运行
  const cases: CaseResult[] = [];
  let totalTimeMs = 0;
  let maxMemoryKb: number | null = null;

  for (const tc of req.testcases) {
    let input = "";
    let expected = "";
    try {
      input = readFileSync(tc.inputPath, "utf8");
      expected = readFileSync(tc.outputPath, "utf8");
    } catch (err) {
      return {
        verdict: Verdict.SE, compileOutput, totalTimeMs, maxMemoryKb,
        cases, error: "读取测试用例失败（组 " + tc.groupNo + "）: " + String(err),
      };
    }

    const r = await runner.run({
      command: finalRunCmd[0],
      args: finalRunCmd.slice(1),
      cwd: req.workDir,
      stdin: input,
      timeLimitMs,
      outputLimitBytes: limits.outputBytes,
      memoryLimitMb: limits.memoryMb,
    });

    totalTimeMs += r.timeMs;
    if (r.memoryKb !== null && (maxMemoryKb === null || r.memoryKb > maxMemoryKb)) {
      maxMemoryKb = r.memoryKb;
    }

    let verdict: Verdict;
    if (r.timedOut) {
      verdict = Verdict.TLE;
    } else if (r.error) {
      verdict = Verdict.SE;
    } else if (r.exitCode !== 0 && !r.outputTruncated) {
      verdict = Verdict.RE;
    } else if (r.outputTruncated || !compareOutput(expected, r.stdoutFull ?? r.stdout)) {
      verdict = Verdict.WA; // 输出超限（OLE）归 WA
    } else {
      verdict = Verdict.AC;
    }

    const caseResult: CaseResult = {
      groupNo: tc.groupNo,
      verdict,
      timeMs: Math.round(r.timeMs * 10) / 10,
      memoryKb: r.memoryKb,
      exitCode: r.exitCode,
      actualOutput: verdict === Verdict.WA ? (r.stdoutFull ?? r.stdout).slice(0, CASE_OUTPUT_CAP) : null,
      expectedOutput: verdict === Verdict.WA ? expected.slice(0, CASE_OUTPUT_CAP) : null,
      stderr: verdict === Verdict.RE ? r.stderr.slice(0, CASE_OUTPUT_CAP) : null,
      outputTruncated: r.outputTruncated,
    };
    cases.push(caseResult);

    // 首个失败组即终态
    if (verdict !== Verdict.AC) {
      return {
        verdict, compileOutput, totalTimeMs: Math.round(totalTimeMs * 10) / 10,
        maxMemoryKb, cases, error: null,
      };
    }
  }

  return {
    verdict: Verdict.AC, compileOutput, totalTimeMs: Math.round(totalTimeMs * 10) / 10,
    maxMemoryKb, cases, error: null,
  };
}
