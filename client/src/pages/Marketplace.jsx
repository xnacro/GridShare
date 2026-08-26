import { Card, Chip, Typography } from '@heroui/react'

const LISTINGS = [
  { id: 'l1', seller: 'House 07', kwh: 4.2, priceRs: 5.1, status: 'Available' },
  { id: 'l2', seller: 'House 12', kwh: 1.5, priceRs: 4.95, status: 'Matching' },
  { id: 'l3', seller: 'House 45', kwh: 1.5, priceRs: 5.05, status: 'Available' },
]

export default function Marketplace() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography.Heading level={1} className="text-3xl font-semibold tracking-tight">
            P2P Marketplace
          </Typography.Heading>
          <Typography.Paragraph className="text-muted">
            Conceptual local energy exchange — price set by local supply and demand. No real settlement occurs here.
          </Typography.Paragraph>
        </div>
        <Chip color="warning" variant="soft">Simulated / conceptual</Chip>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Open listings</Card.Title>
          <Card.Description>Surplus offered by local prosumers right now</Card.Description>
        </Card.Header>
        <Card.Content>
          {LISTINGS.map((listing) => (
            <div key={listing.id} className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
              <div>
                <p className="font-medium">{listing.seller}</p>
                <p className="text-sm text-muted">{listing.kwh.toFixed(1)} kWh available · ₹{listing.priceRs.toFixed(2)}/kWh</p>
              </div>
              <Chip color={listing.status === 'Available' ? 'success' : 'accent'} variant="soft" size="sm">
                {listing.status}
              </Chip>
            </div>
          ))}
        </Card.Content>
      </Card>
    </div>
  )
}
