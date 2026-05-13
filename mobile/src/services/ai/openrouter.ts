import { getSystemPrompt, buildContextMessage } from './prompts';
import { ChatMessage } from '../../types';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callOpenRouterAPI(
  apiKey: string,
  userMessage: string,
  taskContext: string,
  userName: string,
  recentMessages: ChatMessage[] = [],
  model: string = 'meta-llama/llama-3.3-70b-instruct:free'
): Promise<string> {
  const dt = new Date();
  const now = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 19);

  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: getSystemPrompt(now, userName),
    },
  ];

  // Add recent conversation history for context (last 6 messages)
  const historySlice = recentMessages.slice(-6);
  for (const msg of historySlice) {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.message,
    });
  }

  // Add task context + current user message
  const contextualMessage = taskContext
    ? `${taskContext}\n\nUser message: ${userMessage}`
    : userMessage;

  messages.push({
    role: 'user',
    content: contextualMessage,
  });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://godo.app',
      'X-Title': 'godo Task Manager',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function validateOpenRouterKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://godo.app',
        'X-Title': 'godo Task Manager',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
