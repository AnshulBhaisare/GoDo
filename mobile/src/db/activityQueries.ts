import { getDatabase } from './database';
import { ActivityLog, ActivityEventType } from '../types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export async function logActivity(
  taskId: string,
  taskTitle: string,
  eventType: ActivityEventType
): Promise<ActivityLog> {
  const db = await getDatabase();
  const id = generateId();
  const timestamp = new Date().toISOString();

  const log: ActivityLog = {
    id,
    task_id: taskId,
    task_title: taskTitle,
    event_type: eventType,
    timestamp,
  };

  await db.runAsync(
    `INSERT INTO task_logs (id, task_id, task_title, event_type, timestamp) VALUES (?, ?, ?, ?, ?)`,
    [id, taskId, taskTitle, eventType, timestamp]
  );

  return log;
}

export async function getActivityLogs(limit: number = 50, offset: number = 0): Promise<ActivityLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<ActivityLog>(
    `SELECT * FROM task_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
}

export async function getActivityLogsForTask(taskId: string): Promise<ActivityLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<ActivityLog>(
    `SELECT * FROM task_logs WHERE task_id = ? ORDER BY timestamp DESC`,
    [taskId]
  );
}

export async function getTodayActivityLogs(): Promise<ActivityLog[]> {
  const db = await getDatabase();
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

  return db.getAllAsync<ActivityLog>(
    `SELECT * FROM task_logs WHERE timestamp >= ? ORDER BY timestamp DESC`,
    [startOfDay]
  );
}

export async function getWeeklyCompletionCount(): Promise<number> {
  const db = await getDatabase();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM task_logs WHERE event_type = 'completed' AND timestamp >= ?`,
    [weekAgo]
  );

  return result?.count || 0;
}

export async function getDailyCompletionCounts(days: number = 7): Promise<{ date: string; count: number }[]> {
  const db = await getDatabase();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  return db.getAllAsync<{ date: string; count: number }>(
    `SELECT DATE(timestamp) as date, COUNT(*) as count 
     FROM task_logs 
     WHERE event_type = 'completed' AND timestamp >= ?
     GROUP BY DATE(timestamp)
     ORDER BY date ASC`,
    [startDate]
  );
}
