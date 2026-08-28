from datetime import datetime, timezone
from . import db

class UserProfile(db.Model):
    __tablename__ = "user_profiles"

    user_id = db.Column(db.String(100), primary_key=True) # Supabase auth.users.id
    email = db.Column(db.String(150), nullable=False, unique=True, index=True)
    display_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False, default="USER") # "USER", "ADMIN"
    default_household_id = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    households = db.relationship("Household", backref="owner", lazy="dynamic", foreign_keys="Household.owner_user_id")

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "email": self.email,
            "display_name": self.display_name,
            "role": self.role,
            "default_household_id": self.default_household_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
