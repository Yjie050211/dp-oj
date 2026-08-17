import { spawn } from "node:child_process";
import type { RunInput, RunResult, Runner } from "./types";

const MAX_CAPTURE_BYTES = 200 * 1024; // 结果中保留的输出节选上限
/** 输出超限/超时强杀后，等待 close 的兜底时限 */
const KILL_GRACE_MS = 2000;

/** 杀进程树：Windows 用 taskkill /T /F，其他平台留待 DockerRunner 场景扩展 */
function killTree(pid: number | undefined): void {
  if (pid === undefined) return;
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
    } else {
      process.kill(pid, "SIGKILL");
    }
  } catch {
    // 进程可能已退出，忽略
  }
}

/**
 * 本地进程运行器（Windows 默认）：
 * - 子进程 stdin 注入、stdout/stderr 捕获并按上限截断
 * - 超时强杀（含进程树）；kill 发出后等 close 收尾（带兜底时限），避免进程残留与 rmSync 竞态
 * - 以 close 事件定稿：exit 早于 stdio 排空，close 才能保证输出完整
 * - 输出超限同样强杀（防无限输出拖死判题机），并保留完整输出供比对
 * - 高精度计时；内存测量本地不精确，返回 null（M6 Docker 运行器精确化）
 */
export class LocalProcessRunner implements Runner {
  run(input: RunInput): Promise<RunResult> {
    return new Promise((resolve) => {
      const start = process.hrtime.bigint();
      let stdout = Buffer.alloc(0);
      let stderr = Buffer.alloc(0);
      let stdoutTruncated = false;
      let stderrTruncated = false;
      let settled = false;
      let exitInfo: { code: number | null; signal: NodeJS.Signals | null } | null = null;
      let timedOut = false; // 因时限发起过 kill
      let killRequested = false; // 已发起 killTree（超时或输出超限），避免重复 spawn
      let forceTimer: ReturnType<typeof setTimeout> | null = null;

      const elapsedMs = () => Number(process.hrtime.bigint() - start) / 1e6;

      const finish = (r: RunResult) => {
        if (!settled) {
          settled = true;
          resolve(r);
        }
      };

      let child;
      try {
        child = spawn(input.command, input.args, {
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
        killTree(child.pid);
      };

      const timer = setTimeout(() => {
        // 进程已正常退出（exit 已到）则不动手，交给 close 定稿
        if (exitInfo !== null) return;
        timedOut = true;
        requestKill();
        // 兜底：kill 发出后仍未 close 则强制定稿为 TLE
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
            // 超出输出上限：强杀，防无限输出
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

      // close（stdio 全部排空）才定稿，避免输出尾部丢失导致误判 WA
      child.on("close", () => {
        clearTimeout(timer);
        if (forceTimer) clearTimeout(forceTimer);
        const truncated = stdoutTruncated || stderrTruncated;
        const fullStdout = stdout.toString("utf8");
        // 被输出上限杀掉：视为非零退出（归 WA/OLE）
        const effectiveCode = truncated ? (exitInfo?.code ?? 1) : (exitInfo?.code ?? null);
        finish({
          ok: !timedOut && effectiveCode === 0 && !truncated,
          exitCode: effectiveCode,
          timedOut,
          stdout: fullStdout.slice(0, MAX_CAPTURE_BYTES),
          stderr: stderr.toString("utf8").slice(0, MAX_CAPTURE_BYTES),
          stdoutFull: fullStdout,
          timeMs: elapsedMs(),
          memoryKb: null,
          outputTruncated: truncated,
          error: null,
        });
      });

      child.stdin?.on("error", () => {
        // 子进程提前退出导致 EPIPE：忽略，close 事件负责收尾
      });
      child.stdin?.end(input.stdin);
    });
  }
}
