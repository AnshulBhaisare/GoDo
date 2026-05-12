import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('godo.db');
  await initDatabase(db);
  return db;
}

async function initDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`PRAGMA journal_mode = WAL;`);
  await database.execAsync(`PRAGMA foreign_keys = ON;`);

  // ─── Tasks table ───────────────────────────────────────────
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
      deadline TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','completed','deleted')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      recurring_type TEXT DEFAULT 'none' CHECK(recurring_type IN ('none','daily','weekly','monthly')),
      notification_id TEXT
    );
  `);

  // ─── Chat history table ────────────────────────────────────
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK(role IN ('user','assistant')),
      message TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      task_data TEXT
    );
  `);

  // ─── Activity logs table ───────────────────────────────────
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS task_logs (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      task_title TEXT NOT NULL,
      event_type TEXT NOT NULL CHECK(event_type IN ('created','updated','completed','reopened','deleted','restored')),
      timestamp TEXT NOT NULL
    );
  `);

  // ─── Settings table ───────────────────────────────────────
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // ─── Indexes ──────────────────────────────────────────────
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
    CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_chat_timestamp ON chat_history(timestamp);
    CREATE INDEX IF NOT EXISTS idx_logs_task_id ON task_logs(task_id);
    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON task_logs(timestamp);
  `);

  // ─── Insert default settings if empty ─────────────────────
  const settingsCount = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM settings'
  );
  if (settingsCount && settingsCount.count === 0) {
    await database.runAsync(
      "INSERT INTO settings (key, value) VALUES ('theme', 'light')"
    );
    await database.runAsync(
      "INSERT INTO settings (key, value) VALUES ('reminderOffsetMinutes', '15')"
    );
    await database.runAsync(
      "INSERT INTO settings (key, value) VALUES ('aiProvider', 'groq')"
    );
  }

  // Migrate 'grok' to 'groq' for existing users
  await database.runAsync("UPDATE settings SET value = 'groq' WHERE key = 'aiProvider' AND value = 'grok'");
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

export async function wipeAllData(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM tasks;
    DELETE FROM chat_history;
    DELETE FROM task_logs;
  `);
}
