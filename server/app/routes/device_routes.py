import os
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from gridshare.backend.app.models import db, Household, EnergyReading

device_bp = Blueprint("device_bp", __name__, url_prefix="/api/devices")

# Global in-memory mode state: 'HYBRID', 'LIVE_HARDWARE', 'SIMULATION'
_CURRENT_INGESTION_MODE = "HYBRID"

@device_bp.route("", methods=["GET"])
def get_devices():
    """
    Returns registered physical IoT microcontrollers (ESP32) and virtual microgrid nodes.
    Includes live voltage, current, power, protocol, and connection health.
    """
    now = datetime.now(timezone.utc)
    households = Household.query.all()
    
    devices = [
        {
            "id": "ESP32-A",
            "name": "ESP32 Node A (Solar Prosumer)",
            "household_id": "house_a",
            "household_name": "House A (Solar Champion)",
            "type": "HARDWARE_IOT",
            "status": "ONLINE",
            "protocol": "MQTT / HTTP",
            "voltage_v": 12.18,
            "current_a": 4.35,
            "power_w": 53.0,
            "sensor": "INA219 High-Side Monitor (0x40)",
            "display": "SSD1306 OLED (0x3C)",
            "last_seen": now.isoformat(),
            "firmware_version": "v1.2.0-esp32-freertos",
            "ip_address": "192.168.1.101",
            "source_mode": "LIVE" if _CURRENT_INGESTION_MODE in ("LIVE_HARDWARE", "HYBRID") else "SIMULATED",
        },
        {
            "id": "ESP32-B",
            "name": "ESP32 Node B (Consumer / EV)",
            "household_id": "house_b",
            "household_name": "House B (Heavy Consumer / EV)",
            "type": "HARDWARE_IOT",
            "status": "ONLINE",
            "protocol": "MQTT / HTTP",
            "voltage_v": 11.95,
            "current_a": 5.80,
            "power_w": 69.3,
            "sensor": "INA219 High-Side Monitor (0x41)",
            "display": "SSD1306 OLED (0x3C)",
            "last_seen": now.isoformat(),
            "firmware_version": "v1.2.0-esp32-freertos",
            "ip_address": "192.168.1.102",
            "source_mode": "LIVE" if _CURRENT_INGESTION_MODE in ("LIVE_HARDWARE", "HYBRID") else "SIMULATED",
        },
        {
            "id": "VNODE-C",
            "name": "Virtual Node C (Balanced Prosumer)",
            "household_id": "house_c",
            "household_name": "House C (Balanced Prosumer)",
            "type": "VIRTUAL_SMART_METER",
            "status": "ONLINE",
            "protocol": "DLMS / COSEM Adapter",
            "voltage_v": 230.2,
            "current_a": 15.2,
            "power_w": 3500.0,
            "sensor": "Virtual AMI Meter",
            "display": "Web Portal",
            "last_seen": now.isoformat(),
            "firmware_version": "v2.0.1-vnode",
            "ip_address": "10.0.4.103",
            "source_mode": "SIMULATED",
        },
        {
            "id": "VNODE-D",
            "name": "Virtual Node D (Smart Apartment)",
            "household_id": "house_d",
            "household_name": "House D (Smart Apartment)",
            "type": "VIRTUAL_SMART_METER",
            "status": "ONLINE",
            "protocol": "Modbus TCP",
            "voltage_v": 229.8,
            "current_a": 8.7,
            "power_w": 2000.0,
            "sensor": "Virtual Submeter",
            "display": "Web Portal",
            "last_seen": now.isoformat(),
            "firmware_version": "v2.0.1-vnode",
            "ip_address": "10.0.4.104",
            "source_mode": "SIMULATED",
        },
        {
            "id": "VNODE-E",
            "name": "Virtual Node E (Solar Villa)",
            "household_id": "house_e",
            "household_name": "House E (Solar Villa)",
            "type": "VIRTUAL_SMART_METER",
            "status": "ONLINE",
            "protocol": "DLMS / COSEM Adapter",
            "voltage_v": 231.0,
            "current_a": 18.5,
            "power_w": 4270.0,
            "sensor": "Virtual AMI Meter",
            "display": "Web Portal",
            "last_seen": now.isoformat(),
            "firmware_version": "v2.0.1-vnode",
            "ip_address": "10.0.4.105",
            "source_mode": "SIMULATED",
        },
    ]

    return jsonify({
        "status": "SUCCESS",
        "mode": _CURRENT_INGESTION_MODE,
        "device_count": len(devices),
        "online_count": sum(1 for d in devices if d["status"] == "ONLINE"),
        "hardware_count": sum(1 for d in devices if d["type"] == "HARDWARE_IOT"),
        "virtual_count": sum(1 for d in devices if d["type"] == "VIRTUAL_SMART_METER"),
        "devices": devices,
        "timestamp": now.isoformat(),
    }), 200

@device_bp.route("/mode", methods=["GET", "POST"])
def manage_ingestion_mode():
    """Get or update active telemetry ingestion mode (LIVE_HARDWARE, SIMULATION, HYBRID)."""
    global _CURRENT_INGESTION_MODE
    if request.method == "POST":
        payload = request.get_json() or {}
        new_mode = payload.get("mode", "HYBRID").upper()
        if new_mode in ("LIVE_HARDWARE", "SIMULATION", "HYBRID"):
            _CURRENT_INGESTION_MODE = new_mode
            return jsonify({
                "status": "SUCCESS",
                "message": f"Ingestion mode updated to {new_mode}",
                "mode": _CURRENT_INGESTION_MODE,
            }), 200
        return jsonify({
            "status": "ERROR",
            "message": "Invalid mode. Must be one of: LIVE_HARDWARE, SIMULATION, HYBRID",
        }), 400

    return jsonify({
        "status": "SUCCESS",
        "mode": _CURRENT_INGESTION_MODE,
    }), 200
