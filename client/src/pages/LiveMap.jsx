import { Card, Chip, Typography } from '@heroui/react'
import { communitySnapshot, households } from '../data/mockCommunity.js'
import EnergyFlowMap from '../components/EnergyFlowMap.jsx'

export default function LiveMap() {
  const net = communitySnapshot.netKw
  const isSurplus = net >= 0
  const exportingCount = households.filter((h) => h.generationKw - h.consumptionKw >= 0).length
  const importingCount = households.length - exportingCount

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography.Heading level={1} className="text-3xl font-semibold tracking-tight">
            Live Energy Map
          </Typography.Heading>
          <Typography.Paragraph className="text-muted">
            Energy flow between anonymized households, the community battery, and the grid.
          </Typography.Paragraph>
        </div>
        <Chip color="warning" variant="soft">Simulated data</Chip>
      </div>

      <div className="flex flex-wrap gap-3">
        <Chip color={isSurplus ? 'success' : 'danger'} variant="soft">
          {isSurplus ? '+' : '−'}{Math.abs(net).toFixed(1)} kW net community flow
        </Chip>
        <Chip color="success" variant="soft">{exportingCount} households exporting</Chip>
        <Chip color="danger" variant="soft">{importingCount} households importing</Chip>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Network view</Card.Title>
          <Card.Description>
            Not a literal street map, an abstract view of who's feeding the community battery and who's drawing
            from it right now. Hover or focus a node for detail.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="mx-auto w-full max-w-2xl">
            <EnergyFlowMap households={households} communitySnapshot={communitySnapshot} />
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Content className="flex flex-wrap items-center gap-6 py-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
            <span className="text-muted">Surplus, flowing toward the battery or grid</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-danger" />
            <span className="text-muted">Deficit, drawing from the battery or grid</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted">Line thickness reflects flow magnitude, dots show live direction</span>
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}
