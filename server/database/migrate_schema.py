import os
import sys

# Add server directory to path
server_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
root_dir = os.path.abspath(os.path.join(server_dir, ".."))
for p in (root_dir, server_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

from sqlalchemy import text
try:
    from app import create_app
    from app.config import Config
    from app.models import db
    from database.seed_data import seed_database
except (ImportError, ModuleNotFoundError):
    from gridshare.backend.app import create_app  # type: ignore
    from gridshare.backend.app.config import Config  # type: ignore
    from gridshare.backend.app.models import db  # type: ignore
    from gridshare.database.seed_data import seed_database  # type: ignore

def migrate_and_seed():
    app = create_app(Config)
    with app.app_context():
        print(f"Connecting to database: {app.config['SQLALCHEMY_DATABASE_URI']}")
        
        # 1. Create missing tables if needed
        db.create_all()

        # 2. Add owner_user_id to households if not exists (Postgres / SQLite compatible)
        with db.engine.connect() as conn:
            try:
                conn.execute(text("ALTER TABLE households ADD COLUMN IF NOT EXISTS owner_user_id VARCHAR(100);"))
                conn.commit()
                print("[SUCCESS] Verified owner_user_id column on households.")
            except Exception as e:
                print(f"Column check notice: {e}")

            try:
                conn.execute(text("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS default_household_id VARCHAR(50);"))
                conn.commit()
                print("[SUCCESS] Verified default_household_id column on user_profiles.")
            except Exception as e:
                print(f"Column check notice: {e}")

        # 3. Seed the 4-user database
        print("Seeding authentic 4-user community microgrid into remote PostgreSQL...")
        seed_database(clear_existing=True)
        print("[SUCCESS] All 4 users (Anjali, Prince, Ayush, Rahul) and energy telemetry successfully seeded into PostgreSQL!")

if __name__ == "__main__":
    migrate_and_seed()
