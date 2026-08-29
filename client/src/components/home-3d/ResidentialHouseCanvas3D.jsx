import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import ResidentialHouse3D from './ResidentialHouse3D';
import FaIcon from '../icons/FaIcon';

/**
 * 3D Residential House Canvas
 * Full camera controls, day-to-night lighting calculation, and interactive click-to-inspect drawer.
 */
export default function ResidentialHouseCanvas3D({
  solarKw,
  solarGen,
  loadKw,
  consumption,
  batterySoc = 68,
  batteryCapacity = 10,
  batteryPowerKw,
  gridPowerKw,
  p2pPowerKw,
  appliances = {},
  cloudCover = false,
  timeHour = 12,
  selectedElement = null,
  onSelectElement = () => {},
}) {
  const resolvedSolarKw = solarKw !== undefined ? Number(solarKw) : (solarGen !== undefined ? Number(solarGen) : 4.8);
  const resolvedLoadKw = loadKw !== undefined ? Number(loadKw) : (consumption !== undefined ? Number(consumption) : 2.6);
  const netKw = resolvedSolarKw - resolvedLoadKw;
  const resolvedBatteryPowerKw = batteryPowerKw !== undefined ? Number(batteryPowerKw) : (netKw > 0 ? Math.min(2.0, netKw) : (batterySoc > 20 ? Math.max(-2.0, netKw) : 0));
  const resolvedGridPowerKw = gridPowerKw !== undefined ? Number(gridPowerKw) : (netKw < 0 && batterySoc <= 20 ? netKw : (netKw > 2.5 ? netKw - 2.5 : 0));
  const resolvedP2pPowerKw = p2pPowerKw !== undefined ? Number(p2pPowerKw) : (netKw > 0 ? Math.max(0, netKw - 1.2) : 0);

  // Robust normalization for appliance flags
  const normalizedAppliances = {
    ac: typeof appliances.ac === 'boolean' ? appliances.ac : Boolean(appliances.ac?.active || appliances.hvac?.active),
    fridge: typeof appliances.fridge === 'boolean' ? appliances.fridge : Boolean(appliances.fridge?.active || appliances.kitchen?.active),
    livingRoom: typeof appliances.livingRoom === 'boolean' ? appliances.livingRoom : Boolean(appliances.livingRoom?.active || appliances.lights?.active),
    washingMachine: typeof appliances.washingMachine === 'boolean' ? appliances.washingMachine : Boolean(appliances.washingMachine?.active || appliances.waterHeater?.active),
    ev: typeof appliances.ev === 'boolean' ? appliances.ev : Boolean(appliances.ev?.active),
  };

  // Day / Night Sun Angle & Color
  const sunAngle = ((timeHour - 6) / 12) * Math.PI;
  const isNight = timeHour < 6 || timeHour > 18;
  const isTwilight = (timeHour >= 5 && timeHour <= 7) || (timeHour >= 17 && timeHour <= 19);

  const sunX = Math.cos(sunAngle) * 14;
  const sunY = Math.max(0.5, Math.sin(sunAngle) * 15);
  const sunZ = 9;

  const sunIntensity = isNight ? 0.2 : cloudCover ? 0.65 : isTwilight ? 0.95 : 1.7;
  const sunColor = isNight ? '#38bdf8' : isTwilight ? '#fb923c' : cloudCover ? '#cbd5e1' : '#fffbeb';
  const ambientIntensity = isNight ? 0.35 : cloudCover ? 0.65 : 0.9;

  // Inspect Card Details Dictionary
  const INSPECT_INFO = {
    solar: {
      title: 'Rooftop Solar PV Array',
      iconName: 'solar',
      color: 'text-amber-400',
      stats: [
        { label: 'Current Output', value: `${resolvedSolarKw.toFixed(2)} kW` },
        { label: 'Irradiation Condition', value: cloudCover ? 'Cloud Cover (55%)' : 'Clear Sun (100%)' },
        { label: 'Panel Efficiency', value: '82% Monocrystalline' },
      ],
    },
    battery: {
      title: 'Home Wall Battery (ESS)',
      iconName: 'battery',
      color: 'text-emerald-400',
      stats: [
        { label: 'State of Charge', value: `${batterySoc.toFixed(1)}%` },
        { label: 'Stored Energy', value: `${((batteryCapacity * batterySoc) / 100).toFixed(2)} / ${batteryCapacity} kWh` },
        { label: 'Active Power Flow', value: resolvedBatteryPowerKw > 0 ? `Charging +${resolvedBatteryPowerKw.toFixed(1)} kW` : resolvedBatteryPowerKw < 0 ? `Discharging ${resolvedBatteryPowerKw.toFixed(1)} kW` : 'Idle Standby' },
      ],
    },
    meter: {
      title: 'Smart Bi-Directional Meter',
      iconName: 'overview',
      color: 'text-blue-400',
      stats: [
        { label: 'Active Power', value: resolvedGridPowerKw > 0 ? `Exporting +${resolvedGridPowerKw.toFixed(2)} kW` : resolvedGridPowerKw < 0 ? `Importing ${Math.abs(resolvedGridPowerKw).toFixed(2)} kW` : 'Balanced 0 kW' },
        { label: 'Grid Voltage', value: '230 V (50 Hz)' },
        { label: 'Grid Tariff', value: '₹6.10/kWh Standard' },
      ],
    },
    load: {
      title: 'Active Household Load',
      iconName: 'sparkles',
      color: 'text-cyan-400',
      stats: [
        { label: 'Total Demand', value: `${resolvedLoadKw.toFixed(2)} kW` },
        { label: 'Active Appliances', value: `${Object.values(normalizedAppliances).filter(Boolean).length} Units Running` },
        { label: 'Power Source', value: resolvedSolarKw >= resolvedLoadKw ? '100% Rooftop Solar' : batterySoc > 20 ? 'Solar + Home Battery' : 'Utility Grid' },
      ],
    },
    ac: {
      title: 'Air Conditioner (AC)',
      iconName: 'fan',
      color: 'text-cyan-400',
      stats: [
        { label: 'Rated Power', value: '1.2 kW' },
        { label: 'Status', value: normalizedAppliances.ac ? 'RUNNING (Eco Inverter)' : 'OFFLINE' },
        { label: 'Zone', value: 'Upper Floor Bedroom' },
      ],
    },
    fridge: {
      title: 'Smart Refrigerator',
      iconName: 'home',
      color: 'text-emerald-400',
      stats: [
        { label: 'Rated Power', value: '0.2 kW' },
        { label: 'Status', value: normalizedAppliances.fridge ? 'RUNNING (Compressor Eco)' : 'OFFLINE' },
        { label: 'Zone', value: 'Kitchen' },
      ],
    },
    livingRoom: {
      title: 'Living Room & Entertainment',
      iconName: 'tv',
      color: 'text-indigo-400',
      stats: [
        { label: 'Rated Power', value: '0.4 kW' },
        { label: 'Status', value: normalizedAppliances.livingRoom ? 'ACTIVE (OLED TV + LED)' : 'OFFLINE' },
        { label: 'Zone', value: 'Ground Floor Lounge' },
      ],
    },
    washingMachine: {
      title: 'Smart Washing Machine',
      iconName: 'sliders',
      color: 'text-blue-400',
      stats: [
        { label: 'Rated Power', value: '0.3 kW' },
        { label: 'Status', value: normalizedAppliances.washingMachine ? 'RUNNING (Wash Cycle)' : 'IDLE' },
        { label: 'Zone', value: 'Utility Room' },
      ],
    },
  };

  const selectedInfo = selectedElement ? INSPECT_INFO[selectedElement] : null;

  return (
    <div className="relative h-full w-full bg-gradient-to-b from-[#FAFDF7] via-[#F2F8EC] to-[#E4EFE0] rounded-2xl overflow-hidden shadow-[0_14px_45px_rgba(139,197,61,0.25),inset_0_1px_2px_rgba(255,255,255,0.95)] border-2 border-[#BED69E] ring-2 ring-[#8BC53D]/30 backdrop-blur-xl">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full"
      >
        {/* Optimized isometric 3/4 perspective camera zoomed to fill container end-to-end */}
        <PerspectiveCamera makeDefault position={[8.4, 5.8, 8.8]} fov={33} />

        {/* Orbit Controls */}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.06}
          minDistance={5}
          maxDistance={22}
          maxPolarAngle={Math.PI / 2 - 0.05}
          target={[0, 0.7, 0]}
        />

        {/* Crisp Day Lighting for Architectural White/Glass Aesthetic */}
        <ambientLight intensity={1.3} color="#ffffff" />
        <directionalLight
          position={[sunX, 14, sunZ]}
          intensity={1.8}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={40}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <directionalLight position={[-8, 6, -6]} intensity={0.6} color="#E2F0CC" />
        <pointLight position={[2, 4, 2]} intensity={0.5} color="#8BC53D" />

        <Suspense fallback={null}>
          <ResidentialHouse3D
            solarKw={resolvedSolarKw}
            loadKw={resolvedLoadKw}
            batterySoc={batterySoc}
            batteryCapacity={batteryCapacity}
            batteryPowerKw={resolvedBatteryPowerKw}
            gridPowerKw={resolvedGridPowerKw}
            p2pPowerKw={resolvedP2pPowerKw}
            appliances={normalizedAppliances}
            cloudCover={cloudCover}
            timeHour={timeHour}
            selectedElement={selectedElement}
            onSelectElement={onSelectElement}
          />
        </Suspense>
      </Canvas>

      {/* Top-Left Header Badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
        <div className="rounded-full border border-[#BED69E] bg-white/90 px-3 py-1 backdrop-blur-md shadow-[0_2px_10px_rgba(1,47,19,0.08)] pointer-events-auto">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-[#1E9B68] animate-pulse" />
            <span className="text-[10.5px] font-extrabold text-[#012F13] tracking-wider">
              3D RESIDENTIAL DIGITAL TWIN
            </span>
          </div>
        </div>
      </div>

      {/* Top-Right Click-to-Inspect Compact Floating Drawer */}
      {selectedInfo && (
        <div className="absolute top-3 right-3 max-w-[250px] rounded-2xl border border-[#BED69E] bg-white/95 p-3.5 backdrop-blur-xl shadow-[0_12px_32px_rgba(1,47,19,0.14)] transition-all animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2EED7] mb-2">
            <div className="flex items-center space-x-2">
              <FaIcon name={selectedInfo.iconName} className={`text-sm ${selectedInfo.color}`} />
              <span className="font-extrabold text-xs text-[#012F13] truncate">{selectedInfo.title}</span>
            </div>
            <button
              type="button"
              onClick={() => onSelectElement(null)}
              className="text-[#5E6963] hover:text-[#012F13] p-0.5 rounded transition"
              aria-label="Close details"
            >
              <FaIcon name="close" className="text-xs" />
            </button>
          </div>

          <div className="space-y-1.5 text-[11px]">
            {selectedInfo.stats.map((st, i) => (
              <div key={i} className="flex justify-between items-center text-[#4A5B4F]">
                <span className="text-[#5E6963] text-[10px] font-medium">{st.label}:</span>
                <span className="font-mono font-bold text-[#012F13] text-[10.5px]">{st.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
