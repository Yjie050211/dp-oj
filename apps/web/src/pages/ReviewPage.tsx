import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dueLabel, dueForReview, progressStats, resetProgress, upcomingReviews, wrongProblems, subscribeProgress, type ProblemProgress } from "../store/progress";

const STATE_LABELS: Record<string, string> = {
  unseen: "未做",
  attempted: "未通过",
  reviewing: "复习中",
  mastered: "已掌握",
};

const VERDICT_CLASS: Record<string, string> = {
  AC: "v-ac", WA: "v-wa", TLE: "v-tle", MLE: "v-mle", RE: "v-re", CE: "v-ce", SE: "v-se",
};

export default function ReviewPage() {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribeProgress(() => setVersion((v) => v + 1)), []);

  const stats = progressStats();
  const due = dueForReview();
  const wrong = wrongProblems();
  const upcoming = upcomingReviews();

  const fmtDate = (ts: number | null) => (ts === null ? '-' : new Date(ts).toLocaleDateString());

  const Row = ({ p, mode }: { p: ProblemProgress; mode: string }) => (
    <div className="review-row">
      <div className="review-row-main">
        <Link to={"/problems/" + p.slug + (mode === "due" ? "?review=1" : "")} className="review-title">
          {p.slug.toUpperCase()}
        </Link>
        <span className={"review-state st-" + p.state}>{STATE_LABELS[p.state] ?? p.state}</span>
        {mode === "due" && <span className="review-due">到期复习</span>}
        {mode === "upcoming" && <span className="review-next">{dueLabel(p)}</span>}
        {mode === "wrong" && p.lastVerdict && (
          <span className={"verdict small " + (VERDICT_CLASS[p.lastVerdict] ?? "v-se")}>{p.lastVerdict}</span>
        )}
        <span className="review-meta">
          {mode === "wrong" && <span>最近做错 {fmtDate(p.lastWrongAt)} · 错 {p.wrongCount} 次 · </span>}
          {p.acCount > 0 && <span>已过 {p.acCount} 次 · </span>}
          <span>共提交 {p.attempts} 次</span>
        </span>
      </div>
      <div className="review-row-actions">
        {mode === "due" && (
          <Link to={"/problems/" + p.slug + "?review=1"} className="btn primary small">
            开始复习
          </Link>
        )}
        <Link to={"/problems/" + p.slug} className="btn ghost small">
          打开题目
        </Link>
        <button type="button" className="btn danger small" onClick={() => { resetProgress(p.slug); setVersion((v) => v + 1); }}>
          移出
        </button>
      </div>
    </div>
  );

  return (
    <div className="page">
      <header className="page-head">
        <h1>复习计划 · 错题本</h1>
        <p className="subtitle">间隔重复：首次通过 1 天后复习，按记忆效果自动拉长间隔</p>
      </header>

      <div className="stat-strip">
        <div className="stat-cell">
          <div className="stat-num">{stats.acProblems}</div>
          <div className="stat-label">已通过 / 34</div>
        </div>
        <div className="stat-cell accent">
          <div className="stat-num">{stats.dueCount}</div>
          <div className="stat-label">今日待复习</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{stats.wrongCount}</div>
          <div className="stat-label">错题</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{stats.totalAttempts}</div>
          <div className="stat-label">总提交</div>
        </div>
      </div>

      <section className="card">
        <h2>待复习（{due.length}）</h2>
        {due.length === 0 && <div className="banner">🎉 今日没有到期复习，去刷新题或看错题吧。</div>}
        {due.map((p) => (
          <Row key={"due-" + p.slug} p={p} mode="due" />
        ))}
      </section>

      <section className="card">
        <h2>错题本（{wrong.length}）</h2>
        {wrong.length === 0 && <div className="banner">没有错题记录。</div>}
        {wrong.map((p) => (
          <Row key={"wrong-" + p.slug} p={p} mode="wrong" />
        ))}
      </section>

      {upcoming.length > 0 && (
        <section className="card">
          <h2>即将复习（{upcoming.length}）</h2>
          {upcoming.map((p) => (
            <Row key={"up-" + p.slug} p={p} mode="upcoming" />
          ))}
        </section>
      )}
    </div>
  );
}
