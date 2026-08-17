import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { LANGUAGES } from "@dp-oj/common";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DATABASE, DATA_DIR } from "../database/database.module";
import { JudgeQueueService } from "../judge-queue/judge-queue.service";

interface SubmissionRow {
  id: number;
  problem_id: number;
  language_id: string;
  code_path: string;
  status: string;
  verdict: string | null;
  result_json: string | null;
  created_at: string;
}

@Injectable()
export class SubmissionsService {
  constructor(
    @Inject(DATABASE) private readonly db: any,
    private readonly queue: JudgeQueueService
  ) {}

  /** 创建提交：校验 → 落库（代码文件）→ 入判题队列 */
  create(input: { problemSlug: string; languageId: string; code: string }) {
    const lang = LANGUAGES.find((l) => l.id === input.languageId);
    if (!lang) {
      throw new BadRequestException("不支持的语言: " + input.languageId);
    }
    if (typeof input.code !== "string" || input.code.trim().length === 0) {
      throw new BadRequestException("代码不能为空");
    }
    if (typeof input.problemSlug !== "string" || input.problemSlug.length === 0 || input.problemSlug.length > 128) {
      throw new BadRequestException("题目标识不合法");
    }
    if (input.code.length > 200 * 1024) {
      throw new BadRequestException("代码过长（上限 200KB）");
    }

    const problem = this.db
      .prepare("SELECT id, time_limit_ms, memory_limit_mb FROM problems WHERE slug = ? AND enabled = 1")
      .get(input.problemSlug) as { id: number; time_limit_ms: number; memory_limit_mb: number } | undefined;
    if (!problem) {
      throw new NotFoundException("题目不存在: " + input.problemSlug);
    }

    const ins = this.db.prepare(
      "INSERT INTO submissions (problem_id, language_id, code_path) VALUES (?, ?, '')"
    );
    const id = Number(ins.run(problem.id, input.languageId).lastInsertRowid);

    const dir = join(DATA_DIR, "submissions", String(id));
    mkdirSync(dir, { recursive: true });
    const codePath = join(dir, lang.sourceFile);
    writeFileSync(codePath, input.code, "utf8");
    this.db.prepare("UPDATE submissions SET code_path = ? WHERE id = ?").run(codePath, id);

    this.queue.enqueue(id);
    return this.get(id);
  }

  /** 查询单次提交（含判题结果） */
  get(id: number) {
    const row = this.db
      .prepare(
        `SELECT s.*, p.slug AS problem_slug, p.display_id, p.title AS problem_title
         FROM submissions s JOIN problems p ON p.id = s.problem_id
         WHERE s.id = ?`
      )
      .get(id) as (SubmissionRow & { problem_slug: string; display_id: string; problem_title: string }) | undefined;
    if (!row) throw new NotFoundException("提交不存在: " + id);
    return {
      id: row.id,
      problemSlug: row.problem_slug,
      problemDisplayId: row.display_id,
      problemTitle: row.problem_title,
      languageId: row.language_id,
      status: row.status,
      verdict: row.verdict,
      result: row.result_json ? JSON.parse(row.result_json) : null,
      createdAt: row.created_at,
    };
  }

  /** 提交历史（最近 50 条） */
  list() {
    const rows = this.db
      .prepare(
        `SELECT s.id, s.problem_id, s.language_id, s.status, s.verdict, s.created_at,
                p.slug AS problem_slug, p.display_id, p.title AS problem_title
         FROM submissions s JOIN problems p ON p.id = s.problem_id
         ORDER BY s.id DESC LIMIT 50`
      )
      .all() as (SubmissionRow & { problem_slug: string; display_id: string; problem_title: string })[];
    return rows.map((r) => ({
      id: r.id,
      problemSlug: r.problem_slug,
      problemDisplayId: r.display_id,
      problemTitle: r.problem_title,
      languageId: r.language_id,
      status: r.status,
      verdict: r.verdict,
      createdAt: r.created_at,
    }));
  }
}
