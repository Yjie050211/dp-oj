/**
 * 刷题活动统计（每日提交/AC 热力图 + 结果码分布）
 * 键名：dp-oj-activity-v1
 */

export interface DayStat {
  submissions: number;
  ac: number;
}

export interface ActivityStore {
  /** "YYYY-MM-DD" -> 当日统计 */
  days: Record<string, DayStat>;
  /** 各结果码累计次数 */
  verdicts: Record<string, number>;
}

const KEY = "dp-oj-activity-v1";

const EMPTY: ActivityStore = { days: {}, verdicts: {} };

function loadStore(): ActivityStore {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { days: {}, verdicts: {} };
    const parsed = JSON.parse(raw) as ActivityStore;
    return parsed && typeof parsed === "object" && parsed.days && parsed.verdicts ? parsed : { days: {}, verdicts: {} };
  } catch {
    return { days: {}, verdicts: {} };
  }
}

function saveStore(s: ActivityStore): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // 忽略
  }
}

function todayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}

type Listener = () => void;
const listeners = new Set<Listener>();
function emit(): void { listeners.forEach((l) => l()); }

export function subscribeActivity(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** 记录一次判题结果（判题完成时调用） */
export function recordActivity(verdict: string): void {
  const s = loadStore();
  const key = todayKey(new Date());
  const day = s.days[key] ?? { submissions: 0, ac: 0 };
  day.submissions++;
  if (verdict === "AC") day.ac++;
  s.days[key] = day;
  s.verdicts[verdict] = (s.verdicts[verdict] ?? 0) + 1;
  saveStore(s);
  emit();
}

export function getActivity(): ActivityStore {
  return loadStore();
}

/** 近 12 周（84 天）热力图数据：周 x 日 网格，按本地时区 */
export function heatmapWeeks(): { key: string; stat: DayStat | null }[][] {
  const s = loadStore();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // 对齐到本周日（周起始）
  const dayOfWeek = today.getDay(); // 0=周日
  const startOfWeek = new Date(today.getTime() - dayOfWeek * 86400000);
  const weeks: { key: string; stat: DayStat | null }[][] = [];
  for (let w = 11; w >= 0; w--) {
    const week: { key: string; stat: DayStat | null }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startOfWeek.getTime() + (w * 7 + d) * 86400000);
      const key = todayKey(date);
      week.push({ key, stat: s.days[key] ?? null });
    }
    weeks.push(week);
  }
  return weeks;
}
