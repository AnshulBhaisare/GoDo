CREATE_TASKS_TABLE = """
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    task_name TEXT NOT NULL,
    deadline TEXT NOT NULL,
    priority TEXT NOT NULL CHECK(priority IN ('P1', 'P2', 'P3')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'done')),
    notified_30min INTEGER DEFAULT 0,
    notified_deadline INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    notion_page_id TEXT
);
"""