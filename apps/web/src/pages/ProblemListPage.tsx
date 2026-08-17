import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { dueForReview, dueLabel, getAllProgress, subscribeProgress } from "../store/progress";
import { difficultyClass, type ProblemSummary } from "../types";

/** 九讲分类（与题库 lectureNo 对应） */
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

export default function ProblemListPage() {
  const [problems, setProblems] = useState<ProblemSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** 当前选中的讲次（0 = 全部） */
  const [lecture, setLecture] = useState(0);
  /** 学习进度订阅（徽章 + 待复习聚合条） */
  const [progressVersion, setProgressVersion] = useState(0);
  useEffect(() => subscribeProgress(() => setProgressVersion((v) => v + 1)), []);

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

  const filtered = useMemo(
    () => (lecture === 0 ? problems : (problems ?? []).filter((p) => p.lectureNo === lecture)),
    [problems, lecture]
  );

  const progressMap = useMemo(() => {
    void progressVersion; // 订阅刷新用
    const map: Record<string, ReturnType<typeof getAllProgress>[number]> = {};
    for (const p of getAllProgress()) map[p.slug] = p;
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressVersion, problems]);

  const dueCount = dueForReview().length;

  const badgeFor = (slug: string): { text: string; cls: string } | null => {
    const p = progressMap[slug];
    if (!p) return null;
    if (p.reviewDue !== null && p.reviewDue <= Date.now() && (p.state === "reviewing" || p.state === "mastered")) {
      return { text: "待复习", cls: "badge-due" };
    }
    if (p.state === "mastered") return { text: "已掌握", cls: "badge-mastered" };
    if (p.state === "reviewing") return { text: dueLabel(p), cls: "badge-reviewing" };
    if (p.state === "attempted") return { text: "未通过", cls: "badge-attempted" };
    return null;
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>题目列表</h1>
        <p className="subtitle">
          基于《背包问题九讲》· 共 {problems ? problems.length : "…"} 题 · 当前分类 {lecture === 0 ? "全部" : "第 " + lecture + " 讲"} {filtered ? filtered.length : ""} 题
        </p>
      </header>

      {dueCount > 0 && (
        <Link to="/review" className="due-banner">
          📅 今日有 {dueCount} 道题到期复习，点此进入复习计划 →
        </Link>
      )}

      <div className="lecture-tabs">
        <button className={"lecture-tab" + (lecture === 0 ? " active" : "")} onClick={() => setLecture(0)}>
          全部
        </button>
        {LECTURES.map((l) => (
          <button
            key={l.no}
            className={"lecture-tab" + (lecture === l.no ? " active" : "")}
            onClick={() => setLecture(l.no)}
            title={l.title}
          >
            第 {l.no} 讲<span className="lecture-tab-title">{l.title}</span>
          </button>
        ))}
      </div>

      {error && <div className="banner error">加载失败：{error}</div>}

      {problems && (
        <div className="prob-list">
          {(filtered ?? []).length === 0 && <div className="banner">该分类下暂无题目。</div>}
          {(filtered ?? []).map((p) => (
            <Link key={p.slug} to={"/problems/" + p.slug} className="prob-card">
              <div className="prob-id">{p.displayId}</div>
              <div className="prob-main">
                <div className="prob-title">
                  {p.title}
                  {badgeFor(p.slug) && (
                    <span className={"prob-badge " + badgeFor(p.slug)!.cls}>{badgeFor(p.slug)!.text}</span>
                  )}
                </div>
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
