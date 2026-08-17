import { useEffect, useState } from "react";
import { HINTS } from "../data/hints";

interface HintProps {
  slug: string;
  /** 本题是否已 AC（AC 后锁定提示，复习时先独立思考） */
  solved: boolean;
}

function storageKey(slug: string): string {
  return "dp-oj-hint-" + slug;
}

function loadRevealed(slug: string): number[] {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as number[];
    return Array.isArray(parsed) ? parsed.filter((n) => n === 1 || n === 2 || n === 3) : [];
  } catch {
    return [];
  }
}

function saveRevealed(slug: string, levels: number[]): void {
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify(levels));
  } catch {
    // 忽略
  }
}

const LEVEL_META = [
  { key: 1, label: "提示 1 · 思路方向" },
  { key: 2, label: "提示 2 · 状态与转移" },
  { key: 3, label: "提示 3 · 关键代码" },
] as const;

/** 分层提示面板：逐层展开、每层独立记录；AC 后锁定 */
export default function HintPanel({ slug, solved }: HintProps) {
  const hints = HINTS[slug];
  const [revealed, setRevealed] = useState<number[]>(() => loadRevealed(slug));

  // 切换题目时重载
  useEffect(() => {
    setRevealed(loadRevealed(slug));
  }, [slug]);

  if (!hints) return null;

  const toggle = (level: number) => {
    if (solved) return; // AC 锁定
    setRevealed((cur) => {
      const next = cur.includes(level) ? cur.filter((n) => n !== level) : [...cur, level];
      saveRevealed(slug, next);
      return next;
    });
  };

  return (
    <section className="card hint-panel">
      <div className="hint-head">
        <h2>提示</h2>
        <span className="hint-sub">逐层求助 · 尽量少用 · AC 后锁定</span>
      </div>
      {solved && (
        <div className="banner">🔒 本题已通过，提示已锁定——复习时请先独立思考。</div>
      )}
      {!solved && (
        <div className="hint-list">
          {LEVEL_META.map((meta) => {
            const open = revealed.includes(meta.key);
            const text = meta.key === 1 ? hints.l1 : meta.key === 2 ? hints.l2 : hints.l3;
            return (
              <div key={meta.key} className={"hint-level" + (open ? " open" : "")}>
                <button type="button" className="hint-toggle" onClick={() => toggle(meta.key)}>
                  <span className="hint-toggle-label">{open ? "收起" : "查看"} {meta.label}</span>
                  <span className="hint-arrow">{open ? "▴" : "▾"}</span>
                </button>
                {open && <div className="hint-body">{text}</div>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
