"""
One-off migration: adds the accounts/assessments schema to an existing
database. Safe to re-run (idempotent) — creates missing tables via
db.create_all(), and only adds the lectures.user_id column if it isn't
already there.

Usage: python migrate_add_accounts.py
"""
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import text
from app import app, db


def column_exists(table: str, column: str) -> bool:
    result = db.session.execute(text("""
        SELECT 1 FROM information_schema.columns
        WHERE table_name = :table AND column_name = :column
    """), {"table": table, "column": column})
    return result.first() is not None


with app.app_context():
    db.create_all()
    print("Ensured all tables exist (users, assessments, questions, "
          "choices, attempts, attempt_answers, + existing tables)")

    if not column_exists("lectures", "user_id"):
        db.session.execute(text("""
            ALTER TABLE lectures
            ADD COLUMN user_id INTEGER
            REFERENCES users(id) ON DELETE CASCADE
        """))
        db.session.commit()
        print("Added lectures.user_id column")
    else:
        print("lectures.user_id already exists, skipping")

    print("Migration complete.")
