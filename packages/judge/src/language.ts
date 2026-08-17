import { existsSync } from "node:fs";
import { join } from "node:path";
import { LANGUAGES, type LanguageConfig } from "@dp-oj/common";

/** 按 id 取语言配置 */
export function getLanguage(id: string): LanguageConfig | null {
  return LANGUAGES.find((l) => l.id === id) ?? null;
}

/**
 * 解析运行命令模板：
 * - "./main" 之类的相对产物路径 → 优先使用编译产物探测结果（g++ 产物 main.exe，
 *   go build -o main 产物无扩展名，两者都能命中）
 * - 其余参数（java -Xmx256m Main、python main.py）原样保留
 */
export function resolveRunCmd(runCmd: string[], artifactPath: string | null, workDir: string): string[] {
  return runCmd.map((arg) => {
    if (!arg.startsWith("./")) return arg;
    if (artifactPath) return artifactPath;
    const name = arg.slice(2);
    return process.platform === "win32" ? join(workDir, name + ".exe") : join(workDir, name);
  });
}

/**
 * 探测编译产物在 workDir 下的真实路径：
 * Windows 上依次尝试 <artifact>.exe 与 <artifact>（Go 的 -o main 不自动补扩展名）
 */
export function artifactPathIn(lang: LanguageConfig, workDir: string): string | null {
  if (!lang.artifact) return null;
  const candidates =
    process.platform === "win32"
      ? [lang.artifact + ".exe", lang.artifact]
      : [lang.artifact];
  for (const name of candidates) {
    const p = join(workDir, name);
    if (existsSync(p)) return p;
  }
  // 产物缺失返回 null，调用方据此判 CE（而不是 spawn ENOENT 后归 SE）
  return null;
}
