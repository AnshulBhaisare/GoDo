// ─── Task Types ───────────────────────────────────────────────
export type TaskStatus = 'pending' | 'completed' | 'deleted';
export type TaskPriority = 'low' | 'medium' | 'high';
export type RecurringType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  deadline: string | null; // ISO string
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  recurring_type: RecurringType;
  notification_id: string | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  deadline?: string | null;
  recurring_type?: RecurringType;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  deadline?: string | null;
  status?: TaskStatus;
  recurring_type?: RecurringType;
}

// ─── Chat Types ──────────────────────────────────────────────
export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  message: string;
  timestamp: string;
  taskData?: TaskActionResult | null; // Embedded task card data
}

// ─── Activity Types ──────────────────────────────────────────
export type ActivityEventType =
  | 'created'
  | 'updated'
  | 'completed'
  | 'reopened'
  | 'deleted'
  | 'restored';

export interface ActivityLog {
  id: string;
  task_id: string;
  task_title: string;
  event_type: ActivityEventType;
  timestamp: string;
}

// ─── AI Types ────────────────────────────────────────────────
export type AIProvider = 'groq' | 'openrouter';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

export interface TaskActionResult {
  action: 'create' | 'complete' | 'delete' | 'update' | 'query' | 'none';
  task?: CreateTaskInput;
  taskId?: string;
  taskTitle?: string;
  response: string;
}

export interface AIResponse {
  message: string;
  taskAction: TaskActionResult | null;
}

// ─── Settings Types ──────────────────────────────────────────
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  reminderOffsetMinutes: number;
  aiProvider: AIProvider;
}

// ─── Calendar Types ──────────────────────────────────────────
export interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  pendingCount: number;
  completedCount: number;
  hasRecurring: boolean;
}
