import { Module, Global } from "@nestjs/common";
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * 数据目录解析：不再依赖 process.cwd()（从哪个目录启动都会命中同一题库）。
 * 优先级：DATA_DIR 环境变量 > 编译产物位置（dist）> 源码位置（ts 直跑）> cwd 回退。
 * 取第一个存在 data/problems 子目录的候选。
 */
function resolveDataDir(): string {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  const candidates = [
    resolve(__dirname, "../../../../data"), // dist/database -> 项目根/data
    resolve(__dirname, "../../data"), // src/database -> 项目根/data（源码直跑）
    resolve(process.cwd(), "data"),
    resolve(process.cwd(), "../../data"),
  ];
  for (const c of candidates) {
    if (existsSync(join(c, "problems"))) return c;
  }
  return candidates[0] ?? resolve(process.cwd(), "data");
}

/** 数据目录（默认项目根 data/，可用环境变量 DATA_DIR 覆盖） */
export const DATA_DIR = resolveDataDir();
export const DB_PATH = process.env.DB_PATH ?? resolve(DATA_DIR, "oj.db");

export const DATABASE = Symbol("DATABASE");

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    display_id TEXT NOT NULL,
    title TEXT NOT NULL,
    lecture_no INTEGER NOT NULL,
    lecture_title TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    tags TEXT NOT NULL,
    time_limit_ms INTEGER NOT NULL,
    memory_limit_mb INTEGER NOT NULL,
    samples TEXT NOT NULL,
    statement_file TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS testcases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    group_no INTEGER NOT NULL,
    input_path TEXT NOT NULL,
    output_path TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 1,
    UNIQUE(problem_id, group_no)
  )`,
  `CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    problem_id INTEGER NOT NULL REFERENCES problems(id),
    language_id TEXT NOT NULL,
    code_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    verdict TEXT,
    result_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
];

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: () => {
        mkdirSync(DATA_DIR, { recursive: true });
        const db = new DatabaseSync(DB_PATH);
        db.exec("PRAGMA journal_mode = WAL");
        db.exec("PRAGMA foreign_keys = ON");
        for (const sql of SCHEMA) db.exec(sql);
        return db;
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
