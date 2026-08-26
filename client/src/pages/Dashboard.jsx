import { Card, Chip, ProgressBar, Typography } from '@heroui/react'
import { communitySnapshot, households, recentActivity, recommendations } from '../data/mockCommunity.js'

function StatCard({ label, value, unit, hint }) {
  return (
    <Card>
      <Card.Content className="space-y-1 py-5">
        <Typography.Paragraph size="sm" className="text-muted">
          {label}
        </Typography.Paragraph>
        <p className="text-2xl font-semibold tracking-tight">
          {value}
          {unit && <span className="ml-1 text-base font-normal text-muted">{unit}</span>}
        </p>
        {hint && (
          <Typography.Paragraph size="sm" className="text-muted">
            {hint}
          </Typography.Paragraph>
        )}
      </Card.Content>
    </Card>
  )
}

function HouseholdRow({ household }) {
  const net = household.generationKw - household.consumptionKw
  const isSurplus = net >= 0

  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
      <div>
        <p className="font-medium">{household.label}</p>
        <p className="text-sm text-muted">{household.type}</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-muted">
          {household.generationKw.toFixed(1)} kW gen · {household.consumptionKw.toFixed(1)} kW load
        </p>
        <Chip color={isSurplus ? 'success' : 'danger'} variant="soft" size="sm" className="mt-1">
          {isSurplus ? '+' : '−'}
          {Math.abs(net).toFixed(1)} kW {isSurplus ? 'surplus' : 'deficit'}
        </Chip>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const net = communitySnapshot.netKw
  const isSurplus = net >= 0

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography.Heading level={1} className="text-3xl font-semibold tracking-tight">
            Community Dashboard
          </Typography.Heading>
          <Typography.Paragraph className="text-muted">
            What's happening in your community right now.
          </Typography.Paragraph>
        </div>
        <Chip color="warning" variant="soft">Simulated data</Chip>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total generation" value={communitySnapshot.totalGenerationKw.toFixed(1)} unit="kW" />
        <StatCard label="Total consumption" value={communitySnapshot.totalConsumptionKw.toFixed(1)} unit="kW" />
        <StatCard
          label={isSurplus ? 'Community surplus' : 'Community deficit'}
          value={`${isSurplus ? '+' : '−'}${Math.abs(net).toFixed(1)}`}
          unit="kW"
        />
        <StatCard label="Renewable share" value={communitySnapshot.renewablePct} unit="%" />
        <StatCard
          label="Community battery"
          value={communitySnapshot.batterySocPct}
          unit="% charged"
          hint={`${communitySnapshot.batteryCapacityKwh} kWh capacity`}
        />
        <StatCard label="Energy traded today" value={communitySnapshot.energyTradedTodayKwh.toFixed(1)} unit="kWh" />
        <StatCard label="CO₂ avoided today" value={communitySnapshot.co2AvoidedKgToday.toFixed(1)} unit="kg" />
        <StatCard label="Grid price (peak)" value={`₹${communitySnapshot.gridImportPriceRs.toFixed(2)}`} unit="/kWh" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>Households</Card.Title>
            <Card.Description>Live generation vs. consumption, anonymized</Card.Description>
          </Card.Header>
          <Card.Content>
            {households.map((h) => (
              <HouseholdRow key={h.id} household={h} />
            ))}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Battery reserve</Card.Title>
            <Card.Description>Community storage bank</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-2">
            <ProgressBar value={communitySnapshot.batterySocPct} color="success" size="md">
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
            <p className="text-sm text-muted">
              {communitySnapshot.batterySocPct}% of {communitySnapshot.batteryCapacityKwh} kWh available
            </p>
          </Card.Content>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <Card.Header>
            <Card.Title>Recommendations</Card.Title>
            <Card.Description>What the community should do next, and why</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{rec.title}</p>
                  <Chip size="sm" variant="soft" color={rec.confidence === 'High' ? 'success' : 'accent'}>
                    {rec.confidence} confidence
                  </Chip>
                </div>
                <p className="mt-1 text-sm text-muted">{rec.detail}</p>
              </div>
            ))}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Recent activity</Card.Title>
            <Card.Description>Latest simulated engine events</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex gap-3 text-sm">
                <span className="w-16 shrink-0 text-muted">{activity.time}</span>
                <span>{activity.text}</span>
              </div>
            ))}
          </Card.Content>
        </Card>
      </div>
    </div>
  )
}
