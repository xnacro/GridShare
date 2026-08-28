import unittest
import sys
import os
import jwt

# Bootstrap import paths
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import _bootstrap

from gridshare.backend.app import create_app
from gridshare.backend.app.config import Config
from gridshare.backend.app.models import db, UserProfile, Household, EnergyNode, EnergyReading
from gridshare.database.seed_data import seed_database

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class TestAuthMultiTenant(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app(TestConfig)
        cls.app_context = cls.app.app_context()
        cls.app_context.push()
        db.create_all()
        seed_database(clear_existing=True)
        cls.client = cls.app.test_client()

    @classmethod
    def tearDownClass(cls):
        db.session.remove()
        db.drop_all()
        cls.app_context.pop()

    def test_auth_missing_token(self):
        """Unauthenticated request to /api/me should return HTTP 401."""
        res = self.client.get("/api/me")
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertEqual(data["status"], "ERROR")

    def test_auth_invalid_token(self):
        """Invalid token to /api/me should return HTTP 401."""
        res = self.client.get("/api/me", headers={"Authorization": "Bearer invalid.jwt.token"})
        self.assertEqual(res.status_code, 401)

    def test_user_a_identity_and_household(self):
        """User A should automatically resolve to House A (Prosumer)."""
        res = self.client.get("/api/me", headers={"Authorization": "Bearer demo-token-user-a"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["household"]["id"], "house_a")
        self.assertEqual(data["household"]["household_type"], "PROSUMER")
        self.assertIn("node_house_a", data["energy_node"]["id"])

    def test_user_b_identity_and_household(self):
        """User B should automatically resolve to House B (Consumer)."""
        res = self.client.get("/api/me", headers={"Authorization": "Bearer demo-token-user-b"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["household"]["id"], "house_b")
        self.assertIn("node_house_b", data["energy_node"]["id"])

    def test_multi_tenant_energy_isolation(self):
        """User A and User B must receive their own isolated energy states."""
        res_a = self.client.get("/api/my-energy", headers={"Authorization": "Bearer demo-token-user-a"})
        res_b = self.client.get("/api/my-energy", headers={"Authorization": "Bearer demo-token-user-b"})

        self.assertEqual(res_a.status_code, 200)
        self.assertEqual(res_b.status_code, 200)

        data_a = res_a.get_json()["energy"]
        data_b = res_b.get_json()["energy"]

        # Verify House A is Prosumer surplus and House B is Consumer deficit
        self.assertEqual(data_a["household_id"], "house_a")
        self.assertEqual(data_b["household_id"], "house_b")
        self.assertNotEqual(data_a["generation_kw"], data_b["generation_kw"])

    def test_manual_data_source_override_isolation(self):
        """Setting User A to MANUAL source must not affect User B's simulation."""
        # 1. Update User A to MANUAL mode
        update_res = self.client.post(
            "/api/my-energy/source",
            headers={"Authorization": "Bearer demo-token-user-a"},
            json={
                "source_type": "MANUAL",
                "manual_generation_kw": 6.2,
                "manual_consumption_kw": 2.7,
            },
        )
        self.assertEqual(update_res.status_code, 200)

        # 2. Verify User A reads 6.2 kW gen, 2.7 kW con, +3.5 kW net
        res_a = self.client.get("/api/my-energy", headers={"Authorization": "Bearer demo-token-user-a"})
        energy_a = res_a.get_json()["energy"]
        self.assertEqual(energy_a["source"], "MANUAL")
        self.assertEqual(energy_a["generation_kw"], 6.2)
        self.assertEqual(energy_a["consumption_kw"], 2.7)
        self.assertEqual(energy_a["net_balance_kw"], 3.5)

        # 3. Verify User B remains on SIMULATION and unaffected
        res_b = self.client.get("/api/my-energy", headers={"Authorization": "Bearer demo-token-user-b"})
        energy_b = res_b.get_json()["energy"]
        self.assertEqual(energy_b["source"], "SIMULATION")
        self.assertEqual(energy_b["household_id"], "house_b")

    def test_first_time_signup_auto_provisions_household(self):
        """A new authenticated user ID should auto-provision a fresh household."""
        new_user_token = jwt.encode(
            {"sub": "new_user_xyz_123", "email": "new_prosumer@guwahati.in", "user_metadata": {"display_name": "Rohan Das"}},
            "secret",
            algorithm="HS256"
        )
        res = self.client.get("/api/me", headers={"Authorization": f"Bearer {new_user_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["user"]["email"], "new_prosumer@guwahati.in")
        self.assertEqual(data["user"]["display_name"], "Rohan Das")
        self.assertTrue(data["household"]["id"].startswith("house_"))

if __name__ == "__main__":
    unittest.main()
