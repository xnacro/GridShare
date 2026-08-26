import { Card, Chip, Typography } from '@heroui/react'
import { households } from '../data/mockCommunity.js'

export default function LiveMap() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography.Heading level={1} className="text-3xl font-semibold tracking-tight">
            Live Energy Map
          </Typography.Heading>
          <Typography.Paragraph className="text-muted">
            Energy flow between anonymized households, batteries, and the grid.
          </Typography.Paragraph>
        </div>
        <Chip color="warning" variant="soft">Simulated data</Chip>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Node overview</Card.Title>
          <Card.Description>
            The interactive flow map (nodes, live surplus/deficit lines, battery + grid edges) is built once the
            simulation engine is wired in. For now, here's the current node list it will visualize.
          </Card.Description>
        </Card.Header>
        <Card.Content className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {households.map((h) => {
            const net = h.generationKw - h.consumptionKw
            const isSurplus = net >= 0
            return (
              <div key={h.id} className="rounded-2xl border border-border p-4">
                <p className="font-medium">{h.label}</p>
                <p className="text-sm text-muted">{h.type}</p>
                <Chip color={isSurplus ? 'success' : 'danger'} variant="soft" size="sm" className="mt-2">
                  {isSurplus ? '+' : '−'}
                  {Math.abs(net).toFixed(1)} kW
                </Chip>
              </div>
            )
          })}
        </Card.Content>
      </Card>
    </div>
  )
}
