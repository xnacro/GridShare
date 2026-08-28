import React from 'react';
import MetricCard from '../ui/MetricCard';

export default function LedgerSummaryCards({
  totalEnergyTraded = 24.6,
  totalP2PValue = 112.40,
  energySold = 14.2,
  energyBought = 10.4,
  settledCount = 12,
  gridTariff = 6.10,
  p2pBenchmark = 4.50,
}) {
  const netEnergy = energySold - energyBought;
  const totalSavings = totalEnergyTraded * (gridTariff - p2pBenchmark);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <MetricCard
        title="Total Traded"
        value={totalEnergyTraded.toFixed(1)}
        unit="kWh"
        iconName="energy"
        variant="surplus"
        subtitle="Local P2P Volume"
      />
      <MetricCard
        title="Gross P2P Value"
        value={`₹${totalP2PValue.toFixed(2)}`}
        iconName="rupee"
        variant="ai"
        subtitle="Wallet Settlements"
      />
      <MetricCard
        title="Prosumer Sold"
        value={energySold.toFixed(1)}
        unit="kWh"
        iconName="solar"
        variant="surplus"
        subtitle="Export to Peers"
      />
      <MetricCard
        title="Consumer Bought"
        value={energyBought.toFixed(1)}
        unit="kWh"
        iconName="home"
        variant="default"
        subtitle="Purchased at Discount"
      />
      <MetricCard
        title="Settled Contracts"
        value={settledCount}
        unit="Trades"
        iconName="checkCircle"
        variant="ai"
        subtitle="100% Cleared"
      />
      <MetricCard
        title="Community Savings"
        value={`₹${totalSavings.toFixed(2)}`}
        iconName="leaf"
        variant="surplus"
        subtitle="vs DISCOM Grid"
      />
    </div>
  );
}
