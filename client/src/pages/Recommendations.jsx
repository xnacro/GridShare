import { Card, Chip, Typography } from '@heroui/react'
import { recommendations } from '../data/mockCommunity.js'

export default function Recommendations() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography.Heading level={1} className="text-3xl font-semibold tracking-tight">
            Intelligence &amp; Recommendations
          </Typography.Heading>
          <Typography.Paragraph className="text-muted">
            Grounded in the current simulator state — every suggestion explains the reasoning behind it.
          </Typography.Paragraph>
        </div>
        <Chip color="warning" variant="soft">Simulated data</Chip>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Current recommendations</Card.Title>
          <Card.Description>Forecast-driven store / trade / export guidance</Card.Description>
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
          <Card.Title>Forecasting layer</Card.Title>
          <Card.Description>Not yet implemented</Card.Description>
        </Card.Header>
        <Card.Content>
          <p className="text-sm text-muted">
            Weather-aware solar forecasting and household demand forecasting are planned (see the project roadmap)
            but not yet built — this page will show confidence-scored forecast bands once the{' '}
            <code className="rounded bg-surface-secondary px-1 py-0.5">ml/</code> service exists.
          </p>
        </Card.Content>
      </Card>
    </div>
  )
}
