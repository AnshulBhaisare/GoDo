import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task } from '../types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }
  } catch (error) {
    console.warn('Push notifications are not fully supported in Expo Go. Skipping permission request.', error);
    // Continue execution to create the channel anyway!
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('task-reminders', {
      name: 'Task Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563eb',
      sound: 'default',
    });
  }

  return true;
}

export async function scheduleTaskNotification(
  task: Task,
  offsetMinutes: number = 15
): Promise<string | null> {
  if (!task.deadline) return null;

  const deadlineDate = new Date(task.deadline);
  const notifyDate = new Date(deadlineDate.getTime() - offsetMinutes * 60 * 1000);

  // Don't schedule if notification time is in the past
  if (notifyDate.getTime() <= Date.now()) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Task Reminder',
        body: task.title,
        data: { taskId: task.id },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notifyDate,
        channelId: Platform.OS === 'android' ? 'task-reminders' : undefined,
      },
    });

    return id;
  } catch (error) {
    console.warn('Failed to schedule notification:', error);
    return null;
  }
}

export async function cancelTaskNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn('Failed to cancel notification:', error);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}
