import { useEffect, useMemo, useState } from "react";
import { CARDS, type KnowledgeCard } from "../data/cards";
import { applyCardReview, cardStats, dueCards, getCardProgress, newCards, subscribeCards } from "../store/cards";

const RATINGS = [
  { value: 1, label: "忘了", emoji: "😵" },
  { value: 2, label: "模糊", emoji: "🤔" },
  { value: 3, label: "记得", emoji: "🙂" },
  { value: 4, label: "轻松", emoji: "😎" },
] as const;

/** 单张卡片的剩余天数文案 */
function dueLabel(due: number): string {
  const diff = due - Date.now();
  if (diff <= 0) return "待复习";
  const days = Math.ceil(diff / 86400000);
  return days + " 天后";
}

/** 今日学习队列：新卡 + 到期卡 */
function buildQueue(): KnowledgeCard[] {
  const fresh = newCards();
  const due = dueCards();
  fresh.sort((a, b) => a.lectureNo - b.lectureNo);
  due.sort((a, b) => a.lectureNo - b.lectureNo);
  return [...fresh, ...due];
}

export default function CardsPage() {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribeCards(() => setVersion((v) => v + 1)), []);

  const queue = useMemo(() => buildQueue(), [version]);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const current = queue[pos] ?? null;

  const rate = (value: number) => {
    if (!current) return;
    applyCardReview(current.id, value);
    setFlipped(false);
    setPos(0);
  };

  const stats = cardStats();

  return (
    <div className="page">
      <header className="page-head">
        <h1>知识卡片</h1>
        <p className="subtitle">九讲核心知识点 · 正面提问背面答案 · 与题目共用间隔重复</p>
      </header>

      <div className="stat-strip">
        <div className="stat-cell">
          <div className="stat-num">{stats.learned}/{stats.total}</div>
          <div className="stat-label">已学习卡片</div>
        </div>
        <div className="stat-cell accent">
          <div className="stat-num">{queue.length}</div>
          <div className="stat-label">今日队列</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{stats.due}</div>
          <div className="stat-label">到期</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{stats.reviews}</div>
          <div className="stat-label">累计复习</div>
        </div>
      </div>

      <section className="card">
        <h2>今日学习（{queue.length}）</h2>
        {current ? (
          <>
            <div className={"flashcard" + (flipped ? " flipped" : "")} onClick={() => setFlipped((f) => !f)}>
              <div className="flashcard-inner">
                <div className="flashcard-face flashcard-front">
                  <span className="flashcard-tag">第 {current.lectureNo} 讲 · {current.lectureTitle}</span>
                  <div className="flashcard-text">{current.front}</div>
                  <span className="flashcard-hint">点击翻面看答案</span>
                </div>
                <div className="flashcard-face flashcard-back">
                  <span className="flashcard-tag">答案</span>
                  <div className="flashcard-text">{current.back}</div>
                </div>
              </div>
            </div>
            <div className="flashcard-progress">第 {pos + 1} / {queue.length} 张</div>
            {flipped && (
              <div className="self-rating center">
                <span className="rating-label">记忆自评：</span>
                {RATINGS.map((r) => (
                  <button key={r.value} type="button" className="btn ghost rating-btn" onClick={() => rate(r.value)}>
                    {r.emoji} {r.label}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="banner">🎉 今日卡片全部完成！新卡会按九讲顺序陆续加入，到期卡会自动回到队列。</div>
        )}
      </section>

      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((no) => {
        const group = CARDS.filter((c) => c.lectureNo === no);
        return (
          <section key={no} className="card">
            <h2>第 {no} 讲 · {group[0]?.lectureTitle}</h2>
            <div className="card-list">
              {group.map((c) => {
                const p = getCardProgress(c.id);
                return (
                  <div key={c.id} className="card-row">
                    <div className="card-row-front">{c.front}</div>
                    <div className="card-row-meta">
                      {p ? (
                        <span className="card-state">{p.due <= Date.now() ? "⏰ 待复习" : dueLabel(p.due)} · 已复习 {p.reviews} 次</span>
                      ) : (
                        <span className="card-state new">新卡</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
