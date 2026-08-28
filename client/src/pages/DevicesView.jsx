import React, { useState, useEffect } from 'react';
import FaIcon from '../components/icons/FaIcon';
import Badge, { StatusIndicator } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import MetricCard from '../components/ui/MetricCard';
import { LoadingState, ErrorState } from '../components/ui/FeedbackStates';
import { api } from '../services/api';

export default function DevicesView() {
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
    { id: 'SM-HOUSE-A', name: 'House A Solar Inverter & Smart Meter', type: 'SIMULATED_SMART_METER', status: 'ONLINE', powerKw: 6.8, voltage: 230, lastUpdate: 'Just now', firmware: 'v1.0.4-sim' },
    { id: 'SM-HOUSE-B', name: 'House B EV Circuit Smart Meter', type: 'SIMULATED_SMART_METER', status: 'ONLINE', powerKw: 4.0, voltage: 228, lastUpdate: 'Just now', firmware: 'v1.0.4-sim' },
    { id: 'SM-HOUSE-C', name: 'House C Prosumer Smart Meter', type: 'SIMULATED_SMART_METER', status: 'ONLINE', powerKw: 3.5, voltage: 231, lastUpdate: 'Just now', firmware: 'v1.0.4-sim' },
    { id: 'ESS-BMS-01', name: 'Central ESS Battery Management Unit', type: 'SIMULATED_CONTROLLER', status: 'ONLINE', powerKw: 1.5, voltage: 400, lastUpdate: 'Just now', firmware: 'v2.1.0-sim' },
    { id: 'GRID-SUB-01', name: 'Substation Interconnection Gateway', type: 'SIMULATED_GATEWAY', status: 'ONLINE', powerKw: 0.7, voltage: 415, lastUpdate: 'Just now', firmware: 'v1.2.0-sim' },
  ];

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto pb-8 select-none">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl border border-[#DCE4DE] p-5 sm:p-6 shadow-card">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#12392B] text-white flex items-center justify-center text-xl shadow-sm flex-shrink-0">
            <FaIcon name="devices" className="text-[#41C98A]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#15211B] tracking-tight">
                Simulated Edge Nodes & Devices
              </h1>
              <Badge variant="warning" size="xs">
                SIMULATED TELEMETRY
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#5E6A63] font-medium mt-0.5">
              Virtual smart meters, bidirectional inverter controllers, and future edge hardware boundaries.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchDevices}
            isLoading={refreshing}
            icon={<FaIcon name="rotate" />}
          >
            Poll Telemetry
          </Button>
        </div>
      </div>

      {/* Primary Device Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Active Edge Nodes"
          value={devices.length}
          subtitle="Smart meters & BMS"
          iconName="devices"
          variant="default"
          delta="100% Online"
          deltaType="positive"
        />

        <MetricCard
          title="Telemetry Source"
          value="Simulated"
          subtitle="Physics-based diurnal engine"
          iconName="sliders"
          variant="ai"
          badge="SIMULATED"
        />

        <MetricCard
          title="Connection Health"
          value="100%"
          subtitle="Zero packet drop across mesh"
          iconName="network"
          variant="surplus"
          delta="Stable 6s polling cycle"
          deltaType="positive"
        />

        <MetricCard
          title="Aggregate Edge Load"
          value={`${devices.reduce((sum, d) => sum + (d.powerKw || 0), 0).toFixed(1)} kW`}
          subtitle="Total telemetry throughput"
          iconName="solar"
          variant="solar"
        />
      </div>

      {/* Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {devices.map((device) => (
          <div
            key={device.id}
            onClick={() => setSelectedDevice(device)}
            className={`rounded-2xl border bg-white p-5 shadow-card transition-all cursor-pointer ${
              selectedDevice?.id === device.id
                ? 'border-[#209B67] ring-2 ring-[#209B67]/20'
                : 'border-[#DCE4DE] hover:border-[#C7D2CB]'
            }`}
          >
            <div className="flex items-start justify-between pb-3 border-b border-[#DCE4DE]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E7F6EE] text-[#209B67] flex items-center justify-center text-sm">
                  <FaIcon name="devices" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#15211B]">{device.name}</h3>
                  <span className="text-[11px] font-mono text-[#87918B]">{device.id}</span>
                </div>
              </div>
              <Badge variant="surplus" size="xs">
                <StatusIndicator status="online" pulse />
                <span>ONLINE</span>
              </Badge>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#F5F7F3]">
                <span className="text-[#5E6A63]">Device Role:</span>
                <span className="font-semibold text-[#15211B]">{device.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F5F7F3]">
                <span className="text-[#5E6A63]">Telemetry Power:</span>
                <span className="font-mono font-bold text-[#209B67]">{device.powerKw?.toFixed(2)} kW</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F5F7F3]">
                <span className="text-[#5E6A63]">Bus Voltage:</span>
                <span className="font-mono font-bold text-[#15211B]">{device.voltage} V AC</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F5F7F3]">
                <span className="text-[#5E6A63]">Firmware Build:</span>
                <span className="font-mono text-[#87918B]">{device.firmware}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
