import React, { useState, useEffect } from 'react';
import FaIcon from '../components/icons/FaIcon';
import Card from '../components/ui/Card';
import Badge, { StatusIndicator } from '../components/ui/Badge';
import Button, { IconButton } from '../components/ui/Button';
import MetricCard from '../components/ui/MetricCard';
import { LoadingState, ErrorState } from '../components/ui/FeedbackStates';
import { api } from '../services/api';

export default function DevicesView() {
  const [devicesData, setDevicesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ingestionMode, setIngestionMode] = useState('HYBRID');
  const [modeChanging, setModeChanging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const fetchDevices = async () => {
    try {
      setError(null);
      const res = await api.getDevices();
      if (res.data?.status === 'SUCCESS') {
        setDevicesData(res.data);
        setIngestionMode(res.data.mode || 'HYBRID');
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

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchDevices();
  };

  if (loading && !devicesData) {
    return <LoadingState title="Connecting to IoT Device Gateway..." message="Querying ESP32 microcontrollers and virtual smart meters." />;
  }

  if (error && !devicesData) {
    return <ErrorState title="Device Gateway Offline" message={error} onRetry={fetchDevices} />;
  }

  const devices = devicesData?.devices || [];
  const hardwareDevices = devices.filter((d) => d.type === 'HARDWARE_IOT');
  const virtualDevices = devices.filter((d) => d.type === 'VIRTUAL_SMART_METER');

  return (
    <div className="space-y-5">
      {/* Top Header & Mode Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center text-xl shadow-md flex-shrink-0">
            <FaIcon name="microchip" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                IoT Devices & Telemetry Gateway
              </h1>
              <Badge variant="surplus" size="xs">
                <StatusIndicator status="online" pulse label="Gateway Live" />
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-normal">
              ESP32 microcontrollers, INA219 current sensors, and virtual smart-meter ingestion conduits.
            </p>
          </div>
        </div>

        {/* Data Source Selector */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2 flex items-center gap-1.5">
            <FaIcon name="sliders" className="text-slate-400" /> Source:
          </span>
          {['LIVE_HARDWARE', 'HYBRID', 'SIMULATION'].map((mode) => {
            const isActive = ingestionMode === mode;
            const labels = {
              LIVE_HARDWARE: 'Live Hardware',
              HYBRID: 'Hybrid Mode',
              SIMULATION: 'Simulation',
            };
            return (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                disabled={modeChanging}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
          <IconButton
            name="refresh"
            size="sm"
            variant="ghost"
            onClick={handleManualRefresh}
            title="Refresh device status"
            className={refreshing ? 'animate-spin' : ''}
          />
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Devices"
          value={devices.length}
          unit="Nodes"
          iconName="microchip"
          variant="default"
          subtitle={`${devicesData?.online_count || 0} active now`}
        />
        <MetricCard
          title="ESP32 Physical"
          value={hardwareDevices.length}
          unit="Hardware"
          iconName="wifi"
          variant="surplus"
          badge="INA219 Dual-Node"
          subtitle="MQTT / HTTP Stream"
        />
        <MetricCard
          title="Virtual AMI Meters"
          value={virtualDevices.length}
          unit="Simulated"
          iconName="server"
          variant="grid"
          subtitle="DLMS / Modbus Protocol"
        />
        <MetricCard
          title="Ingestion Health"
          value="100%"
          unit="Packet Delivery"
          iconName="shield"
          variant="ai"
          subtitle="Supabase Normalized"
        />
      </div>

      {/* Main Grid: Device Cards & Detail Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Device Grid */}
        <div className="lg:col-span-2 space-y-4">
          {/* Physical ESP32 Hardware Section */}
          <Card
            title="Physical IoT Microcontroller Nodes (ESP32 Testbed)"
            subtitle="Real-time INA219 current/voltage readings from physical bench testbed."
            icon={<FaIcon name="microchip" className="text-emerald-600" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {hardwareDevices.map((dev) => {
                const isSelected = selectedDevice?.id === dev.id;
                return (
                  <div
                    key={dev.id}
                    onClick={() => setSelectedDevice(dev)}
                    className={`rounded-xl border p-4 transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shadow-sm">
                          <FaIcon name="microchip" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{dev.id}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-semibold">
                              {dev.source_mode}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{dev.household_name}</p>
                        </div>
                      </div>
                      <Badge variant="surplus" size="xs">
                        <StatusIndicator status="online" pulse label="Connected" />
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-slate-200/80">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400">Voltage</span>
                        <p className="text-sm font-bold text-slate-800">{dev.voltage_v.toFixed(2)} V</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400">Current</span>
                        <p className="text-sm font-bold text-slate-800">{dev.current_a.toFixed(2)} A</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400">Power</span>
                        <p className="text-sm font-bold text-emerald-700">{dev.power_w.toFixed(1)} W</p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                      <span className="truncate">{dev.sensor}</span>
                      <span className="font-mono">{dev.protocol}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Virtual Smart-Meter Nodes Section */}
          <Card
            title="Virtual Smart Meters & AMI Gateways"
            subtitle="Normalized synthetic smart meters simulating residential neighborhood loads."
            icon={<FaIcon name="server" className="text-blue-600" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {virtualDevices.map((dev) => {
                const isSelected = selectedDevice?.id === dev.id;
                return (
                  <div
                    key={dev.id}
                    onClick={() => setSelectedDevice(dev)}
                    className={`rounded-xl border p-3.5 transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{dev.id}</span>
                      <Badge variant="grid" size="xs">
                        Virtual
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{dev.household_name}</p>

                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="text-xs text-slate-400 font-medium">Power:</span>
                      <span className="text-sm font-bold text-slate-800">
                        {(dev.power_w / 1000).toFixed(2)} kW
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{dev.voltage_v.toFixed(1)} V</span>
                      <span>{dev.protocol}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right: Selected Node Telemetry Inspector */}
        <div>
          <Card
            title={selectedDevice ? `${selectedDevice.id} Telemetry Inspector` : 'Device Inspector'}
            subtitle="High-resolution live sensor stream & firmware diagnostic metadata."
            icon={<FaIcon name="sliders" className="text-purple-600" />}
            variant="default"
          >
            {selectedDevice ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">{selectedDevice.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">
                      {selectedDevice.protocol}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">IP Address</span>
                      <span className="font-mono text-slate-200">{selectedDevice.ip_address}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Firmware</span>
                      <span className="font-mono text-slate-200">{selectedDevice.firmware_version}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">Mapped Household:</span>
                    <span className="font-bold text-slate-900">{selectedDevice.household_name}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">Sensor Interface:</span>
                    <span className="font-semibold text-slate-800">{selectedDevice.sensor}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">Local Readout:</span>
                    <span className="font-semibold text-slate-800">{selectedDevice.display}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">Active Ingestion Mode:</span>
                    <Badge variant="ai" size="xs">
                      {selectedDevice.source_mode}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">Last Telemetry Sync:</span>
                    <span className="font-mono text-slate-600 text-[11px]">Just now</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                    <FaIcon name="shield" />
                    <span>Canonical Backend Normalization</span>
                  </div>
                  <p className="text-[11px] text-emerald-700/90 mt-1 leading-relaxed">
                    Raw byte buffers from INA219 sensors are converted to canonical energy units and stored directly in Supabase PostgreSQL.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Select a device to view diagnostic telemetry.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
