import { BadRequestException, Injectable } from "@nestjs/common";
import { LANGUAGES } from "@dp-oj/common";
import { runCode } from "@dp-oj/judge";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface RunRequestInput {
  languageId: string;
  code: string;
  stdin: string;
}

@Injectable()
export class RunService {
  /** 即时测试：编译 + 以给定 stdin 运行一次，不做输出比对 */
  async run(input: RunRequestInput) {
    const lang = LANGUAGES.find((l) => l.id === input.languageId);
    if (!lang) throw new BadRequestException("不支持的语言: " + input.languageId);
    if (!input.code || input.code.trim().length === 0) throw new BadRequestException("代码不能为空");
    if (input.code.length > 200 * 1024) throw new BadRequestException("代码过长（上限 200KB）");
    const stdin = (input.stdin ?? "").slice(0, 1024 * 1024);

    const dir = mkdtempSync(join(tmpdir(), "dp-oj-run-"));
    const src = join(dir, lang.sourceFile);
    writeFileSync(src, input.code, "utf8");

    const result = await runCode({
      languageId: input.languageId,
      sourcePath: src,
      workDir: dir,
      stdin,
      limits: { timeMs: 2000, memoryMb: 256 },
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
  }
}
