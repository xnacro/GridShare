import os
import sys

try:
    import _bootstrap
except ImportError:
    from server import _bootstrap

from gridshare.backend.app import create_app
from gridshare.backend.app.config import Config
from gridshare.backend.app.models import db
from gridshare.database.seed_data import seed_database

if __name__ == "__main__":
    app = create_app(Config)
    with app.app_context():
        db.create_all()
        seed_database(clear_existing=True)
        print("✓ GridShare 4-User Demo Database successfully seeded!")
