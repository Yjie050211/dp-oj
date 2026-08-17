/**
 * 学习进度存储（localStorage，单机够用）：
 * - 每题状态机：unseen 未做 -> attempted 尝试未过 -> reviewing 复习中 -> mastered 已掌握
 * - SM-2-lite 间隔重复：首次 AC 1 天后复习，复习自评 1-4 分调整间隔与难度系数
 * - 错题：非 AC 提交记录 wrongCount/lastWrongAt，进入错题本
 * 键名：dp-oj-progress-v1
 */

export type ProgressState = "unseen" | "attempted" | "reviewing" | "mastered";

export interface ProblemProgress {
  slug: string;
  state: ProgressState;
  lastVerdict: string | null;
  attempts: number;
  acCount: number;
  firstAcAt: number | null;
  /** 下次复习到期时间戳 */
  reviewDue: number | null;
  /** SM-2 当前间隔（天） */
  interval: number;
  /** SM-2 难度系数 1.3~2.5 */
  ease: number;
  lastReviewedAt: number | null;
  /** 非 AC 次数（错题计数） */
  wrongCount: number;
  lastWrongAt: number | null;
}

const KEY = "dp-oj-progress-v1";
const DAY = 24 * 60 * 60 * 1000;

type Store = Record<string, ProblemProgress>;

function defaultProgress(slug: string): ProblemProgress {
  return {
    slug,
    state: "unseen",
    lastVerdict: null,
    attempts: 0,
    acCount: 0,
    firstAcAt: null,
    reviewDue: null,
    interval: 0,
    ease: 2.5,
    lastReviewedAt: null,
    wrongCount: 0,
    lastWrongAt: null,
  };
}

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveStore(store: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // 存储不可用：进度仅保留在内存（本轮会话）
  }
}

/** 监听器：进度变化时通知订阅方（React 组件用 useSyncExternalStore 或事件桥接） */
type Listener = () => void;
const listeners = new Set<Listener>();

function emit(): void {
  listeners.forEach((l) => l());
}

export function subscribeProgress(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getProgress(slug: string): ProblemProgress {
  const store = loadStore();
  return store[slug] ?? defaultProgress(slug);
}

export function getAllProgress(): ProblemProgress[] {
  return Object.values(loadStore());
}

function mutate(slug: string, fn: (p: ProblemProgress) => void): ProblemProgress {
  const store = loadStore();
  const p = store[slug] ?? defaultProgress(slug);
  fn(p);
  store[slug] = p;
  saveStore(store);
  emit();
  return p;
}

/** 提交判题结果：AC 入复习计划 / 非 AC 进错题本 */
export function recordVerdict(slug: string, verdict: string): ProblemProgress {
  return mutate(slug, (p) => {
    p.attempts++;
    p.lastVerdict = verdict;
    if (verdict === "AC") {
      p.acCount++;
      if (p.firstAcAt === null) p.firstAcAt = Date.now();
      if (p.state === "unseen" || p.state === "attempted") {
        // 首次通过：1 天后首次复习
        p.state = "reviewing";
        p.interval = 1;
        p.ease = 2.5;
        p.reviewDue = Date.now() + DAY;
      }
      // 已进入复习计划的 AC：等待用户自评（applyReview），不在此自动推进
    } else {
      p.wrongCount++;
      p.lastWrongAt = Date.now();
      if (p.state === "unseen") p.state = "attempted";
      // 复习中做错：第二天再来
      if (p.state === "reviewing" || p.state === "mastered") {
        p.reviewDue = Date.now() + DAY;
        p.interval = 1;
      }
    }
  });
}

/** 复习自评 1-4（1 忘记 / 2 模糊 / 3 记得 / 4 轻松），SM-2 调度 */
export function applyReview(slug: string, rating: number): ProblemProgress {
  return mutate(slug, (p) => {
    const r = Math.max(1, Math.min(4, Math.round(rating)));
    const now = Date.now();
    p.lastReviewedAt = now;
    // 难度系数：4 分涨、1 分跌
    p.ease = Math.max(1.3, Math.min(2.5, p.ease + 0.1 - (4 - r) * (0.08 + (4 - r) * 0.02)));
    if (r === 1) p.interval = 1;
    else if (r === 2) p.interval = Math.max(1, Math.round(p.interval * 1.2));
    else if (r === 3) p.interval = Math.max(1, Math.round(p.interval * p.ease));
    else p.interval = Math.max(1, Math.round(p.interval * p.ease * 1.3));
    // 间隔 >=21 天且连续记得 → 掌握（仍会到期，只是状态标记）
    if (p.interval >= 21 && r >= 3) p.state = "mastered";
    else p.state = "reviewing";
    p.reviewDue = now + p.interval * DAY;
  });
}

/** 待复习队列：reviewDue 已到期 */
export function dueForReview(): ProblemProgress[] {
  const now = Date.now();
  return getAllProgress().filter(
    (p) => p.reviewDue !== null && p.reviewDue <= now && (p.state === "reviewing" || p.state === "mastered")
  );
}

/** 错题本：最近判题非 AC 的题（按最近做错时间倒序） */
export function wrongProblems(): ProblemProgress[] {
  return getAllProgress()
    .filter((p) => p.lastVerdict !== null && p.lastVerdict !== "AC")
    .sort((a, b) => (b.lastWrongAt ?? 0) - (a.lastWrongAt ?? 0));
}

/** 复习中（未到期）的题，按到期时间升序 */
export function upcomingReviews(): ProblemProgress[] {
  const now = Date.now();
  return getAllProgress()
    .filter((p) => p.reviewDue !== null && p.reviewDue > now && (p.state === "reviewing" || p.state === "mastered"))
    .sort((a, b) => (a.reviewDue ?? 0) - (b.reviewDue ?? 0));
}

/** 统计汇总 */
export interface ProgressStats {
  acProblems: number;
  totalAttempts: number;
  dueCount: number;
  wrongCount: number;
}

export function progressStats(): ProgressStats {
  const all = getAllProgress();
  return {
    acProblems: all.filter((p) => p.acCount > 0).length,
    totalAttempts: all.reduce((s, p) => s + p.attempts, 0),
    dueCount: dueForReview().length,
    wrongCount: all.filter((p) => p.lastVerdict !== null && p.lastVerdict !== "AC").length,
  };
}

/** 重置单题进度（错题本页"移出"用） */
export function resetProgress(slug: string): void {
  const store = loadStore();
  delete store[slug];
  saveStore(store);
  emit();
}

/** 剩余天数文案 */
export function dueLabel(p: ProblemProgress): string {
  if (p.reviewDue === null) return "";
  const diff = p.reviewDue - Date.now();
  if (diff <= 0) return "待复习";
  const days = Math.ceil(diff / DAY);
  return days + " 天后复习";
}

