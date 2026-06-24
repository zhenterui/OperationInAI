import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const runtimeStorePath = resolve(process.cwd(), "server/data/runtime-store.json");
export const sqliteStorePath = resolve(process.cwd(), "server/data/runtime-store.sqlite");
export const storagePointerPath = resolve(process.cwd(), "server/data/storage-pointer.json");

const require = createRequire(import.meta.url);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

class LocalJsonStorageAdapter {
  constructor(filePath = runtimeStorePath) {
    this.type = "local-json";
    this.filePath = filePath;
  }

  read() {
    if (!existsSync(this.filePath)) return null;
    try {
      return JSON.parse(readFileSync(this.filePath, "utf8"));
    } catch {
      return null;
    }
  }

  write(snapshot) {
    mkdirSync(dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.tmp`;
    writeFileSync(tempPath, JSON.stringify(snapshot, null, 2), "utf8");
    renameSync(tempPath, this.filePath);
  }

  probe() {
    mkdirSync(dirname(this.filePath), { recursive: true });
    return true;
  }
}

class DatabaseStorageAdapter {
  constructor(config = {}) {
    this.type = "database";
    this.config = clone(config);
  }

  unsupported() {
    const error = new Error(`Database storage ${this.config.database || "unknown"} is configured but no built-in adapter is enabled. Use SQLite, or wire the enterprise driver for this database.`);
    error.status = 501;
    return error;
  }

  read() {
    throw this.unsupported();
  }

  write() {
    throw this.unsupported();
  }

  probe() {
    throw this.unsupported();
  }
}

class SqliteStorageAdapter {
  constructor(config = {}) {
    this.type = "sqlite";
    this.config = clone(config);
    this.filePath = resolveSqlitePath(config);
  }

  open() {
    let sqlite;
    try {
      sqlite = require("node:sqlite");
    } catch {
      const error = new Error("SQLite storage requires Node.js with node:sqlite support. Current runtime cannot load node:sqlite.");
      error.status = 501;
      throw error;
    }
    mkdirSync(dirname(this.filePath), { recursive: true });
    const db = new sqlite.DatabaseSync(this.filePath);
    db.exec(`
      create table if not exists operation_store (
        store_key text primary key,
        store_value text not null,
        updated_at text not null
      )
    `);
    return db;
  }

  read() {
    if (!existsSync(this.filePath)) return null;
    const db = this.open();
    try {
      const row = db.prepare("select store_value from operation_store where store_key = ?").get("runtime");
      return row?.store_value ? JSON.parse(row.store_value) : null;
    } finally {
      db.close();
    }
  }

  write(snapshot) {
    const db = this.open();
    try {
      db.prepare(`
        insert into operation_store (store_key, store_value, updated_at)
        values (?, ?, ?)
        on conflict(store_key) do update set
          store_value = excluded.store_value,
          updated_at = excluded.updated_at
      `).run("runtime", JSON.stringify(snapshot), new Date().toISOString());
    } finally {
      db.close();
    }
  }

  probe() {
    const db = this.open();
    db.close();
    return true;
  }
}

function resolveSqlitePath(config = {}) {
  const candidate = String(config.path || config.filePath || config.host || "").trim();
  if (!candidate || candidate === "127.0.0.1" || candidate === "localhost") return sqliteStorePath;
  return resolve(process.cwd(), candidate);
}

export function createStorageAdapter(config = {}) {
  if (config.type === "database") {
    if (String(config.database || "").toLowerCase() === "sqlite") return new SqliteStorageAdapter(config);
    return new DatabaseStorageAdapter(config);
  }
  return new LocalJsonStorageAdapter(config.filePath || runtimeStorePath);
}
