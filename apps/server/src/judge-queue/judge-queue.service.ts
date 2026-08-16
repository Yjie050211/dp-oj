import { Inject, Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { LANGUAGES, SubmissionStatus, Verdict } from "@dp-oj/common";
import { judge } from "@dp-oj/judge";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DATABASE } from "../database/database.module";

interface SubmissionRow {
  id: number;
  problem_id: number;
  language_id: string;
  code_path: string;
}

interface TestcaseRow {
  group_no: number;
  input_path: string;
  output_path: string;
}

/**
 * 判题队列（内存实现，单机自用串行足够）：
 * 提交 id 入队 → 单个 worker 串行处理 → 判题结果写回 submissions 表。
 */
@Injectable()
export class JudgeQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(JudgeQueueService.name);
  private chain: Promise<void> = Promise.resolve();
  private readonly pending = new Set<number>();

  constructor(@Inject(DATABASE) private readonly db: any) {}

  enqueue(submissionId: number): void {
    if (this.pending.has(submissionId)) return;
    this.pending.add(submissionId);
    this.chain = this.chain
      .then(() => this.process(submissionId))
      .catch((err) => this.logger.error("判题队列异常: " + String(err)))
      .finally(() => this.pending.delete(submissionId));
  }

  private async process(id: number): Promise<void> {
    const row = this.db
      .prepare("SELECT id, problem_id, language_id, code_path FROM submissions WHERE id = ?")
      .get(id) as SubmissionRow | undefined;
    if (!row) return;

    const lang = LANGUAGES.find((l) => l.id === row.language_id);
    const problem = this.db
      .prepare("SELECT time_limit_ms, memory_limit_mb FROM problems WHERE id = ?")
      .get(row.problem_id) as { time_limit_ms: number; memory_limit_mb: number } | undefined;
    const cases = this.db
      .prepare("SELECT group_no, input_path, output_path FROM testcases WHERE problem_id = ? ORDER BY group_no")
      .all(row.problem_id) as TestcaseRow[];

    this.db.prepare("UPDATE submissions SET status = ? WHERE id = ?").run(SubmissionStatus.RUNNING, id);

    let result;
    try {
      if (!lang) throw new Error("未知语言");
      if (!problem) throw new Error("题目不存在");
      result = await judge({
        languageId: row.language_id,
        sourcePath: row.code_path,
        workDir: mkdtempSync(join(tmpdir(), "dp-oj-sub-")),
        testcases: cases.map((c) => ({
          groupNo: c.group_no,
          inputPath: c.input_path,
          outputPath: c.output_path,
        })),
        limits: {
          timeMs: problem.time_limit_ms,
          memoryMb: problem.memory_limit_mb,
        },
      });
    } catch (err) {
      result = {
        verdict: Verdict.SE,
        compileOutput: null,
        totalTimeMs: 0,
        maxMemoryKb: null,
        cases: [],
        error: String(err),
      };
    }

    this.db
      .prepare("UPDATE submissions SET status = ?, verdict = ?, result_json = ? WHERE id = ?")
      .run(SubmissionStatus.FINISHED, result.verdict, JSON.stringify(result), id);
    this.logger.log("判题完成 #" + id + " -> " + result.verdict);
  }

  /** 待判数量（供健康检查/前端展示） */
  queueDepth(): number {
    return this.pending.size;
  }

  onModuleDestroy(): void {
    // 队列为内存链，随进程退出自然释放
  }
}
