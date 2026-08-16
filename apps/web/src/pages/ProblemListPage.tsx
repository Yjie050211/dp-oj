import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { difficultyClass, type ProblemSummary } from "../types";

export default function ProblemListPage() {
  const [problems, setProblems] = useState<ProblemSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/problems")
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data: ProblemSummary[]) => {
        if (alive) {
          setProblems(data);
          setError(null);
        }
      })
      .catch((e) => {
        if (alive) setError(String(e));
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="page">
      <header className="page-head">
        <h1>题目列表</h1>
        <p className="subtitle">基于《背包问题九讲》· 共 {problems ? problems.length : "…"} 题</p>
      </header>

      {error && <div className="banner error">加载失败：{error}</div>}

      {problems && (
        <div className="prob-list">
          {problems.map((p) => (
            <Link key={p.slug} to={"/problems/" + p.slug} className="prob-card">
              <div className="prob-id">{p.displayId}</div>
              <div className="prob-main">
                <div className="prob-title">{p.title}</div>
                <div className="prob-meta">
                  <span className="lecture">第 {p.lectureNo} 讲 · {p.lectureTitle}</span>
                  {p.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <span className={"difficulty " + difficultyClass(p.difficulty)}>{p.difficulty}</span>
            </Link>
          ))}
        </div>
      )}

      {!problems && !error && <div className="banner">加载题目中…</div>}
    </div>
  );
}
