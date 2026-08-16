import { spawn } from "node:child_process";
import type { RunInput, RunResult, Runner } from "./types";

const MAX_CAPTURE_BYTES = 200 * 1024; // 结果中保留的输出节选上限

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
 * - 超时强杀（含进程树），输出超限同样强杀（防无限输出拖死判题机）
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
          ok: false, exitCode: null, timedOut: false, stdout: "", stderr: "",
          timeMs: elapsedMs(), memoryKb: null, outputTruncated: false, error: String(err),
        });
      }

      const timer = setTimeout(() => {
        killTree(child.pid);
        finish({
          ok: false, exitCode: null, timedOut: true,
          stdout: stdout.toString("utf8").slice(0, MAX_CAPTURE_BYTES),
          stderr: stderr.toString("utf8").slice(0, MAX_CAPTURE_BYTES),
          timeMs: elapsedMs(), memoryKb: null,
          outputTruncated: stdoutTruncated || stderrTruncated,
          error: null,
        });
      }, input.timeLimitMs);

      child.on("error", (err) => {
        clearTimeout(timer);
        finish({
          ok: false, exitCode: null, timedOut: false, stdout: "", stderr: "",
          timeMs: elapsedMs(), memoryKb: null, outputTruncated: false, error: String(err),
        });
      });

      child.stdout?.on("data", (chunk: Buffer) => {
        if (stdout.length < input.outputLimitBytes) {
          stdout = Buffer.concat([stdout, chunk]);
          if (stdout.length > input.outputLimitBytes) {
            // 超出输出上限：强杀，防无限输出
            stdoutTruncated = true;
            killTree(child.pid);
          }
        } else {
          stdoutTruncated = true;
          killTree(child.pid);
        }
      });

      child.stderr?.on("data", (chunk: Buffer) => {
        if (stderr.length < input.outputLimitBytes) {
          stderr = Buffer.concat([stderr, chunk]);
          if (stderr.length > input.outputLimitBytes) {
            stderrTruncated = true;
            killTree(child.pid);
          }
        } else {
          stderrTruncated = true;
          killTree(child.pid);
        }
      });

      child.on("exit", (code, signal) => {
        clearTimeout(timer);
        const truncated = stdoutTruncated || stderrTruncated;
        // 被输出上限杀掉：视为非零退出（归 WA/OLE）
        const effectiveCode = truncated ? (code ?? 1) : code;
        finish({
          ok: effectiveCode === 0 && !truncated,
          exitCode: effectiveCode,
          timedOut: false,
          stdout: stdout.toString("utf8").slice(0, MAX_CAPTURE_BYTES),
          stderr: stderr.toString("utf8").slice(0, MAX_CAPTURE_BYTES),
          timeMs: elapsedMs(),
          memoryKb: null,
          outputTruncated: truncated,
          error: null,
        });
      });

      child.stdin?.on("error", () => {
        // 子进程提前退出导致 EPIPE：忽略，exit 事件负责收尾
      });
      child.stdin?.end(input.stdin);
    });
  }
}
