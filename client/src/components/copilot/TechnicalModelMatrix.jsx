import React, { useState, useEffect } from 'react';
import FaIcon from '../icons/FaIcon';
import Badge from '../ui/Badge';
import { api } from '../../services/api';

export default function TechnicalModelMatrix() {
  const [modelHealth, setModelHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHealth() {
      try {
        const res = await api.getModelHealth();
        if (res.data) setModelHealth(res.data);
      } catch (e) {
        console.warn('Using cached model metadata:', e);
      } finally {
        setLoading(false);
      }
    }
    loadHealth();
  }, []);

  const solarMetrics = modelHealth?.solar_model?.test_metrics || {
    r2: 0.9789,
    mae: 10.16,
    rmse: 32.89,
    smape: 14.81,
    daytime_r2: 0.948,
    daytime_mae: 23.58,
  };

  const demandMetrics = modelHealth?.demand_model?.test_metrics || {
    r2: 0.7581,
    mae: 0.2353,
    rmse: 0.3935,
    smape: 26.76,
  };

  const benchmarks = modelHealth?.demand_model?.benchmarks || [
    { model_name: 'Baseline 1: Persistence (Last Reading)', model_type: 'Heuristic Baseline', test_rmse: 0.4912, test_mae: 0.2901, test_r2: 0.6231 },
    { model_name: 'Baseline 2: Same-Time 24h Ago (Seasonal)', model_type: 'Heuristic Baseline', test_rmse: 0.9145, test_mae: 0.6092, test_r2: -0.3065 },
    { model_name: 'Baseline 3: Rolling 24h Mean', model_type: 'Heuristic Baseline', test_rmse: 0.7685, test_mae: 0.5841, test_r2: 0.0766 },
  ];

  const solarFeatures = modelHealth?.solar_model?.top_features || [
    { feature: 'lag_15m_ghi', importance: 0.9677 },
    { feature: 'lag_15m_dhi', importance: 0.0037 },
    { feature: 'cos_hour', importance: 0.0036 },
    { feature: 'solar_elevation_proxy', importance: 0.0031 },
    { feature: 'lag_30m_ghi', importance: 0.0025 },
  ];

  const demandFeatures = modelHealth?.demand_model?.top_features || [
    { feature: 'lag_15m (Active Power)', importance: 0.7849 },
    { feature: 'lag_15m_sub1 (Kitchen)', importance: 0.0292 },
    { feature: 'lag_30m', importance: 0.0169 },
    { feature: 'lag_15m_intensity', importance: 0.0167 },
    { feature: 'lag_15m_sub3 (HVAC/Water)', importance: 0.0120 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. Model Status & Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Solar Model Card */}
        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(23,34,29,0.06)]">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#E5A72D]/15 flex items-center justify-center text-[#E5A72D]">
                <FaIcon name="sun" className="text-sm" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#17221D]">Solar Model (`solar_v1`)</h4>
                <p className="text-[11px] text-[#5E6963]">Random Forest (150 trees) • NSRDB Meteosat IODC India</p>
              </div>
            </div>
            <Badge variant="surplus" size="xs">
              <FaIcon name="check" className="mr-1 text-[9px]" /> R² = {solarMetrics.r2}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#F8FAF9] p-2.5 rounded-lg border border-[rgba(23,34,29,0.06)]">
              <span className="text-[10px] uppercase font-bold text-[#5E6963]">Holdout MAE</span>
              <p className="text-sm font-bold text-[#17221D] mt-0.5">{solarMetrics.mae} W/m²</p>
            </div>
            <div className="bg-[#F8FAF9] p-2.5 rounded-lg border border-[rgba(23,34,29,0.06)]">
              <span className="text-[10px] uppercase font-bold text-[#5E6963]">Holdout RMSE</span>
              <p className="text-sm font-bold text-[#17221D] mt-0.5">{solarMetrics.rmse} W/m²</p>
            </div>
            <div className="bg-[#F8FAF9] p-2.5 rounded-lg border border-[rgba(23,34,29,0.06)]">
              <span className="text-[10px] uppercase font-bold text-[#5E6963]">Daytime R²</span>
              <p className="text-sm font-bold text-[#1E9B68] mt-0.5">{solarMetrics.daytime_r2}</p>
            </div>
          </div>

          {/* Feature Importances */}
          <div>
            <p className="text-[11px] font-semibold text-[#17221D] mb-1.5">Key GHI Predictive Drivers:</p>
            <div className="space-y-1 text-xs">
              {solarFeatures.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] py-0.5">
                  <span className="text-[#5E6963] font-mono">{f.feature}</span>
                  <span className="font-bold text-[#17221D]">{(f.importance * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Demand Model Card */}
        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(23,34,29,0.06)]">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#3C78CC]/15 flex items-center justify-center text-[#3C78CC]">
                <FaIcon name="bolt" className="text-sm" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#17221D]">Demand Model (`demand_v1`)</h4>
                <p className="text-[11px] text-[#5E6963]">Random Forest (150 trees) • UCI Household Power Dataset</p>
              </div>
            </div>
            <Badge variant="deficit" size="xs">
              <FaIcon name="check" className="mr-1 text-[9px]" /> R² = {demandMetrics.r2}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#F8FAF9] p-2.5 rounded-lg border border-[rgba(23,34,29,0.06)]">
              <span className="text-[10px] uppercase font-bold text-[#5E6963]">Holdout MAE</span>
              <p className="text-sm font-bold text-[#17221D] mt-0.5">{demandMetrics.mae} kW</p>
            </div>
            <div className="bg-[#F8FAF9] p-2.5 rounded-lg border border-[rgba(23,34,29,0.06)]">
              <span className="text-[10px] uppercase font-bold text-[#5E6963]">Holdout RMSE</span>
              <p className="text-sm font-bold text-[#17221D] mt-0.5">{demandMetrics.rmse} kW</p>
            </div>
            <div className="bg-[#F8FAF9] p-2.5 rounded-lg border border-[rgba(23,34,29,0.06)]">
              <span className="text-[10px] uppercase font-bold text-[#5E6963]">SMAPE</span>
              <p className="text-sm font-bold text-[#17221D] mt-0.5">{demandMetrics.smape}%</p>
            </div>
          </div>

          {/* Feature Importances */}
          <div>
            <p className="text-[11px] font-semibold text-[#17221D] mb-1.5">Key Load Predictive Drivers:</p>
            <div className="space-y-1 text-xs">
              {demandFeatures.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] py-0.5">
                  <span className="text-[#5E6963] font-mono">{f.feature}</span>
                  <span className="font-bold text-[#17221D]">{(f.importance * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 2. Empirical Benchmark Comparison Table */}
      <div className="glass-card rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FaIcon name="chart" className="text-[#1E9B68] text-xs" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#17221D]">
              Model vs Heuristic Baselines (Holdout Test Performance)
            </h4>
          </div>
          <span className="text-[11px] text-[#5E6963]">20,392 test intervals</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[rgba(23,34,29,0.08)] text-[11px] text-[#5E6963]">
                <th className="py-2 font-semibold">Model / Architecture</th>
                <th className="py-2 font-semibold">Type</th>
                <th className="py-2 font-semibold">Holdout RMSE (kW)</th>
                <th className="py-2 font-semibold">Holdout MAE (kW)</th>
                <th className="py-2 font-semibold">Test R²</th>
                <th className="py-2 font-semibold">RF Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(23,34,29,0.04)]">
              <tr className="bg-[#EBF7F1]/60 font-semibold text-[#17221D]">
                <td className="py-2.5 flex items-center space-x-1.5 text-[#1E9B68]">
                  <FaIcon name="brain" className="text-xs" />
                  <span>Random Forest (demand_v1)</span>
                </td>
                <td className="py-2.5 text-[#5E6963]">Trained ML Ensemble</td>
                <td className="py-2.5 font-mono">{demandMetrics.rmse}</td>
                <td className="py-2.5 font-mono">{demandMetrics.mae}</td>
                <td className="py-2.5 font-mono text-[#1E9B68]">{demandMetrics.r2}</td>
                <td className="py-2.5 text-[#1E9B68] font-bold">Winning Model</td>
              </tr>
              {benchmarks.map((b, idx) => (
                <tr key={idx} className="text-[#5E6963]">
                  <td className="py-2 font-medium text-[#17221D]">{b.model_name}</td>
                  <td className="py-2">{b.model_type}</td>
                  <td className="py-2 font-mono">{b.test_rmse}</td>
                  <td className="py-2 font-mono">{b.test_mae}</td>
                  <td className="py-2 font-mono">{b.test_r2}</td>
                  <td className="py-2 font-medium text-[#D45C5C]">
                    +{(((b.test_rmse - demandMetrics.rmse) / b.test_rmse) * 100).toFixed(1)}% error
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Model Limitations & Physical Disclosures */}
      <div className="glass-card rounded-xl p-5 space-y-2 bg-[#FAFBF9]">
        <div className="flex items-center space-x-2 text-[#7358C7]">
          <FaIcon name="shield" className="text-xs" />
          <h4 className="text-xs font-bold uppercase tracking-wider">AI Operational Boundaries & Assumptions</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#5E6963] leading-relaxed">
          <p>
            • <strong>Atmospheric Volatility</strong>: Solar irradiance is forecast using satellite radiative transfer GHI. Cloud transients may cause rapid deviations; GridShare compensates by enforcing conservative lower prediction corridors.
          </p>
          <p>
            • <strong>Behavioral Variance</strong>: Domestic electricity load incorporates human activity. Unscheduled high-power loads (e.g. EV chargers) are mitigated via real-time statistical anomaly detection.
          </p>
        </div>
      </div>

    </div>
  );
}
