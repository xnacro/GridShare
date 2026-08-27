// Compact bar sparkline: history in the de-emphasis tone, only the current
// (last) point in the accent color, per the stat-tile trend contract.
// Single series, so no legend and no categorical palette are needed.
export default function Sparkline({
  data,
  valueKey = 'pct',
  labelKey = 'time',
  height = 56,
  barWidth = 'w-2.5',
  gap = 'gap-1.5',
  showLabels = true,
  unit = '%',
  className = '',
}) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1)

  return (
    <div className={className}>
      <div className={`flex items-end ${gap}`} style={{ height }}>
        {data.map((d, i) => {
          const isCurrent = i === data.length - 1
          const barHeight = Math.max((d[valueKey] / max) * height, 4)
          return (
            <div
              key={d[labelKey] ?? i}
              className={`${barWidth} rounded-t ${isCurrent ? 'bg-accent-vivid' : 'bg-foreground/15'}`}
              style={{ height: barHeight }}
              title={`${d[labelKey]}: ${d[valueKey]}${unit}`}
            />
          )
        })}
      </div>
      {showLabels && (
        <div className="mt-1.5 flex justify-between text-xs text-muted">
          <span>{data[0][labelKey]}</span>
          <span>{data[data.length - 1][labelKey]}</span>
        </div>
      )}
    </div>
  )
}
