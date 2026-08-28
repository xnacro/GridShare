import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import AiForecastScene3D, { FORECAST_3D_POSITIONS } from '../components/energy-map-3d/AiForecastScene3D';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import FaIcon from '../components/icons/FaIcon';
import Card from '../components/ui/Card';
import Badge, { StatusIndicator } from '../components/ui/Badge';
import Button, { IconButton } from '../components/ui/Button';
import MetricCard from '../components/ui/MetricCard';
import DecisionTimeline from '../components/ui/DecisionTimeline';

export default function AiForecastView() {
  const navigate = useNavigate();

  // Forecast state
  const [solarKw, setSolarKw] = useState(6.5);
  const [loadKw, setLoadKw] = useState(7.2);
  const [batterySoc, setBatterySoc] = useState(40);
  const [gridTariff, setGridTariff] = useState(6.10);
  const [p2pPrice, setP2pPrice] = useState(4.50);
  const [weatherFactor, setWeatherFactor] = useState(100);
  const [horizon, setHorizon] = useState('24H');
  const [scenario, setScenario] = useState('NORMAL');
  const [selectedHour, setSelectedHour] = useState(12);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState(null);

  const sceneRef = useRef();

  // Forecast time-series profile
  const forecastSeries = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const solarCurve = [0, 0, 0, 0, 0, 0.1, 0.8, 2.2, 4.5, 6.2, 7.8, 8.4, 8.1, 7.2, 5.8, 3.9, 1.8, 0.4, 0, 0, 0, 0, 0, 0];
    const loadCurve = [2.8, 2.4, 2.2, 2.1, 2.3, 3.1, 4.8, 5.5, 5.1, 4.9, 5.2, 5.8, 5.4, 5.0, 5.3, 6.2, 7.8, 8.9, 8.4, 7.2, 5.8, 4.5, 3.6, 3.0];

    const weatherMult = weatherFactor / 100;
    let runningSoc = batterySoc;

    return hours.map((hr) => {
      const gen = Math.round(solarCurve[hr] * weatherMult * (solarKw / 8.0) * 10) / 10;
      const con = Math.round(loadCurve[hr] * (loadKw / 6.0) * 10) / 10;
      const net = Math.round((gen - con) * 10) / 10;

      // Update battery SOC estimate
      if (net > 0 && runningSoc < 95) {
        runningSoc = Math.min(95, runningSoc + net * 2.5);
      } else if (net < 0 && runningSoc > 20) {
        runningSoc = Math.max(20, runningSoc + net * 2.0);
      }

      return {
        time: `${String(hr).padStart(2, '0')}:00`,
        hour: hr,
        solar: gen,
        load: con,
        net: net,
        batterySoc: Math.round(runningSoc),
        p2pPotential: Math.max(0, net),
        gridImport: net < 0 && runningSoc <= 20 ? Math.abs(net) : 0,
      };
    });
  }, [solarKw, loadKw, batterySoc, weatherFactor]);

  // Current selected hour state
  const currentSlot = forecastSeries[selectedHour] || forecastSeries[12];
  const isSurplus = currentSlot.net > 0;

  // ML Recommendation & Reasoning Engine
  const recommendation = useMemo(() => {
    if (isSurplus) {
      const tradeAmt = Math.min(currentSlot.net, 2.5);
      const estSavings = Math.round(tradeAmt * (gridTariff - p2pPrice) * 100) / 100;
      const co2Kg = Math.round(tradeAmt * 0.82 * 100) / 100;

      return {
        action: 'TRADE',
        actionLabel: 'Execute P2P Local Trade',
        energyAmount: tradeAmt,
        targetNode: 'House B (Consumer / EV)',
        confidence: 94.2,
        reasoning: [
          `Local surplus of +${currentSlot.net.toFixed(1)} kW projected for next ${horizon}.`,
          `Nearby peer demand available at House B (EV Charger active).`,
          `Battery reserve healthy at ${currentSlot.batterySoc}% (above 20% floor).`,
          `P2P tariff (₹${p2pPrice}/kWh) provides +28% seller margin vs grid feed-in.`,
        ],
        impact: {
          savingsInr: estSavings,
          co2AvoidedKg: co2Kg,
          gridAvoidedKw: tradeAmt,
        },
      };
    } else {
      const deficit = Math.abs(currentSlot.net);
      if (currentSlot.batterySoc > 20) {
        return {
          action: 'STORE',
          actionLabel: 'Dispatch Community Battery ESS',
          energyAmount: Math.min(deficit, 2.0),
          targetNode: 'Central Community Battery (50 kWh)',
          confidence: 91.5,
          reasoning: [
            `Community deficit of ${deficit.toFixed(1)} kW projected.`,
            `Battery ESS has sufficient headroom (${currentSlot.batterySoc}% SOC > 20% floor).`,
            `Avoids utility peak tariff surcharge (₹${gridTariff}/kWh).`,
          ],
          impact: {
            savingsInr: Math.round(Math.min(deficit, 2.0) * gridTariff * 0.3 * 100) / 100,
            co2AvoidedKg: Math.round(Math.min(deficit, 2.0) * 0.75 * 100) / 100,
            gridAvoidedKw: Math.min(deficit, 2.0),
          },
        };
      } else {
        return {
          action: 'IMPORT',
          actionLabel: 'Import Utility Reserve Power',
          energyAmount: deficit,
          targetNode: 'Main Grid Substation',
          confidence: 96.0,
          reasoning: [
            `Deficit of ${deficit.toFixed(1)} kW with battery at 20% emergency reserve floor.`,
            `Discharge blocked to maintain critical resilience reserve.`,
            `Importing required base load from central utility.`,
          ],
          impact: {
            savingsInr: 0,
            co2AvoidedKg: 0,
            gridAvoidedKw: 0,
          },
        };
      }
    }
  }, [currentSlot, isSurplus, horizon, gridTariff, p2pPrice]);

  // Execute recommendation
  const handleApplyRecommendation = async () => {
    try {
      setIsApplying(true);
      await api.runOptimization({
        action: recommendation.action,
        amount_kwh: recommendation.energyAmount,
        target_node: recommendation.targetNode,
      });
      setAppliedNotice(`Applied ${recommendation.actionLabel} (${recommendation.energyAmount} kWh).`);
      setTimeout(() => setAppliedNotice(null), 4000);
    } catch (err) {
      console.error('Failed to apply recommendation:', err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-4 max-w-[1680px] mx-auto pb-6">
      {/* Top Banner & AI Model Specification */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-900 text-purple-300 flex items-center justify-center text-xl shadow-md flex-shrink-0">
            <FaIcon name="copilot" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                AI Copilot & Predictive Energy Optimization
              </h1>
              <Badge variant="ai" size="xs">
                <StatusIndicator status="ai" pulse label="Random Forest RF-100" />
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-normal">
              Autonomous decision layer: Observe ➔ Predict ➔ Optimize ➔ Trade.
            </p>
          </div>
        </div>

        {/* Model Performance Pill */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
          <span className="font-mono text-purple-900 font-bold">R² = 0.9787</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600">MAE: 0.11 kW</span>
          <span className="text-slate-300">•</span>
          <span className="text-emerald-700 font-semibold">MAPE: 4.55%</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <MetricCard
          title="Observed Solar"
          value={currentSlot.solar.toFixed(1)}
          unit="kW"
          iconName="solar"
          variant="surplus"
          subtitle="Real-time PV"
        />
        <MetricCard
          title="Community Load"
          value={currentSlot.load.toFixed(1)}
          unit="kW"
          iconName="powerOff"
          variant="default"
          subtitle="Household demand"
        />
        <MetricCard
          title="Forecasted Net"
          value={(isSurplus ? '+' : '') + currentSlot.net.toFixed(1)}
          unit="kW"
          iconName="energy"
          variant={isSurplus ? 'surplus' : 'deficit'}
          subtitle={isSurplus ? 'Surplus' : 'Deficit'}
        />
        <MetricCard
          title="Battery Reserve"
          value={currentSlot.batterySoc}
          unit="%"
          iconName="battery"
          variant="battery"
          subtitle="Floor: 20%"
        />
        <MetricCard
          title="Model Confidence"
          value={`${recommendation.confidence}%`}
          iconName="sparkles"
          variant="ai"
          subtitle="Ensemble StdDev"
        />
        <MetricCard
          title="Projected Savings"
          value={`₹${recommendation.impact.savingsInr.toFixed(2)}`}
          iconName="rupee"
          variant="surplus"
          subtitle="Per hour"
        />
      </div>

      {/* Main Grid: Left Explainable Copilot Card, Right Interactive Graph & 3D */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Explainable Recommendation & Decision Engine (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Executive AI Recommendation Card */}
          <Card
            title="GridShare AI Autonomous Decision"
            subtitle={`Calculated for simulated time ${currentSlot.time}`}
            icon={<FaIcon name="sparkles" className="text-purple-600" />}
            variant="ai"
            className="border-purple-200"
          >
            <div className="space-y-4">
              {/* Primary Action Header */}
              <div className="p-3.5 bg-white rounded-xl border border-purple-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                    Recommended Action
                  </span>
                  <Badge variant={isSurplus ? 'surplus' : 'battery'} size="sm">
                    {recommendation.action}
                  </Badge>
                </div>
                <div className="text-base font-bold text-slate-900">
                  {recommendation.actionLabel}
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  Volume: <strong className="text-slate-900">{recommendation.energyAmount} kWh</strong> ➔ Target: <strong className="text-slate-900">{recommendation.targetNode}</strong>
                </div>
              </div>

              {/* Explainable Reasoning Bullet Points */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  Explainable Decision Reasoning
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {recommendation.reasoning.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FaIcon name="check" className="text-emerald-600 text-xs mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Expected Impact Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-100">
                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs">
                  <span className="text-emerald-700 font-semibold block text-[11px]">Community Savings</span>
                  <span className="text-base font-bold text-emerald-900">₹{recommendation.impact.savingsInr.toFixed(2)}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-xs">
                  <span className="text-blue-700 font-semibold block text-[11px]">CO₂ Avoided</span>
                  <span className="text-base font-bold text-blue-900">{recommendation.impact.co2AvoidedKg} kg</span>
                </div>
              </div>

              {/* Apply Action Button */}
              <div className="pt-2">
                <Button
                  variant="ai"
                  size="md"
                  onClick={handleApplyRecommendation}
                  isLoading={isApplying}
                  icon={<FaIcon name="sparkles" />}
                  className="w-full font-bold"
                >
                  Apply Recommendation ({recommendation.action})
                </Button>
                {appliedNotice && (
                  <p className="text-xs text-emerald-700 font-semibold text-center mt-2 animate-in fade-in">
                    {appliedNotice}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* AI Decision Timeline Component */}
          <Card title="Live Coordination Sequence" icon={<FaIcon name="clock" className="text-slate-600" />}>
            <DecisionTimeline currentStepIndex={isSurplus ? 3 : 2} />
          </Card>
        </div>

        {/* RIGHT COLUMN: 24H Forecast Chart & Interactive Time Stepper (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Time Stepper Slider */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FaIcon name="clock" className="text-slate-500" />
                <span>Simulated Timeline Hour:</span>
              </span>
              <span className="font-mono text-purple-900 font-bold text-sm">
                {currentSlot.time}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="23"
              value={selectedHour}
              onChange={(e) => setSelectedHour(Number(e.target.value))}
              className="w-full accent-purple-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>00:00 Night</span>
              <span>06:00 Sunrise</span>
              <span>12:00 Solar Peak</span>
              <span>18:00 Sunset</span>
              <span>23:00 Night</span>
            </div>
          </div>

          {/* 24-Hour Forecast Curve Graph */}
          <Card
            title="24-Hour Predictive Generation vs Community Load"
            subtitle="Diurnal solar photovoltaic generation and neighborhood aggregate load profile."
            icon={<FaIcon name="analytics" className="text-slate-700" />}
          >
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastSeries} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} unit=" kW" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.5rem', fontSize: '11px' }}
                    formatter={(val) => [`${val} kW`]}
                  />
                  <Legend verticalAlign="top" height={24} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Area
                    type="monotone"
                    dataKey="solar"
                    name="Solar Generation"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#solarGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="load"
                    name="Community Load"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#loadGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Battery SOC Prediction Curve */}
          <Card
            title="Projected Community Battery State of Charge (SOC %)"
            subtitle="Virtual battery reserve tracking with emergency 20% floor guard."
            icon={<FaIcon name="battery" className="text-amber-600" />}
          >
            <div className="h-44 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastSeries} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="socGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.5rem', fontSize: '11px' }}
                    formatter={(val) => [`${val}% SOC`]}
                  />
                  <Area
                    type="monotone"
                    dataKey="batterySoc"
                    name="Battery SOC"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#socGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
