"""
Unit tests for GridShare AI Copilot Backend API.
"""

import unittest
import json
from gridshare.backend.app import create_app
from gridshare.backend.app.config import Config
from gridshare.backend.app.models import db
from gridshare.database.seed_data import seed_database

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class TestCopilotAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app(TestConfig)
        cls.app_context = cls.app.app_context()
        cls.app_context.push()
        db.create_all()
        seed_database(clear_existing=False)
        cls.client = cls.app.test_client()

    @classmethod
    def tearDownClass(cls):
        db.session.remove()
        db.drop_all()
        cls.app_context.pop()

    def test_get_copilot_insights_schema(self):
        resp = self.client.get("/api/copilot/insights?horizon_minutes=15")
        self.assertEqual(resp.status_code, 200)
        body = json.loads(resp.data.decode("utf-8"))
        self.assertEqual(body.get("status"), "SUCCESS")
        data = body.get("data", {})

        # Verify core sections
        self.assertIn("current_state", data)
        self.assertIn("forecast", data)
        self.assertIn("decision", data)
        self.assertIn("risk_check", data)
        self.assertIn("reasoning", data)
        self.assertIn("impact", data)

        # Verify forecast keys
        f = data["forecast"]
        self.assertIn("solar_kw", f)
        self.assertIn("solar_lower_kw", f)
        self.assertIn("solar_upper_kw", f)
        self.assertIn("demand_kw", f)
        self.assertIn("balance_kw", f)

        # Verify recommendation separation
        d = data["decision"]
        self.assertEqual(d["status"], "RECOMMENDED")
        self.assertEqual(d["workflow_state"], "PENDING_REVIEW")
        self.assertIn("action", d)
        self.assertIn("action_label", d)

        # Verify reasoning has actual string bullets
        self.assertTrue(len(data["reasoning"]) > 0)
        for r in data["reasoning"]:
            self.assertIsInstance(r, str)

    def test_copilot_simulate_shock(self):
        resp = self.client.post("/api/copilot/simulate-shock", json={
            "type": "CLOUD_COVER",
            "severity": 0.6
        })
        self.assertEqual(resp.status_code, 200)
        body = json.loads(resp.data.decode("utf-8"))
        self.assertTrue(body.get("is_simulation"))
        self.assertIn("baseline", body)
        self.assertIn("shocked_state", body)

if __name__ == "__main__":
    unittest.main()
