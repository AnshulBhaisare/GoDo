from db.database import get_todays_tasks, get_connection
from datetime import datetime, timedelta

def generate_daily_report(chat_id: int) -> str:
    tasks = get_todays_tasks(chat_id)

    if not tasks:
        return "📭 No tasks were scheduled for today."

    total = len(tasks)
    done = sum(1 for t in tasks if t["status"] == "done")
    pending = total - done
    percent = int((done / total) * 100)

    p1 = [t for t in tasks if t["priority"] == "P1"]
    p2 = [t for t in tasks if t["priority"] == "P2"]
    p3 = [t for t in tasks if t["priority"] == "P3"]

    def priority_summary(task_list, label):
        if not task_list:
            return ""
        done_count = sum(1 for t in task_list if t["status"] == "done")
        return f"{label}: {done_count}/{len(task_list)} done\n"

    bar = generate_progress_bar(percent)

    report = (
        f"📊 *Daily Report — {datetime.now().strftime('%d %b %Y')}*\n\n"
        f"{bar} {percent}%\n\n"
        f"✅ Done: {done}  ⏳ Pending: {pending}  📋 Total: {total}\n\n"
        f"{priority_summary(p1, '🔴 P1')}"
        f"{priority_summary(p2, '🟡 P2')}"
        f"{priority_summary(p3, '🟢 P3')}"
    )

    if pending > 0:
        report += "\n⏳ *Pending tasks:*\n"
        for t in tasks:
            if t["status"] == "pending":
                emoji = {"P1": "🔴", "P2": "🟡", "P3": "🟢"}.get(t["priority"], "⚪")
                report += f"{emoji} {t['task_name']} — {t['deadline']}\n"

    if done > 0:
        report += "\n✅ *Completed:*\n"
        for t in tasks:
            if t["status"] == "done":
                emoji = {"P1": "🔴", "P2": "🟡", "P3": "🟢"}.get(t["priority"], "⚪")
                report += f"{emoji} {t['task_name']}\n"

    return report

def generate_progress_bar(percent: int) -> str:
    filled = int(percent / 10)
    empty = 10 - filled
    return "█" * filled + "░" * empty

def get_weekly_data(chat_id: int) -> list:
    conn = get_connection()
    cursor = conn.cursor()
    results = []

    for i in range(6, -1, -1):
        day = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done
            FROM tasks
            WHERE chat_id = ? AND date(deadline) = ?
        """, (chat_id, day))
        row = cursor.fetchone()
        total = row["total"] or 0
        done = row["done"] or 0
        percent = int((done / total) * 100) if total > 0 else 0
        results.append({
            "date": day,
            "day": (datetime.now() - timedelta(days=i)).strftime("%a"),
            "total": total,
            "done": done,
            "percent": percent
        })

    conn.close()
    return results