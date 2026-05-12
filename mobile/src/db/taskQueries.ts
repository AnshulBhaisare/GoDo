import { getDatabase } from './database';
import { Task, CreateTaskInput, UpdateTaskInput, TaskStatus } from '../types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = generateId();

  const task: Task = {
    id,
    title: input.title,
    description: input.description || '',
    priority: input.priority || 'medium',
    deadline: input.deadline || null,
    status: 'pending',
    created_at: now,
    updated_at: now,
    deleted_at: null,
    recurring_type: input.recurring_type || 'none',
    notification_id: null,
  };

  await db.runAsync(
    `INSERT INTO tasks (id, title, description, priority, deadline, status, created_at, updated_at, deleted_at, recurring_type, notification_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [task.id, task.title, task.description, task.priority, task.deadline, task.status, task.created_at, task.updated_at, task.deleted_at, task.recurring_type, task.notification_id]
  );

  return task;
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const existing = await getTaskById(id);
  if (!existing) return null;

  const updates: string[] = ['updated_at = ?'];
  const values: any[] = [now];

  if (input.title !== undefined) { updates.push('title = ?'); values.push(input.title); }
  if (input.description !== undefined) { updates.push('description = ?'); values.push(input.description); }
  if (input.priority !== undefined) { updates.push('priority = ?'); values.push(input.priority); }
  if (input.deadline !== undefined) { updates.push('deadline = ?'); values.push(input.deadline); }
  if (input.status !== undefined) { updates.push('status = ?'); values.push(input.status); }
  if (input.recurring_type !== undefined) { updates.push('recurring_type = ?'); values.push(input.recurring_type); }

  values.push(id);

  await db.runAsync(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  return getTaskById(id);
}

export async function completeTask(id: string): Promise<Task | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE tasks SET status = 'completed', updated_at = ? WHERE id = ?`,
    [now, id]
  );

  return getTaskById(id);
}

export async function reopenTask(id: string): Promise<Task | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE tasks SET status = 'pending', updated_at = ? WHERE id = ?`,
    [now, id]
  );

  return getTaskById(id);
}

export async function softDeleteTask(id: string): Promise<Task | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE tasks SET status = 'deleted', deleted_at = ?, updated_at = ? WHERE id = ?`,
    [now, now, id]
  );

  return getTaskById(id);
}

export async function restoreTask(id: string): Promise<Task | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE tasks SET status = 'pending', deleted_at = NULL, updated_at = ? WHERE id = ?`,
    [now, id]
  );

  return getTaskById(id);
}

export async function permanentlyDeleteExpiredTasks(): Promise<number> {
  const db = await getDatabase();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const result = await db.runAsync(
    `DELETE FROM tasks WHERE status = 'deleted' AND deleted_at IS NOT NULL AND deleted_at < ?`,
    [cutoff]
  );

  return result.changes;
}

export async function getTaskById(id: string): Promise<Task | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Task>(
    `SELECT * FROM tasks WHERE id = ?`,
    [id]
  );
}

export async function getTasksByStatus(status: TaskStatus): Promise<Task[]> {
  const db = await getDatabase();
  return db.getAllAsync<Task>(
    `SELECT * FROM tasks WHERE status = ? ORDER BY 
      CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END,
      deadline ASC NULLS LAST, created_at DESC`,
    [status]
  );
}

export async function getPendingTasks(): Promise<Task[]> {
  return getTasksByStatus('pending');
}

export async function getCompletedTasks(): Promise<Task[]> {
  return getTasksByStatus('completed');
}

export async function getDeletedTasks(): Promise<Task[]> {
  const db = await getDatabase();
  return db.getAllAsync<Task>(
    `SELECT * FROM tasks WHERE status = 'deleted' AND deleted_at IS NOT NULL ORDER BY deleted_at DESC`
  );
}

export async function getTodayTasks(): Promise<Task[]> {
  const db = await getDatabase();
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  return db.getAllAsync<Task>(
    `SELECT * FROM tasks WHERE status = 'pending' AND deadline >= ? AND deadline < ? ORDER BY deadline ASC`,
    [startOfDay, endOfDay]
  );
}

export async function getOverdueTasks(): Promise<Task[]> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  return db.getAllAsync<Task>(
    `SELECT * FROM tasks WHERE status = 'pending' AND deadline IS NOT NULL AND deadline < ? ORDER BY deadline ASC`,
    [now]
  );
}

export async function getTasksForDate(dateStr: string): Promise<Task[]> {
  const db = await getDatabase();
  const date = new Date(dateStr);
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();

  return db.getAllAsync<Task>(
    `SELECT * FROM tasks WHERE deadline >= ? AND deadline < ? AND status != 'deleted' ORDER BY deadline ASC`,
    [startOfDay, endOfDay]
  );
}

export async function getTasksForMonth(year: number, month: number): Promise<Task[]> {
  const db = await getDatabase();
  const startOfMonth = new Date(year, month, 1).toISOString();
  const endOfMonth = new Date(year, month + 1, 1).toISOString();

  return db.getAllAsync<Task>(
    `SELECT * FROM tasks WHERE deadline >= ? AND deadline < ? AND status != 'deleted' ORDER BY deadline ASC`,
    [startOfMonth, endOfMonth]
  );
}

export async function findTaskByTitle(title: string): Promise<Task | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Task>(
    `SELECT * FROM tasks WHERE LOWER(title) LIKE ? AND status != 'deleted' ORDER BY created_at DESC LIMIT 1`,
    [`%${title.toLowerCase()}%`]
  );
}

export async function getAllActiveTasks(): Promise<Task[]> {
  const db = await getDatabase();
  return db.getAllAsync<Task>(
    `SELECT * FROM tasks WHERE status IN ('pending', 'completed') ORDER BY created_at DESC`
  );
}

export async function updateTaskNotificationId(taskId: string, notificationId: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE tasks SET notification_id = ? WHERE id = ?`,
    [notificationId, taskId]
  );
}
