import os
from dotenv import load_dotenv

# Load from project root .env, server/.env, and current working directory
root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
server_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
if os.path.exists(root_env):
    load_dotenv(root_env)
if os.path.exists(server_env):
    load_dotenv(server_env)
load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "gridshare-secret-key-development")
    _db_uri = os.getenv("DATABASE_URL") or os.getenv("DB_CONNECT") or "sqlite:///gridshare.db"
    if _db_uri.startswith("postgres://"):
        _db_uri = _db_uri.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URI = _db_uri
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # MQTT
    MQTT_BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost")
    MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", 1883))
    MQTT_TOPIC_TELEMETRY = os.getenv("MQTT_TOPIC_TELEMETRY", "gridshare/telemetry")
    MQTT_ENABLED = os.getenv("MQTT_ENABLED", "false").lower() in ("true", "1", "yes")

    # Simulation & Grid Defaults
    BASE_GRID_PRICE = float(os.getenv("SIMULATOR_BASE_GRID_PRICE", 6.10))
    P2P_DISCOUNT_FACTOR = 0.75 # P2P tariff ≈ ₹4.50 when grid is ₹6.10
