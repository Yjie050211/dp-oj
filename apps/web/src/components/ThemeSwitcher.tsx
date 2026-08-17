import { useEffect, useRef, useState } from "react";
import { THEMES, useTheme, type ThemeMode } from "../theme";

/** 导航栏主题选择器：弹出面板展示四套主题 + 自动模式 */
export default function ThemeSwitcher() {
  const { mode, resolved, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const activeEmoji = mode === "auto" ? "🔄" : (THEMES.find((t) => t.id === mode)?.emoji ?? "🌙");

  const choose = (m: ThemeMode) => {
    setMode(m);
    setOpen(false);
  };

  return (
    <div className="theme-switcher" ref={panelRef}>
      <button
        className="theme-toggle"
        title="切换主题"
        aria-label="切换主题"
        onClick={() => setOpen((v) => !v)}
      >
        {activeEmoji}
      </button>
      {open && (
        <div className="theme-panel">
          <div className="theme-panel-title">主题</div>
          <button
            className={"theme-option" + (mode === "auto" ? " active" : "")}
            onClick={() => choose("auto")}
          >
            <span className="theme-emoji">🔄</span>
            <span className="theme-meta">
              <span className="theme-name">自动</span>
              <span className="theme-desc">跟随系统亮暗（当前 {resolved === "dark" ? "暗色" : "亮色"}）</span>
            </span>
            {mode === "auto" && <span className="theme-check">✓</span>}
          </button>
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={"theme-option" + (mode === t.id ? " active" : "")}
              onClick={() => choose(t.id)}
            >
              <span className="theme-emoji">{t.emoji}</span>
              <span className="theme-meta">
                <span className="theme-name">{t.label}</span>
                <span className="theme-swatch" data-theme-swatch={t.id} />
              </span>
              {mode === t.id && <span className="theme-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
