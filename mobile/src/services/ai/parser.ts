import { AIResponse, TaskActionResult, CreateTaskInput } from '../../types';

export function parseAIResponse(rawResponse: string): AIResponse {
  try {
    // Try to extract JSON from the response
    let jsonStr = rawResponse.trim();
    
    // Handle markdown code blocks
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    const message = parsed.message || "I've processed your request.";
    const action = parsed.action || 'none';

    let taskAction: TaskActionResult | null = null;

function normalizeDeadline(deadline: string | null): string | null {
  if (!deadline) return null;
  try {
    if (!deadline.endsWith('Z') && !deadline.includes('+') && deadline.includes('T')) {
      const [datePart, timePart] = deadline.split('T');
      if (datePart && timePart) {
        const [y, m, d] = datePart.split('-').map(Number);
        const [h, min, s] = timePart.split(':').map(Number);
        const dt = new Date(y, m - 1, d, h, min || 0, s || 0);
        if (!isNaN(dt.getTime())) return dt.toISOString();
      }
    }
    const dt = new Date(deadline);
    if (!isNaN(dt.getTime())) return dt.toISOString();
    return deadline;
  } catch {
    return deadline;
  }
}

    if (action !== 'none') {
      taskAction = {
        action,
        response: message,
        taskTitle: parsed.taskTitle || undefined,
      };

      if (action === 'create' && parsed.task) {
        taskAction.task = {
          title: parsed.task.title || 'Untitled Task',
          description: parsed.task.description || '',
          priority: parsed.task.priority || 'medium',
          deadline: normalizeDeadline(parsed.task.deadline),
          recurring_type: parsed.task.recurring_type || 'none',
        };
      }

      if (action === 'update' && parsed.task) {
        taskAction.task = {
          title: parsed.task.title,
          description: parsed.task.description,
          priority: parsed.task.priority,
          deadline: normalizeDeadline(parsed.task.deadline),
          recurring_type: parsed.task.recurring_type,
        };
      }
    }

    return { message, taskAction };
  } catch (error) {
    // If JSON parsing fails, treat the whole response as a message
    return {
      message: rawResponse || "Sorry, I had trouble understanding that. Could you rephrase?",
      taskAction: null,
    };
  }
}
