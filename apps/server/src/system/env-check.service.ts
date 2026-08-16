import { Injectable } from "@nestjs/common";
import { execFile } from "node:child_process";
import type { EngineStatus, SystemHealth } from "@dp-oj/common";

interface Probe {
  id: string;
  label: string;
  cmd: string;
  args: string[];
}

/** 判题语言工具链探测项 */
const PROBES: Probe[] = [
  { id: "cpp", label: "C++17 (g++)", cmd: "g++", args: ["--version"] },
  { id: "python", label: "Python 3", cmd: "python", args: ["--version"] },
  { id: "go", label: "Go", cmd: "go", args: ["version"] },
  { id: "java", label: "Java (javac)", cmd: "javac", args: ["-version"] },
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
  async health(): Promise<SystemHealth> {
    const engines: EngineStatus[] = [];
    for (const p of PROBES) {
      const r = await runProbe(p.cmd, p.args);
      engines.push({
        id: p.id,
        label: p.label,
        available: r.ok,
        version: r.ok ? r.output : null,
        error: r.ok ? null : r.output,
      });
    }

    const d = await runProbe("docker", ["--version"]);
    const docker = {
      available: d.ok,
      version: d.ok ? d.output : null,
      error: d.ok ? null : d.output,
    };

    const requiredOk = engines.every((e) => e.available);
    return {
      status: requiredOk ? "ok" : "degraded",
      checkedAt: new Date().toISOString(),
      engines,
      docker,
    };
  }
}
