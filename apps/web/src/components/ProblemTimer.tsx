import { useEffect } from "react";
import { formatDuration, useTimer } from "../hooks/useTimer";

interface Props {
  slug: string;
  /** 全局偏好：进入题目自动开始（仅对 idle 状态生效一次） */
  autoStart: boolean;
}

/** 做题计时器：显示 HH:MM:SS + 开始/暂停/继续/停止/归零控制 */
export default function ProblemTimer({ slug, autoStart }: Props) {
  const { status, elapsedMs, start, pause, resume, stop, reset } = useTimer(slug);

  // 自动开始：仅对 idle 状态生效（running/paused/done 不打断，避免吞掉历史计时段）
  useEffect(() => {
    if (autoStart && status === "idle") start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, autoStart]);

  return (
    <div className={"timer" + (status === "running" ? " running" : "")}>
      <span className="timer-clock" title={status === "running" ? "计时中" : status === "paused" ? "已暂停" : "计时"}>
        ⏱ {formatDuration(elapsedMs)}
      </span>
      <span className="timer-controls">
        {status === "idle" && (
          <button className="btn ghost timer-btn" onClick={start}>
            开始
          </button>
        )}
        {status === "running" && (
          <button className="btn ghost timer-btn" onClick={pause}>
            暂停
          </button>
        )}
        {status === "paused" && (
          <>
            <button className="btn ghost timer-btn" onClick={resume}>
              继续
            </button>
            <button className="btn ghost timer-btn" onClick={stop}>
              停止
            </button>
          </>
        )}
        {status === "done" && <span className="timer-done">用时 {formatDuration(elapsedMs)}</span>}
        {status !== "idle" && (
          <button className="btn ghost timer-btn timer-reset" onClick={reset} title="计时归零">
            ↺
          </button>
        )}
      </span>
    </div>
  );
}
