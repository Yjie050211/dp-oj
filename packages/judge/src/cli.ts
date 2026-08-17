/**
 * 判题引擎 CLI（调试用）：
 *   node dist/cli.js --lang cpp --source path/main.cpp --cases path/cases [--time 1000] [--memory 256]
 * cases 目录内按 NN.in / NN.out 配对，NN 排序后依次作为测试组。
 * 结果以 JSON 打印到 stdout。
 */
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { judge } from "./judge";
import type { JudgeRequest } from "./types";

function argValue(args: string[], name: string): string | null {
  const i = args.indexOf(name);
  if (i >= 0 && i + 1 < args.length) return args[i + 1];
  return null;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const lang = argValue(argv, "--lang");
  const sourceArg = argValue(argv, "--source");
  const casesArg = argValue(argv, "--cases");
  const time = Number(argValue(argv, "--time") ?? 1000);
  const memory = Number(argValue(argv, "--memory") ?? 256);

  if (!lang || !sourceArg || !casesArg) {
    console.error("用法: node dist/cli.js --lang cpp --source main.cpp --cases cases [--time 1000] [--memory 256]");
    process.exit(2);
  }

  const source = resolve(sourceArg);
  const casesDir = resolve(casesArg);

  const files = readdirSync(casesDir)
    .filter((f) => f.endsWith(".in"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true })); // 数字排序："10.in" 排在 "2.in" 之后

  const req: JudgeRequest = {
    languageId: lang,
    sourcePath: source,
    workDir: mkdtempSync(join(tmpdir(), "dp-oj-judge-")),
    testcases: files.map((f, i) => ({
      groupNo: i + 1,
      inputPath: join(casesDir, f),
      outputPath: join(casesDir, f.replace(/\.in$/, ".out")),
    })),
    limits: { timeMs: time, memoryMb: memory },
  };

  const result = await judge(req);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.verdict === "AC" ? 0 : 1);
}

main().catch((err) => {
  console.error(String(err));
  process.exit(2);
});
