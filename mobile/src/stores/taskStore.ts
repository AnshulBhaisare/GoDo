import { create } from 'zustand';
import { Task, CreateTaskInput, UpdateTaskInput } from '../types';
import * as taskDb from '../db/taskQueries';
import { logActivity } from '../db/activityQueries';
import { scheduleTaskNotification, cancelTaskNotification } from '../services/notifications';
import { updateTaskNotificationId } from '../db/taskQueries';

interface TaskState {
  pendingTasks: Task[];
  completedTasks: Task[];
  deletedTasks: Task[];
  isLoading: boolean;

  loadTasks: () => Promise<void>;
  createTask: (input: CreateTaskInput, reminderOffset?: number) => Promise<Task>;
  completeTask: (id: string) => Promise<void>;
  reopenTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  restoreTask: (id: string) => Promise<void>;
  updateTask: (id: string, input: UpdateTaskInput, reminderOffset?: number) => Promise<void>;
  cleanupExpiredTasks: () => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  pendingTasks: [],
  completedTasks: [],
  deletedTasks: [],
  isLoading: false,

  loadTasks: async () => {
    set({ isLoading: true });
    try {
      const [pending, completed, deleted] = await Promise.all([
        taskDb.getPendingTasks(),
        taskDb.getCompletedTasks(),
        taskDb.getDeletedTasks(),
      ]);
      set({ pendingTasks: pending, completedTasks: completed, deletedTasks: deleted });
    } finally {
      set({ isLoading: false });
    }
  },

  createTask: async (input, reminderOffset = 15) => {
    const task = await taskDb.createTask(input);
    await logActivity(task.id, task.title, 'created');

    // Schedule notification if deadline exists
    if (task.deadline) {
      const notifId = await scheduleTaskNotification(task, reminderOffset);
      if (notifId) {
        await updateTaskNotificationId(task.id, notifId);
        task.notification_id = notifId;
      }
    }

    // Handle recurring task creation
    await get().loadTasks();
    return task;
  },

  completeTask: async (id) => {
    const task = await taskDb.completeTask(id);
    if (task) {
      await logActivity(task.id, task.title, 'completed');

      // Cancel notification
      if (task.notification_id) {
        await cancelTaskNotification(task.notification_id);
      }

      // If recurring, create next occurrence
      if (task.recurring_type !== 'none' && task.deadline) {
        const nextDeadline = calculateNextDeadline(task.deadline, task.recurring_type);
        await taskDb.createTask({
          title: task.title,
          description: task.description,
          priority: task.priority,
          deadline: nextDeadline,
          recurring_type: task.recurring_type,
        });
      }
    }
    await get().loadTasks();
  },

  reopenTask: async (id) => {
    const task = await taskDb.reopenTask(id);
    if (task) {
      await logActivity(task.id, task.title, 'reopened');
    }
    await get().loadTasks();
  },

  deleteTask: async (id) => {
    const existing = await taskDb.getTaskById(id);
    const task = await taskDb.softDeleteTask(id);
    if (task && existing) {
      await logActivity(task.id, existing.title, 'deleted');
      if (task.notification_id) {
        await cancelTaskNotification(task.notification_id);
      }
    }
    await get().loadTasks();
  },

  restoreTask: async (id) => {
    const task = await taskDb.restoreTask(id);
    if (task) {
      await logActivity(task.id, task.title, 'restored');
    }
    await get().loadTasks();
  },

  updateTask: async (id, input, reminderOffset = 15) => {
    const task = await taskDb.updateTask(id, input);
    if (task) {
      await logActivity(task.id, task.title, 'updated');

      // Reschedule notification if deadline changed
      if (input.deadline !== undefined) {
        if (task.notification_id) {
          await cancelTaskNotification(task.notification_id);
        }
        if (task.deadline) {
          const notifId = await scheduleTaskNotification(task, reminderOffset);
          if (notifId) {
            await updateTaskNotificationId(task.id, notifId);
          }
        }
      }
    }
    await get().loadTasks();
  },

  cleanupExpiredTasks: async () => {
    await taskDb.permanentlyDeleteExpiredTasks();
    await get().loadTasks();
  },
}));

function calculateNextDeadline(currentDeadline: string, recurringType: string): string {
  const date = new Date(currentDeadline);
  switch (recurringType) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
  }
  return date.toISOString();
}
