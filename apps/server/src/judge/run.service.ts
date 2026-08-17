import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { LANGUAGES } from "@dp-oj/common";
import { createRunner, runCode } from "@dp-oj/judge";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface RunRequestInput {
  languageId: string;
  code: string;
  stdin: string;
}

const MAX_CONCURRENT_RUNS = 2;

@Injectable()
export class RunService {
  /** 即时测试并发上限：防止并发编译进程拖垮本机 */
  private activeRuns = 0;

  /** 即时测试：编译 + 以给定 stdin 运行一次，不做输出比对 */
  async run(input: RunRequestInput) {
    const lang = LANGUAGES.find((l) => l.id === input.languageId);
    if (!lang) throw new BadRequestException("不支持的语言: " + input.languageId);
    if (typeof input.code !== "string" || input.code.trim().length === 0) {
      throw new BadRequestException("代码不能为空");
    }
    if (input.code.length > 200 * 1024) throw new BadRequestException("代码过长（上限 200KB）");
    const stdin = typeof input.stdin === "string" ? input.stdin.slice(0, 1024 * 1024) : "";

    if (this.activeRuns >= MAX_CONCURRENT_RUNS) {
      throw new ServiceUnavailableException("判题机繁忙，请稍后再试");
    }
    this.activeRuns++;
    const dir = mkdtempSync(join(tmpdir(), "dp-oj-run-"));
    try {
      const src = join(dir, lang.sourceFile);
      writeFileSync(src, input.code, "utf8");

      const result = await runCode({
        languageId: input.languageId,
        sourcePath: src,
        workDir: dir,
        stdin,
        limits: { timeMs: 2000, memoryMb: 256 },
        runner: createRunner(),
      });

      return {
        compiled: result.compiled,
        compileOutput: result.compiled ? null : result.compileOutput,
        exitCode: result.run?.exitCode ?? null,
        stdout: result.run?.stdout ?? "",
        stderr: result.run?.stderr ?? "",
        timeMs: Math.round((result.run?.timeMs ?? 0) * 10) / 10,
        timedOut: result.run?.timedOut ?? false,
        outputTruncated: result.run?.outputTruncated ?? false,
        error: result.run?.error ?? null,
      };
    } finally {
      rmSync(dir, { recursive: true, force: true });
      this.activeRuns--;
    }
  }
}
