import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import FaIcon from '../icons/FaIcon';

export default function CreateOfferModal({
  isOpen,
  onClose,
  onSubmitOffer,
  userSurplusKwh = 2.0,
  initialPrice = 4.5,
  householdName = 'My Home',
  isAiRecommended = false,
}) {
  const [energyKwh, setEnergyKwh] = useState(userSurplusKwh > 0 ? userSurplusKwh : 2.0);
  const [pricePerKwh, setPricePerKwh] = useState(initialPrice || 4.5);
  const [validHours, setValidHours] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userSurplusKwh > 0) {
      setEnergyKwh(userSurplusKwh);
    }
  }, [userSurplusKwh]);

  if (!isOpen) return null;

  const totalValue = Math.round(energyKwh * pricePerKwh * 100) / 100;
  const gridBenchmarkRate = 6.10;
  const gridBenchmarkValue = Math.round(energyKwh * gridBenchmarkRate * 100) / 100;
  const feedInRate = 3.50;
  const feedInValue = Math.round(energyKwh * feedInRate * 100) / 100;
  const extraGainVsFeedIn = Math.round((totalValue - feedInValue) * 100) / 100;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitOffer({
        energyKwh: Number(energyKwh),
        pricePerKwh: Number(pricePerKwh),
        validHours: Number(validHours),
      });
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-lg rounded-xl glass-card p-6 sm:p-7 shadow-2xl border border-white/95 space-y-4 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[rgba(23,34,29,0.06)]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-sm shadow-xs">
              <FaIcon name="solar" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-changa text-lg font-normal text-[#17221D]">
                  Post Energy Listing
                </h3>
                {isAiRecommended && (
                  <span className="text-[10px] font-bold text-[#7358C7] bg-[#F1EDFF] px-2 py-0.5 rounded-md border border-[#7358C7]/20">
                    AI Guided Headroom
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5E6963]">
                Share your surplus solar with nearby community members
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#89938D] hover:text-[#17221D] text-sm p-1 rounded-md transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          {/* Energy Available Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#17221D]">
              <label htmlFor="offer-energy-kwh">Energy Available to Share</label>
              <span className="text-[#5E6963] font-normal">
                Safe headroom: <strong className="text-[#1E9B68] font-mono">{userSurplusKwh.toFixed(2)} kWh</strong>
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                id="offer-energy-kwh"
                type="number"
                step="0.1"
                min="0.1"
                max="50.0"
                value={energyKwh}
                onChange={(e) => setEnergyKwh(Math.max(0.1, Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8F9F6] border border-[rgba(23,34,29,0.1)] text-[#17221D] font-mono font-bold text-sm focus:outline-none focus:border-[#1E9B68] focus:ring-1 focus:ring-[#1E9B68] transition"
                required
              />
              <span className="absolute right-3.5 text-xs font-bold text-[#5E6963]">kWh</span>
            </div>
          </div>

          {/* Preferred Price Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#17221D]">
              <label htmlFor="offer-price-kwh">Preferred P2P Tariff Rate</label>
              <span className="text-[#5E6963] font-normal">
                Grid utility rate: <span className="font-mono text-[#D45C5C]">₹{gridBenchmarkRate.toFixed(2)}</span>
              </span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-bold text-[#5E6963]">₹</span>
              <input
                id="offer-price-kwh"
                type="number"
                step="0.1"
                min="2.0"
                max="10.0"
                value={pricePerKwh}
                onChange={(e) => setPricePerKwh(Math.max(1.0, Number(e.target.value)))}
                className="w-full pl-8 pr-16 py-2.5 rounded-lg bg-[#F8F9F6] border border-[rgba(23,34,29,0.1)] text-[#17221D] font-mono font-bold text-sm focus:outline-none focus:border-[#1E9B68] focus:ring-1 focus:ring-[#1E9B68] transition"
                required
              />
              <span className="absolute right-3.5 text-xs font-bold text-[#5E6963]">/ kWh</span>
            </div>
          </div>

          {/* Validity Duration */}
          <div className="space-y-1.5">
            <label htmlFor="offer-valid-hours" className="text-xs font-semibold text-[#17221D]">Listing Validity</label>
            <select
              id="offer-valid-hours"
              value={validHours}
              onChange={(e) => setValidHours(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8F9F6] border border-[rgba(23,34,29,0.1)] text-[#17221D] text-xs font-medium focus:outline-none focus:border-[#1E9B68] transition"
            >
              <option value={1}>1 Hour (Immediate 15-min Horizon)</option>
              <option value={2}>2 Hours</option>
              <option value={4}>4 Hours (Solar Peak Window)</option>
              <option value={8}>8 Hours (Until Sunset)</option>
            </select>
          </div>

          {/* Real-time Economic Comparison Box */}
          <div className="p-3 rounded-lg bg-[#F8F9F6] border border-[rgba(23,34,29,0.06)] space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#5E6963]">Estimated Local P2P Value:</span>
              <span className="font-changa font-bold text-sm text-[#1E9B68]">
                ₹{totalValue.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#5E6963]">
              <span>Grid Benchmark Value:</span>
              <span className="font-mono line-through text-[#89938D]">₹{gridBenchmarkValue.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[rgba(23,34,29,0.06)]">
              <span className="text-[#12392B] font-bold">Extra Revenue vs Standard Grid Feed-in:</span>
              <span className="font-changa text-[#1E9B68] font-bold">+₹{extraGainVsFeedIn.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-white hover:bg-[#F8F9F6] border border-[rgba(23,34,29,0.12)] text-[#17221D] text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || energyKwh <= 0}
              className="px-5 py-2.5 rounded-lg bg-[#12392B] hover:bg-[#174A37] text-white text-xs font-bold shadow-xs transition active:scale-98 disabled:opacity-50 flex items-center space-x-1.5"
            >
              <FaIcon name="plus" className="text-[#43CB8C]" />
              <span>{isSubmitting ? 'Publishing...' : 'Publish Energy Listing'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
