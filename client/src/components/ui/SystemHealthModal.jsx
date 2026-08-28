import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import FaIcon from '../icons/FaIcon';
import Badge, { StatusIndicator } from './Badge';
import Button from './Button';

export default function SystemHealthModal({ isOpen, onClose }) {
  const [healthData, setHealthData] = useState({
    backend: 'healthy',
    database: 'healthy',
    realtime: 'connected',
    simulation: 'running',
    mode: 'Simulation / IoT Smart Grid',
    dbHost: 'aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres',
    version: '1.0.0',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealth = async () => {
    try {
      setIsRefreshing(true);
      const res = await api.getHealth();
      if (res.data) {
        setHealthData((prev) => ({
          ...prev,
          backend: res.data.status === 'healthy' ? 'healthy' : 'degraded',
          database: res.data.database || 'healthy',
          mode: res.data.mode || 'Simulation / IoT Smart Grid',
          version: res.data.version || '1.0.0',
        }));
      }
    } catch (e) {
      setHealthData((prev) => ({ ...prev, backend: 'offline', database: 'disconnected' }));
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102019]/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-[#DDE5E0] bg-white p-6 shadow-modal animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between pb-4 border-b border-[#DDE5E0]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#E7F5EE] text-[#168A5A] flex items-center justify-center text-lg flex-shrink-0">
              <FaIcon name="health" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#102019]">
                System Infrastructure & Health
              </h3>
              <p className="text-xs text-[#5D6B64]">
                Telemetry pipes, database connectivity, and simulation engine
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#83908A] hover:text-[#102019] text-sm font-bold p-1 rounded-lg hover:bg-[#F5F7F6]"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {/* Backend Service */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#DDE5E0] bg-[#FBFCFB]">
            <div className="flex items-center space-x-3">
              <FaIcon name="server" className="text-[#5D6B64]" />
              <div>
                <div className="text-sm font-bold text-[#102019]">Backend REST API</div>
                <div className="text-xs text-[#83908A]">Flask Python Engine v{healthData.version}</div>
              </div>
            </div>
            <Badge variant={healthData.backend === 'healthy' ? 'surplus' : 'deficit'} size="sm">
              <StatusIndicator status={healthData.backend} pulse={healthData.backend === 'healthy'} />
              <span className="capitalize">{healthData.backend}</span>
            </Badge>
          </div>

          {/* Database */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#DDE5E0] bg-[#FBFCFB]">
            <div className="flex items-center space-x-3">
              <FaIcon name="grid" className="text-[#3678D4]" />
              <div>
                <div className="text-sm font-bold text-[#102019]">Primary Database</div>
                <div className="text-xs text-[#83908A]">Supabase PostgreSQL (Authoritative)</div>
              </div>
            </div>
            <Badge variant={healthData.database === 'healthy' ? 'surplus' : 'deficit'} size="sm">
              <StatusIndicator status={healthData.database === 'healthy' ? 'connected' : 'offline'} />
              <span>{healthData.database === 'healthy' ? 'Connected' : 'Offline'}</span>
            </Badge>
          </div>

          {/* Realtime Telemetry */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#DDE5E0] bg-[#FBFCFB]">
            <div className="flex items-center space-x-3">
              <FaIcon name="wifi" className="text-[#168A5A]" />
              <div>
                <div className="text-sm font-bold text-[#102019]">Realtime WebSocket & SSE</div>
                <div className="text-xs text-[#83908A]">Active bi-directional stream mesh</div>
              </div>
            </div>
            <Badge variant="surplus" size="sm">
              <StatusIndicator status="online" pulse />
              <span>Connected</span>
            </Badge>
          </div>

          {/* Simulation Engine */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#DDE5E0] bg-[#FBFCFB]">
            <div className="flex items-center space-x-3">
              <FaIcon name="sliders" className="text-[#E8A72B]" />
              <div>
                <div className="text-sm font-bold text-[#102019]">Microgrid Simulation</div>
                <div className="text-xs text-[#83908A]">{healthData.mode}</div>
              </div>
            </div>
            <Badge variant="warning" size="sm">
              <span>Running</span>
            </Badge>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#DDE5E0] flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHealth}
            isLoading={isRefreshing}
            icon={<FaIcon name="refresh" className={isRefreshing ? 'animate-spin' : ''} />}
          >
            Check Status
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
