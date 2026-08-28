"""
Unit tests for Solar Resource Model (solar_v1) and Preprocessing Pipeline.
"""

import os
import sys
import unittest
from datetime import datetime, timezone
import pandas as pd

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from ml.solar.preprocessing import load_processed_solar_data
from ml.solar.features import engineer_solar_features, SOLAR_FEATURE_NAMES
from ml.solar.predict import SolarPredictor, predict_solar

class TestSolarPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.predictor = SolarPredictor()

    def test_solar_model_loaded(self):
        self.assertIsNotNone(self.predictor.model)
        self.assertEqual(self.predictor.model_version, "solar_v1")
        self.assertTrue(len(getattr(self.predictor.model, "estimators_", [])) > 0)

    def test_solar_feature_schema(self):
        meta_features = self.predictor.metadata.get("features", [])
        self.assertEqual(len(meta_features), len(SOLAR_FEATURE_NAMES))
        self.assertEqual(meta_features, SOLAR_FEATURE_NAMES)

    def test_predict_solar_daytime(self):
        day_history = [300.0, 450.0, 550.0, 620.0, 700.0]
        noon_time = datetime(2026, 8, 28, 12, 0, 0, tzinfo=timezone.utc)
        res = predict_solar(day_history, horizon_minutes=15, current_time=noon_time)

        self.assertEqual(res["forecast_horizon_minutes"], 15)
        self.assertGreater(res["predicted_ghi"], 0.0)
        self.assertLessEqual(res["lower_ghi"], res["predicted_ghi"])
        self.assertGreaterEqual(res["upper_ghi"], res["predicted_ghi"])
        self.assertGreater(res["estimated_pv_kw"], 0.0)
        self.assertEqual(res["model_version"], "solar_v1")

    def test_predict_solar_night_clamping(self):
        night_history = [0.0, 0.0, 0.0, 0.0, 0.0]
        midnight = datetime(2026, 8, 28, 0, 0, 0, tzinfo=timezone.utc)
        res = predict_solar(night_history, horizon_minutes=15, current_time=midnight)

        self.assertEqual(res["predicted_ghi"], 0.0)
        self.assertEqual(res["lower_ghi"], 0.0)
        self.assertEqual(res["upper_ghi"], 0.0)
        self.assertEqual(res["estimated_pv_kw"], 0.0)

    def test_pv_conversion_scaling(self):
        day_history = [500.0, 500.0, 500.0]
        noon_time = datetime(2026, 8, 28, 12, 0, 0, tzinfo=timezone.utc)

        res_4kw = predict_solar(day_history, horizon_minutes=15, current_time=noon_time, installed_kwp=4.0)
        res_8kw = predict_solar(day_history, horizon_minutes=15, current_time=noon_time, installed_kwp=8.0)

        # 8kWp should yield approximately 2x estimated PV output of 4kWp
        self.assertAlmostEqual(res_8kw["estimated_pv_kw"], res_4kw["estimated_pv_kw"] * 2.0, delta=0.01)

if __name__ == "__main__":
    unittest.main()
