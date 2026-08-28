import React from 'react';
import FaIcon from '../icons/FaIcon';
import Badge from './Badge';

export default function DecisionTimeline({
  steps = [],
  currentStepIndex = 3,
  className = '',
}) {
  const defaultSteps = [
    {
      key: 'observe',
      stage: 'OBSERVE',
      time: '12:30:01',
      title: 'Telemetry Ingested',
      description: 'Solar surplus (+4.70 kW) detected at House A. EV deficit (-2.80 kW) at House B.',
      status: 'completed',
      icon: 'eye',
      color: 'emerald',
    },
    {
      key: 'predict',
      stage: 'PREDICT',
      time: '12:30:02',
      title: 'ML Forecast Generated',
      description: 'Random Forest projects sustained midday generation (+4.5 kW) for next 2.5 hours.',
      status: 'completed',
      icon: 'ai',
      color: 'purple',
    },
    {
      key: 'optimize',
      stage: 'OPTIMIZE',
      time: '12:30:04',
      title: 'Storage & Rule Solver',
      description: 'Battery reserve floor checked (40% > 20%). Routing 2.8kW to P2P, 1.2kW to ESS, 0.7kW to Grid.',
      status: 'completed',
      icon: 'sliders',
      color: 'amber',
    },
    {
      key: 'trade',
      stage: 'TRADE',
      time: '12:30:06',
      title: 'Double-Auction Execution',
      description: 'P2P contract settled at ₹4.50/kWh. Consumer saves ₹4.48/hr; Prosumer earns +₹2.80/hr.',
      status: 'active',
      icon: 'trade',
      color: 'blue',
    },
  ];

  const displaySteps = steps.length > 0 ? steps : defaultSteps;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          AI Decision Progression
        </span>
        <Badge variant="ai" size="xs" icon={<FaIcon name="sparkles" />}>
          Autonomous Loop
        </Badge>
      </div>

      <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {displaySteps.map((step, idx) => {
          const isDone = idx <= currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          const dotColor = {
            emerald: 'bg-emerald-500 ring-emerald-100',
            purple: 'bg-purple-500 ring-purple-100',
            amber: 'bg-amber-500 ring-amber-100',
            blue: 'bg-blue-500 ring-blue-100',
          }[step.color || 'emerald'] || 'bg-slate-400 ring-slate-100';

          return (
            <div key={step.key || idx} className="relative group">
              {/* Dot */}
              <div
                className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ring-4 transition-all duration-200 ${dotColor} ${
                  isCurrent ? 'scale-125' : ''
                }`}
              />

              {/* Step Content */}
              <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      {step.stage}
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {step.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {step.time}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
