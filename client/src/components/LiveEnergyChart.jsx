import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

export default function LiveEnergyChart({ history = [] }) {
  const [activeTab, setActiveTab] = useState('15m');

  // Multi-horizon datasets
  const data15m = [
    { time: '00:00', generation: 0.0, consumption: 2.2, net: -2.2, uncertaintyUpper: 0.0, uncertaintyLower: 0.0 },
    { time: '03:00', generation: 0.0, consumption: 1.8, net: -1.8, uncertaintyUpper: 0.0, uncertaintyLower: 0.0 },
    { time: '06:00', generation: 1.2, consumption: 3.4, net: -2.2, uncertaintyUpper: 1.5, uncertaintyLower: 0.9 },
    { time: '07:15', generation: 2.1, consumption: 8.7, net: -6.6, uncertaintyUpper: 2.5, uncertaintyLower: 1.7 },
    { time: '09:00', generation: 6.8, consumption: 4.5, net: 2.3, uncertaintyUpper: 7.6, uncertaintyLower: 6.0 },
    { time: '11:30', generation: 11.5, consumption: 7.3, net: 4.2, uncertaintyUpper: 12.4, uncertaintyLower: 10.6 },
    { time: '12:00', generation: 10.8, consumption: 7.6, net: 3.2, uncertaintyUpper: 11.8, uncertaintyLower: 9.8 },
    { time: '15:00', generation: 6.4, consumption: 5.2, net: 1.2, uncertaintyUpper: 7.2, uncertaintyLower: 5.6 },
  ];

  const data1h = [
    { time: '12:00', generation: 10.8, consumption: 7.6, net: 3.2, uncertaintyUpper: 11.8, uncertaintyLower: 9.8 },
    { time: '12:15', generation: 9.9, consumption: 7.2, net: 2.7, uncertaintyUpper: 10.8, uncertaintyLower: 9.0 },
    { time: '12:30', generation: 8.8, consumption: 6.8, net: 2.0, uncertaintyUpper: 9.6, uncertaintyLower: 8.0 },
    { time: '12:45', generation: 7.9, consumption: 6.2, net: 1.7, uncertaintyUpper: 8.6, uncertaintyLower: 7.2 },
    { time: '13:00', generation: 7.2, consumption: 5.8, net: 1.4, uncertaintyUpper: 7.9, uncertaintyLower: 6.5 },
  ];

  const data6h = [
    { time: '12:00', generation: 10.8, consumption: 7.6, net: 3.2, uncertaintyUpper: 11.8, uncertaintyLower: 9.8 },
    { time: '13:30', generation: 8.2, consumption: 6.0, net: 2.2, uncertaintyUpper: 9.0, uncertaintyLower: 7.4 },
    { time: '15:00', generation: 6.4, consumption: 5.2, net: 1.2, uncertaintyUpper: 7.2, uncertaintyLower: 5.6 },
    { time: '16:30', generation: 3.8, consumption: 5.8, net: -2.0, uncertaintyUpper: 4.4, uncertaintyLower: 3.2 },
    { time: '18:00', generation: 1.1, consumption: 7.9, net: -6.8, uncertaintyUpper: 1.4, uncertaintyLower: 0.8 },
  ];

  const data24h = [
    { time: '00:00', generation: 0.0, consumption: 2.2, net: -2.2, uncertaintyUpper: 0.0, uncertaintyLower: 0.0 },
    { time: '03:00', generation: 0.0, consumption: 1.8, net: -1.8, uncertaintyUpper: 0.0, uncertaintyLower: 0.0 },
    { time: '06:00', generation: 1.2, consumption: 3.4, net: -2.2, uncertaintyUpper: 1.5, uncertaintyLower: 0.9 },
    { time: '09:00', generation: 6.8, consumption: 4.5, net: 2.3, uncertaintyUpper: 7.6, uncertaintyLower: 6.0 },
    { time: '12:00', generation: 11.5, consumption: 7.6, net: 3.9, uncertaintyUpper: 12.4, uncertaintyLower: 10.6 },
    { time: '15:00', generation: 6.4, consumption: 5.2, net: 1.2, uncertaintyUpper: 7.2, uncertaintyLower: 5.6 },
    { time: '18:00', generation: 1.1, consumption: 7.9, net: -6.8, uncertaintyUpper: 1.4, uncertaintyLower: 0.8 },
    { time: '21:00', generation: 0.0, consumption: 5.4, net: -5.4, uncertaintyUpper: 0.0, uncertaintyLower: 0.0 },
  ];

  const getChartData = () => {
    switch (activeTab) {
      case '1H': return data1h;
      case '6H': return data6h;
      case '24H': return data24h;
      default: return data15m;
    }
  };

  const chartData = getChartData();

  // Custom Light Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-[rgba(23,34,29,0.12)] bg-white/95 p-3 shadow-md backdrop-blur-md text-xs space-y-1 select-none">
          <div className="font-bold text-[#17221D] border-b border-[rgba(23,34,29,0.06)] pb-1 mb-1">
            Time: {label}
          </div>
          <div className="flex items-center justify-between gap-4 text-[#1E9B68]">
            <span>Generation:</span>
            <span className="font-mono font-bold">{payload[0]?.value?.toFixed(1)} kW</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[#3C78CC]">
            <span>Demand:</span>
            <span className="font-mono font-bold">{payload[1]?.value?.toFixed(1)} kW</span>
          </div>
          {payload[2] && (
            <div className="flex items-center justify-between gap-4 text-[#12392B] pt-0.5 border-t border-[rgba(23,34,29,0.06)] font-bold">
              <span>Net Balance:</span>
              <span className="font-mono">
                {payload[2].value > 0 ? '+' : ''}
                {payload[2].value?.toFixed(1)} kW
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-[rgba(23,34,29,0.08)] bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4 select-none h-full">
      
      {/* Header with Title & Horizon Tabs */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-[#1E9B68]" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#17221D]">
              Community Energy Forecast
            </h3>
          </div>

          {/* Time Horizon Pills */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#F6F7F4] border border-[rgba(23,34,29,0.08)] text-[11px] font-bold">
            {['15m', '1H', '6H', '24H'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-2 py-0.5 rounded-md transition ${
                  activeTab === tab
                    ? 'bg-[#E8F6EE] text-[#1E9B68] font-black shadow-xs'
                    : 'text-[#5E6963] hover:text-[#17221D]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-[#5E6963] mt-0.5">
          How generation and demand are expected to move
        </p>

        {/* Legend Row */}
        <div className="flex items-center space-x-3 text-[11px] text-[#5E6963] pt-2">
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-[#1E9B68]" />
            <span>Generation (kW)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-[#3C78CC]" />
            <span>Demand (kW)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-[#12392B]" />
            <span>Net Balance (kW)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-[#A3E3C7]" />
            <span>Uncertainty</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-44 sm:h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="solarGreenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1E9B68" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#1E9B68" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="demandBlueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3C78CC" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3C78CC" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#EEF2ED" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#89938D"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#EEF2ED' }}
            />
            <YAxis
              stroke="#89938D"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#EEF2ED' }}
              domain={[-4, 12]}
              ticks={[-4, 0, 4, 8, 12]}
            />
            <ReferenceLine y={0} stroke="#D4D9D5" strokeWidth={1} />
            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="generation"
              stroke="#1E9B68"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#solarGreenGrad)"
              name="Generation (kW)"
            />
            <Area
              type="monotone"
              dataKey="consumption"
              stroke="#3C78CC"
              strokeWidth={1.8}
              fillOpacity={1}
              fill="url(#demandBlueGrad)"
              name="Demand (kW)"
            />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#12392B"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              name="Net Balance (kW)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom 3-Metric Summary Strip */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[rgba(23,34,29,0.06)] text-left text-xs">
        <div>
          <div className="text-[10px] font-bold uppercase text-[#5E6963]">Peak Surplus</div>
          <div className="text-sm font-extrabold font-mono text-[#1E9B68]">+4.2 kW</div>
          <div className="text-[10px] text-[#89938D]">around 11:30 AM</div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase text-[#5E6963]">Peak Demand</div>
          <div className="text-sm font-extrabold font-mono text-[#17221D]">8.7 kW</div>
          <div className="text-[10px] text-[#89938D]">around 07:30 AM</div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase text-[#5E6963]">Lowest Balance</div>
          <div className="text-sm font-extrabold font-mono text-[#D45C5C]">-1.8 kW</div>
          <div className="text-[10px] text-[#89938D]">around 07:15 AM</div>
        </div>
      </div>

    </div>
  );
}
