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
    const error = new Error("业务数据表存储需要当前 Node.js 支持 node:sqlite");
    error.status = 501;
    throw error;
  }
  mkdirSync(resolve(businessDbPath, ".."), { recursive: true });
  const db = new sqlite.DatabaseSync(businessDbPath);
  try {
    db.exec("PRAGMA journal_mode = WAL");
  } catch {
    try { db.exec("PRAGMA journal_mode = DELETE"); } catch {}
  }
  return db;
}

function sanitizeIdentifier(name) {
  const cleaned = String(name ?? "").replace(/[^\w\u4e00-\u9fa5.]/g, "_").slice(0, 64);
  return cleaned || "col";
}

function quoteIdent(name) {
  return `"${sanitizeIdentifier(name)}"`;
}

function rowsToObjects(fields, rows) {
  return (rows || []).map((row) => {
    if (!Array.isArray(row)) return { ...(row || {}) };
    return fields.reduce((output, field, index) => {
      output[field] = row[index];
      return output;
    }, {});
  });
}

function getExistingColumns(db, tableName) {
  try {
    return db.prepare(`PRAGMA table_info(${quoteIdent(tableName)})`).all().map((row) => row.name);
  } catch {
    return [];
  }
}

function ensureTable(db, tableName, columns) {
  const table = quoteIdent(tableName);
  db.exec(`CREATE TABLE IF NOT EXISTS ${table} (_fetched_at TEXT)`);
  const existing = new Set(getExistingColumns(db, tableName));
  columns.forEach((column) => {
    const sanitized = sanitizeIdentifier(column);
    if (!existing.has(sanitized)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${quoteIdent(sanitized)} TEXT`);
      existing.add(sanitized);
    }
  });
}

export function persistBusinessTable(tableName, fields, rows, options = {}) {
  if (!tableName) return { ok: false, error: "missing table name" };
  const strategy = ["overwrite", "append", "upsert"].includes(options.writeStrategy) ? options.writeStrategy : "upsert";
  const columns = (fields || []).map(String).filter(Boolean);
  if (!columns.length) return { ok: false, error: "missing fields", table: tableName };
  const primaryKeys = (options.primaryKeys || []).map(String).filter(Boolean);
  const objects = rowsToObjects(columns, rows);
  const db = openDb();
  try {
    ensureTable(db, tableName, columns);
    const table = quoteIdent(tableName);
    const colList = columns.map(quoteIdent).join(", ");
    const placeholders = columns.map(() => "?").join(", ");
    const insertOne = db.prepare(`INSERT INTO ${table} (_fetched_at, ${colList}) VALUES (?, ${placeholders})`);
    const now = new Date().toISOString();
    db.exec("BEGIN");
    if (strategy === "overwrite") db.exec(`DELETE FROM ${table}`);
    if (strategy === "upsert" && primaryKeys.length) {
      const where = primaryKeys.map((key) => `${quoteIdent(key)} = ?`).join(" AND ");
      const deleteOne = db.prepare(`DELETE FROM ${table} WHERE ${where}`);
      for (const obj of objects) {
        const keyValues = primaryKeys.map((key) => obj[key]);
        if (keyValues.every((value) => value !== undefined && value !== null && value !== "")) {
          deleteOne.run(...keyValues);
        }
        insertOne.run(now, ...columns.map((column) => obj[column] ?? null));
      }
    } else {
      for (const obj of objects) {
        insertOne.run(now, ...columns.map((column) => obj[column] ?? null));
      }
    }
    db.exec("COMMIT");
    return { ok: true, table: tableName, rowCount: objects.length, strategy };
  } catch (error) {
    try { db.exec("ROLLBACK"); } catch {}
    return { ok: false, table: tableName, error: error.message };
  } finally {
    db.close();
  }
}

export function queryBusinessTable(tableName, options = {}) {
  const db = openDb();
  try {
    const table = sanitizeIdentifier(tableName);
    const found = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").all(table);
    if (!found.length) return { ok: false, table: tableName, error: "table not found", rows: [], columns: [] };
    const columns = getExistingColumns(db, table).filter((name) => name !== "_fetched_at");
    let sql = `SELECT * FROM ${quoteIdent(table)}`;
    const where = [];
    const params = [];
    if (options.timeField && options.timeStart && columns.includes(options.timeField)) {
      where.push(`${quoteIdent(options.timeField)} >= ?`);
      params.push(String(options.timeStart));
    }
    if (options.timeField && options.timeEnd && columns.includes(options.timeField)) {
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
    return { ok: true, table, columns, rows, rowCount: rows.length };
  } catch (error) {
    return { ok: false, table: tableName, error: error.message, rows: [], columns: [] };
  } finally {
    db.close();
  }
}

export function listBusinessTables() {
  const db = openDb();
  try {
    return db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all()
      .map((row) => row.name);
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
