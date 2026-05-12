from telegram import Update
from telegram.ext import ContextTypes
from db.database import (
    add_task, get_pending_tasks, mark_task_done,
    delete_task, get_todays_tasks
)
from bot.keyboards import task_actions_keyboard

PRIORITY_EMOJI = {"P1": "🔴", "P2": "🟡", "P3": "🟢"}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "👋 Hey! I'm GoDo — your personal task assistant.\n\n"
        "Just tell me a task like:\n"
        "📝 *Submit report by 6pm P1*\n"
        "📝 *Call dentist tomorrow 3pm P2*\n\n"
        "Commands:\n"
        "/tasks — view pending tasks\n"
        "/today — today's tasks\n"
        "/report — today's completion report\n"
        "/help — show this message",
        parse_mode="Markdown"
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await start(update, context)

async def tasks_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    tasks = get_pending_tasks(chat_id)

    if not tasks:
        await update.message.reply_text("🎉 No pending tasks! You're all clear.")
        return

    await update.message.reply_text("📋 *Your pending tasks:*", parse_mode="Markdown")
    for task in tasks:
        emoji = PRIORITY_EMOJI.get(task["priority"], "⚪")
        text = (
            f"{emoji} *{task['priority']}* — {task['task_name']}\n"
            f"⏰ Due: {task['deadline']}\n"
            f"🆔 ID: {task['id']}"
        )
        await update.message.reply_text(
            text,
            parse_mode="Markdown",
            reply_markup=task_actions_keyboard(task["id"])
        )

async def today_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    tasks = get_todays_tasks(chat_id)

    if not tasks:
        await update.message.reply_text("📭 No tasks due today.")
        return

    await update.message.reply_text("📅 *Today's tasks:*", parse_mode="Markdown")
    for task in tasks:
        emoji = PRIORITY_EMOJI.get(task["priority"], "⚪")
        status = "✅" if task["status"] == "done" else "⏳"
        text = (
            f"{status} {emoji} *{task['priority']}* — {task['task_name']}\n"
            f"⏰ Due: {task['deadline']}"
        )
        await update.message.reply_text(
            text,
            parse_mode="Markdown",
            reply_markup=task_actions_keyboard(task["id"]) if task["status"] == "pending" else None
        )

async def report_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    from core.reporter import generate_daily_report
    report = generate_daily_report(chat_id)
    await update.message.reply_text(report, parse_mode="Markdown")

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    chat_id = query.message.chat_id
    data = query.data

    if data.startswith("done_"):
        task_id = int(data.split("_")[1])
        from db.database import mark_task_done, get_pending_tasks
        success = mark_task_done(task_id, chat_id)
        if success:
            await query.edit_message_reply_markup(reply_markup=None)
            await query.message.reply_text(f"✅ Task #{task_id} marked as done!")

            # Sync to Notion
            from db.database import get_connection
            from notion.client import mark_task_done_in_notion
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT notion_page_id FROM tasks WHERE id = ?", (task_id,))
            row = cursor.fetchone()
            conn.close()
            if row and row["notion_page_id"]:
                mark_task_done_in_notion(row["notion_page_id"])
        else:
            await query.message.reply_text("❌ Task not found.")

    elif data.startswith("delete_"):
        task_id = int(data.split("_")[1])
        from db.database import delete_task
        from notion.client import delete_task_in_notion

        # Get notion page id before deleting
        from db.database import get_connection
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT notion_page_id FROM tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        conn.close()

        success = delete_task(task_id, chat_id)
        if success:
            await query.edit_message_reply_markup(reply_markup=None)
            await query.message.reply_text(f"🗑 Task #{task_id} deleted.")
            if row and row["notion_page_id"]:
                delete_task_in_notion(row["notion_page_id"])
        else:
            await query.message.reply_text("❌ Task not found.")

async def unknown_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    user_message = update.message.text

    await update.message.reply_text("🤔 Parsing your task...")

    from core.parser import parse_task
    result = parse_task(user_message)

    if result is None:
        await update.message.reply_text("❌ Something went wrong while parsing. Try again!")
        return

    if "error" in result:
        await update.message.reply_text(
            "🤖 That doesn't look like a task to me.\n\n"
            "Try something like:\n"
            "📝 *Submit report by 6pm P1*\n"
            "📝 *Call dentist tomorrow 3pm P2*",
            parse_mode="Markdown"
        )
        return

    task_name = result.get("task_name")
    deadline = result.get("deadline")
    priority = result.get("priority", "P2")

    from db.database import add_task, update_notion_page_id
    from notion.client import add_task_to_notion

    task_id = add_task(chat_id, task_name, deadline, priority)

    # Sync to Notion
    notion_page_id = add_task_to_notion(task_id, chat_id, task_name, deadline, priority)
    if notion_page_id:
        update_notion_page_id(task_id, notion_page_id)
        print(f"✅ Task {task_id} synced to Notion")
    else:
        print(f"⚠️ Task {task_id} saved locally but Notion sync failed")

    emoji = PRIORITY_EMOJI.get(priority, "⚪")
    await update.message.reply_text(
        f"✅ Task added!\n\n"
        f"{emoji} *{priority}* — {task_name}\n"
        f"⏰ Due: {deadline}\n"
        f"🆔 ID: {task_id}",
        parse_mode="Markdown",
        reply_markup=task_actions_keyboard(task_id)
    )


async def weekly_report_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    from core.reporter import get_weekly_data
    from notion.client import create_weekly_report_in_notion

    await update.message.reply_text("📊 Generating your weekly report...")

    week_data = get_weekly_data(chat_id)

    total_tasks = sum(d["total"] for d in week_data)
    total_done = sum(d["done"] for d in week_data)
    overall_percent = int((total_done / total_tasks) * 100) if total_tasks > 0 else 0

    # Telegram summary
    report = f"📅 *Weekly Report*\n\n"
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

    await update.message.reply_text(report, parse_mode="Markdown")

    # Push to Notion
    success = create_weekly_report_in_notion(week_data, overall_percent)
    if success:
        await update.message.reply_text("✅ Weekly report saved to Notion!")
    else:
        await update.message.reply_text("⚠️ Couldn't save to Notion, but report is above.")