import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

/** 四套主题：dark 深蓝暗色 / light 明亮 / oled 纯黑 / nature 护眼纸色 */
export type ThemeId = "dark" | "light" | "oled" | "nature";

/** 主题模式：auto 跟随系统，或手动指定主题 */
export type ThemeMode = "auto" | ThemeId;

export const THEMES: { id: ThemeId; label: string; emoji: string; dark: boolean }[] = [
  { id: "dark", label: "深蓝暗色", emoji: "🌙", dark: true },
  { id: "light", label: "明亮", emoji: "☀️", dark: false },
  { id: "oled", label: "纯黑", emoji: "🕶️", dark: true },
  { id: "nature", label: "护眼纸色", emoji: "🍃", dark: false },
];

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ThemeId;
  isDark: boolean;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "auto",
  resolved: "dark",
  isDark: true,
  setMode: () => undefined,
});

const STORAGE_KEY = "dp-oj-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "auto" || saved === "dark" || saved === "light" || saved === "oled" || saved === "nature"
      ? (saved as ThemeMode)
      : "auto";
  });
  const [systemDark, setSystemDark] = useState<boolean>(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  // 监听系统亮暗切换（auto 模式自动跟随）
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolved: ThemeId = mode === "auto" ? (systemDark ? "dark" : "light") : mode;
  const isDark = THEMES.find((t) => t.id === resolved)?.dark ?? true;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [resolved, mode]);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);

  return (
    <ThemeContext.Provider value={{ mode, resolved, isDark, setMode }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
