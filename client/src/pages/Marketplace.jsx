import { useState } from 'react'
import { Button, Card, Chip, ListBox, NumberField, Select, Typography } from '@heroui/react'
import { households } from '../data/mockCommunity.js'

const MY_HOUSEHOLD_LABEL = 'House 12' // the demo user, per MyHome.jsx

const INITIAL_LISTINGS = [
  { id: 'l1', sellerLabel: 'House 07', kwh: 4.2, priceRs: 5.1 },
  { id: 'l2', sellerLabel: 'House 12', kwh: 1.5, priceRs: 4.95 },
  { id: 'l3', sellerLabel: 'House 45', kwh: 1.5, priceRs: 5.05 },
]

const INITIAL_TRADES = [
  { id: 't1', time: '11:30 AM', sellerLabel: 'House 45', buyerLabel: MY_HOUSEHOLD_LABEL, kwh: 1.0, priceRs: 5.0 },
]

function surplusOf(household) {
  return household.generationKw - household.consumptionKw
}

export default function Marketplace() {
  const [listings, setListings] = useState(INITIAL_LISTINGS)
  const [trades, setTrades] = useState(INITIAL_TRADES)

  const sellableHouseholds = households.filter((h) => surplusOf(h) > 0)
  const [sellerId, setSellerId] = useState(sellableHouseholds[0]?.id ?? null)
  const seller = sellableHouseholds.find((h) => h.id === sellerId) ?? null
  const sellerAvailableKwh = seller ? Number(surplusOf(seller).toFixed(1)) : 0

  const [amount, setAmount] = useState(sellerAvailableKwh || 1)
  const [price, setPrice] = useState(5.0)

  function handleSellerChange(id) {
    setSellerId(id)
    const next = sellableHouseholds.find((h) => h.id === id)
    if (next) setAmount(Math.min(amount, Number(surplusOf(next).toFixed(1))) || Number(surplusOf(next).toFixed(1)))
  }

  function handleList() {
    if (!seller || amount <= 0) return
    setListings((prev) => [
      { id: `l${Date.now()}`, sellerLabel: seller.label, kwh: amount, priceRs: price },
      ...prev,
    ])
  }

  function handleBuy(listing) {
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <Card.Header>
            <Card.Title>List surplus for sale</Card.Title>
            <Card.Description>Offer your household's surplus to the community</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Seller</label>
              <Select selectedKey={sellerId} onSelectionChange={handleSellerChange} className="w-full">
                <Select.Trigger className="w-full">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {sellableHouseholds.map((h) => (
                      <ListBox.Item key={h.id} id={h.id}>
                        {h.label} (+{surplusOf(h).toFixed(1)} kW available)
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount (kWh)</label>
              <NumberField value={amount} onChange={setAmount} minValue={0.1} maxValue={sellerAvailableKwh} step={0.1}>
                <NumberField.Group className="w-full">
                  <NumberField.DecrementButton>−</NumberField.DecrementButton>
                  <NumberField.Input />
                  <NumberField.IncrementButton>+</NumberField.IncrementButton>
                </NumberField.Group>
              </NumberField>
              <p className="text-xs text-muted">Up to {sellerAvailableKwh.toFixed(1)} kWh available right now</p>
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

            <Button variant="primary" fullWidth onClick={handleList} isDisabled={!seller || amount <= 0}>
              List for sale
            </Button>
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
            {listings.map((listing) => (
              <div key={listing.id} className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
                <div>
                  <p className="font-medium">{listing.sellerLabel}</p>
                  <p className="text-sm text-muted">{listing.kwh.toFixed(1)} kWh available · ₹{listing.priceRs.toFixed(2)}/kWh</p>
                </div>
                {listing.sellerLabel === MY_HOUSEHOLD_LABEL ? (
                  <Chip color="accent" variant="soft" size="sm">Your listing</Chip>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => handleBuy(listing)}>
                    Buy for ₹{(listing.kwh * listing.priceRs).toFixed(2)}
                  </Button>
                )}
              </div>
            ))}
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
          {trades.map((trade) => (
            <div key={trade.id} className="flex items-center justify-between border-b border-border py-3 last:border-b-0 last:pb-0">
              <div>
                <p className="text-sm">
                  <span className="font-medium">{trade.buyerLabel}</span> bought {trade.kwh.toFixed(1)} kWh from{' '}
                  <span className="font-medium">{trade.sellerLabel}</span>
                </p>
                <p className="text-sm text-muted">{trade.time}</p>
              </div>
              <span className="font-semibold text-success">₹{(trade.kwh * trade.priceRs).toFixed(2)}</span>
            </div>
          ))}
        </Card.Content>
      </Card>
    </div>
  )
}
