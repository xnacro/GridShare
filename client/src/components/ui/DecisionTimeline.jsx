import React from 'react';
import FaIcon from '../icons/FaIcon';
import Badge from './Badge';

export default function DecisionTimeline({
  events = [],
  title = 'AI Decision Sequence & Dispatch Logic',
  subtitle = 'Sequential explainable intelligence trace',
  className = '',
}) {
  const defaultEvents = [
    {
      time: '12:30:01',
      stage: 'Observe',
      icon: 'solar',
      title: 'Solar Surplus Detected',
      desc: 'House A generated +4.7 kW in excess of local baseline consumption.',
      variant: 'surplus',
    },
    {
      time: '12:30:02',
      stage: 'Predict',
      icon: 'ai',
      title: 'ML Horizon Forecast Generated',
      desc: 'Predicted 60-min community deficit of 2.8 kW across neighboring nodes.',
      variant: 'ai',
    },
    {
      time: '12:30:03',
      stage: 'Evaluate',
      icon: 'battery',
      title: 'ESS Battery Reserve Inspected',
      desc: 'Community battery at 40% SOC with 10% reserve floor preserved for blackouts.',
      variant: 'battery',
    },
    {
      time: '12:30:04',
      stage: 'Match',
      icon: 'users',
      title: 'Nearby Household Demand Matched',
      desc: 'House B actively drawing 4.0 kW on circuit branch A (98% proximity match).',
      variant: 'grid',
    },
    {
      time: '12:30:05',
      stage: 'Optimize',
      icon: 'sliders',
      title: 'Optimal Dispatch Calculated',
      desc: 'Allocated 2.80 kW to P2P peer trade, 1.20 kW to storage, 0.70 kW to grid.',
      variant: 'surplus',
    },
    {
      time: '12:30:06',
      stage: 'Execute',
      icon: 'trade',
      title: 'Trade Recommendation Created',
      desc: 'Bilateral order cleared at fair midpoint ₹4.50/kWh (saving ₹1.60/kWh vs grid).',
      variant: 'surplus',
    },
  ];

  const items = events && events.length > 0 ? events : defaultEvents;

  return (
    <div className={`rounded-2xl border border-[#DDE5E0] bg-white p-5 sm:p-6 shadow-card ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#DDE5E0] gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#F0EBFF] text-[#7657D8] flex items-center justify-center text-base flex-shrink-0">
            <FaIcon name="sparkles" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#102019] tracking-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-[13px] text-[#5D6B64] font-medium">
              {subtitle}
            </p>
          </div>
        </div>
        <Badge variant="ai" size="sm">
          Simulated Trace
        </Badge>
      </div>

      <div className="mt-5 relative">
        {/* Continuous vertical connector line */}
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-[#DDE5E0] hidden sm:block" />

        <div className="space-y-4 sm:space-y-5">
          {items.map((evt, idx) => (
            <div key={idx} className="relative flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 pl-0 sm:pl-10">
              {/* Circle Icon Badge on the line */}
              <div className="hidden sm:flex absolute left-1.5 top-0.5 w-6 h-6 rounded-full bg-white border-2 border-[#168A5A] items-center justify-center text-[10px] text-[#168A5A] shadow-xs">
                <FaIcon name={evt.icon || 'check'} />
              </div>

              <div className="flex-1 rounded-xl border border-[#DDE5E0] bg-[#FBFCFB] p-3.5 hover:bg-white hover:border-[#CBD5CF] transition duration-150">
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-[#168A5A]">
                      {evt.time}
                    </span>
                    <Badge variant={evt.variant || 'default'} size="xs">
                      {evt.stage || 'Step'}
                    </Badge>
                  </div>
                  <span className="text-xs font-bold text-[#102019]">
                    {evt.title}
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] text-[#5D6B64] leading-relaxed">
                  {evt.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
