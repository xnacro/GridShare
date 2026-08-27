import { Link } from 'react-router-dom'
import { Card, Chip, ProgressBar, Typography } from '@heroui/react'
import {
  batterySocTrend,
  communitySnapshot,
  consumptionTrend,
  generationTrend,
  households,
  recentActivity,
  recommendations,
  renewableTrend,
} from '../data/mockCommunity.js'
import { ArrowUpRightIcon, BatteryIcon, BoltIcon, CloudIcon, LeafIcon, ScaleIcon, SunIcon, SwapIcon, TagIcon } from '../components/icons.jsx'
import HeroIllustration from '../components/HeroIllustration.jsx'
import RotatingBadge from '../components/RotatingBadge.jsx'
import Sparkline from '../components/Sparkline.jsx'

const TONE_CLASSES = {
  accent: 'bg-accent-soft text-accent-soft-foreground',
  success: 'bg-success-soft text-success-soft-foreground',
  danger: 'bg-danger-soft text-danger-soft-foreground',
  default: 'bg-default-soft text-default-soft-foreground',
}

// Shared taxonomy for what an engine event or recommendation *does* - trade
// locally, charge the battery, or export to the grid - reused for both the
// Recommendations and Recent activity cards so the same icon always means
// the same thing across the page.
const KIND_ICONS = { trade: SwapIcon, battery: BatteryIcon, export: ArrowUpRightIcon, alert: ScaleIcon }
const KIND_TONES = { trade: 'accent', battery: 'success', export: 'default', alert: 'danger' }

function StatCard({ icon: Icon, tone = 'accent', label, value, unit, hint, trend }) {
  return (
    <Card>
      <Card.Content className="space-y-3 py-5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${TONE_CLASSES[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
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
        </div>
        {trend && (
          <Sparkline data={trend} height={28} barWidth="w-1.5" gap="gap-1" showLabels={false} unit={unit ?? ''} />
        )}
      </Card.Content>
    </Card>
  )
}

function HouseholdRow({ household, maxAbsNetKw }) {
  const net = household.generationKw - household.consumptionKw
  const isSurplus = net >= 0
  const barPct = Math.max((Math.abs(net) / maxAbsNetKw) * 100, 6)

  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <div className="flex items-center justify-between">
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
      <div className="mt-2 h-1.5 w-full rounded-full bg-foreground/10">
        <div
          className={`h-full rounded-full ${isSurplus ? 'bg-success' : 'bg-danger'}`}
          style={{ width: `${barPct}%` }}
        />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const net = communitySnapshot.netKw
  const isSurplus = net >= 0

  const storedKwh = (communitySnapshot.batterySocPct / 100) * communitySnapshot.batteryCapacityKwh
  const reserveKwh = (communitySnapshot.batteryReservePct / 100) * communitySnapshot.batteryCapacityKwh
  const availableKwh = storedKwh - reserveKwh

  const maxAbsNetKw = Math.max(...households.map((h) => Math.abs(h.generationKw - h.consumptionKw)))

  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 pt-4 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-6">
          <Chip color="warning" variant="soft">Simulated data</Chip>
          <Typography.Heading level={1} className="font-serif text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
            {isSurplus
              ? `Your community has ${Math.abs(net).toFixed(1)} kW to share right now.`
              : `Your community needs ${Math.abs(net).toFixed(1)} kW right now.`}
          </Typography.Heading>
          <Typography.Paragraph className="max-w-md text-lg text-muted">
            GridShare tracks generation and demand across {households.length} households, then decides in
            real time whether to store the surplus, trade it locally, or export it to the grid.
          </Typography.Paragraph>
          <div className="flex flex-wrap items-center gap-5">
            <Link
              to="/map"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              View live map
              <ArrowUpRightIcon className="h-4 w-4" />
            </Link>
            <Link to="/recommendations" className="text-sm font-medium text-foreground/70 hover:text-foreground">
              See recommendations
            </Link>
          </div>
        </div>

        <div className="relative px-6 pb-8 pt-2">
          <RotatingBadge className="absolute -top-2 right-6 z-10 hidden sm:flex" />
          <HeroIllustration className="w-full" />
          {/* <Card className="absolute -bottom-2 left-0 hidden w-52 sm:block">
            <Card.Content className="flex items-center gap-3 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success-soft text-success-soft-foreground">
                <LeafIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted">Renewable right now</p>
                <p className="text-lg font-semibold">{communitySnapshot.renewablePct}%</p>
              </div>
            </Card.Content>
          </Card> */}
        </div>
      </section>

      <div className="space-y-8">
      <div>
        <Typography.Heading level={2} className="text-xl font-semibold tracking-tight">
          Live snapshot
        </Typography.Heading>
        <Typography.Paragraph className="text-muted">
          12:30 PM community state
        </Typography.Paragraph>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard
          icon={SunIcon}
          tone="accent"
          label="Total generation"
          value={communitySnapshot.totalGenerationKw.toFixed(1)}
          unit="kW"
          trend={generationTrend}
        />
        <StatCard
          icon={BoltIcon}
          tone="default"
          label="Total consumption"
          value={communitySnapshot.totalConsumptionKw.toFixed(1)}
          unit="kW"
          trend={consumptionTrend}
        />
        <StatCard
          icon={ScaleIcon}
          tone={isSurplus ? 'success' : 'danger'}
          label={isSurplus ? 'Community surplus' : 'Community deficit'}
          value={`${isSurplus ? '+' : '−'}${Math.abs(net).toFixed(1)}`}
          unit="kW"
        />
        <StatCard
          icon={LeafIcon}
          tone="success"
          label="Renewable share"
          value={communitySnapshot.renewablePct}
          unit="%"
          trend={renewableTrend}
        />
        <StatCard
          icon={BatteryIcon}
          tone="accent"
          label="Community battery"
          value={communitySnapshot.batterySocPct}
          unit="% charged"
          hint={`${communitySnapshot.batteryCapacityKwh} kWh capacity`}
        />
        <StatCard
          icon={SwapIcon}
          tone="accent"
          label="Energy traded today"
          value={communitySnapshot.energyTradedTodayKwh.toFixed(1)}
          unit="kWh"
        />
        <StatCard
          icon={CloudIcon}
          tone="success"
          label="CO₂ avoided today"
          value={communitySnapshot.co2AvoidedKgToday.toFixed(1)}
          unit="kg"
        />
        <StatCard
          icon={TagIcon}
          tone="default"
          label="Grid price (peak)"
          value={`₹${communitySnapshot.gridImportPriceRs.toFixed(2)}`}
          unit="/kWh"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>Households</Card.Title>
            <Card.Description>Live generation vs. consumption, anonymized</Card.Description>
          </Card.Header>
          <Card.Content>
            {households.map((h) => (
              <HouseholdRow key={h.id} household={h} maxAbsNetKw={maxAbsNetKw} />
            ))}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Battery reserve</Card.Title>
            <Card.Description>Community storage bank, charging at {communitySnapshot.batteryChargeRateKw} kW</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-5">
            <div className="space-y-2">
              <ProgressBar value={communitySnapshot.batterySocPct} color="success" size="md">
                <ProgressBar.Track>
                  <ProgressBar.Fill />
                </ProgressBar.Track>
              </ProgressBar>
              <p className="text-sm text-muted">
                {communitySnapshot.batterySocPct}% of {communitySnapshot.batteryCapacityKwh} kWh charged
              </p>
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

            <div>
              <p className="mb-2 text-sm text-muted">State of charge today</p>
              <Sparkline data={batterySocTrend} />
            </div>
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
            {recommendations.map((rec) => {
              const KindIcon = KIND_ICONS[rec.kind]
              return (
                <div key={rec.id} className="flex gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${TONE_CLASSES[KIND_TONES[rec.kind]]}`}>
                    <KindIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{rec.title}</p>
                      <Chip size="sm" variant="soft" color={rec.confidence === 'High' ? 'success' : 'accent'}>
                        {rec.confidence} confidence
                      </Chip>
                    </div>
                    <p className="mt-1 text-sm text-muted">{rec.detail}</p>
                  </div>
                </div>
              )
            })}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Recent activity</Card.Title>
            <Card.Description>Latest simulated engine events</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-4">
            {recentActivity.map((activity) => {
              const KindIcon = KIND_ICONS[activity.kind]
              return (
                <div key={activity.id} className="flex gap-3 text-sm">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${TONE_CLASSES[KIND_TONES[activity.kind]]}`}>
                    <KindIcon className="h-3.5 w-3.5" />
                  </div>
                  <span className="w-16 shrink-0 pt-1 text-muted">{activity.time}</span>
                  <span className="pt-1">{activity.text}</span>
                </div>
              )
            })}
          </Card.Content>
        </Card>
      </div>
      </div>
    </div>
  )
}
