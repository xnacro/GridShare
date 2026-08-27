import { Tooltip } from '@heroui/react'
import { BatteryIcon, ArrowUpRightIcon } from './icons.jsx'

const CENTER = 50
const RADIUS = 36

function polarPoint(angleDeg, radius = RADIUS) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  }
}

// One spoke per household plus one for the grid, evenly spaced around the
// hub. The grid always takes the top slot (-90deg) so its position is
// stable regardless of household count.
function layoutNodes(households) {
  const slots = households.length + 1
  const step = 360 / slots
  const grid = { id: 'grid', ...polarPoint(-90) }
  const householdNodes = households.map((h, i) => ({
    id: h.id,
    household: h,
    ...polarPoint(-90 + (i + 1) * step),
  }))
  return { grid, householdNodes }
}

function EdgeLayer({ edges }) {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <marker id="flow-arrow-success" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10Z" fill="var(--success)" />
        </marker>
        <marker id="flow-arrow-danger" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10Z" fill="var(--danger)" />
        </marker>
      </defs>
      {edges.map((edge) => (
        <path
          key={edge.id}
          d={edge.d}
          className={edge.positive ? 'text-success' : 'text-danger'}
          stroke="currentColor"
          strokeWidth={edge.width}
          strokeLinecap="round"
          fill="none"
          opacity={0.55}
          markerEnd={`url(#flow-arrow-${edge.positive ? 'success' : 'danger'})`}
        />
      ))}
      {edges.map((edge) => (
        <circle key={`${edge.id}-dot`} r="1.3" className={edge.positive ? 'text-success' : 'text-danger'} fill="currentColor">
          <animateMotion dur="2.2s" repeatCount="indefinite" path={edge.d} />
        </circle>
      ))}
    </svg>
  )
}

function Node({ x, y, size = 44, badgeClass, children, tooltip }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <Tooltip>
        <Tooltip.Trigger>
          <div className="flex cursor-default flex-col items-center gap-1">
            <div
              className={`flex items-center justify-center rounded-full border-2 ${badgeClass}`}
              style={{ height: size, width: size }}
            >
              {children}
            </div>
          </div>
        </Tooltip.Trigger>
        <Tooltip.Content className="w-max max-w-64 text-xs">{tooltip}</Tooltip.Content>
      </Tooltip>
    </div>
  )
}

export default function EnergyFlowMap({ households, communitySnapshot, className = '' }) {
  const { grid, householdNodes } = layoutNodes(households)
  const maxAbsNetKw = Math.max(...households.map((h) => Math.abs(h.generationKw - h.consumptionKw)), 0.1)

  const householdEdges = householdNodes.map((node) => {
    const net = node.household.generationKw - node.household.consumptionKw
    const positive = net >= 0
    const width = 0.6 + (Math.abs(net) / maxAbsNetKw) * 1.6
    const d = positive
      ? `M ${node.x} ${node.y} L ${CENTER} ${CENTER}`
      : `M ${CENTER} ${CENTER} L ${node.x} ${node.y}`
    return { id: node.id, positive, width, d }
  })

  const gridPositive = communitySnapshot.gridFlowKw >= 0
  const gridEdge = {
    id: 'grid-edge',
    positive: gridPositive,
    width: 1.4,
    d: gridPositive
      ? `M ${CENTER} ${CENTER} L ${grid.x} ${grid.y}`
      : `M ${grid.x} ${grid.y} L ${CENTER} ${CENTER}`,
  }

  const storedKwh = (communitySnapshot.batterySocPct / 100) * communitySnapshot.batteryCapacityKwh

  return (
    <div className={`relative aspect-square w-full ${className}`}>
      <EdgeLayer edges={[...householdEdges, gridEdge]} />

      <Node
        x={CENTER}
        y={CENTER}
        size={64}
        badgeClass="border-accent-vivid bg-accent-soft text-accent-soft-foreground"
        tooltip={
          <div className="space-y-0.5">
            <p className="font-medium">Community battery</p>
            <p>{communitySnapshot.batterySocPct}% charged, {storedKwh.toFixed(1)} of {communitySnapshot.batteryCapacityKwh} kWh stored</p>
          </div>
        }
      >
        <BatteryIcon className="h-6 w-6" />
        <span className="sr-only">Community battery, {communitySnapshot.batterySocPct}% charged</span>
      </Node>
      <div
        className="pointer-events-none absolute -translate-x-1/2 text-center text-xs font-medium"
        style={{ left: `${CENTER}%`, top: `calc(${CENTER}% + 36px)` }}
      >
        {communitySnapshot.batterySocPct}%
      </div>

      <Node
        x={grid.x}
        y={grid.y}
        size={48}
        badgeClass={gridPositive ? 'border-success bg-success-soft text-success-soft-foreground' : 'border-danger bg-danger-soft text-danger-soft-foreground'}
        tooltip={
          <div className="space-y-0.5">
            <p className="font-medium">Grid</p>
            <p>{gridPositive ? 'Exporting' : 'Importing'} {Math.abs(communitySnapshot.gridFlowKw).toFixed(1)} kW at ₹{communitySnapshot.gridImportPriceRs.toFixed(2)}/kWh</p>
          </div>
        }
      >
        <ArrowUpRightIcon className="h-4 w-4" />
      </Node>
      <div
        className="pointer-events-none absolute -translate-x-1/2 text-center text-xs"
        style={{ left: `${grid.x}%`, top: `calc(${grid.y}% + 30px)` }}
      >
        <span className="font-medium">Grid</span>
        <br />
        <span className={gridPositive ? 'text-success' : 'text-danger'}>
          {gridPositive ? '+' : '−'}{Math.abs(communitySnapshot.gridFlowKw).toFixed(1)} kW
        </span>
      </div>

      {householdNodes.map((node) => {
        const net = node.household.generationKw - node.household.consumptionKw
        const isSurplus = net >= 0
        return (
          <div key={node.id}>
            <Node
              x={node.x}
              y={node.y}
              size={40}
              badgeClass={isSurplus ? 'border-success bg-success-soft text-success-soft-foreground' : 'border-danger bg-danger-soft text-danger-soft-foreground'}
              tooltip={
                <div className="space-y-0.5">
                  <p className="font-medium">{node.household.label}, {node.household.type}</p>
                  <p>{node.household.generationKw.toFixed(1)} kW generation, {node.household.consumptionKw.toFixed(1)} kW consumption</p>
                </div>
              }
            >
              <span className="text-xs font-semibold">
                {isSurplus ? '+' : '−'}{Math.abs(net).toFixed(1)}
              </span>
            </Node>
            <div
              className="pointer-events-none absolute -translate-x-1/2 text-center text-xs font-medium text-muted"
              style={{ left: `${node.x}%`, top: `calc(${node.y}% + 26px)` }}
            >
              {node.household.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}
