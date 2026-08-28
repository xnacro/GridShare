import React from 'react';
import FaIcon from '../icons/FaIcon';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function CommunityInputPanel({
  values,
  onChange,
  errors = {},
  onRunGridshare,
  onLoadDemo,
  onReset,
  onDemoMode,
  isProcessing = false,
  isSimulating = false,
}) {
  const handleChange = (field, subfield, val) => {
    onChange(field, subfield, val);
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
            <FaIcon name="sliders" className="text-xs" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Community Input Panel
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">
              Configure real-time telemetry inputs and run microgrid routing
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLoadDemo}
          disabled={isProcessing}
          className="flex items-center space-x-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100 transition active:scale-95 disabled:opacity-50"
          title="Load standard demo scenario (House A 6.8/2.1, House B 1.2/4.0, Battery 20kWh/40%, Grid ₹6)"
        >
          <FaIcon name="sparkles" className="text-amber-600 text-xs" />
          <span>Load Demo Data</span>
        </button>
      </div>

      {/* Input Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3.5">
        {/* House A Card */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5">
              <FaIcon name="solar" className="text-amber-500 text-xs" />
              <span className="text-[11.5px] font-extrabold text-slate-900">House A</span>
            </div>
            <Badge variant="surplus" size="xs">
              Solar Champion
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div>
              <label className="flex items-center justify-between text-[10px] font-medium text-slate-600 mb-0.5">
                <span>Solar Generation</span>
                <span className="font-mono text-slate-400">kW</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={values.houseA.generation}
                onChange={(e) => handleChange('houseA', 'generation', e.target.value)}
                disabled={isProcessing}
                className={`w-full rounded-lg border px-2.5 py-1 text-xs font-mono font-bold text-slate-900 bg-white transition focus:outline-none focus:ring-1.5 ${
                  errors.houseAGen ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:ring-emerald-500'
                }`}
              />
              {errors.houseAGen && (
                <p className="text-[9px] text-rose-500 font-semibold mt-0.5">{errors.houseAGen}</p>
              )}
            </div>

            <div>
              <label className="flex items-center justify-between text-[10px] font-medium text-slate-600 mb-0.5">
                <span>Consumption</span>
                <span className="font-mono text-slate-400">kW</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={values.houseA.consumption}
                onChange={(e) => handleChange('houseA', 'consumption', e.target.value)}
                disabled={isProcessing}
                className={`w-full rounded-lg border px-2.5 py-1 text-xs font-mono font-bold text-slate-900 bg-white transition focus:outline-none focus:ring-1.5 ${
                  errors.houseACon ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:ring-emerald-500'
                }`}
              />
              {errors.houseACon && (
                <p className="text-[9px] text-rose-500 font-semibold mt-0.5">{errors.houseACon}</p>
              )}
            </div>
          </div>
        </div>

        {/* House B Card */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5">
              <FaIcon name="home" className="text-blue-500 text-xs" />
              <span className="text-[11.5px] font-extrabold text-slate-900">House B</span>
            </div>
            <Badge variant="ai" size="xs">
              EV Consumer
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div>
              <label className="flex items-center justify-between text-[10px] font-medium text-slate-600 mb-0.5">
                <span>Solar Generation</span>
                <span className="font-mono text-slate-400">kW</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={values.houseB.generation}
                onChange={(e) => handleChange('houseB', 'generation', e.target.value)}
                disabled={isProcessing}
                className={`w-full rounded-lg border px-2.5 py-1 text-xs font-mono font-bold text-slate-900 bg-white transition focus:outline-none focus:ring-1.5 ${
                  errors.houseBGen ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:ring-emerald-500'
                }`}
              />
              {errors.houseBGen && (
                <p className="text-[9px] text-rose-500 font-semibold mt-0.5">{errors.houseBGen}</p>
              )}
            </div>

            <div>
              <label className="flex items-center justify-between text-[10px] font-medium text-slate-600 mb-0.5">
                <span>Consumption</span>
                <span className="font-mono text-slate-400">kW</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={values.houseB.consumption}
                onChange={(e) => handleChange('houseB', 'consumption', e.target.value)}
                disabled={isProcessing}
                className={`w-full rounded-lg border px-2.5 py-1 text-xs font-mono font-bold text-slate-900 bg-white transition focus:outline-none focus:ring-1.5 ${
                  errors.houseBCon ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:ring-emerald-500'
                }`}
              />
              {errors.houseBCon && (
                <p className="text-[9px] text-rose-500 font-semibold mt-0.5">{errors.houseBCon}</p>
              )}
            </div>
          </div>
        </div>

        {/* Community Battery Card */}
        <div className="rounded-xl border border-teal-200/80 bg-teal-50/40 p-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5">
              <FaIcon name="battery" className="text-teal-600 text-xs" />
              <span className="text-[11.5px] font-extrabold text-slate-900">Community Battery</span>
            </div>
            <Badge variant="battery" size="xs">
              Shared ESS
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div>
              <label className="flex items-center justify-between text-[10px] font-medium text-slate-600 mb-0.5">
                <span>Total Capacity</span>
                <span className="font-mono text-slate-400">kWh</span>
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={values.battery.capacity}
                onChange={(e) => handleChange('battery', 'capacity', e.target.value)}
                disabled={isProcessing}
                className={`w-full rounded-lg border px-2.5 py-1 text-xs font-mono font-bold text-slate-900 bg-white transition focus:outline-none focus:ring-1.5 ${
                  errors.batteryCap ? 'border-rose-400 focus:ring-rose-400' : 'border-teal-300 focus:ring-teal-500'
                }`}
              />
              {errors.batteryCap && (
                <p className="text-[9px] text-rose-500 font-semibold mt-0.5">{errors.batteryCap}</p>
              )}
            </div>

            <div>
              <label className="flex items-center justify-between text-[10px] font-medium text-slate-600 mb-0.5">
                <span>Current SOC</span>
                <span className="font-mono text-slate-400">%</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={values.battery.soc}
                onChange={(e) => handleChange('battery', 'soc', e.target.value)}
                disabled={isProcessing}
                className={`w-full rounded-lg border px-2.5 py-1 text-xs font-mono font-bold text-slate-900 bg-white transition focus:outline-none focus:ring-1.5 ${
                  errors.batterySoc ? 'border-rose-400 focus:ring-rose-400' : 'border-teal-300 focus:ring-teal-500'
                }`}
              />
              {errors.batterySoc && (
                <p className="text-[9px] text-rose-500 font-semibold mt-0.5">{errors.batterySoc}</p>
              )}
            </div>
          </div>
        </div>

        {/* Utility Grid Card */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5">
              <FaIcon name="grid" className="text-slate-700 text-xs" />
              <span className="text-[11.5px] font-extrabold text-slate-900">Utility Grid</span>
            </div>
            <Badge variant="default" size="xs">
              Interconnect
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div>
              <label className="flex items-center justify-between text-[10px] font-medium text-slate-600 mb-0.5">
                <span>Grid Export Price</span>
                <span className="font-mono text-slate-400">₹/kWh</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={values.grid.exportPrice}
                onChange={(e) => handleChange('grid', 'exportPrice', e.target.value)}
                disabled={isProcessing}
                className={`w-full rounded-lg border px-2.5 py-1 text-xs font-mono font-bold text-slate-900 bg-white transition focus:outline-none focus:ring-1.5 ${
                  errors.gridPrice ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:ring-emerald-500'
                }`}
              />
              {errors.gridPrice && (
                <p className="text-[9px] text-rose-500 font-semibold mt-0.5">{errors.gridPrice}</p>
              )}
            </div>

            <div className="rounded-lg bg-emerald-50/80 border border-emerald-200/60 p-1.5 text-[10px] text-emerald-800">
              <span className="font-bold">P2P Tariff: </span>
              <span className="font-mono font-extrabold">₹4.50/kWh</span>
              <p className="text-[9px] text-emerald-700 font-medium mt-0.2">
                Saves ₹1.50/kWh vs. Grid export
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={onRunGridshare}
            disabled={isProcessing}
            icon={<FaIcon name={isProcessing ? "refresh" : "play"} className={isProcessing ? "animate-spin" : ""} />}
          >
            {isProcessing ? 'Processing Routing...' : 'RUN GRIDSHARE'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onDemoMode}
            disabled={isProcessing}
            icon={<FaIcon name="sparkles" />}
          >
            DEMO MODE
          </Button>

          {isSimulating && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRunGridshare}
              disabled={isProcessing}
              icon={<FaIcon name="refresh" />}
            >
              RUN AGAIN
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={isProcessing}
          icon={<FaIcon name="refresh" />}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
