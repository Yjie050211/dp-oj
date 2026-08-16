// M3 验收：HTTP 全链路提交四语言 AC 代码
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const examples = join(here, "..", "..", "..", "packages", "judge", "examples");

const langs = [
  ["cpp", "a1-ac.cpp"],
  ["python", "a1-ac.py"],
  ["go", "a1-ac.go"],
  ["java", "a1-ac.java"],
];

async function submitAndPoll(langId, code) {
  const created = await fetch("http://localhost:3000/api/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problemSlug: "a1", languageId: langId, code }),
  }).then((r) => r.json());

  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 800));
    const s = await fetch("http://localhost:3000/api/submissions/" + created.id).then((r) => r.json());
    if (s.status === "FINISHED") {
      return langId + " => " + s.verdict + " (" + s.result.totalTimeMs + "ms, " + s.result.cases.length + " groups)";
    }
  }
  return langId + " => POLL_TIMEOUT";
}

for (const [lang, file] of langs) {
  const code = readFileSync(join(examples, file), "utf8");
  console.log(await submitAndPoll(lang, code));
}
