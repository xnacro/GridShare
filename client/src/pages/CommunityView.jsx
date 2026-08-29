import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import BatteryOwnership3D from '../components/3d/BatteryOwnership3D';
import StatusBadge from '../components/StatusBadge';
import { LoadingState, ErrorState } from '../components/StateFeedback';
import {
  BatteryCharging,
  Zap,
  ShieldCheck,
  RotateCcw,
  Play,
  RefreshCw,
  Home,
  IndianRupee,
  Layers,
  Sparkles,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function CommunityView() {
  const [nodes, setNodes] = useState([]);
  const [batteryState, setBatteryState] = useState(null);
  const [ownershipData, setOwnershipData] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Demo Runner state
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoFeedback, setDemoFeedback] = useState(null);
  const [visMode, setVisMode] = useState('CONTRIBUTION'); // CONTRIBUTION or WITHDRAWAL

  const fetchAllData = async () => {
    try {
      setError(null);
      const [obsRes, battRes, ownRes, ledgRes] = await Promise.all([
        api.getCommunityState(),
        api.getBattery(),
        api.getBatteryOwnership(),
        api.getBatteryLedger(30),
      ]);

      if (obsRes.data?.status === 'SUCCESS') setNodes(obsRes.data.data.households || []);
      if (battRes.data?.status === 'SUCCESS') setBatteryState(battRes.data.battery);
      if (ownRes.data?.status === 'SUCCESS') setOwnershipData(ownRes.data.data);
      if (ledgRes.data?.status === 'SUCCESS') setLedgerEntries(ledgRes.data.ledger || []);
    } catch (err) {
      console.error(err);
      setError('Unable to load community battery ownership data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRunBatteryFairnessDemo = async () => {
    try {
      setIsDemoRunning(true);
      setDemoFeedback("Executing Step 1: Anjali (10 kWh) & Prince (5 kWh) contributing to shared battery...");
      setVisMode('CONTRIBUTION');

      const res = await api.runBatteryFairnessDemo();
      if (res.data?.status === 'SUCCESS') {
        setTimeout(async () => {
          setVisMode('WITHDRAWAL');
          setDemoFeedback("Executing Step 2: Proportional withdrawal of 5.0 kWh (Anjali: 3.33 kWh | Prince: 1.67 kWh)...");
          await fetchAllData();

          setTimeout(() => {
            setDemoFeedback('✅ Battery Fairness Demo Complete: Individual contribution credits maintained with zero unfair depletion.');
            setIsDemoRunning(false);
          }, 3000);
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      setIsDemoRunning(false);
      setDemoFeedback('Error executing battery fairness demo.');
    }
  };

  const handleResetDemo = async () => {
    try {
      await api.resetDemo();
      setDemoFeedback(null);
      setVisMode('CONTRIBUTION');
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !batteryState) return <LoadingState message="Loading Community Battery & Ownership Ledgers..." />;
  if (error && !batteryState) return <ErrorState message={error} onRetry={fetchAllData} />;

  const shares = ownershipData?.ownership_shares || [];
  const soc = batteryState?.current_soc || 40.0;
  const stored = batteryState?.current_energy_kwh || 11.0;
  const capacity = batteryState?.capacity_kwh || 50.0;
  const efficiency = batteryState?.efficiency_percent || 90.0;
  return (
    <div className="space-y-6 max-w-[1520px] mx-auto pb-12 select-none animate-fadeIn">
      {/* 🌟 1. COMPACT PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[rgba(23,34,29,0.06)]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#011207]">
              Community Storage Equity
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E2F0CC] text-[#012F13] border border-[#BED69E]">
              Proportional Ledger
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4A5B4F] mt-0.5">
            Transparent proportional tracking of household energy deposits with 90% round-trip efficiency accounting
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRunBatteryFairnessDemo}
            disabled={isDemoRunning}
            className="px-4 py-2 rounded-xl bg-[#012F13] hover:bg-[#0B3E1D] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 text-[#8BC53D]" />
            <span>{isDemoRunning ? 'Simulating...' : 'Run Fairness Demo'}</span>
          </button>
          <button
            type="button"
            onClick={handleResetDemo}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#BED69E] text-[#011207] text-xs font-bold hover:bg-[#F4F9EB] transition flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#4A5B4F]" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Demo Feedback Banner */}
      {demoFeedback && (
        <div className="rounded-xl border border-[#1E9B68]/30 bg-[#E8F6EE] p-3.5 shadow-xs text-xs font-bold text-[#12392B] animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-[#1E9B68] shrink-0" />
            <span>{demoFeedback}</span>
          </div>
        </div>
      )}

      {/* 3D Ownership Mesh & KPI Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Central 3D Mesh Canvas (2 cols) */}
        <div className="lg:col-span-2">
          <BatteryOwnership3D
            batterySoc={soc}
            capacity={capacity}
            storedEnergy={stored}
            efficiency={efficiency}
            ownershipShares={shares}
            mode={visMode}
          />
        </div>

        {/* Battery Technical Status Card (1 col) */}
        <div className="glass-card rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(23,34,29,0.06)] mb-3">
              <div className="flex items-center space-x-2">
                <BatteryCharging className="h-4 w-4 text-[#1E9B68]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#17221D]">ESS Technical State</h3>
              </div>
              <span className="font-mono text-xs font-bold text-[#1E9B68]">{soc.toFixed(1)}% SOC</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[rgba(23,34,29,0.04)]">
                <span className="text-[#5E6963]">Physical Energy Stored:</span>
                <span className="font-mono font-bold text-[#17221D]">{stored.toFixed(2)} kWh</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[rgba(23,34,29,0.04)]">
                <span className="text-[#5E6963]">Nameplate Capacity:</span>
                <span className="font-mono font-bold text-[#17221D]">{capacity.toFixed(0)} kWh</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[rgba(23,34,29,0.04)]">
                <span className="text-[#5E6963]">Round-Trip Efficiency:</span>
                <span className="font-mono font-bold text-[#1E9B68]">{efficiency}% (10% Loss)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[rgba(23,34,29,0.04)]">
                <span className="text-[#5E6963]">Total Active Credits:</span>
                <span className="font-mono font-bold text-[#1E9B68]">{totalCredits.toFixed(2)} kWh</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#5E6963]">Dispatchable Headroom:</span>
                <span className="font-mono font-bold text-[#17221D]">{availableDispatch.toFixed(2)} kWh</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[rgba(23,34,29,0.06)] rounded-xl bg-[#F6F7F4] p-3 text-[11px] text-[#5E6963]">
            <span className="font-bold text-[#17221D]">Policy: </span>
            <span>PROPORTIONAL_OWNERSHIP (Withdrawals dynamically allocated by credit share).</span>
          </div>
        </div>
      </div>

      {/* Household Ownership Breakdown Bars & Explainability */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ownership Percentage Breakdown (2 cols) */}
        <div className="md:col-span-2 glass-card rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(23,34,29,0.06)] mb-4">
            <div className="flex items-center space-x-2">
              <Layers className="h-4 w-4 text-[#1E9B68]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#17221D]">Household Energy Ownership Breakdown</h3>
            </div>
            <span className="text-[11px] text-[#5E6963] font-mono">Real Database Credits</span>
          </div>

          <div className="space-y-4">
            {shares.map((s) => (
              <div key={s.household_id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#17221D]">{s.household_id}</span>
                    <span className="text-[11px] text-[#5E6963]">
                      (Contributed: {s.contributed_kwh.toFixed(1)} kWh → Usable: {s.usable_credit_kwh.toFixed(2)} kWh)
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-[#1E9B68]">{s.remaining_credit_kwh.toFixed(3)} kWh Credit</span>
                    <span className="font-mono text-[#5E6963] font-bold">{s.ownership_percent.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 w-full rounded-full bg-[#F6F7F4] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#1E9B68] to-[#43CB8C] transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(2, s.ownership_percent))}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-[#89938D] font-mono">
                  <span>Withdrawn: {s.withdrawn_kwh.toFixed(2)} kWh</span>
                  <span>Simulated Value: ₹{s.estimated_value_inr.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explainability Section: Why Ownership Tracking? */}
        <div className="glass-card rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-[rgba(23,34,29,0.06)] mb-3">
              <ShieldCheck className="h-4 w-4 text-[#1E9B68]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#17221D]">Why Ownership Tracking?</h3>
            </div>
            <p className="text-xs text-[#5E6963] leading-relaxed">
              GridShare tracks individual household contributions to the community battery so stored solar energy is never treated as an anonymous dump.
            </p>
            <p className="text-xs text-[#5E6963] leading-relaxed mt-2.5">
              Future withdrawals are dynamically calculated and allocated proportionally to remaining energy credits.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[rgba(23,34,29,0.06)] text-[10.5px] text-[#89938D] font-medium">
            <span className="font-bold text-[#17221D]">Notice: </span>
            All monetary metrics are derived from active microgrid tariffs and settlement rules.
          </div>
        </div>
      </div>

      {/* Battery Ledger Audit Trail */}
      <div className="glass-card rounded-xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(23,34,29,0.06)] mb-3">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-[#1E9B68]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#17221D]">Battery Ledger & Audit Trail</h3>
          </div>
          <span className="font-mono text-xs text-[#5E6963] font-bold">{ledgerEntries.length} Recorded Events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[rgba(23,34,29,0.06)] bg-[#F6F7F4] text-[11px] font-bold uppercase tracking-wider text-[#5E6963]">
                <th className="px-3.5 py-2.5 rounded-l-lg">Timestamp</th>
                <th className="px-3.5 py-2.5">Household</th>
                <th className="px-3.5 py-2.5">Action</th>
                <th className="px-3.5 py-2.5 text-right">Energy (kWh)</th>
                <th className="px-3.5 py-2.5 text-right">Usable (kWh)</th>
                <th className="px-3.5 py-2.5 text-right">Battery Stored</th>
                <th className="px-3.5 py-2.5 text-right">Simulated Value</th>
                <th className="px-3.5 py-2.5 rounded-r-lg">Reason / Policy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(23,34,29,0.04)]">
              {ledgerEntries.map((e) => (
                <tr key={e.id} className="hover:bg-[#F6F7F4]/60 transition">
                  <td className="px-3.5 py-2.5 font-mono text-[11px] text-[#5E6963]">
                    {e.timestamp ? new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                  </td>
                  <td className="px-3.5 py-2.5 font-bold text-[#17221D]">{e.household_id || 'Community'}</td>
                  <td className="px-3.5 py-2.5">
                    <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold ${e.action_type === 'CONTRIBUTION' ? 'bg-[#E8F6EE] text-[#1E9B68] border border-[#1E9B68]/20' : 'bg-[#EDF3FD] text-[#3C78CC] border border-[#3C78CC]/20'
                      }`}>
                      {e.action_type}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono font-bold text-[#17221D]">{e.energy_kwh.toFixed(2)}</td>
                  <td className="px-3.5 py-2.5 text-right font-mono font-bold text-[#1E9B68]">{e.usable_kwh.toFixed(2)}</td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-[#5E6963]">{e.balance_after_kwh.toFixed(2)} kWh ({e.soc_after_percent.toFixed(0)}%)</td>
                  <td className="px-3.5 py-2.5 text-right font-mono font-bold text-[#17221D]">₹{e.economic_value_inr?.toFixed(2)}</td>
                  <td className="px-3.5 py-2.5 text-[#5E6963] text-[11px] max-w-xs truncate">{e.reason || e.policy_applied}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
