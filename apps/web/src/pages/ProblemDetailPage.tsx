import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Markdown from "../components/Markdown";
import ProblemTimer from "../components/ProblemTimer";
import SubmitPanel from "../components/SubmitPanel";
import { useAutoStart } from "../hooks/useTimer";
import { difficultyClass, type ProblemDetail } from "../types";

const ALL_LANGS = ["cpp", "python", "go", "java"];

export default function ProblemDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoStart] = useAutoStart();

  // 重置本题：递增 key 重挂计时器与提交面板（内部 state 全部恢复初始）
  const [resetKey, setResetKey] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const confirmTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    setProblem(null);
    setError(null);
    fetch("/api/problems/" + slug)
      .then((r) => {
        if (r.status === 404) throw new Error("题目不存在");
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data: ProblemDetail) => {
        if (alive) setProblem(data);
      })
      .catch((e) => {
        if (alive) setError(String(e));
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current !== null) window.clearTimeout(confirmTimerRef.current);
    };
  }, []);

  const onResetClick = () => {
    if (!confirming) {
      // 第一次点击进入确认态，3 秒未确认自动恢复
      setConfirming(true);
      confirmTimerRef.current = window.setTimeout(() => setConfirming(false), 3000);
      return;
    }
    // 确认重置：清草稿（所有语言）+ 计时 + 重挂面板
    for (const lang of ALL_LANGS) {
      try {
        localStorage.removeItem("dp-oj-code-" + slug + "-" + lang);
      } catch {
        // 忽略
      }
    }
    if (confirmTimerRef.current !== null) window.clearTimeout(confirmTimerRef.current);
    setConfirming(false);
    setResetKey((k) => k + 1);
  };

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← 返回题目列表
      </Link>

      {error && <div className="banner error">{error}</div>}

      {problem && (
        <>
          <header className="page-head">
            <div className="prob-title-row">
              <span className="prob-id big">{problem.displayId}</span>
              <h1>{problem.title}</h1>
              <span className={"difficulty " + difficultyClass(problem.difficulty)}>{problem.difficulty}</span>
              <span className="title-spacer" />
              <ProblemTimer key={"timer-" + resetKey} slug={problem.slug} autoStart={autoStart} />
            </div>
            <div className="prob-meta">
              <span className="lecture">第 {problem.lectureNo} 讲 · {problem.lectureTitle}</span>
              {problem.tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
              <span className="tag limit">
                时限 {(problem.timeLimitMs / 1000).toFixed(1)}s · 内存 {problem.memoryLimitMb}MB
              </span>
            </div>
          </header>

          <section className="card">
            <Markdown>{problem.statement}</Markdown>
          </section>

          <section className="card">
            <h2>样例</h2>
            {problem.samples.map((s, i) => (
              <div key={i} className="sample">
                <div className="sample-col">
                  <div className="sample-label">输入 #{i + 1}</div>
                  <pre>{s.input}</pre>
                </div>
                <div className="sample-col">
                  <div className="sample-label">输出 #{i + 1}</div>
                  <pre>{s.output}</pre>
                </div>
                {s.note && <div className="sample-note">{s.note}</div>}
              </div>
            ))}
          </section>

          <SubmitPanel
            key={"submit-" + resetKey}
            problemSlug={problem.slug}
            samples={problem.samples}
            onReset={onResetClick}
            resetConfirming={confirming}
          />
        </>
      )}

      {!problem && !error && <div className="banner">加载题面中…</div>}
    </div>
  );
}
