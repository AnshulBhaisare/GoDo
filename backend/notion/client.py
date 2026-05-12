from notion_client import Client
from config import NOTION_TOKEN, NOTION_DATABASE_ID
from datetime import datetime

notion = Client(auth=NOTION_TOKEN)

def add_task_to_notion(task_id: int, chat_id: int, task_name: str, deadline: str, priority: str) -> str | None:
    try:
        # Convert deadline from "YYYY-MM-DD HH:MM:SS" to "YYYY-MM-DDTHH:MM:SS"
        deadline_iso = deadline.replace(" ", "T")

        response = notion.pages.create(
            parent={"database_id": NOTION_DATABASE_ID},
            properties={
                "Name": {
                    "title": [{"text": {"content": task_name}}]
                },
                "Status": {
                    "select": {"name": "Pending"}
                },
                "Priority": {
                    "select": {"name": priority}
                },
                "Deadline": {
                    "date": {"start": deadline_iso}
                },
                "Chat ID": {
                    "number": chat_id
                },
                "Task ID": {
                    "number": task_id
                }
            }
        )
        return response["id"]

    except Exception as e:
        print(f"Notion add error: {e}")
        return None

def mark_task_done_in_notion(notion_page_id: str) -> bool:
    try:
        notion.pages.update(
            page_id=notion_page_id,
            properties={
                "Status": {
                    "select": {"name": "Done"}
                }
            }
        )
        return True
    except Exception as e:
        print(f"Notion update error: {e}")
        return False

def delete_task_in_notion(notion_page_id: str) -> bool:
    try:
        notion.pages.update(
            page_id=notion_page_id,
            archived=True
        )
        return True
    except Exception as e:
        print(f"Notion delete error: {e}")
        return False


def create_weekly_report_in_notion(week_data: list, overall_percent: int) -> bool:
    try:
        today = datetime.now().strftime("%d %b %Y")
        week_start = week_data[0]["date"]
        week_end = week_data[-1]["date"]

        # Build the report content blocks
        children = [
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [{"type": "text", "text": {"content": f"📊 Weekly Summary — {week_start} to {week_end}"}}]
                }
            },
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": f"Overall completion: {overall_percent}%"}}]
                }
            },
            {
                "object": "block",
                "type": "divider",
                "divider": {}
            }
        ]

        # Add each day
        for day in week_data:
            bar = "█" * int(day["percent"] / 10) + "░" * (10 - int(day["percent"] / 10))
            if day["percent"] >= 80:
                indicator = "🟢 Productive"
            elif day["percent"] >= 50:
                indicator = "🟡 Moderate"
            elif day["total"] == 0:
                indicator = "⚪ No tasks"
            else:
                indicator = "🔴 Low"

            children.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content":
                        f"{day['day']} {day['date']} — {bar} {day['percent']}% ({day['done']}/{day['total']}) {indicator}"
                    }}]
                }
            })

        # Create the page in Notion
        notion.pages.create(
            parent={"database_id": NOTION_DATABASE_ID},
            properties={
                "Name": {
                    "title": [{"text": {"content": f"Weekly Report — {today}"}}]
                },
                "Status": {
                    "select": {"name": "Done"}
                },
                "Priority": {
                    "select": {"name": "P1"}
                },
            },
            children=children
        )
        return True

    except Exception as e:
        print(f"Notion weekly report error: {e}")
        return False