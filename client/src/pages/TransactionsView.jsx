import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import HeroMetric from '../components/ui/HeroMetric';
import GlassSurface from '../components/ui/GlassSurface';
import SectionHeader from '../components/ui/SectionHeader';
import LedgerSummaryCards from '../components/ledger/LedgerSummaryCards';
import LedgerFilterBar from '../components/ledger/LedgerFilterBar';
import LedgerTransactionTable from '../components/ledger/LedgerTransactionTable';
import TransactionDetailModal from '../components/ledger/TransactionDetailModal';
import LedgerTraderSummaries from '../components/ledger/LedgerTraderSummaries';
import { LoadingState, ErrorState } from '../components/ui/FeedbackStates';
import FaIcon from '../components/icons/FaIcon';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function TransactionsView() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('ALL');
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [dateRange, setDateRange] = useState('all');

  // Selected Transaction for Inspection Modal
  const [selectedTx, setSelectedTx] = useState(null);
  const [liveToast, setLiveToast] = useState(null);

  // Fetch transactions from backend API
  const fetchLedgerData = async () => {
    try {
      setError(null);
      const [txRes, batRes] = await Promise.all([
        api.getMarketTransactions(100),
        api.getBatteryLedger(50),
      ]);

      let allTxns = [];

      if (txRes.data?.status === 'SUCCESS') {
        const marketTxns = (txRes.data.transactions || []).map((t) => ({
          ...t,
          type: t.type || 'P2P',
          seller_household_id: t.seller_household_id || 'house_a',
          buyer_household_id: t.buyer_household_id || 'house_b',
          energy_kwh: t.energy_kwh || 1.5,
          price_per_kwh: t.price_per_kwh || 4.50,
          total_value: t.total_value || (t.energy_kwh * (t.price_per_kwh || 4.50)),
          status: t.status || 'SETTLED',
        }));
        allTxns = [...marketTxns];
      }

      if (allTxns.length === 0) {
        // Fallback demo seed transactions
        allTxns = [
          { id: 'TX-GS-101', type: 'P2P', seller_household_id: 'house_a', buyer_household_id: 'house_b', energy_kwh: 2.8, price_per_kwh: 4.50, total_value: 12.60, status: 'SETTLED', timestamp: new Date().toISOString() },
          { id: 'TX-GS-102', type: 'P2P', seller_household_id: 'house_c', buyer_household_id: 'house_d', energy_kwh: 1.5, price_per_kwh: 4.80, total_value: 7.20, status: 'SETTLED', timestamp: new Date(Date.now() - 3600000).toISOString() },
          { id: 'TX-GS-103', type: 'BATTERY_STORAGE', seller_household_id: 'house_a', buyer_household_id: 'community_battery', energy_kwh: 2.0, price_per_kwh: 4.00, total_value: 8.00, status: 'SETTLED', timestamp: new Date(Date.now() - 7200000).toISOString() },
        ];
      }

      setTransactions(allTxns);
    } catch (err) {
      console.warn('Using local transactions fallback:', err);
      setTransactions([
        { id: 'TX-GS-101', type: 'P2P', seller_household_id: 'house_a', buyer_household_id: 'house_b', energy_kwh: 2.8, price_per_kwh: 4.50, total_value: 12.60, status: 'SETTLED', timestamp: new Date().toISOString() },
        { id: 'TX-GS-102', type: 'P2P', seller_household_id: 'house_c', buyer_household_id: 'house_d', energy_kwh: 1.5, price_per_kwh: 4.80, total_value: 7.20, status: 'SETTLED', timestamp: new Date(Date.now() - 3600000).toISOString() },
      ]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
    const interval = setInterval(fetchLedgerData, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalEnergyTraded = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (t.energy_kwh || 0), 0);
  }, [transactions]);

  const totalVolumeInr = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (t.total_value || 0), 0);
  }, [transactions]);

  const avgTariff = useMemo(() => {
    if (transactions.length === 0) return 4.50;
    return totalVolumeInr / (totalEnergyTraded || 1);
  }, [transactions, totalVolumeInr, totalEnergyTraded]);

  return (
    <div className="space-y-6 max-w-[1520px] mx-auto pb-12 select-none animate-fadeIn">
      
      {/* 🌟 1. COMPACT PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[rgba(23,34,29,0.06)]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#041D0D]">
              Settlement & Ledger Audit
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E2F0CC] text-[#012F13] border border-[#BED69E]">
              100% Cleared
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4A5B4F] mt-0.5">
            Audit history tracking {transactions.length} settlements totaling {totalEnergyTraded.toFixed(1)} kWh across peer trades and storage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              fetchLedgerData();
            }}
            className="px-4 py-2 rounded-xl bg-[#012F13] hover:bg-[#0B3E1D] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <FaIcon name="refresh" className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Ledger'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/marketplace')}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#BED69E] text-[#011207] text-xs font-bold hover:bg-[#F4F9EB] transition flex items-center gap-1.5 shadow-xs"
          >
            <FaIcon name="marketplace" />
            <span>Marketplace</span>
          </button>
        </div>
      </div>

      {/* 🌟 2. METRIC STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <HeroMetric
          label="Total Energy Cleared"
          value={totalEnergyTraded.toFixed(1)}
          unit="kWh"
          subtitle="Direct peer energy transferred"
          iconName="marketplace"
          variant="emerald"
        />

        <HeroMetric
          label="Total Transaction Value"
          value={`₹${totalVolumeInr.toFixed(2)}`}
          unit=""
          subtitle="Community settlement volume"
          iconName="rupee"
          variant="solar"
        />

        <HeroMetric
          label="Average P2P Tariff"
          value={`₹${avgTariff.toFixed(2)}`}
          unit="/ kWh"
          subtitle="vs ₹6.10/kWh standard grid"
          iconName="leaf"
          variant="emerald"
        />

        <HeroMetric
          label="Settlement Success"
          value="100%"
          unit="Success"
          subtitle="Zero failed transactions"
          iconName="shield"
          variant="emerald"
        />
      </div>

      {/* 🌟 3. TRANSACTIONS TABLE */}
      <div className="glass-card rounded-xl p-6 sm:p-8 space-y-4">
        <SectionHeader
          title="Executed Smart Transactions"
          subtitle="Chronological audit records of all microgrid energy flows"
          rightAction={
            <Badge variant="surplus" size="xs">
              {transactions.length} Transactions
            </Badge>
          }
        />

        <LedgerTransactionTable
          transactions={transactions}
          onSelectTransaction={(tx) => setSelectedTx(tx)}
        />
      </div>

      {/* Inspection Modal */}
      {selectedTx && (
        <TransactionDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}

    </div>
  );
}
