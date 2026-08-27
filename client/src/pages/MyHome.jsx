import { useState } from 'react'
import { Button, Card, Chip, NumberField, ProgressBar, Switch, Typography } from '@heroui/react'
import { households } from '../data/mockCommunity.js'
import { TONE_CLASSES } from '../components/kindTaxonomy.js'
import { BoltIcon, ScaleIcon, SunIcon } from '../components/icons.jsx'
import SeeMoreModal from '../components/SeeMoreModal.jsx'

const MY_HOUSEHOLD = households.find((h) => h.id === 'house-12')
const MY_EARNINGS_TODAY_RS = 62.4
const MY_EARNINGS_WEEK_RS = 318.9
const MY_TRADE_HISTORY = [
  { id: 't1', time: '11:52 AM', text: 'Sold 1.5 kWh to community marketplace', amountRs: '+₹7.65' },
  { id: 't2', time: 'Yesterday', text: 'Sold 3.1 kWh to House 21', amountRs: '+₹15.81' },
  { id: 't3', time: 'Yesterday', text: 'Sold 0.8 kWh to community marketplace', amountRs: '+₹3.96' },
  { id: 't4', time: '2 days ago', text: 'Sold 2.4 kWh to House 34', amountRs: '+₹12.24' },
  { id: 't5', time: '3 days ago', text: 'Sold 1.2 kWh to community marketplace', amountRs: '+₹5.88' },
]

const TRADE_HISTORY_PREVIEW = 2

function StatCard({ icon: Icon, tone, label, value }) {
  return (
    <Card>
      <Card.Content className="space-y-3 py-5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${TONE_CLASSES[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <Typography.Paragraph size="sm" className="text-muted">{label}</Typography.Paragraph>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </Card.Content>
    </Card>
  )
}

function TradeHistoryRow({ trade }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
      <div>
        <p className="text-sm">{trade.text}</p>
        <p className="text-sm text-muted">{trade.time}</p>
      </div>
      <span className="font-medium text-success">{trade.amountRs}</span>
    </div>
  )
}

export default function MyHome() {
  const net = MY_HOUSEHOLD.generationKw - MY_HOUSEHOLD.consumptionKw
  const isSurplus = net >= 0

  const storedKwh = (MY_HOUSEHOLD.batterySoc / 100) * MY_HOUSEHOLD.batteryCapacityKwh
  const reserveKwh = (MY_HOUSEHOLD.batteryReservePct / 100) * MY_HOUSEHOLD.batteryCapacityKwh
  const availableKwh = storedKwh - reserveKwh

  const [minSellPrice, setMinSellPrice] = useState(5.0)
  const [sellReservePct, setSellReservePct] = useState(20)
  const [autoSell, setAutoSell] = useState(true)
  const [autoChargeFirst, setAutoChargeFirst] = useState(true)
  const [showAllTrades, setShowAllTrades] = useState(false)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography.Heading level={1} className="text-3xl font-semibold tracking-tight">
            My Home
          </Typography.Heading>
          <Typography.Paragraph className="text-muted">
            Private view: {MY_HOUSEHOLD.label}. Other households can't see this detail.
          </Typography.Paragraph>
        </div>
        <Chip color="warning" variant="soft">Simulated data</Chip>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={SunIcon} tone="accent" label="Generation" value={`${MY_HOUSEHOLD.generationKw.toFixed(1)} kW`} />
        <StatCard icon={BoltIcon} tone="default" label="Consumption" value={`${MY_HOUSEHOLD.consumptionKw.toFixed(1)} kW`} />
        <StatCard
          icon={ScaleIcon}
          tone={isSurplus ? 'success' : 'danger'}
          label={isSurplus ? 'Surplus' : 'Deficit'}
          value={`${isSurplus ? '+' : '−'}${Math.abs(net).toFixed(1)} kW`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <Card.Header>
            <Card.Title>Battery reserve</Card.Title>
            <Card.Description>Your household battery</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-5">
            <div className="space-y-2">
              <ProgressBar value={MY_HOUSEHOLD.batterySoc} color="success" size="md">
                <ProgressBar.Track>
                  <ProgressBar.Fill />
                </ProgressBar.Track>
              </ProgressBar>
              <p className="text-sm text-muted">{MY_HOUSEHOLD.batterySoc}% of {MY_HOUSEHOLD.batteryCapacityKwh} kWh charged</p>
            </div>
            <div className="grid grid-cols-3 gap-2 border-y border-border py-4">
              <div>
                <p className="text-xs text-muted">Stored</p>
                <p className="font-semibold">{storedKwh.toFixed(1)} kWh</p>
              </div>
              <div>
                <p className="text-xs text-muted">Reserve held</p>
                <p className="font-semibold">{reserveKwh.toFixed(1)} kWh</p>
              </div>
              <div>
                <p className="text-xs text-muted">Available</p>
                <p className="font-semibold">{availableKwh.toFixed(1)} kWh</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Earnings</Card.Title>
            <Card.Description>From local trades</Card.Description>
          </Card.Header>
          <Card.Content className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted">Today</p>
              <p className="text-2xl font-semibold">₹{MY_EARNINGS_TODAY_RS.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">This week</p>
              <p className="text-2xl font-semibold">₹{MY_EARNINGS_WEEK_RS.toFixed(2)}</p>
            </div>
          </Card.Content>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <Card.Header>
            <Card.Title>Selling preferences</Card.Title>
            <Card.Description>Applied when your surplus is listed on the marketplace</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Minimum sell price (₹/kWh)</label>
              <NumberField value={minSellPrice} onChange={setMinSellPrice} minValue={1} maxValue={6.1} step={0.05}>
                <NumberField.Group className="w-full">
                  <NumberField.DecrementButton>−</NumberField.DecrementButton>
                  <NumberField.Input />
                  <NumberField.IncrementButton>+</NumberField.IncrementButton>
                </NumberField.Group>
              </NumberField>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Reserve to keep before selling (%)</label>
              <NumberField value={sellReservePct} onChange={setSellReservePct} minValue={0} maxValue={100} step={5}>
                <NumberField.Group className="w-full">
                  <NumberField.DecrementButton>−</NumberField.DecrementButton>
                  <NumberField.Input />
                  <NumberField.IncrementButton>+</NumberField.IncrementButton>
                </NumberField.Group>
              </NumberField>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Automated trading</Card.Title>
            <Card.Description>Not yet enforced by a live engine, preferences only for now</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-4">
            <Switch isSelected={autoSell} onChange={setAutoSell}>
              <Switch.Content className="flex items-center gap-3">
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <span className="text-sm">Auto-sell surplus above my minimum price</span>
              </Switch.Content>
            </Switch>
            <Switch isSelected={autoChargeFirst} onChange={setAutoChargeFirst}>
              <Switch.Content className="flex items-center gap-3">
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <span className="text-sm">Charge my battery before selling anything</span>
              </Switch.Content>
            </Switch>
          </Card.Content>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Trading history</Card.Title>
          <Card.Description>Recent simulated trades for this household</Card.Description>
        </Card.Header>
        <Card.Content>
          {MY_TRADE_HISTORY.slice(0, TRADE_HISTORY_PREVIEW).map((trade) => (
            <TradeHistoryRow key={trade.id} trade={trade} />
          ))}
          {MY_TRADE_HISTORY.length > TRADE_HISTORY_PREVIEW && (
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => setShowAllTrades(true)}>
              See more
            </Button>
          )}
        </Card.Content>
      </Card>

      <SeeMoreModal isOpen={showAllTrades} onOpenChange={setShowAllTrades} title="Trading history">
        {MY_TRADE_HISTORY.map((trade) => (
          <TradeHistoryRow key={trade.id} trade={trade} />
        ))}
      </SeeMoreModal>
    </div>
  )
}
