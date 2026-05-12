import { create } from 'zustand';
import { ActivityLog } from '../types';
import * as activityDb from '../db/activityQueries';

interface ActivityState {
  logs: ActivityLog[];
  isLoading: boolean;
  weeklyCompletions: number;
  dailyCounts: { date: string; count: number }[];

  loadLogs: () => Promise<void>;
  loadStats: () => Promise<void>;
}

export const useActivityStore = create<ActivityState>((set) => ({
  logs: [],
  isLoading: false,
  weeklyCompletions: 0,
  dailyCounts: [],

  loadLogs: async () => {
    set({ isLoading: true });
    try {
      const logs = await activityDb.getActivityLogs(100);
      set({ logs });
    } finally {
      set({ isLoading: false });
    }
  },

  loadStats: async () => {
    const [weeklyCompletions, dailyCounts] = await Promise.all([
      activityDb.getWeeklyCompletionCount(),
      activityDb.getDailyCompletionCounts(7),
    ]);
    set({ weeklyCompletions, dailyCounts });
  },
}));
