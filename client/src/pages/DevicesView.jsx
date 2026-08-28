import React, { useState, useEffect } from 'react';
import FaIcon from '../components/icons/FaIcon';
import Badge, { StatusIndicator } from '../components/ui/Badge';
import Button, { IconButton } from '../components/ui/Button';
import MetricCard from '../components/ui/MetricCard';
import { LoadingState, ErrorState } from '../components/ui/FeedbackStates';
import { api } from '../services/api';

export default function DevicesView() {
  const [devicesData, setDevicesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ingestionMode, setIngestionMode] = useState('SIMULATED');
  const [modeChanging, setModeChanging] = useState(false);
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
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleModeChange = async (newMode) => {
    try {
      setModeChanging(true);
      await api.setDeviceMode(newMode);
      setIngestionMode(newMode);
      await fetchDevices();
    } catch (err) {
      console.error('Failed to update ingestion mode:', err);
    } finally {
      setModeChanging(false);
    }
  };

  if (loading && !devicesData) {
    return <LoadingState title="Connecting to Simulated Gateway..." message="Polling virtual smart meter circuits and edge controllers." />;
  }

  if (error && !devicesData) {
    return <ErrorState title="Device Gateway Offline" message={error} onRetry={fetchDevices} />;
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
      
      {/* Top Header & Mode Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-[#DDE5E0] p-5 shadow-card">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#163A2B] text-white flex items-center justify-center text-xl shadow-sm flex-shrink-0">
            <FaIcon name="microchip" className="text-[#34B978]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#102019] tracking-tight">
                Simulated Edge Nodes & Devices
              </h1>
              <Badge variant="warning" size="xs">
                SIMULATED TELEMETRY
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#5D6B64] font-medium mt-0.5">
              Virtual smart meters, bidirectional inverter controllers, and future edge hardware boundaries.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDevices}
            isLoading={refreshing}
            icon={<FaIcon name="refresh" className={refreshing ? 'animate-spin' : ''} />}
          >
            Poll Nodes
          </Button>
        </div>
      </div>

      {/* Primary Device Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Active Simulation Nodes"
          value={devices.length}
          subtitle="Smart meters & controllers"
          iconName="microchip"
          variant="default"
          delta="100% Online"
          deltaType="positive"
        />

        <MetricCard
          title="Telemetry Data Source"
          value="Simulated"
          subtitle="Physics-based diurnal engine"
          iconName="sliders"
          variant="ai"
          badge="SIMULATED"
        />

        <MetricCard
          title="Connection Health"
          value="100%"
          subtitle="Zero packet loss across mesh"
          iconName="wifi"
          variant="surplus"
          delta="Stable 5s polling cycle"
          deltaType="positive"
        />

        <MetricCard
          title="Aggregate Edge Load"
          value={`${devices.reduce((sum, d) => sum + (d.powerKw || 0), 0).toFixed(1)} kW`}
          subtitle="Total telemetry throughput"
          iconName="energy"
          variant="solar"
        />
      </div>

      {/* Node List & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Devices List Table (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-[#DDE5E0] bg-white p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDE5E0]">
            <div>
              <h3 className="text-base font-bold text-[#102019]">
                Configured Edge Telemetry Nodes
              </h3>
              <p className="text-xs text-[#5D6B64]">
                Click any device to inspect firmware parameters and circuit state
              </p>
            </div>
            <Badge variant="default" size="xs">
              {devices.length} Nodes
            </Badge>
          </div>

          <div className="space-y-2.5">
            {devices.map((d) => {
              const isSelected = selectedDevice?.id === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDevice(d)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#E7F5EE] border-[#168A5A] shadow-xs'
                      : 'bg-[#FBFCFB] border-[#DDE5E0] hover:bg-white hover:border-[#CBD5CF]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                      isSelected ? 'bg-[#168A5A] text-white' : 'bg-[#F5F7F6] text-[#5D6B64]'
                    }`}>
                      <FaIcon name="microchip" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#102019]">{d.name}</div>
                      <div className="text-xs text-[#83908A]">{d.id} • {d.firmware || 'v1.0.4'}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs font-mono">
                    <div>
                      <span className="text-[#83908A] text-[10px] block">Active Draw:</span>
                      <span className="font-bold text-[#102019]">{d.powerKw || 0} kW</span>
                    </div>
                    <div>
                      <span className="text-[#83908A] text-[10px] block">Voltage:</span>
                      <span className="font-bold text-[#102019]">{d.voltage || 230} V</span>
                    </div>
                    <Badge variant="surplus" size="xs">
                      ONLINE
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Device Detail Panel (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-[#DDE5E0] bg-white p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDE5E0]">
            <div>
              <h3 className="text-base font-bold text-[#102019]">
                Device Inspector
              </h3>
              <p className="text-xs text-[#5D6B64]">
                Hardware telemetry configuration
              </p>
            </div>
            <Badge variant="warning" size="xs">
              SIMULATED
            </Badge>
          </div>

          {selectedDevice ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FBFCFB] border border-[#DDE5E0] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#83908A]">Device Identification</span>
                <div className="text-sm font-bold text-[#102019]">{selectedDevice.name}</div>
                <div className="text-xs font-mono text-[#5D6B64]">UUID: {selectedDevice.id}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-[#FBFCFB] border border-[#DDE5E0]">
                  <span className="text-[10px] text-[#83908A]">Telemetry Source</span>
                  <div className="font-bold text-[#102019] mt-0.5">Physics Model</div>
                </div>
                <div className="p-3 rounded-xl bg-[#FBFCFB] border border-[#DDE5E0]">
                  <span className="text-[10px] text-[#83908A]">Polling Interval</span>
                  <div className="font-bold text-[#102019] mt-0.5">5.0 Seconds</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#E7F5EE] border border-[#DDE5E0] space-y-1">
                <span className="font-bold text-[#168A5A] block">Hardware Integration Ready</span>
                <p className="text-[#5D6B64] text-[11.5px] leading-relaxed">
                  This device boundary exposes standardized JSON ingestion schemas ready to bind to physical ESP32 or MQTT telemetry in future hardware phases.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-[#83908A]">
              Select a device from the list to view telemetry parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
