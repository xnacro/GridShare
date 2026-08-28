import React from 'react';
import FaIcon from '../icons/FaIcon';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function LedgerTransactionTable({
  transactions = [],
  onSelectTransaction,
  onNavigateMarketplace,
}) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-card space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <FaIcon name="receipt" className="text-xl" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">No Transactions Found</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          No energy trade records match your active filters. Once you match or complete your first P2P trade, it will appear here.
        </p>
        {onNavigateMarketplace && (
          <Button
            variant="primary"
            size="sm"
            onClick={onNavigateMarketplace}
            icon={<FaIcon name="marketplace" />}
            className="mt-2"
          >
            Go to Marketplace
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 bg-slate-50/60">
            <tr>
              <th className="py-2.5 px-3">Tx ID</th>
              <th className="py-2.5 px-3">Date / Time</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Prosumer Seller</th>
              <th className="py-2.5 px-3">Consumer Buyer</th>
              <th className="py-2.5 px-3 text-right">Energy Volume</th>
              <th className="py-2.5 px-3 text-right">Unit Tariff</th>
              <th className="py-2.5 px-3 text-right">Total Amount</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const energyVal = tx.energy_kwh || tx.energyKwh || 0;
              const priceVal = tx.price_per_kwh || tx.pricePerKwh || 4.50;
              const totalVal = tx.total_value || tx.totalValue || (energyVal * priceVal);

              const seller = tx.seller_household_id || tx.sellerId || 'House A';
              const buyer = tx.buyer_household_id || tx.buyerId || 'House B';

              const isGrid = tx.type === 'GRID_IMPORT' || tx.type === 'GRID_EXPORT';
              const isBattery = tx.type === 'BATTERY';

              const typeBadge = isGrid ? (
                <Badge variant="grid" size="xs" icon={<FaIcon name="grid" className="text-[10px]" />}>
                  {tx.type === 'GRID_IMPORT' ? 'GRID IMPORT' : 'GRID EXPORT'}
                </Badge>
              ) : isBattery ? (
                <Badge variant="battery" size="xs" icon={<FaIcon name="battery" className="text-[10px]" />}>
                  BATTERY ESS
                </Badge>
              ) : (
                <Badge variant="surplus" size="xs" icon={<FaIcon name="trade" className="text-[10px]" />}>
                  P2P TRADE
                </Badge>
              );

              return (
                <tr
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="hover:bg-slate-50/80 transition cursor-pointer group"
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-500 group-hover:text-slate-900">
                    #TXN-{tx.id}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                    {tx.timestamp
                      ? new Date(tx.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                      : 'Live'}
                  </td>
                  <td className="py-2.5 px-3">{typeBadge}</td>
                  <td className="py-2.5 px-3 font-bold text-amber-800">
                    {seller}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-blue-800">
                    {buyer}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-right">
                    {energyVal.toFixed(2)} kWh
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 text-right">
                    ₹{priceVal.toFixed(2)}/kWh
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 text-right">
                    ₹{totalVal.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <Badge variant={tx.status === 'SETTLED' ? 'surplus' : 'warning'} size="xs">
                      {tx.status || 'SETTLED'}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTransaction(tx);
                      }}
                      className="inline-flex items-center space-x-1 rounded px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 transition"
                      title="Inspect Transaction"
                    >
                      <FaIcon name="view" className="text-slate-500 text-xs" />
                      <span className="hidden sm:inline">Details</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
