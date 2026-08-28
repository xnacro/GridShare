import React, { useState, useRef } from 'react';
import InteractiveBatteryTwin3D from '../components/battery/InteractiveBatteryTwin3D';
import PageHero from '../components/ui/PageHero';
import HeroMetric from '../components/ui/HeroMetric';
import GlassSurface from '../components/ui/GlassSurface';
import SectionHeader from '../components/ui/SectionHeader';
import FaIcon from '../components/icons/FaIcon';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function BatteryView() {
  // Battery State
  const [battery, setBattery] = useState({
    soc: 40,
    capacity: 50.0,
    storedKwh: 20.0,
    minSoc: 20, // 20% Emergency Reserve Floor
    maxSoc: 95,
    reserveKwh: 10.0,
    efficiency: 90,
    health: 98,
    cycleCount: 142,
    tempC: 27.5,
    voltage: 400.0,
  });

  const [status, setStatus] = useState('IDLE');
  const [activeFlow, setActiveFlow] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [chargeAmount, setChargeAmount] = useState(2.0);
  const [dischargeAmount, setDischargeAmount] = useState(2.0);

  const [history, setHistory] = useState([
    {
      id: 'ACT-001',
      time: '11:15',
      action: 'CHARGE',
      source: 'House A (Solar)',
      dest: 'Central ESS',
      energyKwh: 2.0,
      usableKwh: 1.80,
      socBefore: 36,
      socAfter: 40,
      status: 'COMPLETED',
    },
    {
      id: 'ACT-002',
      time: '11:45',
      action: 'DISCHARGE',
      source: 'Central ESS',
      dest: 'House B (EV Load)',
      energyKwh: 2.5,
      usableKwh: 2.5,
      socBefore: 45,
      socAfter: 40,
      status: 'COMPLETED',
    }
  ]);

  const sceneRef = useRef();

  const usableKwh = Math.max(0, (battery.capacity * (battery.soc - battery.minSoc)) / 100);
  const reservedKwh = (battery.capacity * battery.minSoc) / 100;

  const handleExecuteCharge = () => {
    if (battery.soc >= 95) {
      setStatusMessage('Battery storage is at maximum 95% operating threshold.');
      return;
    }
    setStatus('CHARGING');
    setActiveFlow({ type: 'CHARGE', kw: chargeAmount });
    setStatusMessage(`Buffering ${chargeAmount} kWh excess solar yield into Community ESS.`);
    
    setTimeout(() => {
      setBattery((prev) => {
        const nextSoc = Math.min(95, prev.soc + Math.round((chargeAmount / prev.capacity) * 100));
        return { ...prev, soc: nextSoc, storedKwh: (prev.capacity * nextSoc) / 100 };
      });
      setStatus('IDLE');
      setActiveFlow(null);
      setHistory((prev) => [
        {
          id: `ACT-00${prev.length + 1}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'CHARGE',
          source: 'House A (Solar Surplus)',
          dest: 'Central ESS',
          energyKwh: chargeAmount,
          usableKwh: Math.round(chargeAmount * 0.9 * 100) / 100,
          socBefore: battery.soc,
          socAfter: Math.min(95, battery.soc + Math.round((chargeAmount / battery.capacity) * 100)),
          status: 'COMPLETED',
        },
        ...prev,
      ]);
      setStatusMessage(`Successfully injected ${chargeAmount} kWh into ESS.`);
      setTimeout(() => setStatusMessage(''), 4000);
    }, 900);
  };

  const handleExecuteDischarge = () => {
    if (battery.soc <= battery.minSoc) {
      setStatusMessage('⚠️ Cannot discharge: 20% Emergency Reserve Floor is strictly locked for blackout resilience.');
      setTimeout(() => setStatusMessage(''), 5000);
      return;
    }
    setStatus('DISCHARGING');
    setActiveFlow({ type: 'DISCHARGE', kw: dischargeAmount });
    setStatusMessage(`Supplying ${dischargeAmount} kWh from Community ESS to local households.`);

    setTimeout(() => {
      setBattery((prev) => {
        const nextSoc = Math.max(prev.minSoc, prev.soc - Math.round((dischargeAmount / prev.capacity) * 100));
        return { ...prev, soc: nextSoc, storedKwh: (prev.capacity * nextSoc) / 100 };
      });
      setStatus('IDLE');
      setActiveFlow(null);
      setHistory((prev) => [
        {
          id: `ACT-00${prev.length + 1}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'DISCHARGE',
          source: 'Central ESS',
          dest: 'House B (EV Charging)',
          energyKwh: dischargeAmount,
          usableKwh: dischargeAmount,
          socBefore: battery.soc,
          socAfter: Math.max(battery.minSoc, battery.soc - Math.round((dischargeAmount / battery.capacity) * 100)),
          status: 'COMPLETED',
        },
        ...prev,
      ]);
      setStatusMessage(`Supplied ${dischargeAmount} kWh to local circuits.`);
      setTimeout(() => setStatusMessage(''), 4000);
    }, 900);
  };

  return (
    <div className="space-y-8 max-w-[1520px] mx-auto pb-12 select-none animate-fadeIn">
      
      {/* 🌟 1. BATTERY HERO */}
      <PageHero
        category="COMMUNITY BATTERY STORAGE"
        statusBadge="CENTRAL ESS (50 kWh)"
        statusVariant="solar"
        title="40% Stored •"
        highlightText={`${usableKwh.toFixed(1)} / ${battery.storedKwh.toFixed(1)} kWh usable with 20% emergency reserve floor.`}
        subtitle="Buffers rooftop solar surplus, preserves blackout resilience, and provides equity accounting for community contributors."
        supportingFacts={[
          { label: 'Total Capacity', value: `${battery.capacity.toFixed(0)} kWh`, icon: 'battery' },
          { label: 'Round-Trip Efficiency', value: `${battery.efficiency}%`, icon: 'leaf' },
          { label: 'Emergency Floor', value: `${battery.minSoc}% (${reservedKwh.toFixed(0)} kWh locked)`, icon: 'shield' },
        ]}
        primaryAction={{
          label: 'Buffer Solar Surplus',
          icon: 'battery',
          onClick: handleExecuteCharge,
        }}
        secondaryAction={{
          label: 'Withdraw Credit',
          icon: 'flash',
          onClick: handleExecuteDischarge,
        }}
      />

      {/* Dynamic Status Notification */}
      {statusMessage && (
        <div className="flex items-center justify-between rounded-2xl border border-[#DCE4DE] bg-[#E6F5EC] px-4 py-3 text-xs sm:text-sm text-[#12382A] font-bold shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <FaIcon name="check" className="text-[#1E9B67]" />
            <span>{statusMessage}</span>
          </div>
          <button type="button" onClick={() => setStatusMessage('')} className="text-[#1E9B67] text-xs p-1 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* 🌟 2. METRIC STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <HeroMetric
          label="Total Energy Stored"
          value={battery.storedKwh.toFixed(1)}
          unit="kWh"
          subtitle={`${battery.soc}% of 50 kWh capacity`}
          iconName="battery"
          variant="solar"
        />

        <HeroMetric
          label="Usable Available Storage"
          value={usableKwh.toFixed(1)}
          unit="kWh"
          subtitle="Above 20% reserve threshold"
          iconName="flash"
          variant="emerald"
        />

        <HeroMetric
          label="Emergency Reserve Floor"
          value={reservedKwh.toFixed(1)}
          unit="kWh"
          subtitle="20% capacity locked for outages"
          iconName="shield"
          variant="deficit"
        />

        <HeroMetric
          label="Round-Trip Efficiency"
          value={`${battery.efficiency}%`}
          unit="ETA"
          subtitle="90% energy retention guarantee"
          iconName="leaf"
          variant="emerald"
        />
      </div>

      {/* 🌟 3. VISUAL 3D BATTERY TWIN & DISPATCH CONTROLLER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT: 3D SPATIAL BATTERY TWIN (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-white border border-[rgba(23,56,43,0.08)] p-6 shadow-card flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(23,56,43,0.06)]">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#FFF7E4] text-[#E5A72D] flex items-center justify-center text-xs">
                <FaIcon name="battery" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#15221B]">
                  3D Central ESS Architecture Twin
                </h3>
                <p className="text-xs text-[#5E6B63]">
                  50 kWh LiFePO4 rack modules with cell balancing and thermal management
                </p>
              </div>
            </div>
            <Badge variant="surplus" size="xs">
              HEALTH: {battery.health}%
            </Badge>
          </div>

          <div className="h-[380px] w-full relative rounded-2xl overflow-hidden bg-[#EEF2ED]/60 border border-[rgba(23,56,43,0.05)]">
            <InteractiveBatteryTwin3D
              ref={sceneRef}
              battery={battery}
              activeFlow={activeFlow}
              status={status}
              onSelectModule={() => {}}
            />

            {/* Floating Glass SOC Chip */}
            <div className="absolute top-3 left-3 p-2 rounded-2xl gs-glass shadow-sm space-y-1">
              <div className="text-[10px] uppercase font-bold text-[#5E6B63]">State of Charge</div>
              <div className="text-lg font-black text-[#E5A72D]">{battery.soc}% ({battery.storedKwh.toFixed(1)} kWh)</div>
            </div>
          </div>
        </div>

        {/* RIGHT: STORAGE DISPATCH & EQUITY LEDGER (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl bg-white border border-[rgba(23,56,43,0.08)] p-6 shadow-card flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(23,56,43,0.06)]">
            <div>
              <h3 className="text-base font-extrabold text-[#15221B]">
                Manual Storage Dispatch
              </h3>
              <p className="text-xs text-[#5E6B63]">
                Inject solar surplus or withdraw energy credits
              </p>
            </div>
            <Badge variant="default" size="xs">
              90% EFFICIENCY
            </Badge>
          </div>

          {/* Charge Card */}
          <div className="p-4 rounded-2xl bg-[#FFF7E4]/50 border border-[#E5A72D]/20 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#15221B]">
              <span className="flex items-center gap-1.5 text-[#E5A72D]">
                <FaIcon name="solar" />
                Charge ESS (Solar Ingestion)
              </span>
              <span>{chargeAmount.toFixed(1)} kWh</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.5"
              value={chargeAmount}
              onChange={(e) => setChargeAmount(Number(e.target.value))}
              className="w-full accent-[#E5A72D] cursor-pointer"
            />
            <Button
              variant="solar"
              size="sm"
              className="w-full justify-center text-xs font-bold"
              onClick={handleExecuteCharge}
              isLoading={status === 'CHARGING'}
            >
              Inject {chargeAmount} kWh Solar Yield
            </Button>
          </div>

          {/* Discharge Card */}
          <div className="p-4 rounded-2xl bg-[#E6F5EC]/50 border border-[#1E9B67]/20 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#15221B]">
              <span className="flex items-center gap-1.5 text-[#1E9B67]">
                <FaIcon name="flash" />
                Discharge ESS (Load Relief)
              </span>
              <span>{dischargeAmount.toFixed(1)} kWh</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.5"
              value={dischargeAmount}
              onChange={(e) => setDischargeAmount(Number(e.target.value))}
              className="w-full accent-[#1E9B67] cursor-pointer"
            />
            <Button
              variant="primary"
              size="sm"
              className="w-full justify-center text-xs font-bold"
              onClick={handleExecuteDischarge}
              isLoading={status === 'DISCHARGING'}
            >
              Discharge {dischargeAmount} kWh to Community
            </Button>
          </div>

        </div>

      </div>

      {/* 🌟 4. RECENT BATTERY DISPATCH LOG */}
      <div className="rounded-3xl bg-white border border-[rgba(23,56,43,0.08)] p-6 sm:p-8 shadow-card space-y-4">
        <SectionHeader
          title="Community Storage Accounting & History"
          subtitle="Transparent transactional audit log tracking solar injections and credit withdrawals"
          rightAction={
            <Badge variant="surplus" size="xs">
              {history.length} Transactions
            </Badge>
          }
        />

        <div className="space-y-2.5">
          {history.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F5F7F3]/60 border border-[rgba(23,56,43,0.06)] hover:bg-white text-xs transition"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${
                  h.action === 'CHARGE' ? 'bg-[#FFF7E4] text-[#E5A72D]' : 'bg-[#E6F5EC] text-[#1E9B67]'
                }`}>
                  <FaIcon name={h.action === 'CHARGE' ? 'solar' : 'flash'} />
                </div>
                <div>
                  <div className="font-bold text-[#15221B]">{h.action}: {h.source} ➔ {h.dest}</div>
                  <div className="text-[11px] text-[#5E6B63]">{h.time} • SOC {h.socBefore}% ➔ {h.socAfter}%</div>
                </div>
              </div>

              <div className="text-right space-y-0.5">
                <div className="font-mono font-bold text-[#12382A]">
                  {h.action === 'CHARGE' ? '+' : '-'}{h.energyKwh.toFixed(1)} kWh
                </div>
                <Badge variant={h.action === 'CHARGE' ? 'solar' : 'surplus'} size="xs">{h.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
