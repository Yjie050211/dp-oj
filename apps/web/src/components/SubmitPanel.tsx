import { useEffect, useRef, useState } from "react";
import CodeEditor from "./CodeEditor";
import SubmissionResultView from "./SubmissionResultView";
import { useTheme } from "../theme";
import { type SubmissionDetail } from "../types";

interface LangInfo {
  id: string;
  label: string;
  available: boolean;
  version: string | null;
}

interface Sample {
  input: string;
  output: string;
  note?: string;
}

interface RunResultData {
  compiled: boolean;
  compileOutput: string | null;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timeMs: number;
  timedOut: boolean;
  outputTruncated: boolean;
  error: string | null;
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

export default function SubmitPanel({
  problemSlug,
  samples,
  onReset,
  resetConfirming = false,
}: {
  problemSlug: string;
  samples: Sample[];
  onReset?: () => void;
  resetConfirming?: boolean;
}) {
  const { isDark } = useTheme();
  const [languages, setLanguages] = useState<LangInfo[]>([]);
  const [langId, setLangId] = useState("cpp");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResultData | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customStdin, setCustomStdin] = useState("");

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
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(storageKey(problemSlug, langId));
    } catch {
      saved = null;
    }
    setCode(saved ?? TEMPLATES[langId] ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langId, problemSlug]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, []);

  const onLangChange = (next: string) => {
    try {
      localStorage.setItem(storageKey(problemSlug, langId), code);
    } catch {
      // 存储不可用不影响切换
    }
    setLangId(next);
  };

  const onCodeChange = (v: string) => {
    setCode(v);
    try {
      localStorage.setItem(storageKey(problemSlug, langId), v);
    } catch {
      // 存储不可用不影响编辑
    }
  };

  /** 即时测试：POST /api/judge/run */
  const doRun = async (stdin: string) => {
    setError(null);
    setRunning(true);
    setRunResult(null);
    setCustomOpen(true);
    try {
      const res = await fetch("/api/judge/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ languageId: langId, code, stdin }),
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
      setRunResult((await res.json()) as RunResultData);
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
    }
  };

  const runSample = () => {
    const input = samples[0]?.input ?? "";
    void doRun(input);
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
    let attempts = 0;
    const MAX_ATTEMPTS = 120; // 最多轮询约 2 分钟，防判题队列故障时无限轮询
    const tick = async () => {
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        setSubmitting(false);
        setError("判题超时未完成，请稍后在提交记录中查看结果。");
        return;
      }
      try {
        const res = await fetch("/api/submissions/" + id);
        if (!res.ok) throw new Error("HTTP " + res.status);
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
          disabled={submitting || running}
        >
          {languages.map((l) => (
            <option key={l.id} value={l.id} disabled={!l.available}>
              {l.label}
              {l.available ? "" : "（未安装）"}
            </option>
          ))}
        </select>
        {samples.length > 0 && (
          <button className="btn ghost" onClick={runSample} disabled={running || submitting || code.trim().length === 0}>
            {running ? "运行中…" : "运行样例"}
          </button>
        )}
        <button className="btn ghost" onClick={() => setCustomOpen((v) => !v)} disabled={submitting}>
          自定义测试 {customOpen ? "▴" : "▾"}
        </button>
        <button className="btn primary" onClick={submit} disabled={submitting || running || code.trim().length === 0}>
          {submitting ? "判题中…" : "提交"}
        </button>
        {onReset && (
          <button
            className={"btn danger" + (resetConfirming ? " confirming" : "")}
            onClick={onReset}
            title="清空本题的代码草稿、计时与判题结果"
          >
            {resetConfirming ? "确认重置？" : "🔄 重置本题"}
          </button>
        )}
      </div>

      <CodeEditor language={langId} value={code} onChange={onCodeChange} isDark={isDark} />

      {error && <div className="banner error">{error}</div>}

      {customOpen && (
        <div className="custom-panel">
          <div className="custom-head">
            <div className="result-label">自定义输入（stdin）</div>
            <button className="btn ghost" onClick={() => void doRun(customStdin)} disabled={running || code.trim().length === 0}>
              {running ? "运行中…" : "运行"}
            </button>
          </div>
          <textarea
            className="stdin-editor"
            value={customStdin}
            onChange={(e) => setCustomStdin(e.target.value)}
            spellCheck={false}
            placeholder="在这里输入测试数据…"
          />

          {runResult && (
            <div className="run-result">
              {!runResult.compiled && runResult.compileOutput && (
                <div className="compile-output">
                  <div className="result-label">编译器输出</div>
                  <pre>{runResult.compileOutput}</pre>
                </div>
              )}
              {runResult.compiled && (
                <>
                  <div className="result-head">
                    <span className={"verdict " + (runResult.timedOut ? "v-tle" : runResult.exitCode === 0 ? "v-ac" : "v-re")}>
                      {runResult.timedOut ? "超时" : runResult.exitCode === 0 ? "运行完成" : "退出码 " + runResult.exitCode}
                    </span>
                    <span className="result-meta">
                      耗时 {runResult.timeMs} ms
                      {runResult.outputTruncated && " · 输出已截断"}
                    </span>
                  </div>
                  {runResult.stdout && (
                    <div className="run-block">
                      <div className="result-label">stdout</div>
                      <pre>{runResult.stdout}</pre>
                    </div>
                  )}
                  {(runResult.stderr || runResult.error) && (
                    <div className="run-block">
                      <div className="result-label">stderr</div>
                      <pre>{runResult.stderr || runResult.error}</pre>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {submission && !verdict && <div className="banner">提交 #{submission.id} 排队判题中…</div>}

      {verdict && result && <SubmissionResultView verdict={verdict} result={result} />}
    </section>
  );
}
