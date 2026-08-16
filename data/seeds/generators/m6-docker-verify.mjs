// DockerRunner 验证：容器内编译 + 运行 A1 样例
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DockerRunner, runCode, judge } from "../../../packages/judge/dist/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, "..", "..", "..");

const runner = new DockerRunner("dp-oj/judge-env", 256);
const dir = mkdtempSync(join(tmpdir(), "dp-oj-docker-"));
const code = readFileSync(join(projectRoot, "packages/judge/examples/a1-ac.cpp"), "utf8");
writeFileSync(join(dir, "main.cpp"), code);

// runCode：容器内编译 + 运行
const t0 = performance.now();
const r = await runCode({
  languageId: "cpp",
  sourcePath: join(dir, "main.cpp"),
  workDir: dir,
  stdin: "70 3" + String.fromCharCode(10) + "71 100" + String.fromCharCode(10) + "69 1" + String.fromCharCode(10) + "1 2" + String.fromCharCode(10),
  limits: { timeMs: 3000, memoryMb: 256 },
  runner,
});
console.log("runCode: compiled=" + r.compiled + " stdout=" + JSON.stringify((r.run ? r.run.stdout : "").trim()) + " timeMs=" + Math.round(r.run ? r.run.timeMs : 0) + " wallMs=" + Math.round(performance.now() - t0));
if (!r.compiled) console.log("compileOutput:", r.compileOutput);
if (r.run && r.run.error) console.log("runCode error:", r.run.error);

// judge：容器内完整判题（A1 全 12 组）
const cases = [];
for (let i = 1; i <= 12; i++) {
  const no = String(i).padStart(2, "0");
  cases.push({
    groupNo: i,
    inputPath: join(process.cwd(), "data/problems/a1/cases/" + no + ".in"),
    outputPath: join(process.cwd(), "data/problems/a1/cases/" + no + ".out"),
  });
}
const j = await judge({
  languageId: "cpp",
  sourcePath: join(dir, "main.cpp"),
  workDir: mkdtempSync(join(tmpdir(), "dp-oj-docker-judge-")),
  testcases: cases,
  limits: { timeMs: 3000, memoryMb: 256 },
  runner,
});
console.log("judge: verdict=" + j.verdict + " groups=" + j.cases.length + " totalMs=" + j.totalTimeMs);
if (j.error) console.log("judge error:", j.error);
