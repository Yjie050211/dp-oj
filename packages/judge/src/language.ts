import { LANGUAGES, type LanguageConfig } from "@dp-oj/common";

/** 按 id 取语言配置 */
export function getLanguage(id: string): LanguageConfig | null {
  return LANGUAGES.find((l) => l.id === id) ?? null;
}

/**
 * 解析运行命令模板：
 * - "./main" 之类的相对产物路径 → 补全为 workDir 下真实可执行文件
 *   （Windows 需补 .exe 后缀）
 * - 其余参数（java -Xmx256m Main、python main.py）原样保留
 */
export function resolveRunCmd(runCmd: string[], artifactPath: string | null, workDir: string): string[] {
  return runCmd.map((arg) => {
    if (!arg.startsWith("./")) return arg;
    const name = arg.slice(2);
    if (process.platform === "win32") return joinWin(workDir, name + ".exe");
    return joinWin(workDir, name);
  });
}

import { join } from "node:path";
function joinWin(...parts: string[]): string {
  return join(...parts);
}

/** 编译产物在 workDir 下的真实路径（Windows 补 .exe） */
export function artifactPathIn(lang: LanguageConfig, workDir: string): string | null {
  if (!lang.artifact) return null;
  const name = lang.artifact.endsWith(".exe") || process.platform !== "win32" ? lang.artifact : lang.artifact + ".exe";
  return join(workDir, name);
}
