from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler, MessageHandler, filters
from config import TELEGRAM_TOKEN
from db.database import init_db
from bot.handlers import (
    start, help_command, tasks_command,
    today_command, report_command,
    weekly_report_command,
    button_callback, unknown_message
)
from core.scheduler import init_scheduler

async def post_init(application):
    init_scheduler(application)

def main():
    print("🚀 GoDo Bot starting...")
    init_db()

    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("tasks", tasks_command))
    app.add_handler(CommandHandler("today", today_command))
    app.add_handler(CommandHandler("weekly", weekly_report_command))
    app.add_handler(CommandHandler("report", report_command))
    app.add_handler(CallbackQueryHandler(button_callback))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, unknown_message))

    app.post_init = post_init

    print("✅ Bot is running! Open Telegram and message your bot.")
    app.run_polling()

if __name__ == "__main__":
    main()