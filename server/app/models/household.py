from datetime import datetime, timezone
from . import db

class Household(db.Model):
    __tablename__ = "households"

    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(150), nullable=True)
    household_type = db.Column(db.String(50), nullable=False, default="PROSUMER") # PROSUMER, CONSUMER, SOLAR_ONLY
    owner_user_id = db.Column(db.String(100), db.ForeignKey("user_profiles.user_id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    nodes = db.relationship("EnergyNode", backref="household", lazy="dynamic", cascade="all, delete-orphan")
    readings = db.relationship("EnergyReading", backref="household", lazy="dynamic", cascade="all, delete-orphan")
    predictions = db.relationship("Prediction", backref="household", lazy="dynamic", cascade="all, delete-orphan")
    sales = db.relationship("EnergyTransaction", foreign_keys="EnergyTransaction.seller_household_id", backref="seller", lazy="dynamic")
    purchases = db.relationship("EnergyTransaction", foreign_keys="EnergyTransaction.buyer_household_id", backref="buyer", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "location": self.location,
            "household_type": self.household_type,
            "owner_user_id": self.owner_user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
