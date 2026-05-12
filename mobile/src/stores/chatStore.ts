import { create } from 'zustand';
import { ChatMessage, AIProvider, TaskActionResult } from '../types';
import * as chatDb from '../db/chatQueries';
import * as taskDb from '../db/taskQueries';
import { callGroqAPI } from '../services/ai/groq';
import { callOpenRouterAPI, validateOpenRouterKey } from '../services/ai/openrouter';
import { parseAIResponse } from '../services/ai/parser';
import { buildContextMessage } from '../services/ai/prompts';
import { useTaskStore } from './taskStore';
import { useSettingsStore } from './settingsStore';
import * as SecureStore from 'expo-secure-store';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isAIResponding: boolean;

  loadMessages: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  isAIResponding: false,

  loadMessages: async () => {
    set({ isLoading: true });
    try {
      const messages = await chatDb.getChatHistory(200);
      set({ messages });
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Add user message
    const userMsg = await chatDb.addChatMessage('user', trimmed);
    set((state) => ({ messages: [...state.messages, userMsg] }));

    set({ isAIResponding: true });

    try {
      // Get API key from secure store
      const settings = useSettingsStore.getState();
      const provider = settings.aiProvider;
      const apiKey = await SecureStore.getItemAsync(`godo_api_key_${provider}`);

      if (!apiKey) {
        const errorMsg = await chatDb.addChatMessage(
          'assistant',
          "I need an API key to help you. Please go to Settings and add your AI provider key. 🔑"
        );
        set((state) => ({ messages: [...state.messages, errorMsg] }));
        return;
      }

      // Build task context (filtered, not entire DB)
      const taskContext = await buildTaskContext(trimmed);

      // Get recent messages for conversation context
      const recentMessages = get().messages.slice(-6);

      // Call AI provider
      let rawResponse: string;
      if (provider === 'groq') {
        rawResponse = await callGroqAPI(apiKey, trimmed, taskContext, recentMessages);
      } else {
        rawResponse = await callOpenRouterAPI(apiKey, trimmed, taskContext, recentMessages);
      }

      // Parse the AI response
      const aiResponse = parseAIResponse(rawResponse);

      // Execute task action if any
      let taskActionResult: TaskActionResult | null = null;
      if (aiResponse.taskAction) {
        taskActionResult = await executeTaskAction(aiResponse.taskAction);
      }

      // Save AI response to chat
      const aiMsg = await chatDb.addChatMessage('assistant', aiResponse.message, taskActionResult);
      set((state) => ({ messages: [...state.messages, aiMsg] }));

    } catch (error: any) {
      console.error('AI Error:', error);
      const errorMessage = `Connection Error: ${error.message || 'Unknown error'}`;

      const errorMsg = await chatDb.addChatMessage('assistant', errorMessage);
      set((state) => ({ messages: [...state.messages, errorMsg] }));
    } finally {
      set({ isAIResponding: false });
    }
  },

  clearChat: async () => {
    await chatDb.clearChatHistory();
    set({ messages: [] });
  },
}));

async function buildTaskContext(userMessage: string): Promise<string> {
  const lower = userMessage.toLowerCase();

  // Determine what context to send based on user's message
  const pendingTasks = await taskDb.getPendingTasks();
  const completedTasks = await taskDb.getCompletedTasks();
  const overdueTasks = await taskDb.getOverdueTasks();
  const todayTasks = await taskDb.getTodayTasks();

  // Build relevant task list based on message content
  let relevantTasks: string[] = [];

  if (lower.includes('pending') || lower.includes('what') || lower.includes('list') || lower.includes('show')) {
    relevantTasks = pendingTasks.slice(0, 10).map(t => {
      const deadline = t.deadline ? ` (due: ${new Date(t.deadline).toLocaleString()})` : '';
      return `[${t.priority}] ${t.title}${deadline}`;
    });
  } else if (lower.includes('complet') || lower.includes('done') || lower.includes('finished')) {
    relevantTasks = completedTasks.slice(0, 10).map(t => `✓ ${t.title}`);
  } else if (lower.includes('overdue') || lower.includes('late') || lower.includes('missed')) {
    relevantTasks = overdueTasks.map(t => `⚠ ${t.title} (due: ${new Date(t.deadline!).toLocaleString()})`);
  } else if (lower.includes('today')) {
    relevantTasks = todayTasks.map(t => `${t.title} (${t.deadline ? new Date(t.deadline).toLocaleTimeString() : 'no time'})`);
  } else {
    // For task actions (complete, delete, etc.) include pending tasks for matching
    relevantTasks = pendingTasks.slice(0, 8).map(t => {
      const deadline = t.deadline ? ` (due: ${new Date(t.deadline).toLocaleString()})` : '';
      return `[${t.status}][${t.priority}] ${t.title}${deadline}`;
    });
  }

  return buildContextMessage({
    pending: pendingTasks.length,
    completed: completedTasks.length,
    overdue: overdueTasks.length,
    todayTasks: todayTasks.map(t => t.title),
    relevantTasks,
  });
}

async function executeTaskAction(action: TaskActionResult): Promise<TaskActionResult> {
  const taskStore = useTaskStore.getState();
  const settingsStore = useSettingsStore.getState();

  try {
    switch (action.action) {
      case 'create':
        if (action.task) {
          const created = await taskStore.createTask(action.task, settingsStore.reminderOffsetMinutes);
          action.taskId = created.id;
        }
        break;

      case 'complete':
        if (action.taskTitle) {
          const task = await taskDb.findTaskByTitle(action.taskTitle);
          if (task) {
            await taskStore.completeTask(task.id);
            action.taskId = task.id;
          }
        }
        break;

      case 'delete':
        if (action.taskTitle) {
          const task = await taskDb.findTaskByTitle(action.taskTitle);
          if (task) {
            await taskStore.deleteTask(task.id);
            action.taskId = task.id;
          }
        }
        break;

      case 'update':
        if (action.taskTitle && action.task) {
          const task = await taskDb.findTaskByTitle(action.taskTitle);
          if (task) {
            await taskStore.updateTask(task.id, action.task, settingsStore.reminderOffsetMinutes);
            action.taskId = task.id;
          }
        }
        break;

      case 'query':
        // No action needed, the AI response already contains the answer
        break;
    }
  } catch (error) {
    console.error('Task action execution error:', error);
  }

  return action;
}
