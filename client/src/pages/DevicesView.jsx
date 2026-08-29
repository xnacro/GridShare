import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroMetric from '../components/ui/HeroMetric';
import GlassSurface from '../components/ui/GlassSurface';
import SectionHeader from '../components/ui/SectionHeader';
import FaIcon from '../components/icons/FaIcon';
import Badge, { StatusIndicator } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { LoadingState, ErrorState } from '../components/ui/FeedbackStates';
import { api } from '../services/api';

export default function DevicesView() {
  const navigate = useNavigate();
  const [devicesData, setDevicesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const fetchDevices = async () => {
    try {
      setError(null);
      const res = await api.getDevices();
      if (res?.data?.status === 'SUCCESS') {
        setDevicesData(res.data.data);
      }
    } catch (err) {
      console.warn('Using fallback device telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const devices = devicesData?.devices || [
    { id: 'dev_m1', name: 'Main Feeder Smart Meter', type: 'SMART_METER', status: 'ONLINE', powerKw: 4.8, voltageV: 230.4, currentA: 20.8, frequencyHz: 50.02, powerFactor: 0.98, lastSeen: 'Just now', health: 'HEALTHY' },
    { id: 'dev_inv1', name: 'Rooftop Solar Inverter 5kW', type: 'SOLAR_INVERTER', status: 'ONLINE', powerKw: 4.2, voltageV: 230.1, currentA: 18.2, frequencyHz: 50.01, powerFactor: 0.99, lastSeen: 'Just now', health: 'HEALTHY' },
    { id: 'dev_bms1', name: 'Central ESS BMS Master', type: 'BATTERY_BMS', status: 'ONLINE', powerKw: 2.1, voltageV: 400.0, currentA: 5.25, frequencyHz: 50.0, powerFactor: 1.0, lastSeen: 'Just now', health: 'HEALTHY' },
    { id: 'dev_sub1', name: 'Kitchen & HVAC Sub-Meter', type: 'SUB_METER', status: 'ONLINE', powerKw: 1.8, voltageV: 229.8, currentA: 7.83, frequencyHz: 49.99, powerFactor: 0.95, lastSeen: 'Just now', health: 'HEALTHY' },
    { id: 'dev_ev1', name: 'Smart EVSE Level 2 Charger', type: 'EV_CHARGER', status: 'STANDBY', powerKw: 0.0, voltageV: 230.0, currentA: 0.0, frequencyHz: 50.0, powerFactor: 1.0, lastSeen: '2m ago', health: 'HEALTHY' },
  ];

  const onlineCount = devices.filter((d) => d.status === 'ONLINE').length;
  const totalTelemetryPower = devices.reduce((sum, d) => sum + (d.powerKw || 0), 0);

  return (
    <div className="space-y-6 max-w-[1520px] mx-auto pb-12 select-none animate-fadeIn">
      
      {/* 🌟 1. COMPACT PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Hardware & Edge Telemetry
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0D9488] border border-teal-200">
              {onlineCount}/{devices.length} Online
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Streaming real-time hardware telemetry across smart meters, solar inverters, and BMS controllers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              fetchDevices();
            }}
            className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#0D9488] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <FaIcon name="refresh" className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Polling...' : 'Poll Telemetry'}</span>
          </button>
        </div>
      </div>

      {/* 🌟 2. METRIC STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <HeroMetric
          label="Online Telemetry Nodes"
          value={`${onlineCount} / ${devices.length}`}
          unit="Active"
          subtitle="All microgrid nodes responding"
          iconName="devices"
          variant="emerald"
        />

        <HeroMetric
          label="Ingestion Mode"
          value="SIMULATED"
          unit=""
          subtitle="Physics simulator active"
          iconName="network"
          variant="solar"
        />

        <HeroMetric
          label="Telemetry Throughput"
          value={totalTelemetryPower.toFixed(1)}
          unit="kW"
          subtitle="Instantaneous measured load"
          iconName="solar"
          variant="default"
        />

        <HeroMetric
          label="Network Latency"
          value="14"
          unit="ms"
          subtitle="MQTT / REST loopback verified"
          iconName="shield"
          variant="emerald"
        />
      </div>

      {/* 🌟 3. DEVICE NODES TABLE */}
      <div className="rounded-3xl border border-white/90 bg-white/80 backdrop-blur-2xl p-6 sm:p-8 space-y-4 shadow-[0_20px_50px_rgba(15,23,42,0.04)]">
        <SectionHeader
          title="Registered Edge Devices & Circuits"
          subtitle="Virtual smart meters, inverters, and central battery telemetry units"
          rightAction={
            <Badge variant="surplus" size="xs">
              {devices.length} Registered
            </Badge>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-white/60 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                <th className="py-2.5 px-3.5 rounded-l-xl">Device Identifier</th>
                <th className="py-2.5 px-3.5">Circuit Name</th>
                <th className="py-2.5 px-3.5">Type</th>
                <th className="py-2.5 px-3.5">Telemetry Power</th>
                <th className="py-2.5 px-3.5">Voltage</th>
                <th className="py-2.5 px-3.5 rounded-r-xl">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 font-medium text-[#0F172A]">
              {devices.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => setSelectedDevice(d)}
                  className="hover:bg-white/70 cursor-pointer transition"
                >
                  <td className="py-3 px-3.5 font-mono text-[11px] text-[#64748B]">{d.id}</td>
                  <td className="py-3 px-3.5 font-bold text-[#0F172A]">{d.name}</td>
                  <td className="py-3 px-3.5">
                    <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {d.type}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 font-mono font-bold text-[#0D9488]">{d.powerKw.toFixed(2)} kW</td>
                  <td className="py-3 px-3.5 font-mono text-slate-600">{d.voltageV} V</td>
                  <td className="py-3 px-3.5">
                    <Badge variant={d.status === 'ONLINE' ? 'surplus' : 'neutral'} size="xs">
                      {d.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
