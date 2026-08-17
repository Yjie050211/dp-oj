import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { heatmapWeeks, getActivity, subscribeActivity } from "../store/activity";
import { getAllProgress, subscribeProgress, dueForReview, wrongProblems } from "../store/progress";
import { formatDuration } from "../hooks/useTimer";
import { type ProblemSummary } from "../types";

const LECTURES: { no: number; title: string }[] = [
  { no: 1, title: "01 背包问题" },
  { no: 2, title: "完全背包问题" },
  { no: 3, title: "多重背包问题" },
  { no: 4, title: "混合三种背包问题" },
  { no: 5, title: "二维费用的背包问题" },
  { no: 6, title: "分组的背包问题" },
  { no: 7, title: "有依赖的背包问题" },
  { no: 8, title: "泛化物品" },
  { no: 9, title: "背包问题问法的变化" },
];

const VERDICT_ORDER = ["AC", "WA", "TLE", "RE", "CE", "MLE", "SE"] as const;

/** 聚合所有题目的计时器累计时长（含进行中的片段） */
function totalFocusMs(): number {
  let total = 0;
  try {
    const now = Date.now();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("dp-oj-timer-")) continue;
      const parsed = JSON.parse(localStorage.getItem(key) ?? "null") as { status?: string; accumulatedMs?: number; startedAt?: number } | null;
      if (!parsed || typeof parsed.accumulatedMs !== "number") continue;
      let ms = parsed.accumulatedMs;
      if (parsed.status === "running" && typeof parsed.startedAt === "number") {
        ms += now - parsed.startedAt;
      }
      total += ms;
    }
  } catch {
    // 忽略
  }
  return total;
}

export default function DashboardPage() {
  const [problems, setProblems] = useState<ProblemSummary[] | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => subscribeProgress(() => setVersion((v) => v + 1)), []);
  useEffect(() => subscribeActivity(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    let alive = true;
    fetch("/api/problems")
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data: ProblemSummary[]) => {
        if (alive) setProblems(data);
      })
      .catch(() => {
        // 忽略：进度区仍可用
      });
    return () => {
      alive = false;
    };
  }, []);

  const progressMap = useMemo(() => {
    void version;
    const map: Record<string, ReturnType<typeof getAllProgress>[number]> = {};
    for (const p of getAllProgress()) map[p.slug] = p;
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const byLecture = useMemo(() => {
    if (!problems) return null;
    return LECTURES.map((l) => {
      const items = problems.filter((p) => p.lectureNo === l.no);
      const solved = items.filter((p) => (progressMap[p.slug]?.acCount ?? 0) > 0);
      const times = solved
        .map((p) => progressMap[p.slug]?.firstAcMs ?? null)
        .filter((t): t is number => t !== null);
      const avgMs = times.length > 0 ? Math.round(times.reduce((s, t) => s + t, 0) / times.length) : null;
      return { no: l.no, title: l.title, total: items.length, solved: solved.length, avgMs };
    });
  }, [problems, progressMap]);

  const activity = getActivity();
  const weeks = heatmapWeeks();
  const focusMs = useMemo(() => totalFocusMs(), [version]);
  const dueCount = dueForReview().length;
  const wrongCount = wrongProblems().length;
  const acProblems = Object.values(progressMap).filter((p) => p.acCount > 0).length;
  const maxVerdict = Math.max(1, ...Object.values(activity.verdicts));

  const heatLevel = (n: number | null): string => {
    if (n === null || n === 0) return "h0";
    if (n <= 2) return "h1";
    if (n <= 4) return "h2";
    if (n <= 7) return "h3";
    return "h4";
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>进度统计</h1>
        <p className="subtitle">九讲掌握度 · 提交热力图 · 专注时长（数据保存在本机浏览器）</p>
      </header>

      <div className="stat-strip">
        <div className="stat-cell">
          <div className="stat-num">{acProblems}/34</div>
          <div className="stat-label">已通过</div>
        </div>
        <div className="stat-cell accent">
          <div className="stat-num">{dueCount}</div>
          <div className="stat-label">待复习</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{wrongCount}</div>
          <div className="stat-label">错题</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{formatDuration(focusMs)}</div>
          <div className="stat-label">累计专注</div>
        </div>
      </div>

      {/* 九讲进度 */}
      <section className="card">
        <h2>九讲进度</h2>
        <div className="lecture-grid">
          {byLecture &&
            byLecture.map((l) => (
              <div key={l.no} className="lecture-cell">
                <div className="lecture-cell-head">
                  <span className="lecture-cell-no">第 {l.no} 讲</span>
                  <span className="lecture-cell-count">{l.solved}/{l.total}</span>
                </div>
                <div className="lecture-cell-title">{l.title}</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: (l.total === 0 ? 0 : Math.round((l.solved / l.total) * 100)) + "%" }} />
                </div>
                <div className="lecture-cell-avg">
                  {l.avgMs !== null ? <>平均首过 {formatDuration(l.avgMs)}</> : <span className="muted-text">尚未通过</span>}
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* 提交热力图 */}
      <section className="card">
        <h2>提交热力图（近 12 周）</h2>
        <div className="heatmap">
          {weeks.map((week, wi) => (
            <div key={wi} className="heatmap-col">
              {week.map((d) => (
                <div key={d.key} className={"heat-cell " + heatLevel(d.stat ? d.stat.submissions : null)} title={d.key + " · 提交 " + (d.stat?.submissions ?? 0) + " · AC " + (d.stat?.ac ?? 0)} />
              ))}
            </div>
          ))}
        </div>
        <div className="heat-legend">少 <span className="heat-cell h0" /> <span className="heat-cell h1" /> <span className="heat-cell h2" /> <span className="heat-cell h3" /> <span className="heat-cell h4" /> 多</div>
      </section>

      {/* 结果码分布 */}
      <section className="card">
        <h2>结果码分布</h2>
        {VERDICT_ORDER.filter((v) => activity.verdicts[v]).map((v) => {
          const n = activity.verdicts[v];
          return (
            <div key={v} className="verdict-dist-row">
              <span className={"verdict small " + "v-" + v.toLowerCase()}>{v}</span>
              <div className="verdict-dist-bar">
                <div className="verdict-dist-fill" style={{ width: Math.round((n / maxVerdict) * 100) + "%" }} />
              </div>
              <span className="verdict-dist-num">{n}</span>
            </div>
          );
        })}
        {VERDICT_ORDER.every((v) => !activity.verdicts[v]) && (
          <div className="banner">还没有判题记录，<Link to="/">去刷一道题</Link>吧。</div>
        )}
      </section>
    </div>
  );
}
