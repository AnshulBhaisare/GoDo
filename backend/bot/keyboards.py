from telegram import InlineKeyboardButton, InlineKeyboardMarkup

def task_actions_keyboard(task_id):
    keyboard = [
        [
            InlineKeyboardButton("✅ Done", callback_data=f"done_{task_id}"),
            InlineKeyboardButton("🗑 Delete", callback_data=f"delete_{task_id}")
        ]
    ]
    return InlineKeyboardMarkup(keyboard)