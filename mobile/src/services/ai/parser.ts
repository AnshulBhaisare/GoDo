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
          deadline: parsed.task.deadline || null,
          recurring_type: parsed.task.recurring_type || 'none',
        };
      }

      if (action === 'update' && parsed.task) {
        taskAction.task = {
          title: parsed.task.title,
          description: parsed.task.description,
          priority: parsed.task.priority,
          deadline: parsed.task.deadline,
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
