import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  writeAsStringAsync,
  readAsStringAsync,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from '../db/database';

const BACKUP_DIR = (documentDirectory || '') + 'backups/';

export async function exportBackup(): Promise<boolean> {
  try {
    const db = await getDatabase();

    // Ensure backup directory exists
    const dirInfo = await getInfoAsync(BACKUP_DIR);
    if (!dirInfo.exists) {
      await makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
    }

    // Export all data as JSON
    const tasks = await db.getAllAsync('SELECT * FROM tasks');
    const chatHistory = await db.getAllAsync('SELECT * FROM chat_history');
    const taskLogs = await db.getAllAsync('SELECT * FROM task_logs');
    const settings = await db.getAllAsync('SELECT * FROM settings');

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        tasks,
        chatHistory,
        taskLogs,
        settings,
      },
    };

    const filename = `godo_backup_${Date.now()}.json`;
    const filePath = BACKUP_DIR + filename;

    await writeAsStringAsync(filePath, JSON.stringify(backup, null, 2));

    // Share the file
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Export GoDo Backup',
      });
    }

    return true;
  } catch (error) {
    console.error('Export backup failed:', error);
    return false;
  }
}

export async function importBackup(): Promise<boolean> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) return false;

    const fileContent = await readAsStringAsync(result.assets[0].uri);
    const backup = JSON.parse(fileContent);

    if (!backup.version || !backup.data) {
      throw new Error('Invalid backup file format');
    }

    const db = await getDatabase();

    // Clear existing data
    await db.execAsync('DELETE FROM tasks');
    await db.execAsync('DELETE FROM chat_history');
    await db.execAsync('DELETE FROM task_logs');
    await db.execAsync('DELETE FROM settings');

    // Restore tasks
    if (backup.data.tasks?.length) {
      for (const task of backup.data.tasks) {
        await db.runAsync(
          `INSERT INTO tasks (id, title, description, priority, deadline, status, created_at, updated_at, deleted_at, recurring_type, notification_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [task.id, task.title, task.description, task.priority, task.deadline, task.status, task.created_at, task.updated_at, task.deleted_at, task.recurring_type, task.notification_id]
        );
      }
    }

    // Restore chat history
    if (backup.data.chatHistory?.length) {
      for (const msg of backup.data.chatHistory) {
        await db.runAsync(
          `INSERT INTO chat_history (id, role, message, timestamp, task_data) VALUES (?, ?, ?, ?, ?)`,
          [msg.id, msg.role, msg.message, msg.timestamp, msg.task_data]
        );
      }
    }

    // Restore task logs
    if (backup.data.taskLogs?.length) {
      for (const log of backup.data.taskLogs) {
        await db.runAsync(
          `INSERT INTO task_logs (id, task_id, task_title, event_type, timestamp) VALUES (?, ?, ?, ?, ?)`,
          [log.id, log.task_id, log.task_title, log.event_type, log.timestamp]
        );
      }
    }

    // Restore settings
    if (backup.data.settings?.length) {
      for (const setting of backup.data.settings) {
        await db.runAsync(
          `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
          [setting.key, setting.value]
        );
      }
    }

    return true;
  } catch (error) {
    console.error('Import backup failed:', error);
    return false;
  }
}
