"""
Unit tests for Demand Model (demand_v1) Artifact & Inference Interface.
"""

import os
import sys
import unittest
import pandas as pd

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from ml.predict import DemandPredictor, predict_demand
from ml.features.feature_engineering import FEATURE_NAMES

class TestDemandV1(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.predictor = DemandPredictor()

    def test_model_loaded(self):
        self.assertIsNotNone(self.predictor.model)
        self.assertEqual(self.predictor.model_version, "demand_v1")
        self.assertTrue(len(getattr(self.predictor.model, "estimators_", [])) > 0)

    def test_feature_schema(self):
        meta_features = self.predictor.metadata.get("features", [])
        self.assertEqual(len(meta_features), 32)
        self.assertEqual(meta_features, FEATURE_NAMES)

    def test_predict_list_input(self):
        history = [1.12, 1.05, 1.34, 1.89, 2.10]
        res15 = predict_demand(history, horizon_minutes=15)
        self.assertEqual(res15["forecast_horizon_minutes"], 15)
        self.assertGreater(res15["predicted_consumption_kw"], 0.0)
        self.assertIsNotNone(res15["uncertainty_value"])
        self.assertEqual(res15["model_version"], "demand_v1")

    def test_multi_horizon_rollout(self):
        history = [1.5, 1.6, 1.7, 1.8]
        res15 = predict_demand(history, horizon_minutes=15)
        res30 = predict_demand(history, horizon_minutes=30)
        res60 = predict_demand(history, horizon_minutes=60)
        self.assertGreater(res15["predicted_consumption_kw"], 0.0)
        self.assertGreater(res30["predicted_consumption_kw"], 0.0)
        self.assertGreater(res60["predicted_consumption_kw"], 0.0)

    def test_dataframe_input(self):
        df = pd.DataFrame({"consumption_kw": [1.0, 1.2, 1.4, 1.6, 1.8]})
        res = predict_demand(df, horizon_minutes=15)
        self.assertGreater(res["predicted_consumption_kw"], 0.0)

if __name__ == "__main__":
    unittest.main()
