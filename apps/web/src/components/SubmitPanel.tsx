import { useEffect, useRef, useState } from "react";
import { VERDICT_CLASS, type SubmissionDetail } from "../types";

interface LangInfo {
  id: string;
  label: string;
  available: boolean;
  version: string | null;
}

/** 每种语言的初始代码模板 */
const TEMPLATES: Record<string, string> = {
  cpp: [
    "#include <bits/stdc++.h>",
    "using namespace std;",
    "",
    "int main() {",
    "    ios::sync_with_stdio(false);",
    "    cin.tie(nullptr);",
    "    ",
    "    return 0;",
    "}",
    "",
  ].join("\n"),
  python: ["import sys", "", "", "def main():", "    data = sys.stdin.read().split()", "", "", "main()", ""].join("\n"),
  go: [
    "package main",
    "",
    "import (",
    '    "bufio"',
    '    "fmt"',
    '    "os"',
    ")",
    "",
    "func main() {",
    "    in := bufio.NewReader(os.Stdin)",
    "",
    "}",
    "",
  ].join("\n"),
  java: [
    "import java.util.*;",
    "",
    "public class Main {",
    "    public static void main(String[] args) {",
    "        Scanner sc = new Scanner(System.in);",
    "    }",
    "}",
    "",
  ].join("\n"),
};

function storageKey(slug: string, lang: string): string {
  return "dp-oj-code-" + slug + "-" + lang;
}

export default function SubmitPanel({ problemSlug }: { problemSlug: string }) {
  const [languages, setLanguages] = useState<LangInfo[]>([]);
  const [langId, setLangId] = useState("cpp");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  // 语言列表
  useEffect(() => {
    fetch("/api/system/languages")
      .then((r) => r.json())
      .then((langs: LangInfo[]) => {
        setLanguages(langs);
        const firstAvailable = langs.find((l) => l.available);
        if (firstAvailable) {
          setLangId((cur) => (cur && langs.some((l) => l.id === cur && l.available) ? cur : firstAvailable.id));
        }
      })
      .catch(() => setLanguages([{ id: "cpp", label: "C++14", available: true, version: null }]));
  }, []);

  // 切换语言时读写草稿
  useEffect(() => {
    const saved = localStorage.getItem(storageKey(problemSlug, langId));
    setCode(saved ?? TEMPLATES[langId] ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langId, problemSlug]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, []);

  const onLangChange = (next: string) => {
    localStorage.setItem(storageKey(problemSlug, langId), code);
    setLangId(next);
  };

  const onCodeChange = (v: string) => {
    setCode(v);
    localStorage.setItem(storageKey(problemSlug, langId), v);
  };

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    setSubmission(null);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemSlug, languageId: langId, code }),
      });
      if (!res.ok) {
        const text = await res.text();
        let message = "HTTP " + res.status;
        try {
          const parsed = JSON.parse(text);
          if (parsed.message) message = parsed.message;
        } catch {
          // 保持默认消息
        }
        throw new Error(message);
      }
      const created = (await res.json()) as SubmissionDetail;
      setSubmission(created);
      poll(created.id);
    } catch (e) {
      setError(String(e));
      setSubmitting(false);
    }
  };

  const poll = (id: number) => {
    const tick = async () => {
      try {
        const res = await fetch("/api/submissions/" + id);
        const data = (await res.json()) as SubmissionDetail;
        setSubmission(data);
        if (data.status === "FINISHED") {
          if (timerRef.current !== null) window.clearInterval(timerRef.current);
          setSubmitting(false);
        }
      } catch {
        // 轮询失败下个周期重试
      }
    };
    tick();
    timerRef.current = window.setInterval(tick, 1000);
  };

  const verdict = submission?.verdict ?? null;
  const result = submission?.result;

  return (
    <section className="card submit-panel">
      <div className="submit-head">
        <h2>编写代码</h2>
        <select
          className="lang-select"
          value={langId}
          onChange={(e) => onLangChange(e.target.value)}
          disabled={submitting}
        >
          {languages.map((l) => (
            <option key={l.id} value={l.id} disabled={!l.available}>
              {l.label}
              {l.available ? "" : "（未安装）"}
            </option>
          ))}
        </select>
        <button className="btn primary" onClick={submit} disabled={submitting || code.trim().length === 0}>
          {submitting ? "判题中…" : "提交"}
        </button>
      </div>

      <textarea
        className="code-editor"
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        spellCheck={false}
        placeholder="在这里编写代码…"
      />

      {error && <div className="banner error">{error}</div>}

      {submission && !verdict && <div className="banner">提交 #{submission.id} 排队判题中…</div>}

      {verdict && result && (
        <div className="result-panel">
          <div className="result-head">
            <span className={"verdict " + VERDICT_CLASS[verdict]}>{verdict}</span>
            <span className="result-meta">
              {result.totalTimeMs != null && <>总耗时 {result.totalTimeMs} ms</>}
              {verdict === "AC" && <> · {result.cases.length} 组全部通过</>}
            </span>
          </div>

          {verdict === "CE" && result.compileOutput && (
            <div className="compile-output">
              <div className="result-label">编译器输出</div>
              <pre>{result.compileOutput}</pre>
            </div>
          )}

          {verdict === "SE" && result.error && (
            <div className="compile-output">
              <div className="result-label">系统错误</div>
              <pre>{result.error}</pre>
            </div>
          )}

          {result.cases.length > 0 && (
            <table className="case-table">
              <thead>
                <tr>
                  <th>测试组</th>
                  <th>结果</th>
                  <th>耗时</th>
                </tr>
              </thead>
              <tbody>
                {result.cases.map((c) => (
                  <tr key={c.groupNo} className={c.verdict !== "AC" ? "row-fail" : ""}>
                    <td>#{c.groupNo}</td>
                    <td>
                      <span className={"verdict small " + VERDICT_CLASS[c.verdict]}>{c.verdict}</span>
                    </td>
                    <td>{c.timeMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {verdict === "WA" &&
            result.cases.some((c) => c.actualOutput !== null) &&
            (() => {
              const failed = result.cases.find((c) => c.actualOutput !== null)!;
              return (
                <div className="wa-compare">
                  <div className="wa-col">
                    <div className="result-label">你的输出</div>
                    <pre>{failed.actualOutput}</pre>
                  </div>
                  <div className="wa-col">
                    <div className="result-label">期望输出</div>
                    <pre>{failed.expectedOutput}</pre>
                  </div>
                </div>
              );
            })()}

          {verdict === "RE" &&
            result.cases.some((c) => c.stderr !== null) &&
            (() => {
              const failed = result.cases.find((c) => c.stderr !== null)!;
              return (
                <div className="compile-output">
                  <div className="result-label">运行时错误（stderr）</div>
                  <pre>{failed.stderr}</pre>
                </div>
              );
            })()}
        </div>
      )}
    </section>
  );
}
