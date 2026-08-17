import { useCallback, useEffect, useState } from "react";

/** 计时状态：idle 未开始 / running 计时中 / paused 已暂停 / done 已完成 */
export type TimerStatus = "idle" | "running" | "paused" | "done";

export interface TimerState {
  status: TimerStatus;
  /** running 时的开始时间戳（用于跨刷新恢复） */
  startedAt: number | null;
  /** 已累计时长（不含当前 running 段） */
  accumulatedMs: number;
}

const IDLE: TimerState = { status: "idle", startedAt: null, accumulatedMs: 0 };

function storageKey(slug: string): string {
  return "dp-oj-timer-" + slug;
}

function load(slug: string): TimerState {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return IDLE;
    const parsed = JSON.parse(raw) as TimerState;
    if (
      typeof parsed.status !== "string" ||
      !["idle", "running", "paused", "done"].includes(parsed.status) ||
      typeof parsed.accumulatedMs !== "number"
    ) {
      return IDLE;
    }
    // 跨刷新恢复：running 状态继续以 startedAt 计时，丢失 startedAt 则降级为暂停态累计值
    if (parsed.status === "running" && typeof parsed.startedAt !== "number") {
      return { status: "paused", startedAt: null, accumulatedMs: parsed.accumulatedMs };
    }
    return {
      status: parsed.status,
      startedAt: typeof parsed.startedAt === "number" ? parsed.startedAt : null,
      accumulatedMs: parsed.accumulatedMs,
    };
  } catch {
    return IDLE;
  }
}

/**
 * 单题做题计时器：
 * - 每秒 tick（仅 running）
 * - 状态变化实时持久化到 localStorage，刷新/重开页面不丢时间（基于时间戳恢复）
 */
export function useTimer(slug: string) {
  const [state, setState] = useState<TimerState>(() => load(slug));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (state.status !== "running") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [state.status]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(slug), JSON.stringify(state));
    } catch {
      // 存储失败不影响使用
    }
  }, [slug, state]);

  const elapsedMs =
    state.status === "running" ? state.accumulatedMs + (now - (state.startedAt ?? now)) : state.accumulatedMs;

  const start = useCallback(() => {
    setState((s) => ({ status: "running", startedAt: Date.now(), accumulatedMs: s.accumulatedMs }));
  }, []);

  const pause = useCallback(() => {
    setState((s) => ({
      status: "paused",
      startedAt: null,
      accumulatedMs: s.status === "running" ? s.accumulatedMs + (Date.now() - (s.startedAt ?? Date.now())) : s.accumulatedMs,
    }));
  }, []);

  const resume = useCallback(() => {
    setState((s) => ({ status: "running", startedAt: Date.now(), accumulatedMs: s.accumulatedMs }));
  }, []);

  /** 停止：累计当前段并定格为 done，显示总用时 */
  const stop = useCallback(() => {
    setState((s) => ({
      status: "done",
      startedAt: null,
      accumulatedMs: s.status === "running" ? s.accumulatedMs + (Date.now() - (s.startedAt ?? Date.now())) : s.accumulatedMs,
    }));
  }, []);

  /** 计时归零回 idle（删除持久化） */
  const reset = useCallback(() => {
    try {
      localStorage.removeItem(storageKey(slug));
    } catch {
      // 忽略
    }
    setState(IDLE);
  }, [slug]);

  return { status: state.status, elapsedMs, start, pause, resume, stop, reset };
}

/** 全局偏好：进入题目自动开始计时 */
export function useAutoStart(): [boolean, (v: boolean) => void] {
  const [value, setValue] = useState<boolean>(() => {
    try {
      return localStorage.getItem("dp-oj-autostart") === "1";
    } catch {
      return false;
    }
  });

  const set = useCallback((v: boolean) => {
    setValue(v);
    try {
      localStorage.setItem("dp-oj-autostart", v ? "1" : "0");
    } catch {
      // 忽略
    }
  }, []);

  return [value, set];
}

/** HH:MM:SS 格式化 */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return pad(h) + ":" + pad(m) + ":" + pad(s);
}
