import { getDatabase } from './database';
import { ChatMessage, TaskActionResult } from '../types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export async function addChatMessage(
  role: 'user' | 'assistant',
  message: string,
  taskData?: TaskActionResult | null
): Promise<ChatMessage> {
  const db = await getDatabase();
  const id = generateId();
  const timestamp = new Date().toISOString();

  const chatMessage: ChatMessage = {
    id,
    role,
    message,
    timestamp,
    taskData: taskData || null,
  };

  await db.runAsync(
    `INSERT INTO chat_history (id, role, message, timestamp, task_data) VALUES (?, ?, ?, ?, ?)`,
    [id, role, message, timestamp, taskData ? JSON.stringify(taskData) : null]
  );

  return chatMessage;
}

export async function getChatHistory(limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM chat_history ORDER BY timestamp ASC LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  return rows.map((row) => ({
    ...row,
    taskData: row.task_data ? JSON.parse(row.task_data) : null,
  }));
}

export async function getRecentChatMessages(count: number = 10): Promise<ChatMessage[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM (
      SELECT * FROM chat_history ORDER BY timestamp DESC LIMIT ?
    ) sub ORDER BY timestamp ASC`,
    [count]
  );

  return rows.map((row) => ({
    ...row,
    taskData: row.task_data ? JSON.parse(row.task_data) : null,
  }));
}

export async function getChatMessageCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM chat_history'
  );
  return result?.count || 0;
}

export async function clearChatHistory(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM chat_history');
}
