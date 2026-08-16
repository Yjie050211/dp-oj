import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Markdown from "../components/Markdown";
import SubmitPanel from "../components/SubmitPanel";
import { difficultyClass, type ProblemDetail } from "../types";

export default function ProblemDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

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

          <SubmitPanel problemSlug={problem.slug} />
        </>
      )}

      {!problem && !error && <div className="banner">加载题面中…</div>}
    </div>
  );
}
