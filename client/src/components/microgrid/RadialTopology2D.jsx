import React, { useState } from 'react';
import FaIcon from '../icons/FaIcon';

export default function RadialTopology2D({
  households = [],
  battery = { soc: 40, capacity: 20.0 },
  grid = { status: 'NORMAL', tariff: 6.50 },
  selectedNodeId,
  onSelectNode,
}) {
  const [hoveredNode, setHoveredNode] = useState(null);

  // Center coordinate for SVG viewBox 0 0 900 620
  const cx = 450;
  const cy = 340;
  const radialRadius = 220;
  const gridY = 90;

  // Grid net calculation
  const totalGen = households.reduce((sum, h) => sum + (h.generation || 0), 0);
  const totalCon = households.reduce((sum, h) => sum + (h.consumption || 0), 0);
  const netCommunity = totalGen - totalCon;
  const gridNetKw = netCommunity < 0 ? netCommunity : 0; // Grid supplies deficit if any

  // Map households to radial angles (excluding top 90° for Grid)
  const defaultAngles = [
    { angle: -30, label: 'House A' },
    { angle: 35, label: 'House B' },
    { angle: 90, label: 'House C' },
    { angle: 145, label: 'House D' },
    { angle: 210, label: 'House E' },
    { angle: 250, label: 'House F' },
  ];

  const nodes = households.map((h, index) => {
    const angleConfig = defaultAngles[index % defaultAngles.length];
    const angleRad = (angleConfig.angle * Math.PI) / 180;
    const x = cx + radialRadius * Math.cos(angleRad);
    const y = cy + radialRadius * Math.sin(angleRad);
    const net = (h.generation || 0) - (h.consumption || 0);
    const isSurplus = net >= 0;

    return {
      ...h,
      x,
      y,
      net,
      isSurplus,
      label: h.name || angleConfig.label,
    };
  });

  return (
    <div className="w-full relative flex flex-col items-center select-none">
      {/* Top Banner / Description matching user spec */}
      <div className="w-full pb-3 text-left">
        <h2 className="font-display text-lg font-bold text-[#041D0D]">
          Network view
        </h2>
        <p className="text-xs text-[#4A5B4F] mt-0.5 max-w-2xl leading-relaxed">
          Not a literal street map, an abstract view of who's feeding the community battery and who's drawing from it right now. Hover or focus a node for detail.
        </p>
      </div>

      {/* SVG Canvas */}
      <div className="w-full max-w-[880px] aspect-[900/620] relative bg-[#F8FAF6] rounded-2xl border border-[#E2EED7] p-2 flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 900 620"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Green Inward Arrowhead (Pointing toward Battery) */}
            <marker
              id="arrow-green-inward"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#8BC53D" />
            </marker>

            {/* Red Outward Arrowhead (Pointing toward Consumer House) */}
            <marker
              id="arrow-red-outward"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#D45C5C" />
            </marker>

            {/* Grid Flow Inward Arrowhead */}
            <marker
              id="arrow-grid-down"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#D45C5C" />
            </marker>

            {/* Glowing filter for battery */}
            <filter id="glow-battery" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#8BC53D" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* ─── 1. GRID FLOW ARROW & MOVING PARTICLES (Grid -> Battery) ─── */}
          <g>
            {/* Background Conduit Ribbon */}
            <line
              x1={cx}
              y1={gridY + 36}
              x2={cx}
              y2={cy - 48}
              stroke={gridNetKw < 0 ? '#FDECEC' : '#E2F0CC'}
              strokeWidth={Math.min(20, Math.max(6, Math.abs(gridNetKw) * 2.8))}
              strokeLinecap="round"
            />
            {/* Primary Flow Arrow Line */}
            <line
              x1={cx}
              y1={gridY + 36}
              x2={cx}
              y2={cy - 48}
              stroke={gridNetKw < 0 ? '#D45C5C' : '#8BC53D'}
              strokeWidth={Math.min(14, Math.max(3.5, Math.abs(gridNetKw) * 1.8))}
              strokeOpacity="0.85"
              markerEnd={gridNetKw < 0 ? 'url(#arrow-grid-down)' : 'url(#arrow-green-inward)'}
            />
            {/* Moving Animated Energy Circles */}
            {gridNetKw !== 0 && (
              <>
                <circle r={Math.min(5, Math.max(3, Math.abs(gridNetKw) * 0.8))} fill={gridNetKw < 0 ? '#D45C5C' : '#8BC53D'}>
                  <animateMotion
                    path={gridNetKw < 0 ? `M ${cx},${gridY + 36} L ${cx},${cy - 48}` : `M ${cx},${cy - 48} L ${cx},${gridY + 36}`}
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle r={Math.min(4, Math.max(2.5, Math.abs(gridNetKw) * 0.6))} fill={gridNetKw < 0 ? '#FF8A8A' : '#A6E552'} opacity="0.9">
                  <animateMotion
                    path={gridNetKw < 0 ? `M ${cx},${gridY + 36} L ${cx},${cy - 48}` : `M ${cx},${cy - 48} L ${cx},${gridY + 36}`}
                    dur="1.4s"
                    begin="0.7s"
                    repeatCount="indefinite"
                  />
                </circle>
              </>
            )}
          </g>

          {/* ─── 2. HOUSEHOLD FLOW ARROWS & MOVING PARTICLES ─── */}
          {nodes.map((node) => {
            const isHovered = hoveredNode?.id === node.id || selectedNodeId === node.id;
            const flowMagnitude = Math.abs(node.net);
            // Dynamic Thickness directly proportional to power sent or received
            const strokeWidth = Math.min(14, Math.max(3, flowMagnitude * 2.6));
            const ribbonWidth = strokeWidth * 1.8;
            const strokeColor = node.isSurplus ? '#8BC53D' : '#D45C5C';
            const ribbonColor = node.isSurplus ? '#E2F0CC' : '#FDECEC';
            const particleColor = node.isSurplus ? '#8BC53D' : '#D45C5C';
            const particleGlowColor = node.isSurplus ? '#B7EB74' : '#FF9999';
            const particleRadius = Math.min(5.5, Math.max(2.8, strokeWidth * 0.45));
            const animDuration = Math.max(0.9, 2.2 - Math.min(1.2, flowMagnitude * 0.25)); // Higher flow moves faster

            // Geometry vector calculation to clip arrows outside node circles
            const dx = node.x - cx;
            const dy = node.y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const ux = dx / dist;
            const uy = dy / dist;

            // Clip points (Battery radius: 46, Node radius: 32)
            const startX = cx + ux * 46;
            const startY = cy + uy * 46;
            const endX = node.x - ux * 32;
            const endY = node.y - uy * 32;

            // Motion Path direction
            const motionPath = node.isSurplus
              ? `M ${endX},${endY} L ${startX},${startY}` // Inward toward Battery
              : `M ${startX},${startY} L ${endX},${endY}`; // Outward toward House

            return (
              <g key={`flow-${node.id}`} className="transition-all duration-300">
                {/* Background Conduit Ribbon */}
                <line
                  x1={node.isSurplus ? endX : startX}
                  y1={node.isSurplus ? endY : startY}
                  x2={node.isSurplus ? startX : endX}
                  y2={node.isSurplus ? startY : endY}
                  stroke={ribbonColor}
                  strokeWidth={ribbonWidth}
                  strokeLinecap="round"
                  strokeOpacity="0.75"
                />

                {/* Primary Flow Arrow Line */}
                <line
                  x1={node.isSurplus ? endX : startX}
                  y1={node.isSurplus ? endY : startY}
                  x2={node.isSurplus ? startX : endX}
                  y2={node.isSurplus ? startY : endY}
                  stroke={strokeColor}
                  strokeWidth={isHovered ? strokeWidth + 2.5 : strokeWidth}
                  strokeOpacity={isHovered ? 1 : 0.85}
                  markerEnd={node.isSurplus ? 'url(#arrow-green-inward)' : 'url(#arrow-red-outward)'}
                />

                {/* Animated Moving Particles Traveling in Arrow Direction */}
                {flowMagnitude > 0.05 && (
                  <>
                    {/* Leading Particle Circle */}
                    <circle r={particleRadius} fill={particleColor}>
                      <animateMotion
                        path={motionPath}
                        dur={`${animDuration}s`}
                        repeatCount="indefinite"
                      />
                    </circle>

                    {/* Following Particle Circle (offset by half duration) */}
                    <circle r={Math.max(2, particleRadius * 0.75)} fill={particleGlowColor} opacity="0.9">
                      <animateMotion
                        path={motionPath}
                        dur={`${animDuration}s`}
                        begin={`${animDuration / 2}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  </>
                )}
              </g>
            );
          })}

          {/* ─── 3. TOP GRID NODE ─── */}
          <g
            className="cursor-pointer transition-transform duration-200"
            onMouseEnter={() => setHoveredNode({ id: 'grid', name: 'Utility Grid', type: 'Grid Feed-in', net: gridNetKw })}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {/* Outer halo */}
            <circle
              cx={cx}
              cy={gridY}
              r="34"
              fill={gridNetKw < 0 ? '#FDECEC' : '#E2F0CC'}
              stroke={gridNetKw < 0 ? '#D45C5C' : '#8BC53D'}
              strokeWidth="2"
              strokeOpacity="0.8"
            />
            {/* Grid Icon */}
            <circle cx={cx} cy={gridY} r="22" fill={gridNetKw < 0 ? '#D45C5C' : '#012F13'} />
            <text
              x={cx}
              y={gridY + 4}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="12"
              fontWeight="bold"
              fontFamily="Outfit, sans-serif"
            >
              ⚡
            </text>

            {/* Grid Text Labels */}
            <text
              x={cx}
              y={gridY + 46}
              textAnchor="middle"
              fill="#041D0D"
              fontSize="11"
              fontWeight="bold"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              Grid
            </text>
            <text
              x={cx}
              y={gridY + 58}
              textAnchor="middle"
              fill={gridNetKw < 0 ? '#D45C5C' : '#8BC53D'}
              fontSize="10"
              fontWeight="bold"
              fontFamily="JetBrains Mono, monospace"
            >
              {gridNetKw.toFixed(1)} kW
            </text>
          </g>

          {/* ─── 4. CENTER BATTERY NODE ─── */}
          <g
            className="cursor-pointer"
            filter="url(#glow-battery)"
            onMouseEnter={() => setHoveredNode({ id: 'battery', name: 'Central ESS Battery', soc: battery.soc, capacity: battery.capacity, type: 'Storage' })}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {/* Outer Ring */}
            <circle
              cx={cx}
              cy={cy}
              r="46"
              fill="#E2F0CC"
              fillOpacity="0.6"
              stroke="#8BC53D"
              strokeWidth="2.5"
            />
            {/* Inner Core */}
            <circle
              cx={cx}
              cy={cy}
              r="34"
              fill="#FFFFFF"
              stroke="#BED69E"
              strokeWidth="1.5"
            />
            {/* Battery Glyph */}
            <text
              x={cx}
              y={cy - 2}
              textAnchor="middle"
              fill="#012F13"
              fontSize="16"
              fontWeight="bold"
              fontFamily="Outfit, sans-serif"
            >
              🔋
            </text>
            {/* Battery SOC */}
            <text
              x={cx}
              y={cy + 16}
              textAnchor="middle"
              fill="#012F13"
              fontSize="11"
              fontWeight="800"
              fontFamily="JetBrains Mono, monospace"
            >
              {battery.soc || 40}%
            </text>

            <text
              x={cx}
              y={cy + 62}
              textAnchor="middle"
              fill="#4A5B4F"
              fontSize="11"
              fontWeight="600"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              Community Battery
            </text>
          </g>

          {/* ─── 5. SURROUNDING PROSUMER NODES ─── */}
          {nodes.map((node) => {
            const isHovered = hoveredNode?.id === node.id || selectedNodeId === node.id;
            const isSurplus = node.isSurplus;
            const bgColor = isSurplus ? '#E2F0CC' : '#FDECEC';
            const borderColor = isSurplus ? '#8BC53D' : '#D45C5C';
            const textColor = isSurplus ? '#012F13' : '#D45C5C';

            return (
              <g
                key={`node-${node.id}`}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => onSelectNode && onSelectNode(node)}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Node Outer Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? 34 : 28}
                  fill={bgColor}
                  stroke={borderColor}
                  strokeWidth={isHovered ? 2.5 : 1.8}
                  className="transition-all duration-200"
                />

                {/* Node kW text */}
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fill={textColor}
                  fontSize={isHovered ? '12' : '11'}
                  fontWeight="800"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {isSurplus ? `+${node.net.toFixed(1)}` : `${node.net.toFixed(1)}`}
                </text>

                {/* Node Name Label */}
                <text
                  x={node.x}
                  y={node.y + (isHovered ? 46 : 42)}
                  textAnchor="middle"
                  fill="#041D0D"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Details when Hovered / Tapped on Mobile */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto max-w-sm bg-white/95 backdrop-blur-md p-3 rounded-xl border border-[#BED69E] shadow-xl text-left z-20 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-2">
                <span className="font-display font-bold text-xs text-[#041D0D]">
                  {hoveredNode.name || hoveredNode.label}
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#E2F0CC] text-[#012F13]">
                  {hoveredNode.type || 'Household'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setHoveredNode(null)}
                className="text-[#4A5B4F] hover:text-[#041D0D] text-xs p-1 sm:hidden font-bold"
                aria-label="Close tooltip"
              >
                ✕
              </button>
            </div>
            {hoveredNode.generation !== undefined && (
              <div className="text-[11px] text-[#4A5B4F] mt-1 space-y-0.5 font-mono">
                <div>Solar Gen: <span className="font-bold text-[#8BC53D]">{hoveredNode.generation.toFixed(1)} kW</span></div>
                <div>Demand: <span className="font-bold text-[#011207]">{hoveredNode.consumption.toFixed(1)} kW</span></div>
                <div>Net Power: <span className={`font-bold ${hoveredNode.net >= 0 ? 'text-[#8BC53D]' : 'text-[#D45C5C]'}`}>{hoveredNode.net >= 0 ? `+${hoveredNode.net.toFixed(1)} kW (Feeding ESS)` : `${hoveredNode.net.toFixed(1)} kW (Drawing ESS)`}</span></div>
              </div>
            )}
            {hoveredNode.id === 'battery' && (
              <div className="text-[11px] text-[#4A5B4F] mt-1 space-y-0.5 font-mono">
                <div>State of Charge: <span className="font-bold text-[#8BC53D]">{hoveredNode.soc}%</span></div>
                <div>Capacity: <span className="font-bold text-[#011207]">{hoveredNode.capacity} kWh</span></div>
                <div>Emergency Floor: <span className="font-bold text-[#D45C5C]">20% (4.0 kWh)</span></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
