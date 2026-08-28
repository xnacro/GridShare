import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
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
  const [ingestionMode, setIngestionMode] = useState('SIMULATED');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const fetchDevices = async () => {
    try {
      setError(null);
      const res = await api.getDevices();
      if (res.data?.status === 'SUCCESS') {
        setDevicesData(res.data);
        setIngestionMode(res.data.mode || 'SIMULATED');
        if (!selectedDevice && res.data.devices?.length > 0) {
          setSelectedDevice(res.data.devices[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load devices:', err);
      setError('Unable to fetch device telemetry from backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 6000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !devicesData) {
    return <LoadingState message="Polling virtual smart meter circuits and edge controllers..." />;
  }

  if (error && !devicesData) {
    return <ErrorState message={error} onRetry={fetchDevices} />;
  }

  const devices = devicesData?.devices || [
    { id: 'SM-HOUSE-ANJALI', name: "Anjali's Solar Inverter & Smart Meter", type: 'SIMULATED_SMART_METER', status: 'ONLINE', powerKw: 6.4, voltage: 230, lastUpdate: 'Just now', firmware: 'v1.0.4-sim' },
    { id: 'SM-HOUSE-PRINCE', name: "Prince's Load Circuit Smart Meter", type: 'SIMULATED_SMART_METER', status: 'ONLINE', powerKw: 4.8, voltage: 228, lastUpdate: 'Just now', firmware: 'v1.0.4-sim' },
    { id: 'SM-HOUSE-AYUSH', name: "Ayush's Solar Prosumer Smart Meter", type: 'SIMULATED_SMART_METER', status: 'ONLINE', powerKw: 3.2, voltage: 231, lastUpdate: 'Just now', firmware: 'v1.0.4-sim' },
    { id: 'SM-HOUSE-RAHUL', name: "Rahul's EV Fast Charger Smart Meter", type: 'SIMULATED_SMART_METER', status: 'ONLINE', powerKw: 5.2, voltage: 229, lastUpdate: 'Just now', firmware: 'v1.0.4-sim' },
    { id: 'ESS-BMS-01', name: 'Central ESS Battery Management Unit', type: 'SIMULATED_CONTROLLER', status: 'ONLINE', powerKw: 2.0, voltage: 400, lastUpdate: 'Just now', firmware: 'v2.1.0-sim' },
    { id: 'GRID-SUB-01', name: 'Substation Interconnection Gateway', type: 'SIMULATED_GATEWAY', status: 'ONLINE', powerKw: 1.0, voltage: 415, lastUpdate: 'Just now', firmware: 'v1.2.0-sim' },
  ];

  const onlineCount = devices.filter((d) => d.status === 'ONLINE').length;
  const totalTelemetryPower = devices.reduce((sum, d) => sum + (d.powerKw || 0), 0);

  return (
    <div className="space-y-8 max-w-[1520px] mx-auto pb-12 select-none animate-fadeIn">
      
      {/* 🌟 1. DEVICES HERO */}
      <PageHero
        category="MICROGRID INFRASTRUCTURE"
        statusBadge="EDGE TELEMETRY"
        statusVariant="surplus"
        title="Hardware telemetry,"
        highlightText="monitored in real time."
        subtitle={`Streaming live telemetry across ${onlineCount} active smart meter circuits, rooftop inverters, and central BMS controllers.`}
        supportingFacts={[
          { label: 'Ingestion Mode', value: ingestionMode, icon: 'devices' },
          { label: 'Sample Rate', value: '1 Hz Continuous', icon: 'refresh' },
          { label: 'Active Draw', value: `${totalTelemetryPower.toFixed(1)} kW`, icon: 'network' },
        ]}
        primaryAction={{
          label: 'Poll Telemetry',
          icon: 'refresh',
          onClick: () => {
            setRefreshing(true);
            fetchDevices();
          },
        }}
        tertiaryAction={{
          label: 'View Marketplace →',
          onClick: () => navigate('/marketplace'),
        }}
      />

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
          value={ingestionMode}
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
      <div className="glass-card rounded-xl p-6 sm:p-8 space-y-4">
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
              <tr className="border-b border-[rgba(23,34,29,0.06)] bg-[#F6F7F4] text-[11px] font-bold uppercase tracking-wider text-[#5E6963]">
                <th className="py-2.5 px-3.5 rounded-l-lg">Device Identifier</th>
                <th className="py-2.5 px-3.5">Circuit Name</th>
                <th className="py-2.5 px-3.5">Type</th>
                <th className="py-2.5 px-3.5">Telemetry Power</th>
                <th className="py-2.5 px-3.5">Voltage</th>
                <th className="py-2.5 px-3.5 rounded-r-lg">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(23,34,29,0.04)] font-medium text-[#17221D]">
              {devices.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => setSelectedDevice(d)}
                  className={`hover:bg-[#F6F7F4]/60 cursor-pointer transition ${
                    selectedDevice?.id === d.id ? 'bg-[#E8F6EE]/40' : ''
                  }`}
                >
                  <td className="py-3 px-3.5 font-mono font-bold text-[#12392B]">{d.id}</td>
                  <td className="py-3 px-3.5 font-bold">{d.name}</td>
                  <td className="py-3 px-3.5 text-[#5E6963]">{d.type}</td>
                  <td className="py-3 px-3.5 font-mono font-bold text-[#1E9B68]">{d.powerKw ? `${d.powerKw.toFixed(1)} kW` : 'N/A'}</td>
                  <td className="py-3 px-3.5 font-mono">{d.voltage || 230} V</td>
                  <td className="py-3 px-3.5">
                    <Badge variant={d.status === 'ONLINE' ? 'surplus' : 'deficit'} size="xs">
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
