import { Card, Chip, ProgressBar, Typography } from '@heroui/react'
import { households } from '../data/mockCommunity.js'

const MY_HOUSEHOLD = households.find((h) => h.id === 'house-12')
const MY_EARNINGS_TODAY_RS = 62.4
const MY_TRADE_HISTORY = [
  { id: 't1', time: '11:52 AM', text: 'Sold 1.5 kWh to community marketplace', amountRs: '+₹7.65' },
  { id: 't2', time: 'Yesterday', text: 'Sold 3.1 kWh to House 21', amountRs: '+₹15.81' },
]

export default function MyHome() {
  const net = MY_HOUSEHOLD.generationKw - MY_HOUSEHOLD.consumptionKw
  const isSurplus = net >= 0

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography.Heading level={1} className="text-3xl font-semibold tracking-tight">
            My Home
          </Typography.Heading>
          <Typography.Paragraph className="text-muted">
            Private view — {MY_HOUSEHOLD.label}. Other households can't see this detail.
          </Typography.Paragraph>
        </div>
        <Chip color="warning" variant="soft">Simulated data</Chip>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <Card.Content className="space-y-1 py-5">
            <Typography.Paragraph size="sm" className="text-muted">Generation</Typography.Paragraph>
            <p className="text-2xl font-semibold">{MY_HOUSEHOLD.generationKw.toFixed(1)} kW</p>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content className="space-y-1 py-5">
            <Typography.Paragraph size="sm" className="text-muted">Consumption</Typography.Paragraph>
            <p className="text-2xl font-semibold">{MY_HOUSEHOLD.consumptionKw.toFixed(1)} kW</p>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content className="space-y-1 py-5">
            <Typography.Paragraph size="sm" className="text-muted">
              {isSurplus ? 'Surplus' : 'Deficit'}
            </Typography.Paragraph>
            <p className="text-2xl font-semibold">
              {isSurplus ? '+' : '−'}{Math.abs(net).toFixed(1)} kW
            </p>
          </Card.Content>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <Card.Header>
            <Card.Title>Battery reserve</Card.Title>
            <Card.Description>Your household battery</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-2">
            <ProgressBar value={MY_HOUSEHOLD.batterySoc} color="success" size="md">
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
            <p className="text-sm text-muted">{MY_HOUSEHOLD.batterySoc}% charged</p>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Earnings today</Card.Title>
            <Card.Description>From local trades</Card.Description>
          </Card.Header>
          <Card.Content>
            <p className="text-2xl font-semibold">₹{MY_EARNINGS_TODAY_RS.toFixed(2)}</p>
          </Card.Content>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Trading history</Card.Title>
          <Card.Description>Recent simulated trades for this household</Card.Description>
        </Card.Header>
        <Card.Content>
          {MY_TRADE_HISTORY.map((trade) => (
            <div key={trade.id} className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
              <div>
                <p className="text-sm">{trade.text}</p>
                <p className="text-sm text-muted">{trade.time}</p>
              </div>
              <span className="font-medium text-success">{trade.amountRs}</span>
            </div>
          ))}
        </Card.Content>
      </Card>
    </div>
  )
}
