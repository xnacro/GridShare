import { useState } from 'react'
import { Button, Card, Chip, Typography } from '@heroui/react'
import { useCommunity } from '../context/useCommunity.js'
import { KIND_ICONS, KIND_TONES, TONE_CLASSES } from '../components/kindTaxonomy.js'
import { BatteryIcon, ScaleIcon, SwapIcon } from '../components/icons.jsx'
import SeeMoreModal from '../components/SeeMoreModal.jsx'

const RECOMMENDATIONS_PREVIEW = 2

const ENGINE_STEPS = [
  {
    icon: BatteryIcon,
    tone: 'success',
    title: 'Meet the battery reserve first',
    detail: 'Surplus tops up the community battery up to its reserve threshold before anything else happens with it.',
  },
  {
    icon: SwapIcon,
    tone: 'accent',
    title: 'Then offer it to local demand',
    detail: 'Any surplus left after the reserve is checked against households currently running a deficit.',
  },
  {
    icon: ScaleIcon,
    tone: 'default',
    title: 'Export whatever is left',
    detail: 'Surplus with no local demand or battery headroom left is exported to the grid instead of curtailed.',
  },
]

function InputChip({ input }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[input.tone]}`}>
      {input.label}: {input.value}
    </span>
  )
}

function RecommendationDetail({ rec }) {
  const KindIcon = KIND_ICONS[rec.kind]
  return (
    <div className="flex gap-3 border-b border-border pb-5 last:border-b-0 last:pb-0">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TONE_CLASSES[KIND_TONES[rec.kind]]}`}>
        <KindIcon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium">{rec.title}</p>
          <Chip size="sm" variant="soft" color={rec.confidence === 'High' ? 'success' : 'accent'}>
            {rec.confidence} confidence
          </Chip>
        </div>
        <p className="text-sm text-muted">{rec.detail}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {rec.inputs.map((input) => (
            <InputChip key={input.label} input={input} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Recommendations() {
  const { data } = useCommunity()
  const { recommendations } = data
  const [showAll, setShowAll] = useState(false)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography.Heading level={1} className="text-3xl font-semibold tracking-tight">
            Intelligence &amp; Recommendations
          </Typography.Heading>
          <Typography.Paragraph className="text-muted">
            Grounded in the current simulator state, every suggestion explains the reasoning behind it.
          </Typography.Paragraph>
        </div>
        <Chip color="warning" variant="soft">Simulated data</Chip>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Current recommendations</Card.Title>
          <Card.Description>Store / trade / export guidance, with the numbers behind each one</Card.Description>
        </Card.Header>
        <Card.Content className="space-y-5">
          {recommendations.slice(0, RECOMMENDATIONS_PREVIEW).map((rec) => (
            <RecommendationDetail key={rec.id} rec={rec} />
          ))}
          {recommendations.length > RECOMMENDATIONS_PREVIEW && (
            <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
              See more
            </Button>
          )}
        </Card.Content>
      </Card>

      <SeeMoreModal isOpen={showAll} onOpenChange={setShowAll} title="All recommendations">
        <div className="space-y-5">
          {recommendations.map((rec) => (
            <RecommendationDetail key={rec.id} rec={rec} />
          ))}
        </div>
      </SeeMoreModal>

      <Card>
        <Card.Header>
          <Card.Title>How the engine decides</Card.Title>
          <Card.Description>The real rule-based priority order behind every recommendation above</Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          {ENGINE_STEPS.map((step, i) => (
            <div key={step.title} className="flex gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TONE_CLASSES[step.tone]}`}>
                <step.icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="font-medium">{i + 1}. {step.title}</p>
                <p className="text-sm text-muted">{step.detail}</p>
              </div>
            </div>
          ))}
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Forecasting layer</Card.Title>
          <Card.Description>Not yet implemented</Card.Description>
        </Card.Header>
        <Card.Content>
          <p className="text-sm text-muted">
            Weather-aware solar forecasting and household demand forecasting are planned (see the project roadmap)
            but not yet built. This page will show confidence-scored forecast bands once the{' '}
            <code className="rounded bg-surface-secondary px-1 py-0.5">ml/</code> service exists.
          </p>
        </Card.Content>
      </Card>
    </div>
  )
}
