import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DATABASE, DATA_DIR } from "../database/database.module";

interface ProblemConfig {
  slug: string;
  displayId: string;
  title: string;
  lectureNo: number;
  lectureTitle: string;
  difficulty: string;
  tags: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  statementFile: string;
  samples: { input: string; output: string; note?: string }[];
}

interface ProblemRow {
  id: number;
  slug: string;
  display_id: string;
  title: string;
  lecture_no: number;
  lecture_title: string;
  difficulty: string;
  tags: string;
  time_limit_ms: number;
  memory_limit_mb: number;
  samples: string;
  statement_file: string;
}

@Injectable()
export class ProblemsService implements OnModuleInit {
  private readonly logger = new Logger(ProblemsService.name);

  constructor(@Inject(DATABASE) private readonly db: any) {}

  /** 启动时扫描题库目录（data/problems 下每个子目录）导入题目，按 slug upsert */
  async onModuleInit(): Promise<void> {
    try {
      const count = this.seed();
      this.logger.log("题库导入完成，共 " + count + " 道题");
    } catch (err) {
      this.logger.error("题库导入失败: " + String(err));
    }
  }

  seed(): number {
    const problemsDir = join(DATA_DIR, "problems");
    let slugs: string[] = [];
    try {
      slugs = readdirSync(problemsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    } catch {
      return 0;
    }

    let count = 0;
    for (const slug of slugs) {
      const dir = join(problemsDir, slug);
      const cfgPath = join(dir, "config.json");
      let cfg: ProblemConfig;
      try {
        cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
      } catch (err) {
        this.logger.warn("跳过无法读取配置的题目 " + slug + ": " + String(err));
        continue;
      }

      const stmtPath = join(dir, cfg.statementFile ?? "statement.md");
      if (!readFileSync(stmtPath, "utf8")) continue;

      const upsert = this.db.prepare(
        `INSERT INTO problems
          (slug, display_id, title, lecture_no, lecture_title, difficulty,
           tags, time_limit_ms, memory_limit_mb, samples, statement_file)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET
           display_id = excluded.display_id,
           title = excluded.title,
           lecture_no = excluded.lecture_no,
           lecture_title = excluded.lecture_title,
           difficulty = excluded.difficulty,
           tags = excluded.tags,
           time_limit_ms = excluded.time_limit_ms,
           memory_limit_mb = excluded.memory_limit_mb,
           samples = excluded.samples,
           statement_file = excluded.statement_file`
      );
      upsert.run(
        cfg.slug, cfg.displayId, cfg.title, cfg.lectureNo, cfg.lectureTitle,
        cfg.difficulty, JSON.stringify(cfg.tags ?? []), cfg.timeLimitMs,
        cfg.memoryLimitMb, JSON.stringify(cfg.samples ?? []), cfg.statementFile ?? "statement.md"
      );

      // 测试用例：先清后插（cases 目录内 NN.in / NN.out 成对）
      const row = this.db.prepare("SELECT id FROM problems WHERE slug = ?").get(cfg.slug) as { id: number };
      this.db.prepare("DELETE FROM testcases WHERE problem_id = ?").run(row.id);
      const casesDir = join(dir, "cases");
      let files: string[] = [];
      try {
        files = readdirSync(casesDir).filter((f) => f.endsWith(".in")).sort();
      } catch {
        continue;
      }
      const ins = this.db.prepare(
        "INSERT INTO testcases (problem_id, group_no, input_path, output_path) VALUES (?, ?, ?, ?)"
      );
      files.forEach((f, idx) => {
        const out = f.replace(/\.in$/, ".out");
        ins.run(row.id, idx + 1, join(casesDir, f), join(casesDir, out));
      });
      count++;
    }
    return count;
  }

  /** 列表：不含题面正文，供列表页展示 */
  list() {
    const rows = this.db
      .prepare("SELECT * FROM problems WHERE enabled = 1 ORDER BY display_id")
      .all() as ProblemRow[];
    return rows.map((r) => ({
      slug: r.slug,
      displayId: r.display_id,
      title: r.title,
      lectureNo: r.lecture_no,
      lectureTitle: r.lecture_title,
      difficulty: r.difficulty,
      tags: JSON.parse(r.tags) as string[],
    }));
  }

  /** 详情：含题面 Markdown 原文、样例与测试组数 */
  getBySlug(slug: string) {
    const row = this.db.prepare("SELECT * FROM problems WHERE slug = ? AND enabled = 1").get(slug) as
      | ProblemRow
      | undefined;
    if (!row) return null;

    const statement = readFileSync(join(DATA_DIR, "problems", slug, row.statement_file), "utf8");
    const caseCount = (
      this.db.prepare("SELECT COUNT(*) AS n FROM testcases WHERE problem_id = ?").get(row.id) as { n: number }
    ).n;

    return {
      slug: row.slug,
      displayId: row.display_id,
      title: row.title,
      lectureNo: row.lecture_no,
      lectureTitle: row.lecture_title,
      difficulty: row.difficulty,
      tags: JSON.parse(row.tags) as string[],
      timeLimitMs: row.time_limit_ms,
      memoryLimitMb: row.memory_limit_mb,
      samples: JSON.parse(row.samples),
      statement,
      testcaseCount: caseCount,
    };
  }
}
