import { useState } from 'react'
import { Button, Card, Chip, NumberField, Typography } from '@heroui/react'
import { households } from '../data/mockCommunity.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import SeeMoreModal from '../components/SeeMoreModal.jsx'

const MY_HOUSEHOLD_LABEL = 'House 12' // the demo user, per MyHome.jsx
const MY_HOUSEHOLD = households.find((h) => h.label === MY_HOUSEHOLD_LABEL)

const INITIAL_LISTINGS = [
  { id: 'l1', sellerLabel: 'House 07', kwh: 4.2, priceRs: 5.1 },
  { id: 'l2', sellerLabel: 'House 12', kwh: 1.5, priceRs: 4.95 },
  { id: 'l3', sellerLabel: 'House 45', kwh: 1.5, priceRs: 5.05 },
]

const INITIAL_TRADES = [
  { id: 't1', time: '11:30 AM', sellerLabel: 'House 45', buyerLabel: MY_HOUSEHOLD_LABEL, kwh: 1.0, priceRs: 5.0 },
]

const LISTINGS_PREVIEW = 3
const TRADES_PREVIEW = 2

function surplusOf(household) {
  return household.generationKw - household.consumptionKw
}

function ListingRow({ listing, onBuy }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
      <div>
        <p className="font-medium">{listing.sellerLabel}</p>
        <p className="text-sm text-muted">{listing.kwh.toFixed(1)} kWh available · ₹{listing.priceRs.toFixed(2)}/kWh</p>
      </div>
      {listing.sellerLabel === MY_HOUSEHOLD_LABEL ? (
        <Chip color="accent" variant="soft" size="sm">Your listing</Chip>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => onBuy(listing)}>
          Buy for ₹{(listing.kwh * listing.priceRs).toFixed(2)}
        </Button>
      )}
    </div>
  )
}

function TradeRow({ trade }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-b-0 last:pb-0">
      <div>
        <p className="text-sm">
          <span className="font-medium">{trade.buyerLabel}</span> bought {trade.kwh.toFixed(1)} kWh from{' '}
          <span className="font-medium">{trade.sellerLabel}</span>
        </p>
        <p className="text-sm text-muted">{trade.time}</p>
      </div>
      <span className="font-semibold text-success">₹{(trade.kwh * trade.priceRs).toFixed(2)}</span>
    </div>
  )
}

export default function Marketplace() {
  const [listings, setListings] = useState(INITIAL_LISTINGS)
  const [trades, setTrades] = useState(INITIAL_TRADES)

  const mySurplusKwh = Math.max(Number(surplusOf(MY_HOUSEHOLD).toFixed(1)), 0)
  const canSell = mySurplusKwh > 0

  const [amount, setAmount] = useState(mySurplusKwh || 1)
  const [price, setPrice] = useState(5.0)

  const [showAllListings, setShowAllListings] = useState(false)
  const [showAllTrades, setShowAllTrades] = useState(false)

  // Pending actions wait here until the user confirms in the dialog, so
  // nothing changes state on the first click.
  const [pendingSell, setPendingSell] = useState(false)
  const [pendingBuy, setPendingBuy] = useState(null)

  function confirmList() {
    setListings((prev) => [
      { id: `l${Date.now()}`, sellerLabel: MY_HOUSEHOLD.label, kwh: amount, priceRs: price },
      ...prev,
    ])
    setPendingSell(false)
  }

  function confirmBuy() {
    const listing = pendingBuy
    setListings((prev) => prev.filter((l) => l.id !== listing.id))
    setTrades((prev) => [
      {
        id: `t${Date.now()}`,
        time: 'Just now',
        sellerLabel: listing.sellerLabel,
        buyerLabel: MY_HOUSEHOLD_LABEL,
        kwh: listing.kwh,
        priceRs: listing.priceRs,
      },
      ...prev,
    ])
    setPendingBuy(null)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography.Heading level={1} className="text-3xl font-semibold tracking-tight">
            P2P Marketplace
          </Typography.Heading>
          <Typography.Paragraph className="text-muted">
            Conceptual local energy exchange, price set by local supply and demand. No real settlement occurs here.
          </Typography.Paragraph>
        </div>
        <Chip color="warning" variant="soft">Simulated / conceptual</Chip>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <Card.Header>
            <Card.Title>List surplus for sale</Card.Title>
            <Card.Description>Offer your own household's surplus to the community</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
              <span className="text-sm text-muted">Selling from</span>
              <span className="font-semibold">{MY_HOUSEHOLD.label}</span>
            </div>

            {canSell ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Amount (kWh)</label>
                  <NumberField value={amount} onChange={setAmount} minValue={0.1} maxValue={mySurplusKwh} step={0.1}>
                    <NumberField.Group className="w-full">
                      <NumberField.DecrementButton>−</NumberField.DecrementButton>
                      <NumberField.Input />
                      <NumberField.IncrementButton>+</NumberField.IncrementButton>
                    </NumberField.Group>
                  </NumberField>
                  <p className="text-xs text-muted">Up to {mySurplusKwh.toFixed(1)} kWh available right now</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Price (₹/kWh)</label>
                  <NumberField value={price} onChange={setPrice} minValue={1} maxValue={6.1} step={0.05}>
                    <NumberField.Group className="w-full">
                      <NumberField.DecrementButton>−</NumberField.DecrementButton>
                      <NumberField.Input />
                      <NumberField.IncrementButton>+</NumberField.IncrementButton>
                    </NumberField.Group>
                  </NumberField>
                  <p className="text-xs text-muted">Grid rate right now is ₹6.10/kWh</p>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                  <span className="text-sm text-muted">Total if sold</span>
                  <span className="font-semibold">₹{(amount * price).toFixed(2)}</span>
                </div>

                <Button variant="primary" fullWidth onClick={() => setPendingSell(true)} isDisabled={amount <= 0}>
                  List for sale
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted">
                {MY_HOUSEHOLD.label} has no surplus right now, nothing available to list.
              </p>
            )}
          </Card.Content>
        </Card>

        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>Open listings</Card.Title>
            <Card.Description>Surplus offered by local prosumers right now</Card.Description>
          </Card.Header>
          <Card.Content>
            {listings.length === 0 && (
              <p className="py-6 text-center text-sm text-muted">No open listings right now.</p>
            )}
            {listings.slice(0, LISTINGS_PREVIEW).map((listing) => (
              <ListingRow key={listing.id} listing={listing} onBuy={setPendingBuy} />
            ))}
            {listings.length > LISTINGS_PREVIEW && (
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => setShowAllListings(true)}>
                See more
              </Button>
            )}
          </Card.Content>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Recent trades</Card.Title>
          <Card.Description>Settled local matches, simulated</Card.Description>
        </Card.Header>
        <Card.Content>
          {trades.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">No trades yet, buy a listing to see it here.</p>
          )}
          {trades.slice(0, TRADES_PREVIEW).map((trade) => (
            <TradeRow key={trade.id} trade={trade} />
          ))}
          {trades.length > TRADES_PREVIEW && (
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => setShowAllTrades(true)}>
              See more
            </Button>
          )}
        </Card.Content>
      </Card>

      <SeeMoreModal isOpen={showAllListings} onOpenChange={setShowAllListings} title="All open listings">
        {listings.map((listing) => (
          <ListingRow key={listing.id} listing={listing} onBuy={(l) => { setShowAllListings(false); setPendingBuy(l) }} />
        ))}
      </SeeMoreModal>

      <SeeMoreModal isOpen={showAllTrades} onOpenChange={setShowAllTrades} title="All recent trades">
        {trades.map((trade) => (
          <TradeRow key={trade.id} trade={trade} />
        ))}
      </SeeMoreModal>

      <ConfirmDialog
        isOpen={pendingSell}
        onOpenChange={(open) => !open && setPendingSell(false)}
        heading="Confirm listing"
        confirmLabel="List for sale"
        onCancel={() => setPendingSell(false)}
        onConfirm={confirmList}
      >
        <p>
          List {amount.toFixed(1)} kWh from {MY_HOUSEHOLD.label} at ₹{price.toFixed(2)}/kWh, ₹{(amount * price).toFixed(2)} total if sold?
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={!!pendingBuy}
        onOpenChange={(open) => !open && setPendingBuy(null)}
        heading="Confirm purchase"
        confirmLabel="Buy"
        onCancel={() => setPendingBuy(null)}
        onConfirm={confirmBuy}
      >
        {pendingBuy && (
          <p>
            Buy {pendingBuy.kwh.toFixed(1)} kWh from {pendingBuy.sellerLabel} for ₹{(pendingBuy.kwh * pendingBuy.priceRs).toFixed(2)}?
          </p>
        )}
      </ConfirmDialog>
    </div>
  )
}
