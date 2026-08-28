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
    demandModel: 'available',
    solarModel: 'available',
    mode: 'Guwahati Microgrid Cluster',
    version: '2.0.0',
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
          mode: res.data.mode || 'Guwahati Microgrid Cluster',
          version: res.data.version || '2.0.0',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#15211B]/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl border border-[#DCE4DE] bg-white p-6 shadow-modal animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between pb-4 border-b border-[#DCE4DE]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E7F6EE] text-[#209B67] flex items-center justify-center text-lg flex-shrink-0">
              <FaIcon name="health" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#15211B]">
                System Infrastructure & Health
              </h3>
              <p className="text-xs text-[#5E6A63]">
                Telemetry pipelines, cloud database, and ML models
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#87918B] hover:text-[#15211B] text-sm font-bold p-1 rounded-lg hover:bg-[#F5F7F3]"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {/* Backend Service */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#DCE4DE] bg-[#FBFCFA]">
            <div className="flex items-center space-x-3">
              <FaIcon name="server" className="text-[#5E6A63]" />
              <div>
                <div className="text-sm font-bold text-[#15211B]">Backend REST API</div>
                <div className="text-xs text-[#87918B]">Flask Python Engine v{healthData.version}</div>
              </div>
            </div>
            <Badge variant={healthData.backend === 'healthy' ? 'surplus' : 'deficit'} size="sm">
              <StatusIndicator status={healthData.backend} pulse={healthData.backend === 'healthy'} />
              <span className="capitalize">{healthData.backend}</span>
            </Badge>
          </div>

          {/* Database */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#DCE4DE] bg-[#FBFCFA]">
            <div className="flex items-center space-x-3">
              <FaIcon name="grid" className="text-[#397BD2]" />
              <div>
                <div className="text-sm font-bold text-[#15211B]">Primary Database</div>
                <div className="text-xs text-[#87918B]">PostgreSQL Ledger (Authoritative)</div>
              </div>
            </div>
            <Badge variant={healthData.database === 'healthy' ? 'surplus' : 'deficit'} size="sm">
              <StatusIndicator status={healthData.database === 'healthy' ? 'connected' : 'offline'} />
              <span>{healthData.database === 'healthy' ? 'Connected' : 'Offline'}</span>
            </Badge>
          </div>

          {/* ML Models */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#DCE4DE] bg-[#FBFCFA]">
            <div className="flex items-center space-x-3">
              <FaIcon name="ai" className="text-[#7359C8]" />
              <div>
                <div className="text-sm font-bold text-[#15211B]">Hornet AI Models</div>
                <div className="text-xs text-[#87918B]">demand_v1 & solar_v1 (150 trees)</div>
              </div>
            </div>
            <Badge variant="ai" size="sm">
              <StatusIndicator status="online" pulse />
              <span>Available</span>
            </Badge>
          </div>

          {/* Operating Cluster */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#DCE4DE] bg-[#FBFCFA]">
            <div className="flex items-center space-x-3">
              <FaIcon name="solar" className="text-[#E7AA31]" />
              <div>
                <div className="text-sm font-bold text-[#15211B]">Operating Scope</div>
                <div className="text-xs text-[#87918B]">{healthData.mode}</div>
              </div>
            </div>
            <Badge variant="warning" size="sm">
              <span>Active</span>
            </Badge>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#DCE4DE] flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHealth}
            isLoading={isRefreshing}
            icon={<FaIcon name="rotate" />}
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
