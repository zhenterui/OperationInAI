// 业务数据独立表存储(E6)
// 与配置快照分离: 业务数据按 businessTable 建独立 SQLite 表, 动态建表 + _fetched_at,
// 支持 overwrite/upsert/append 写入(单表事务原子), 并提供 SQL 查询能力。
// 通过 outputConfig.useTableStorage 开启, 默认关闭, 不影响内存 business.rows 主路径。

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const businessDbPath = resolve(process.cwd(), "server/data/business-data.sqlite");

function openDb() {
  let sqlite;
  try {
    sqlite = require("node:sqlite");
  } catch {
    const error = new Error("业务数据表存储需要 node:sqlite 支持");
    error.status = 501;
    throw error;
  }
  mkdirSync(resolve(businessDbPath, ".."), { recursive: true });
  const db = new sqlite.DatabaseSync(businessDbPath);
  db.exec("PRAGMA journal_mode = WAL");
  return db;
}

function sanitizeIdentifier(name) {
  const cleaned = String(name ?? "").replace(/[^\w一-龥.]/g, "_").slice(0, 64);
  return cleaned || "col";
}

function quoteIdent(name) {
  return `"${sanitizeIdentifier(name)}"`;
}

function ensureTable(db, table, columns) {
  const colDefs = ["_fetched_at TEXT"].concat(columns.map((c) => `${quoteIdent(c)} TEXT`));
  db.exec(`CREATE TABLE IF NOT EXISTS ${quoteIdent(table)} (${colDefs.join(", ")})`);
}

function rowsToObjects(fields, rows) {
  return (rows || []).map((row) => {
    if (Array.isArray(row)) {
      const obj = {};
      fields.forEach((field, index) => { obj[field] = row[index]; });
      return obj;
    }
    return { ...(row || {}) };
  });
}

// 写业务数据到独立表。rows 可为字段对齐的二维数组或对象数组
export function persistBusinessTable(tableName, fields, rows, options = {}) {
  if (!tableName) return { ok: false, error: "missing table name" };
  const strategy = ["overwrite", "append", "upsert"].includes(options.writeStrategy) ? options.writeStrategy : "upsert";
  const primaryKeys = (options.primaryKeys || []).map(String).filter(Boolean);
  const columns = (fields || []).map(String);
  if (!columns.length) return { ok: false, error: "missing fields", table: tableName };
  const objects = rowsToObjects(columns, rows);
  const db = openDb();
  try {
    ensureTable(db, tableName, columns);
    const colList = columns.map(quoteIdent).join(", ");
    const placeholders = columns.map(() => "?").join(", ");
    const insertOne = db.prepare(
      `INSERT INTO ${quoteIdent(tableName)} (_fetched_at, ${colList}) VALUES (?, ${placeholders})`
    );
    const now = new Date().toISOString();
    db.exec("BEGIN");
    if (strategy === "overwrite") {
      db.exec(`DELETE FROM ${quoteIdent(tableName)}`);
    }
    if (strategy === "upsert" && primaryKeys.length) {
      // 复合主键 upsert: 先按主键删, 再插入(单表事务内原子)
      const wherePk = primaryKeys.map((k) => `${quoteIdent(k)} = ?`).join(" AND ");
      const delStmt = db.prepare(`DELETE FROM ${quoteIdent(tableName)} WHERE ${wherePk}`);
      for (const obj of objects) {
        const keyVals = primaryKeys.map((k) => obj[k]);
        if (keyVals.every((v) => v !== undefined && v !== null && v !== "")) {
          delStmt.run(...keyVals);
        }
        insertOne.run(now, ...columns.map((c) => obj[c] ?? null));
      }
    } else {
      for (const obj of objects) {
        insertOne.run(now, ...columns.map((c) => obj[c] ?? null));
      }
    }
    db.exec("COMMIT");
    return { ok: true, table: tableName, rowCount: objects.length, strategy };
  } catch (error) {
    try { db.exec("ROLLBACK"); } catch {}
    return { ok: false, error: error.message, table: tableName };
  } finally {
    db.close();
  }
}

export function queryBusinessTable(tableName, options = {}) {
  const db = openDb();
  try {
    const found = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
      .all(sanitizeIdentifier(tableName));
    if (!found.length) return { ok: false, error: "table not found", rows: [] };
    const info = db.prepare(`PRAGMA table_info(${quoteIdent(tableName)})`).all();
    const columns = info.map((col) => col.name).filter((name) => name !== "_fetched_at");
    let sql = `SELECT * FROM ${quoteIdent(tableName)}`;
    const where = [];
    const params = [];
    if (options.timeField && options.timeStart) {
      where.push(`${quoteIdent(options.timeField)} >= ?`);
      params.push(String(options.timeStart));
    }
    if (options.timeField && options.timeEnd) {
      where.push(`${quoteIdent(options.timeField)} <= ?`);
      params.push(String(options.timeEnd));
    }
    if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
    if (options.sortBy && columns.includes(options.sortBy)) {
      sql += ` ORDER BY ${quoteIdent(options.sortBy)} ${options.sortDesc ? "DESC" : "ASC"}`;
    }
    const limit = Math.max(1, Math.min(1000, Number(options.limit || 100)));
    sql += ` LIMIT ${limit}`;
    const rows = db.prepare(sql).all(...params);
    return { ok: true, table: tableName, columns, rows, rowCount: rows.length };
  } catch (error) {
    return { ok: false, error: error.message, rows: [] };
  } finally {
    db.close();
  }
}

export function listBusinessTables() {
  const db = openDb();
  try {
    const rows = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all();
    return rows.map((row) => row.name);
  } finally {
    db.close();
  }
}

export function dropBusinessTable(tableName) {
  const db = openDb();
  try {
    db.exec(`DROP TABLE IF EXISTS ${quoteIdent(tableName)}`);
    return { ok: true, table: tableName };
  } finally {
    db.close();
  }
}

export function getBusinessDataDbPath() {
  return businessDbPath;
}
