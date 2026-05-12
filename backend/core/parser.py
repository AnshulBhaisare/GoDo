from groq import Groq
import json
from datetime import datetime
from config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)

def parse_task(user_message: str) -> dict | None:
    today = datetime.now().strftime("%Y-%m-%d")
    current_time = datetime.now().strftime("%H:%M")

    prompt = f"""
You are a task parsing assistant. Extract task details from the user's message.

Today's date: {today}
Current time: {current_time}

User message: "{user_message}"

Extract and return ONLY a JSON object with these fields:
- task_name: short clear task name (string)
- deadline: in format "YYYY-MM-DD HH:MM:SS" (string)
- priority: one of "P1", "P2", "P3" (string)

Rules:
- If no priority mentioned, default to "P2"
- If no time mentioned, default to "23:59:00" of the mentioned day
- If "today" mentioned, use {today}
- If "tomorrow" mentioned, use next date
- If "EOD" or "end of day", use {today} 18:00:00
- If it doesn't look like a task at all, return: {{"error": "not a task"}}

Return ONLY the JSON. No explanation, no markdown, no extra text.
"""

    raw = "No response yet"
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )
        raw = response.choices[0].message.content.strip()
        print(f"Groq raw response: {raw}")

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        data = json.loads(raw)
        return data

    except Exception as e:
        print(f"Parser error: {e}")
        print(f"Raw response was: {raw}")
        return None