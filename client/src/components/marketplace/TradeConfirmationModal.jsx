import React from 'react';
import { createPortal } from 'react-dom';
import FaIcon from '../icons/FaIcon';

export default function TradeConfirmationModal({
  purchase,
  isOpen,
  onConfirm,
  onCancel,
  isSettling = false,
  buyerHousehold = {},
  sellerHousehold = {},
  aiValidationSteps = [
    'Solar generation forecast exceeds local demand (Positive Headroom)',
    'Conservative lower solar bound preserves zero-deficit safety margin',
    'Nearby household on same sub-feeder (45 m) actively requests energy',
    'Community battery reserve exceeds 20% protection floor',
    'P2P clearing tariff provides 26% savings vs retail DISCOM rate',
  ],
}) {
  if (!isOpen || !purchase) return null;

  const { buyerId, buyerName, sellOrder, sellerName, quantityKwh } = purchase;
  const unitPrice = sellOrder?.min_price_per_kwh || 4.50;
  const qty = Number(quantityKwh) || sellOrder?.remaining_kwh || 2.0;
  const totalAmount = Math.round(qty * unitPrice * 100) / 100;
  const gridPrice = 6.10;
  const savingsVsGrid = Math.round((gridPrice - unitPrice) * qty * 100) / 100;

  const displaySeller = sellerName || sellerHousehold.name || sellOrder?.sellerName || 'Rahul\'s Home (Solar)';
  const displayBuyer = buyerName || buyerHousehold.name || purchase?.buyerName || 'Green Valley Block 2 (Demand)';

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm select-none">
      <div className="relative z-10 w-full max-w-lg rounded-xl glass-card p-6 sm:p-7 shadow-2xl border border-white/95 space-y-4 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[rgba(23,34,29,0.06)]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-sm shadow-xs">
              <FaIcon name="marketplace" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-changa text-lg font-normal text-[#17221D]">
                  Review & Settle Energy Trade
                </h3>
              </div>
              <p className="text-xs text-[#5E6963]">
                Algorithmic double-auction match validation & settlement
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={isSettling}
            className="text-slate-400 hover:text-slate-700 text-sm p-1 rounded-md transition"
          >
            <FaIcon name="close" />
          </button>
        </div>

        {/* Counterparty Cards */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Seller */}
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-[#D97706]">Seller (Prosumer)</span>
              <span className="font-mono text-slate-500">#{sellOrder?.id || 'GS-001'}</span>
            </div>
            <div className="font-bold text-[#0F172A] text-sm truncate">
              {displaySeller}
            </div>
            <div className="text-[11px] text-slate-600">
              Surplus: <span className="font-mono font-bold text-[#D97706]">+{qty.toFixed(1)} kWh</span>
            </div>
          </div>

          {/* Buyer */}
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-3 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-[#2563EB]">Buyer (Consumer)</span>
              <span className="font-mono text-slate-500">Local Feeder</span>
            </div>
            <div className="font-bold text-[#0F172A] text-sm truncate">
              {displayBuyer}
            </div>
            <div className="text-[11px] text-slate-600">
              Demand: <span className="font-mono font-bold text-[#2563EB]">-{qty.toFixed(1)} kWh</span>
            </div>
          </div>
        </div>

        {/* AI Deterministic Reasoning Checklist */}
        <div className="p-3.5 rounded-xl bg-white/70 border border-slate-100 space-y-2 text-xs shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Why GridShare Recommends This
            </span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
              5-Point Verification
            </span>
          </div>
          <div className="space-y-1.5 text-[11px] text-[#0F172A]">
            {aiValidationSteps.map((step, idx) => (
              <div key={idx} className="flex items-start space-x-1.5">
                <FaIcon name="check" className="text-[#0D9488] text-[9px] mt-0.5 shrink-0" />
                <span className="text-slate-600">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Breakdown Box */}
        <div className="rounded-lg border border-[rgba(23,34,29,0.06)] bg-[#F8F9F6] p-3.5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#5E6963]">Energy Traded:</span>
            <span className="font-mono font-bold text-[#17221D]">{qty.toFixed(1)} kWh</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#5E6963]">P2P Agreed Tariff:</span>
            <span className="font-mono font-bold text-[#1E9B68]">₹{unitPrice.toFixed(2)} / kWh</span>
          </div>

          <div className="flex items-center justify-between pt-1.5 border-t border-[rgba(23,34,29,0.08)]">
            <span className="text-[#17221D] font-bold">Total Trade Settlement:</span>
            <span className="font-changa font-bold text-base text-[#12392B]">₹{totalAmount.toFixed(2)}</span>
          </div>

          {savingsVsGrid > 0 && (
            <div className="flex items-center justify-between text-[11px] text-[#1E9B68]">
              <span className="font-medium">Direct Peer Savings vs Grid:</span>
              <span className="font-mono font-bold">+₹{savingsVsGrid.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSettling}
            className="px-4 py-2.5 rounded-lg bg-white hover:bg-[#F8F9F6] border border-[rgba(23,34,29,0.12)] text-[#17221D] text-xs font-bold transition"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSettling}
            className="px-5 py-2.5 rounded-lg bg-[#1E9B68] hover:bg-[#168557] text-white text-xs font-bold shadow-xs transition active:scale-98 disabled:opacity-50 flex items-center space-x-1.5"
          >
            <FaIcon name="check" />
            <span>{isSettling ? 'Settling Trade...' : 'Approve & Execute Trade'}</span>
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
