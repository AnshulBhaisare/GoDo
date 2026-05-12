import { create } from 'zustand';
import { AIProvider, AppSettings } from '../types';
import * as SecureStore from 'expo-secure-store';
import { getDatabase } from '../db/database';

interface SettingsState extends AppSettings {
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  setReminderOffset: (minutes: number) => Promise<void>;
  setAIProvider: (provider: AIProvider) => Promise<void>;
  setUserName: (name: string) => Promise<void>;
  saveAPIKey: (provider: AIProvider, key: string) => Promise<void>;
  getAPIKey: (provider: AIProvider) => Promise<string | null>;
  clearAPIKey: (provider: AIProvider) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'light',
  reminderOffsetMinutes: 15,
  aiProvider: 'groq',
  userName: 'User',
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const db = await getDatabase();
      
      const themeRow = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'theme'"
      );
      const offsetRow = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'reminderOffsetMinutes'"
      );
      const providerRow = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'aiProvider'"
      );
      const nameRow = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'userName'"
      );

      set({
        theme: (themeRow?.value as any) || 'light',
        reminderOffsetMinutes: offsetRow ? parseInt(offsetRow.value, 10) : 15,
        aiProvider: (providerRow?.value as AIProvider) || 'groq',
        userName: nameRow?.value || 'User',
      });
    } finally {
      set({ isLoading: false });
    }
  },

  setTheme: async (theme) => {
    const db = await getDatabase();
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('theme', ?)",
      [theme]
    );
    set({ theme });
  },

  setReminderOffset: async (minutes) => {
    const db = await getDatabase();
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('reminderOffsetMinutes', ?)",
      [minutes.toString()]
    );
    set({ reminderOffsetMinutes: minutes });
  },

  setAIProvider: async (provider) => {
    const db = await getDatabase();
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('aiProvider', ?)",
      [provider]
    );
    set({ aiProvider: provider });
  },

  setUserName: async (name) => {
    const db = await getDatabase();
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('userName', ?)",
      [name]
    );
    set({ userName: name });
  },

  saveAPIKey: async (provider, key) => {
    await SecureStore.setItemAsync(`godo_api_key_${provider}`, key);
  },

  getAPIKey: async (provider) => {
    return SecureStore.getItemAsync(`godo_api_key_${provider}`);
  },

  clearAPIKey: async (provider) => {
    await SecureStore.deleteItemAsync(`godo_api_key_${provider}`);
  },
}));
