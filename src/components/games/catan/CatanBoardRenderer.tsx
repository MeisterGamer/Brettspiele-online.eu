import React from 'react';
import {
  CatanHex,
  CatanVertex,
  CatanEdge,
  CatanPlayerState,
  TERRAIN_DATA
} from './catanData';
import { WoodenSettlement, WoodenCity, WoodenRoad, WoodenRobber } from './CatanFigureRenderer';

interface CatanBoardRendererProps {
  hexes: CatanHex[];
  vertices: CatanVertex[];
  edges: CatanEdge[];
  players: CatanPlayerState[];
  robberHexId: number;
  highlightedVertexIds?: number[];
  highlightedEdgeIds?: string[];
  highlightedHexIds?: number[];
  onVertexClick?: (vertexId: number) => void;
  onEdgeClick?: (edgeId: string) => void;
  onHexClick?: (hexId: number) => void;
  activeBuildingMode?: 'settlement' | 'city' | 'road' | 'robber' | null;
  lastDiceRollHexIds?: number[];
}

export const CatanBoardRenderer: React.FC<CatanBoardRendererProps> = ({
  hexes,
  vertices,
  edges,
  players,
  robberHexId,
  highlightedVertexIds = [],
  highlightedEdgeIds = [],
  highlightedHexIds = [],
  onVertexClick,
  onEdgeClick,
  onHexClick,
  activeBuildingMode = null,
  lastDiceRollHexIds = [],
}) => {
  // Helper to find building owner on vertex
  const getVertexBuilding = (vId: number) => {
    for (const p of players) {
      if (p.cities.includes(vId)) {
        return { type: 'city' as const, color: p.color, player: p };
      }
      if (p.settlements.includes(vId)) {
        return { type: 'settlement' as const, color: p.color, player: p };
      }
    }
    return null;
  };

  // Helper to find road owner on edge
  const getEdgeRoad = (edgeId: string) => {
    for (const p of players) {
      if (p.roads.includes(edgeId)) {
        return { color: p.color, player: p };
      }
    }
    return null;
  };

  // Hex path generator from center and radius
  const getHexPoints = (cx: number, cy: number, radius = 54) => {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angleRad = (Math.PI / 180) * (30 + i * 60);
      const x = cx + radius * Math.cos(angleRad);
      const y = cy + radius * Math.sin(angleRad);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto flex items-center justify-center select-none overflow-hidden rounded-3xl bg-slate-950/60 p-2 sm:p-4 shadow-2xl border border-slate-800">
      <svg
        viewBox="0 0 720 640"
        className="w-full h-auto max-h-[72vh] drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Sea Ocean Gradient */}
          <radialGradient id="catanOcean" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#082f49" />
          </radialGradient>

          {/* Terrain Patterns & Textures */}
          <linearGradient id="forestTile" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#166534" />
            <stop offset="50%" stopColor="#14532d" />
            <stop offset="100%" stopColor="#052e16" />
          </linearGradient>

          <linearGradient id="pastureTile" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#65a30d" />
            <stop offset="50%" stopColor="#4d7c0f" />
            <stop offset="100%" stopColor="#365314" />
          </linearGradient>

          <linearGradient id="fieldTile" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="50%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>

          <linearGradient id="hillsTile" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b91c1c" />
            <stop offset="50%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>

          <linearGradient id="mountainTile" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          <linearGradient id="desertTile" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="50%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Number Token Parchment Gradient */}
          <radialGradient id="tokenParchment" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fde68a" />
          </radialGradient>

          {/* Harbor Flag Gradient */}
          <linearGradient id="harborWood" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          <filter id="tileShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.45" />
          </filter>

          <filter id="tokenShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* 1. Sea Frame Background */}
        <rect width="720" height="640" rx="24" fill="url(#catanOcean)" />

        {/* Wave textures around island */}
        <g opacity="0.25" stroke="#ffffff" strokeWidth="1.5" fill="none">
          <ellipse cx="360" cy="320" rx="310" ry="260" strokeDasharray="16, 12" />
          <ellipse cx="360" cy="320" rx="335" ry="285" strokeDasharray="8, 16" />
        </g>

        {/* 2. Coastal Harbors Docks */}
        {vertices
          .filter((v) => v.harbor)
          .map((v) => {
            const h = v.harbor!;
            const label = h.ratio === 2 ? `2:1 ${h.type.toUpperCase()}` : '3:1';
            const icon =
              h.type === 'wood' ? '🌲' :
              h.type === 'brick' ? '🧱' :
              h.type === 'wool' ? '🐑' :
              h.type === 'wheat' ? '🌾' :
              h.type === 'ore' ? '⛰️' : '⛵';

            // Vector pointing outward from center
            const angle = Math.atan2(v.y - 320, v.x - 360);
            const pierX = v.x + Math.cos(angle) * 22;
            const pierY = v.y + Math.sin(angle) * 22;

            return (
              <g key={`harbor-${v.id}`} className="pointer-events-none">
                {/* Pier line to coast */}
                <line
                  x1={v.x}
                  y1={v.y}
                  x2={pierX}
                  y2={pierY}
                  stroke="#78350f"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Harbor Dock Icon */}
                <circle cx={pierX} cy={pierY} r="13" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
                <text
                  x={pierX}
                  y={pierY + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#ffffff"
                >
                  {icon}
                </text>
              </g>
            );
          })}

        {/* 3. Hexagonal Land Tiles */}
        {hexes.map((hex) => {
          const isRobberHere = hex.id === robberHexId;
          const isHighlighted = highlightedHexIds.includes(hex.id);
          const isLastDiceRoll = lastDiceRollHexIds.includes(hex.id);
          const fillId =
            hex.terrain === 'forest' ? 'url(#forestTile)' :
            hex.terrain === 'pasture' ? 'url(#pastureTile)' :
            hex.terrain === 'field' ? 'url(#fieldTile)' :
            hex.terrain === 'hills' ? 'url(#hillsTile)' :
            hex.terrain === 'mountains' ? 'url(#mountainTile)' :
            'url(#desertTile)';

          const terrainIcon =
            hex.terrain === 'forest' ? '🌲' :
            hex.terrain === 'pasture' ? '🐑' :
            hex.terrain === 'field' ? '🌾' :
            hex.terrain === 'hills' ? '🧱' :
            hex.terrain === 'mountains' ? '⛰️' : '🌵';

          return (
            <g
              key={`hex-${hex.id}`}
              role="button" aria-label={`Räuber auf Feld ${hex.id+1}`} aria-disabled={!isHighlighted} tabIndex={isHighlighted?0:-1}
              onKeyDown={event=>{if(isHighlighted&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onHexClick?.(hex.id);}}}
              onClick={() => isHighlighted&&onHexClick?.(hex.id)}
              className={onHexClick && isHighlighted ? 'cursor-pointer group' : ''}
            >
              {/* Hex Base Polygon */}
              <polygon
                points={getHexPoints(hex.x, hex.y, 53)}
                fill={fillId}
                stroke={isHighlighted ? '#38bdf8' : isLastDiceRoll ? '#facc15' : '#020617'}
                strokeWidth={isHighlighted ? 4 : isLastDiceRoll ? 3.5 : 2}
                filter="url(#tileShadow)"
                className="transition-all duration-300"
              />

              {/* Inner Hex Texture Pattern */}
              <polygon
                points={getHexPoints(hex.x, hex.y, 48)}
                fill="none"
                stroke="#ffffff"
                strokeWidth="0.8"
                opacity="0.18"
              />

              {/* Terrain Watermark Icon */}
              <text
                x={hex.x}
                y={hex.terrain === 'desert' ? hex.y + 10 : hex.y - 18}
                textAnchor="middle"
                fontSize="18"
                opacity="0.75"
                className="pointer-events-none select-none"
              >
                {terrainIcon}
              </text>

              {/* 4. Number Token on Hex (except desert) */}
              {hex.number > 0 && (
                <g filter="url(#tokenShadow)" className="pointer-events-none">
                  {/* Parchment disc */}
                  <circle
                    cx={hex.x}
                    cy={hex.y + 6}
                    r="18"
                    fill="url(#tokenParchment)"
                    stroke="#78350f"
                    strokeWidth="1.5"
                  />

                  {/* Dice Number (Red 6 and 8, Dark Slate others) */}
                  <text
                    x={hex.x}
                    y={hex.y + 11}
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight="900"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fill={hex.number === 6 || hex.number === 8 ? '#dc2626' : '#1e293b'}
                  >
                    {hex.number}
                  </text>

                  {/* Probability Pip Dots */}
                  <g transform={`translate(${hex.x}, ${hex.y + 18})`}>
                    {Array.from({ length: hex.pips }).map((_, pIdx) => {
                      const offset = (pIdx - (hex.pips - 1) / 2) * 5;
                      return (
                        <circle
                          key={pIdx}
                          cx={offset}
                          cy="0"
                          r="1.3"
                          fill={hex.number === 6 || hex.number === 8 ? '#dc2626' : '#1e293b'}
                        />
                      );
                    })}
                  </g>
                </g>
              )}

              {/* 5. The Robber Pawn if located on this hex */}
              {isRobberHere && (
                <g transform={`translate(${hex.x - 19}, ${hex.y - 20})`} className="pointer-events-none">
                  <WoodenRobber size={38} />
                </g>
              )}

              {/* Robber placement highlight beacon */}
              {activeBuildingMode === 'robber' && isHighlighted && (
                <g className="animate-pulse">
                  <circle cx={hex.x} cy={hex.y} r="28" fill="#38bdf8" opacity="0.35" />
                  <circle cx={hex.x} cy={hex.y} r="32" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                </g>
              )}
            </g>
          );
        })}

        {/* 6. Built Wooden Roads */}
        {edges.map((edge) => {
          const road = getEdgeRoad(edge.id);
          if (!road) return null;
          return (
            <WoodenRoad
              key={`road-${edge.id}`}
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
              color={road.color}
            />
          );
        })}

        {/* 7. Interactive Edge Placement Targets (for building roads) */}
        {activeBuildingMode === 'road' &&
          edges.map((edge) => {
            const isHighlighted = highlightedEdgeIds.includes(edge.id);
            const alreadyHasRoad = getEdgeRoad(edge.id);
            if (alreadyHasRoad) return null;

            return (
              <g
                key={`edge-target-${edge.id}`}
                role="button" aria-label={`Straße ${edge.id}`} aria-disabled={!isHighlighted} tabIndex={isHighlighted?0:-1}
                onKeyDown={event=>{if(isHighlighted&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onEdgeClick?.(edge.id);}}}
                onClick={() => isHighlighted&&onEdgeClick?.(edge.id)}
                className={isHighlighted ? 'cursor-pointer group' : 'pointer-events-none'}
              >
                {/* Wide invisible click target */}
                <line
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke="transparent"
                  strokeWidth="18"
                />
                {isHighlighted && (
                  <line
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke="#38bdf8"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeDasharray="4, 4"
                    className="animate-pulse"
                  />
                )}
              </g>
            );
          })}

        {/* 8. Built Settlements and Cities */}
        {vertices.map((v) => {
          const building = getVertexBuilding(v.id);
          if (!building) return null;

          return (
            <g
              key={`building-${v.id}`}
              transform={`translate(${v.x - (building.type === 'city' ? 18 : 14)}, ${v.y - (building.type === 'city' ? 22 : 18)})`}
              onClick={() => onVertexClick && onVertexClick(v.id)}
              className={activeBuildingMode === 'city' && building.type === 'settlement' ? 'cursor-pointer' : ''}
            >
              {building.type === 'city' ? (
                <WoodenCity color={building.color} size={36} />
              ) : (
                <WoodenSettlement color={building.color} size={28} />
              )}
            </g>
          );
        })}

        {/* 9. Interactive Vertex Targets (for Settlements & Cities) */}
        {(activeBuildingMode === 'settlement' || activeBuildingMode === 'city') &&
          vertices.map((v) => {
            const isHighlighted = highlightedVertexIds.includes(v.id);
            if (!isHighlighted) return null;

            return (
              <g
                key={`vertex-target-${v.id}`}
                role="button" aria-label={`Bauplatz ${v.id+1}`} tabIndex={0}
                onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onVertexClick?.(v.id);}}}
                onClick={() => onVertexClick?.(v.id)}
                className="cursor-pointer group"
              >
                {/* Large touch target */}
                <circle cx={v.x} cy={v.y} r="18" fill="transparent" />
                {/* Pulsating target beacon */}
                <circle
                  cx={v.x}
                  cy={v.y}
                  r="11"
                  fill="#38bdf8"
                  opacity="0.8"
                  className="animate-ping"
                />
                <circle
                  cx={v.x}
                  cy={v.y}
                  r="8"
                  fill="#0284c7"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="group-hover:scale-125 transition-transform"
                />
              </g>
            );
          })}
      </svg>
    </div>
  );
};
