"""
GridShare ML Solar Forecasting Package.
"""
try:
    from ml.solar.predict import SolarPredictor, predict_solar
    __all__ = ["SolarPredictor", "predict_solar"]
except ImportError:
    __all__ = []
