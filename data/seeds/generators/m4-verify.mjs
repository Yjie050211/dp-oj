// M4 验收：POST /api/judge/run 即时测试（四语言 + CE），测端到端耗时
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const examples = join(here, "..", "..", "..", "packages", "judge", "examples");
const STDIN = "70 3\n71 100\n69 1\n1 2\n";

const langs = [
  ["cpp", "a1-ac.cpp"],
  ["python", "a1-ac.py"],
  ["go", "a1-ac.go"],
  ["java", "a1-ac.java"],
];

async function runOnce(langId, code, stdin) {
  const t0 = performance.now();
  const res = await fetch("http://localhost:3000/api/judge/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ languageId: langId, code, stdin }),
  });
  const data = await res.json();
  const wall = Math.round(performance.now() - t0);
  const ok = data.compiled && data.exitCode === 0 && data.stdout.trim() === "3";
  return langId + " => " + (ok ? "OK" : "FAIL") + " (wall=" + wall + "ms, run=" + data.timeMs + "ms, stdout=" + JSON.stringify(data.stdout.trim()) + ")";
}

for (const [lang, file] of langs) {
  const code = readFileSync(join(examples, file), "utf8");
  console.log(await runOnce(lang, code, STDIN));
}

// CE 即时反馈
const ceCode = readFileSync(join(examples, "a1-ce.cpp"), "utf8");
const ce = await runOnce("cpp", ceCode, STDIN);
console.log("ce =>", ce);

// 直接看 CE 响应结构
const res = await fetch("http://localhost:3000/api/judge/run", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ languageId: "cpp", code: ceCode, stdin: "" }),
});
const ceData = await res.json();
console.log("CE compiled=", ceData.compiled, "compileOutputLen=", (ceData.compileOutput ?? "").length);
