from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta
from db.database import get_tasks_for_reminder, mark_notified

scheduler = AsyncIOScheduler()
bot_app = None

def init_scheduler(app):
    global bot_app
    bot_app = app
    scheduler.add_job(check_reminders, "interval", minutes=1, id="reminder_check")
    scheduler.add_job(send_daily_reports, "cron", hour=22, minute=0, id="daily_report")
    scheduler.add_job(send_weekly_report, "cron", day_of_week="sun", hour=22, minute=30, id="weekly_report")
    scheduler.start()
    print("✅ Scheduler started")

async def check_reminders():
    now = datetime.now()
    window_end = now + timedelta(minutes=1)

    # --- 30 min warning ---
    warn_start = (now + timedelta(minutes=29)).strftime("%Y-%m-%d %H:%M:%S")
    warn_end = (now + timedelta(minutes=31)).strftime("%Y-%m-%d %H:%M:%S")

    tasks_30 = get_tasks_for_reminder(now, warn_start, warn_end, "notified_30min")
    for task in tasks_30:
        try:
            await bot_app.bot.send_message(
                chat_id=task["chat_id"],
                text=(
                    f"⚠️ *30 min reminder!*\n\n"
                    f"Task: *{task['task_name']}*\n"
                    f"Priority: {task['priority']}\n"
                    f"Due at: {task['deadline']}"
                ),
                parse_mode="Markdown"
            )
            mark_notified(task["id"], "notified_30min")
            print(f"30min reminder sent for task {task['id']}")
        except Exception as e:
            print(f"Error sending 30min reminder: {e}")

    # --- Deadline alert ---
    deadline_start = now.strftime("%Y-%m-%d %H:%M:%S")
    deadline_end = window_end.strftime("%Y-%m-%d %H:%M:%S")

    tasks_due = get_tasks_for_reminder(now, deadline_start, deadline_end, "notified_deadline")
    for task in tasks_due:
        try:
            await bot_app.bot.send_message(
                chat_id=task["chat_id"],
                text=(
                    f"🚨 *DEADLINE REACHED!*\n\n"
                    f"Task: *{task['task_name']}*\n"
                    f"Priority: {task['priority']}\n\n"
                    f"Mark it done or you'll keep getting nudged! 👇"
                ),
                parse_mode="Markdown",
            )
            mark_notified(task["id"], "notified_deadline")
            print(f"Deadline reminder sent for task {task['id']}")
        except Exception as e:
            print(f"Error sending deadline reminder: {e}")


async def send_daily_reports():
    from db.database import get_connection
    from core.reporter import generate_daily_report

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT chat_id FROM tasks WHERE date(deadline) = date('now')")
    rows = cursor.fetchall()
    conn.close()

    for row in rows:
        chat_id = row["chat_id"]
        report = generate_daily_report(chat_id)
        try:
            await bot_app.bot.send_message(
                chat_id=chat_id,
                text=f"🌙 *Your Evening Report*\n\n{report}",
                parse_mode="Markdown"
            )
            print(f"Daily report sent to {chat_id}")
        except Exception as e:
            print(f"Error sending daily report to {chat_id}: {e}")


async def send_weekly_report():
    from db.database import get_connection
    from core.reporter import get_weekly_data
    from notion.client import create_weekly_report_in_notion

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT chat_id FROM tasks")
    rows = cursor.fetchall()
    conn.close()

    for row in rows:
        chat_id = row["chat_id"]
        week_data = get_weekly_data(chat_id)
        total_tasks = sum(d["total"] for d in week_data)
        total_done = sum(d["done"] for d in week_data)
        overall_percent = int((total_done / total_tasks) * 100) if total_tasks > 0 else 0

        report = f"📅 *Your Weekly Report*\n\n"
        for day in week_data:
            bar = "█" * int(day["percent"] / 10) + "░" * (10 - int(day["percent"] / 10))
            if day["percent"] >= 80:
                indicator = "🟢"
            elif day["percent"] >= 50:
                indicator = "🟡"
            elif day["total"] == 0:
                indicator = "⚪"
            else:
                indicator = "🔴"
            report += f"{indicator} *{day['day']}* {bar} {day['percent']}% ({day['done']}/{day['total']})\n"

        report += f"\n🏆 *Overall: {overall_percent}% this week*"

        try:
            await bot_app.bot.send_message(chat_id=chat_id, text=report, parse_mode="Markdown")
            create_weekly_report_in_notion(week_data, overall_percent)
            print(f"Weekly report sent to {chat_id}")
        except Exception as e:
            print(f"Error sending weekly report to {chat_id}: {e}")