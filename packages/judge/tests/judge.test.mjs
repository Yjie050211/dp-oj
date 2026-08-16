// 判题引擎单元测试：结果码判定 / 输出比对 / 超时杀进程 / C++ 端到端（AC/WA/TLE/CE）
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { judge, compareOutput, normalizeOutput, LocalProcessRunner } from "../dist/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const examples = join(here, "..", "examples");

/** 造一个临时测试用例目录 */
function makeCaseDir(files) {
  const dir = mkdtempSync(join(tmpdir(), "dp-oj-test-"));
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
  return dir;
}

const SAMPLE_IN = "70 3\n71 100\n69 1\n1 2\n";
const SAMPLE_OUT = "3\n";

// ---------- 输出比对 ----------
test("compareOutput: 完全一致判相等", () => {
  assert.equal(compareOutput("1 2 3\n", "1 2 3\n"), true);
});

test("compareOutput: 忽略行末空格与末尾空行", () => {
  assert.equal(compareOutput("1 2 3  \n4\n\n", "1 2 3\n4\n"), true);
});

test("compareOutput: 兼容 CRLF", () => {
  assert.equal(compareOutput("1\r\n2\r\n", "1\n2\n"), true);
});

test("compareOutput: 行内差异判不相等", () => {
  assert.equal(compareOutput("1 2\n", "1  2\n"), false);
  assert.equal(compareOutput("12\n", "1 2\n"), false);
});

test("normalizeOutput: 基本规范化", () => {
  assert.equal(normalizeOutput("a  \r\nb\n\n"), "a\nb");
});

// ---------- 运行器 ----------
test("Runner: 正常捕获 stdout", async () => {
  const runner = new LocalProcessRunner();
  const r = await runner.run({
    command: process.execPath,
    args: ["-e", "process.stdout.write('hello world')"],
    cwd: tmpdir(),
    stdin: "",
    timeLimitMs: 5000,
    outputLimitBytes: 1024 * 1024,
  });
  assert.equal(r.ok, true);
  assert.equal(r.stdout, "hello world");
  assert.equal(r.timedOut, false);
  assert.equal(r.exitCode, 0);
});

test("Runner: 超时强杀（死循环进程）", async () => {
  const runner = new LocalProcessRunner();
  const r = await runner.run({
    command: process.execPath,
    args: ["-e", "while(true){}"],
    cwd: tmpdir(),
    stdin: "",
    timeLimitMs: 600,
    outputLimitBytes: 1024 * 1024,
  });
  assert.equal(r.timedOut, true);
  assert.equal(r.ok, false);
});

test("Runner: 输出超限截断标记", async () => {
  const runner = new LocalProcessRunner();
  const r = await runner.run({
    command: process.execPath,
    args: ["-e", "process.stdout.write('x'.repeat(200000))"],
    cwd: tmpdir(),
    stdin: "",
    timeLimitMs: 5000,
    outputLimitBytes: 1000,
  });
  assert.equal(r.outputTruncated, true);
});

test("Runner: 非零退出码上报", async () => {
  const runner = new LocalProcessRunner();
  const r = await runner.run({
    command: process.execPath,
    args: ["-e", "process.exit(3)"],
    cwd: tmpdir(),
    stdin: "",
    timeLimitMs: 5000,
    outputLimitBytes: 1024 * 1024,
  });
  assert.equal(r.exitCode, 3);
  assert.equal(r.ok, false);
});

// ---------- C++ 端到端（依赖本机 g++）----------
function judgeCpp(sourceFile, cases, limits) {
  return judge({
    languageId: "cpp",
    sourcePath: join(examples, sourceFile),
    workDir: mkdtempSync(join(tmpdir(), "dp-oj-work-")),
    testcases: cases,
    limits,
  });
}

function sampleCases(dir) {
  return [{ groupNo: 1, inputPath: join(dir, "01.in"), outputPath: join(dir, "01.out") }];
}

test("judge(cpp): AC 代码全组通过", async () => {
  const dir = makeCaseDir({ "01.in": SAMPLE_IN, "01.out": SAMPLE_OUT });
  const r = await judgeCpp("a1-ac.cpp", sampleCases(dir));
  assert.equal(r.verdict, "AC");
  assert.equal(r.cases.length, 1);
  assert.equal(r.cases[0].verdict, "AC");
});

test("judge(cpp): WA 代码判答案错误并附带输出对比", async () => {
  const dir = makeCaseDir({ "01.in": SAMPLE_IN, "01.out": SAMPLE_OUT });
  const r = await judgeCpp("a1-wa.cpp", sampleCases(dir));
  assert.equal(r.verdict, "WA");
  assert.equal(normalizeOutput(r.cases[0].actualOutput ?? ""), "0");
  assert.equal(r.cases[0].expectedOutput, SAMPLE_OUT);
});

test("judge(cpp): TLE 代码判超时", async () => {
  const dir = makeCaseDir({ "01.in": SAMPLE_IN, "01.out": SAMPLE_OUT });
  const r = await judgeCpp("a1-tle.cpp", sampleCases(dir), { timeMs: 700 });
  assert.equal(r.verdict, "TLE");
  assert.equal(r.cases[0].verdict, "TLE");
});

test("judge(cpp): CE 代码判编译错误并附编译器输出", async () => {
  const dir = makeCaseDir({ "01.in": SAMPLE_IN, "01.out": SAMPLE_OUT });
  const r = await judgeCpp("a1-ce.cpp", sampleCases(dir));
  assert.equal(r.verdict, "CE");
  assert.ok(r.compileOutput && r.compileOutput.length > 0);
});

test("judge: 首败组即终态（第 1 组过、第 2 组挂）", async () => {
  const dir = makeCaseDir({
    "01.in": SAMPLE_IN, "01.out": SAMPLE_OUT,
    "02.in": "70 3\n71 100\n69 1\n1 2\n", "02.out": "999\n",
  });
  const r = await judgeCpp("a1-ac.cpp", [
    { groupNo: 1, inputPath: join(dir, "01.in"), outputPath: join(dir, "01.out") },
    { groupNo: 2, inputPath: join(dir, "02.in"), outputPath: join(dir, "02.out") },
  ]);
  assert.equal(r.verdict, "WA");
  assert.equal(r.cases.length, 2);
  assert.equal(r.cases[0].verdict, "AC");
  assert.equal(r.cases[1].verdict, "WA");
});

test("judge: 未知语言判 SE", async () => {
  const dir = makeCaseDir({ "01.in": SAMPLE_IN, "01.out": SAMPLE_OUT });
  const r = await judge({
    languageId: "rust",
    sourcePath: join(examples, "a1-ac.cpp"),
    workDir: mkdtempSync(join(tmpdir(), "dp-oj-work-")),
    testcases: sampleCases(dir),
  });
  assert.equal(r.verdict, "SE");
  assert.ok(r.error);
});
