import { Injectable } from "@nestjs/common";
import { execFile } from "node:child_process";
import { LANGUAGES, type EngineStatus, type SystemHealth } from "@dp-oj/common";

interface Probe {
  id: string;
  label: string;
  cmd: string;
  args: string[];
}

/** 判题语言工具链探测项 */
const PROBES: Probe[] = [
  { id: "cpp", label: "C++14 (g++)", cmd: "g++", args: ["--version"] },
  { id: "python", label: "Python 3", cmd: "python", args: ["--version"] },
  { id: "go", label: "Go", cmd: "go", args: ["version"] },
  { id: "java", label: "Java (javac)", cmd: "javac", args: ["-version"] },
  // 判题运行依赖 java 而不仅是 javac，两者都检测
  { id: "java-run", label: "Java (java)", cmd: "java", args: ["-version"] },
];

/** 执行一次版本探测；任何失败（缺失/超时/权限）都归为 unavailable 并带回错误信息 */
function runProbe(cmd: string, args: string[]): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: 8000, windowsHide: true }, (error, stdout, stderr) => {
      const lines = [stdout, stderr].filter(Boolean).join(" ").trim().split(REGEX_NEWLINE);
      const firstLine = lines[0] ?? "";
      if (error) resolve({ ok: false, output: error.message });
      else resolve({ ok: true, output: firstLine });
    });
  });
}

/** 按换行切分（避免正则字面量在传输中损坏，使用 RegExp 构造） */
const REGEX_NEWLINE = new RegExp("\r?\n");

@Injectable()
export class EnvCheckService {
  /** health 结果缓存（探针串行较慢，5 秒内复用） */
  private cache: { at: number; value: SystemHealth } | null = null;

  async health(): Promise<SystemHealth> {
    const now = Date.now();
    if (this.cache && now - this.cache.at < 5000) return this.cache.value;

    const probeResults: EngineStatus[] = [];
    for (const p of PROBES) {
      const r = await runProbe(p.cmd, p.args);
      probeResults.push({
        id: p.id,
        label: p.label,
        available: r.ok,
        version: r.ok ? r.output : null,
        error: r.ok ? null : r.output,
      });
    }

    // Java 判题 = javac 编译 + java 运行，两者齐备才算可用
    const javac = probeResults.find((e) => e.id === "java");
    const javaRun = probeResults.find((e) => e.id === "java-run");
    const engines: EngineStatus[] = probeResults.filter((e) => e.id !== "java-run");
    if (javac && javaRun) {
      javac.available = javac.available && javaRun.available;
      if (javac.available) {
        javac.version = javaRun.version;
      } else {
        javac.error = javaRun.available
          ? (javac.error ?? "javac 不可用")
          : (javaRun.error ?? "java 运行时不可用");
      }
      javac.label = "Java (javac + java)";
    }

    const d = await runProbe("docker", ["--version"]);
    const docker = {
      available: d.ok,
      version: d.ok ? d.output : null,
      error: d.ok ? null : d.output,
    };

    const requiredOk = engines.every((e) => e.available);
    const value: SystemHealth = {
      status: requiredOk ? "ok" : "degraded",
      checkedAt: new Date().toISOString(),
      engines,
      docker,
    };
    this.cache = { at: now, value };
    return value;
  }

  /** 判题语言可用性（供提交页语言选择禁用不可用项） */
  async languages() {
    const probes: Record<string, { cmd: string; args: string[] }> = {
      cpp: { cmd: "g++", args: ["--version"] },
      python: { cmd: "python", args: ["--version"] },
      go: { cmd: "go", args: ["version"] },
      java: { cmd: "javac", args: ["-version"] },
    };
    const result = [];
    for (const lang of LANGUAGES) {
      const probe = probes[lang.id];
      const r = probe ? await runProbe(probe.cmd, probe.args) : { ok: true, output: "" };
      result.push({
        id: lang.id,
        label: lang.label,
        available: r.ok,
        version: r.ok ? r.output : null,
      });
    }
    return result;
  }
}
