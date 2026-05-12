import { getSystemPrompt, buildContextMessage } from './prompts';
import { ChatMessage } from '../../types';

interface GroqRequestMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callGroqAPI(
  apiKey: string,
  userMessage: string,
  taskContext: string,
  userName: string,
  recentMessages: ChatMessage[] = []
): Promise<string> {
  const dt = new Date();
  const now = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
  
  const messages: GroqRequestMessage[] = [
    {
      role: 'system',
      content: getSystemPrompt(now, userName),
    },
  ];

  const historySlice = recentMessages.slice(-6);
  for (const msg of historySlice) {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.message,
    });
  }

  const contextualMessage = taskContext
    ? `${taskContext}\n\nUser message: ${userMessage}`
    : userMessage;

  messages.push({
    role: 'user',
    content: contextualMessage,
  });

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
