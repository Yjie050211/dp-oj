import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { LocalProcessRunner } from "./runner";
import type { RunInput, RunResult, Runner } from "./types";

const MAX_CAPTURE_BYTES = 200 * 1024;
/** 超时/输出超限强杀后的兜底时限 */
const KILL_GRACE_MS = 2500;

/** Windows 路径转容器内 Linux 路径（workDir 挂载为 /work） */
function toContainerPath(p: string, cwd: string): string {
  // 裸命令名（g++/python/go/java）走容器 PATH，不转换
  if (!p.includes("/") && !p.includes("\\")) return p;
  const host = cwd.replace(/[\\]/g, "/");
  const abs = p.replace(/[\\]/g, "/").replace(/^\.\//, "");
  let rel = abs.startsWith(host) ? abs.slice(host.length) : abs;
  rel = rel.replace(/^[\/]+/, "");
  return "/work/" + rel;
}

/**
 * Docker 容器运行器（可选沙箱）：
 * - 判题镜像 dp-oj/judge-env（内含 g++/python/go/openjdk 工具链）
 * - 每次运行启动独立容器：--network=none 断网、--memory 限内存（优先取题目的 memoryLimitMb）、
 *   --cpus=1 限核、-v 挂载工作目录、-i 注入 stdin
 * - 超时强杀：杀宿主 docker 进程 + docker rm -f 清理容器；close 定稿保证输出排空
 * - docker CLI/daemon 故障（退出码 125/126/127）归为系统错误（SE），不归用户 RE
 * 启用方式：server 侧环境变量 JUDGE_RUNNER=docker
 */
export class DockerRunner implements Runner {
  constructor(
    private readonly image: string,
    private readonly memoryMb: number = 256
  ) {}

  run(input: RunInput): Promise<RunResult> {
    return new Promise((resolve) => {
      const start = process.hrtime.bigint();
      const containerName = "dp-oj-judge-" + randomUUID().replace(/-/g, "");
      const command = input.command.startsWith("/work") ? input.command : toContainerPath(input.command, input.cwd);
      const memoryLimit = input.memoryLimitMb > 0 ? input.memoryLimitMb : this.memoryMb;
      const args = [
        "run", "--rm", "-i",
        "--name", containerName,
        "--network=none",
        "--memory=" + memoryLimit + "m",
        "--memory-swap=" + memoryLimit + "m",
        "--cpus=1",
        "--pids-limit=256",
        "--workdir=/work",
        "-v", input.cwd + ":/work",
        this.image,
        command,
        ...input.args,
      ];

      let stdout = Buffer.alloc(0);
      let stderr = Buffer.alloc(0);
      let stdoutTruncated = false;
      let stderrTruncated = false;
      let settled = false;
      let exitInfo: { code: number | null; signal: NodeJS.Signals | null } | null = null;
      let timedOut = false;
      let killRequested = false;
      let forceTimer: ReturnType<typeof setTimeout> | null = null;
      const elapsedMs = () => Number(process.hrtime.bigint() - start) / 1e6;

      const cleanup = () => {
        // 超时/异常时清理容器（--rm 不适用于强杀场景）
        const rm = spawn("docker", ["rm", "-f", containerName], { stdio: "ignore", windowsHide: true });
        rm.on("error", () => undefined);
      };

      const finish = (r: RunResult) => {
        if (!settled) {
          settled = true;
          resolve(r);
        }
      };

      let child;
      try {
        child = spawn("docker", args, {
          cwd: input.cwd,
          stdio: ["pipe", "pipe", "pipe"],
          windowsHide: true,
          shell: false,
        });
      } catch (err) {
        return finish({
          ok: false, exitCode: null, timedOut: false, stdout: "", stderr: "", stdoutFull: "",
          timeMs: elapsedMs(), memoryKb: null, outputTruncated: false, error: String(err),
        });
      }

      const requestKill = () => {
        if (killRequested) return;
        killRequested = true;
        try { child.kill("SIGKILL"); } catch { /* 已退出 */ }
        cleanup();
      };

      const timer = setTimeout(() => {
        if (exitInfo !== null) return; // 已退出，等 close 收尾
        timedOut = true;
        requestKill();
        forceTimer = setTimeout(() => {
          finish({
            ok: false, exitCode: null, timedOut: true,
            stdout: stdout.toString("utf8").slice(0, MAX_CAPTURE_BYTES),
            stderr: stderr.toString("utf8").slice(0, MAX_CAPTURE_BYTES),
            stdoutFull: stdout.toString("utf8"),
            timeMs: elapsedMs(), memoryKb: null,
            outputTruncated: stdoutTruncated || stderrTruncated,
            error: null,
          });
        }, KILL_GRACE_MS);
      }, input.timeLimitMs);

      child.on("error", (err) => {
        clearTimeout(timer);
        if (forceTimer) clearTimeout(forceTimer);
        finish({
          ok: false, exitCode: null, timedOut: false, stdout: "", stderr: "", stdoutFull: "",
          timeMs: elapsedMs(), memoryKb: null, outputTruncated: false, error: String(err),
        });
      });

      child.stdout?.on("data", (chunk: Buffer) => {
        if (stdout.length < input.outputLimitBytes) {
          stdout = Buffer.concat([stdout, chunk]);
          if (stdout.length > input.outputLimitBytes) {
            stdoutTruncated = true;
            requestKill();
          }
        } else {
          stdoutTruncated = true;
          requestKill();
        }
      });

      child.stderr?.on("data", (chunk: Buffer) => {
        if (stderr.length < input.outputLimitBytes) {
          stderr = Buffer.concat([stderr, chunk]);
          if (stderr.length > input.outputLimitBytes) {
            stderrTruncated = true;
            requestKill();
          }
        } else {
          stderrTruncated = true;
          requestKill();
        }
      });

      child.on("exit", (code, signal) => {
        exitInfo = { code, signal };
      });

      child.on("close", () => {
        clearTimeout(timer);
        if (forceTimer) clearTimeout(forceTimer);
        const truncated = stdoutTruncated || stderrTruncated;
        const fullStdout = stdout.toString("utf8");
        const code = exitInfo?.code ?? null;
        const effectiveCode = truncated ? (code ?? 1) : code;
        // docker CLI/daemon 故障：125 daemon 错误、126/127 命令不可执行 → 系统错误
        let sysError: string | null = null;
        if (code !== null && (code === 125 || code === 126 || code === 127) && !truncated) {
          sysError = "Docker 环境错误（退出码 " + code + "）: " + stderr.toString("utf8").slice(0, 300);
        }
        finish({
          ok: effectiveCode === 0 && !truncated && sysError === null,
          exitCode: effectiveCode,
          timedOut,
          stdout: fullStdout.slice(0, MAX_CAPTURE_BYTES),
          stderr: stderr.toString("utf8").slice(0, MAX_CAPTURE_BYTES),
          stdoutFull: fullStdout,
          timeMs: elapsedMs(),
          memoryKb: null,
          outputTruncated: truncated,
          error: sysError,
        });
      });

      child.stdin?.on("error", () => undefined);
      child.stdin?.end(input.stdin);
    });
  }
}

/**
 * 按环境变量创建沙箱运行器：
 * - JUDGE_RUNNER=docker 时使用容器沙箱（镜像 JUDGE_IMAGE，默认 dp-oj/judge-env；
 *   内存 JUDGE_MEMORY_MB，默认 256，判题时以题目 memoryLimitMb 优先）
 * - 否则使用本地进程运行器（默认，零外部依赖）
 */
export function createRunner(env: NodeJS.ProcessEnv = process.env): Runner {
  if (env.JUDGE_RUNNER === "docker") {
    return new DockerRunner(
      env.JUDGE_IMAGE ?? "dp-oj/judge-env",
      Number(env.JUDGE_MEMORY_MB ?? 256)
    );
  }
  return new LocalProcessRunner();
}
