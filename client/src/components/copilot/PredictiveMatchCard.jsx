import React from 'react';
import { useNavigate } from 'react-router-dom';
import FaIcon from '../icons/FaIcon';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function PredictiveMatchCard({ predictiveMatch, onApprove }) {
  const navigate = useNavigate();

  if (!predictiveMatch || !predictiveMatch.has_match) {
    return (
      <div className="glass-card rounded-xl p-5 text-center space-y-2">
        <FaIcon name="handshake" className="text-[#89938D] text-lg mx-auto" />
        <h4 className="text-xs font-bold text-[#17221D]">No Active Local Peer Matches Required</h4>
        <p className="text-xs text-[#5E6963]">Your household is balanced or current battery reserves are handling microgrid flows.</p>
      </div>
    );
  }

  const {
    partner_name,
    partner_household_id,
    trade_kwh,
    price_rs,
    grid_benchmark_rs = 6.10,
    savings_rs = 1.26,
    distance_meters = 55,
    match_reasons = []
  } = predictiveMatch;

  return (
    <div className="glass-card rounded-xl p-5 sm:p-6 space-y-4 border-l-4 border-l-[#1E9B68] animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[rgba(23,34,29,0.06)] gap-2">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-[#EBF7F1] flex items-center justify-center text-[#1E9B68]">
            <FaIcon name="handshake" className="text-sm" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-[#17221D]">Predictive P2P Match Opportunity</h3>
              <Badge variant="surplus" size="xs">Optimal Match</Badge>
            </div>
            <p className="text-xs text-[#5E6963]">
              Paired with <strong>{partner_name}</strong> • {distance_meters}m peer distance
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-[#5E6963]">Peer Tariff</span>
            <p className="text-sm font-bold text-[#1E9B68]">₹{price_rs?.toFixed(2)} / kWh</p>
          </div>
          <div className="text-right pl-3 border-l border-[rgba(23,34,29,0.08)]">
            <span className="text-[10px] uppercase font-bold text-[#5E6963]">Peer Savings</span>
            <p className="text-sm font-bold text-[#17221D]">₹{savings_rs?.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Match Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
        <div className="bg-[#F8FAF9] p-3 rounded-lg border border-[rgba(23,34,29,0.06)]">
          <span className="text-[10px] uppercase font-bold text-[#5E6963]">Trade Volume</span>
          <p className="text-sm font-bold text-[#17221D] mt-0.5">{trade_kwh?.toFixed(2)} kWh</p>
        </div>
        <div className="bg-[#F8FAF9] p-3 rounded-lg border border-[rgba(23,34,29,0.06)]">
          <span className="text-[10px] uppercase font-bold text-[#5E6963]">Grid Benchmark</span>
          <p className="text-sm font-bold text-[#5E6963] mt-0.5">₹{grid_benchmark_rs?.toFixed(2)} / kWh</p>
        </div>
        <div className="bg-[#F8FAF9] p-3 rounded-lg border border-[rgba(23,34,29,0.06)]">
          <span className="text-[10px] uppercase font-bold text-[#5E6963]">CO₂ Avoided</span>
          <p className="text-sm font-bold text-[#1E9B68] mt-0.5">{(trade_kwh * 0.82)?.toFixed(2)} kg</p>
        </div>
      </div>

      {/* Explainable Why Match Bullets */}
      <div className="space-y-1.5 bg-[#FAFBF9] p-3.5 rounded-lg border border-[rgba(23,34,29,0.04)]">
        <span className="text-[11px] font-bold text-[#17221D] uppercase tracking-wider block">
          Deterministic Match Verification (Why This Peer?):
        </span>
        <ul className="space-y-1">
          {match_reasons.map((r, i) => (
            <li key={i} className="flex items-start text-xs text-[#5E6963]">
              <span className="text-[#1E9B68] font-bold mr-1.5">✓</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => navigate('/marketplace')}
          className="text-xs text-[#1E9B68] hover:underline font-semibold flex items-center"
        >
          <span>View Double-Auction Order Book</span>
          <FaIcon name="arrow-right" className="ml-1 text-[10px]" />
        </button>

        <div className="flex items-center space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={onApprove}
          >
            Review & Approve Trade
          </Button>
        </div>
      </div>
    </div>
  );
}
