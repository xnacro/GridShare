from datetime import datetime, timezone
from . import db

class EnergyNode(db.Model):
    __tablename__ = "energy_nodes"

    id = db.Column(db.String(50), primary_key=True) # e.g. "node_house_a"
    household_id = db.Column(db.String(50), db.ForeignKey("households.id", ondelete="CASCADE"), nullable=False, index=True)
    node_type = db.Column(db.String(50), nullable=False, default="RESIDENTIAL_SOLAR") # "RESIDENTIAL_SOLAR", "RESIDENTIAL_LOAD", "BATTERY", "GRID"
    source_type = db.Column(db.String(50), nullable=False, default="SIMULATION") # "SIMULATION", "MANUAL", "HARDWARE"
    
    # Manual override parameters when source_type == "MANUAL"
    manual_generation_kw = db.Column(db.Float, nullable=False, default=0.0)
    manual_consumption_kw = db.Column(db.Float, nullable=False, default=0.0)
    
    status = db.Column(db.String(50), nullable=False, default="ONLINE")
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "household_id": self.household_id,
            "node_type": self.node_type,
            "source_type": self.source_type,
            "manual_generation_kw": round(self.manual_generation_kw, 3),
            "manual_consumption_kw": round(self.manual_consumption_kw, 3),
            "manual_net_kw": round(self.manual_generation_kw - self.manual_consumption_kw, 3),
            "status": self.status,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
