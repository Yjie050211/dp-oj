import { useEffect, useRef, useState } from "react";
import { useAutoStart } from "../hooks/useTimer";

/** 导航栏设置面板：全局偏好开关（自动计时等） */
export default function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const [autoStart, setAutoStart] = useAutoStart();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="theme-switcher" ref={panelRef}>
      <button
        className="theme-toggle"
        title="设置"
        aria-label="设置"
        onClick={() => setOpen((v) => !v)}
      >
        ⚙️
      </button>
      {open && (
        <div className="theme-panel">
          <div className="theme-panel-title">偏好设置</div>
          <button className="theme-option" onClick={() => setAutoStart(!autoStart)}>
            <span className="theme-emoji">⏱</span>
            <span className="theme-meta">
              <span className="theme-name">进入题目自动开始计时</span>
              <span className="theme-desc">{autoStart ? "已开启" : "已关闭（手动点击开始）"}</span>
            </span>
            <span className={"toggle" + (autoStart ? " on" : "")}>
              <span className="toggle-knob" />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
