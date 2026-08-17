import { CARDS } from "../data/cards";

/**
 * 卡片复习进度（SM-2，与题目复习同一套公式）
 * 键名：dp-oj-cards-v1
 */

export interface CardProgress {
  interval: number;
  ease: number;
  due: number;
  lastReviewedAt: number;
  reviews: number;
}

const KEY = "dp-oj-cards-v1";
const DAY = 24 * 60 * 60 * 1000;

type Store = Record<string, CardProgress>;

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
    // 忽略
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();
function emit(): void { listeners.forEach((l) => l()); }

export function subscribeCards(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getCardProgress(id: string): CardProgress | null {
  return loadStore()[id] ?? null;
}

/** 新卡（从未复习过） */
export function newCards() {
  const store = loadStore();
  return CARDS.filter((c) => !store[c.id]);
}

/** 到期卡 */
export function dueCards() {
  const store = loadStore();
  const now = Date.now();
  return CARDS.filter((c) => {
    const p = store[c.id];
    return p && p.due <= now;
  });
}

/** 未到期卡（按到期时间升序） */
export function upcomingCards() {
  const store = loadStore();
  const now = Date.now();
  return CARDS.filter((c) => {
    const p = store[c.id];
    return p && p.due > now;
  }).sort((a, b) => (store[a.id]?.due ?? 0) - (store[b.id]?.due ?? 0));
}

/** 卡片自评（SM-2）：1 忘了 / 2 模糊 / 3 记得 / 4 轻松 */
export function applyCardReview(id: string, rating: number): CardProgress {
  const store = loadStore();
  const prev = store[id] ?? { interval: 0, ease: 2.5, due: 0, lastReviewedAt: 0, reviews: 0 };
  const r = Math.max(1, Math.min(4, Math.round(rating)));
  const now = Date.now();
  const p: CardProgress = { ...prev };
  p.reviews++;
  p.lastReviewedAt = now;
  p.ease = Math.max(1.3, Math.min(2.5, p.ease + 0.1 - (4 - r) * (0.08 + (4 - r) * 0.02)));
  if (r === 1) p.interval = 1;
  else if (r === 2) p.interval = Math.max(1, Math.round(p.interval * 1.2));
  else if (r === 3) p.interval = Math.max(1, Math.round(p.interval * p.ease));
  else p.interval = Math.max(1, Math.round(p.interval * p.ease * 1.3));
  p.due = now + p.interval * DAY;
  store[id] = p;
  saveStore(store);
  emit();
  return p;
}

/** 卡片统计 */
export function cardStats() {
  const store = loadStore();
  const total = CARDS.length;
  const learned = Object.keys(store).length;
  const due = dueCards().length;
  const reviews = Object.values(store).reduce((s, p) => s + p.reviews, 0);
  return { total, learned, due, reviews };
}
