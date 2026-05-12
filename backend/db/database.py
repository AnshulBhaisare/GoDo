import sqlite3
import os
from db.models import CREATE_TASKS_TABLE

DB_PATH = os.path.join(os.path.dirname(__file__), "godo.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(CREATE_TASKS_TABLE)
    conn.commit()
    conn.close()
    print("✅ Database initialized")

def add_task(chat_id, task_name, deadline, priority):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO tasks (chat_id, task_name, deadline, priority)
        VALUES (?, ?, ?, ?)
    """, (chat_id, task_name, deadline, priority))
    task_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return task_id

def get_pending_tasks(chat_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM tasks
        WHERE chat_id = ? AND status = 'pending'
        ORDER BY priority ASC, deadline ASC
    """, (chat_id,))
    tasks = cursor.fetchall()
    conn.close()
    return tasks

def mark_task_done(task_id, chat_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE tasks SET status = 'done'
        WHERE id = ? AND chat_id = ?
    """, (task_id, chat_id))
    updated = cursor.rowcount
    conn.commit()
    conn.close()
    return updated > 0

def delete_task(task_id, chat_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        DELETE FROM tasks
        WHERE id = ? AND chat_id = ?
    """, (task_id, chat_id))
    deleted = cursor.rowcount
    conn.commit()
    conn.close()
    return deleted > 0

def get_todays_tasks(chat_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM tasks
        WHERE chat_id = ?
        AND date(deadline) = date('now')
        ORDER BY priority ASC, deadline ASC
    """, (chat_id,))
    tasks = cursor.fetchall()
    conn.close()
    return tasks

def get_tasks_for_reminder(current_time, window_start, window_end, notified_col):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(f"""
        SELECT * FROM tasks
        WHERE status = 'pending'
        AND {notified_col} = 0
        AND deadline BETWEEN ? AND ?
    """, (window_start, window_end))
    tasks = cursor.fetchall()
    conn.close()
    return tasks

def mark_notified(task_id, notified_col):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(f"""
        UPDATE tasks SET {notified_col} = 1
        WHERE id = ?
    """, (task_id,))
    conn.commit()
    conn.close()

def update_notion_page_id(task_id, notion_page_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE tasks SET notion_page_id = ?
        WHERE id = ?
    """, (notion_page_id, task_id))
    conn.commit()
    conn.close()