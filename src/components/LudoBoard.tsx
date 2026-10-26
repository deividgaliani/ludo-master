import React from 'react';
import type { BoardCoord } from '../constants/boardPath';
import {
  HOME_STRETCHES,
  START_INDICES,
  TRACK_COORDINATES,
} from '../constants/boardPath';
import { COLOR_THEMES } from '../constants/colors';
import type { MoveOption, Player, PlayerColor, Token } from '../types/ludo';
import { TokenPiece } from './TokenPiece';

interface LudoBoardProps {
  players: Player[];
  validMoves: MoveOption[];
  onTokenClick: (tokenId: number) => void;
  animatingToken?: {
    color: PlayerColor;
    tokenId: number;
    coord: BoardCoord;
  } | null;
}

const CELL_SIZE = 50; // 15 x 50 = 750px board

export const LudoBoard: React.FC<LudoBoardProps> = ({
  players,
  validMoves,
  onTokenClick,
  animatingToken,
}) => {
  // Map all current active tokens to coordinate keys to calculate stacking offsets
  const coordTokenMap = new Map<string, { token: Token; player: Player }[]>();

  players.forEach((player) => {
    player.tokens.forEach((token) => {
      // If this token is currently in the middle of being animated, we don't draw it at its static spot
      if (
        animatingToken &&
        animatingToken.color === token.color &&
        animatingToken.tokenId === token.id
      ) {
        return;
      }

      const key = `${token.row.toFixed(1)},${token.col.toFixed(1)}`;
      const list = coordTokenMap.get(key) || [];
      list.push({ token, player });
      coordTokenMap.set(key, list);
    });
  });

  const getStackOffset = (index: number, total: number) => {
    if (total <= 1) return { dx: 0, dy: 0 };
    const radius = 10;
    const angle = (index * (2 * Math.PI)) / total;
    return {
      dx: Math.cos(angle) * radius,
      dy: Math.sin(angle) * radius,
    };
  };

  const renderStarIcon = (cx: number, cy: number, color: string = '#64748b') => {
    return (
      <path
        d={`M ${cx} ${cy - 12} 
            L ${cx + 3.5} ${cy - 4} 
            L ${cx + 12} ${cy - 3} 
            L ${cx + 6} ${cy + 3} 
            L ${cx + 8} ${cy + 11} 
            L ${cx} ${cy + 7} 
            L ${cx - 8} ${cy + 11} 
            L ${cx - 6} ${cy + 3} 
            L ${cx - 12} ${cy - 3} 
            L ${cx - 3.5} ${cy - 4} Z`}
        fill={color}
        opacity="0.85"
      />
    );
  };

  const renderArrowIcon = (cx: number, cy: number, direction: 'right' | 'down' | 'left' | 'up', color: string) => {
    const angle =
      direction === 'right' ? 0 : direction === 'down' ? 90 : direction === 'left' ? 180 : 270;
    return (
      <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
        <path
          d="M -8 -8 L 8 0 L -8 8 L -4 0 Z"
          fill={color}
          opacity="0.9"
        />
      </g>
    );
  };

  return (
    <div className="relative w-full max-w-[620px] aspect-square mx-auto rounded-3xl p-3 bg-slate-900/90 shadow-2xl border-4 border-slate-700/60 backdrop-blur-md">
      <svg
        viewBox="0 0 750 750"
        className="w-full h-full rounded-2xl select-none"
        style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.5))' }}
      >
        <defs>
          {/* Gradients for tokens */}
          {(['red', 'green', 'yellow', 'blue'] as PlayerColor[]).map((col) => (
            <radialGradient
              key={col}
              id={`token-gradient-${col}`}
              cx="35%"
              cy="35%"
              r="65%"
            >
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="30%" stopColor={COLOR_THEMES[col].primary} />
              <stop offset="85%" stopColor={COLOR_THEMES[col].secondary} />
              <stop offset="100%" stopColor={COLOR_THEMES[col].darkHex} />
            </radialGradient>
          ))}
          {/* Board quadrant gradients */}
          <linearGradient id="red-base-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
          <linearGradient id="green-base-grad" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
          <linearGradient id="yellow-base-grad" x1="1" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>
          <linearGradient id="blue-base-grad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>

        {/* Board Background */}
        <rect width="750" height="750" fill="#f8fafc" rx="16" />

        {/* 1. Red Yard (Top Left) */}
        <rect x="0" y="0" width="300" height="300" fill="url(#red-base-grad)" rx="16" />
        <rect x="40" y="40" width="220" height="220" fill="#ffffff" rx="14" opacity="0.95" />
        {[
          [80, 80],
          [80, 220],
          [220, 80],
          [220, 220],
        ].map(([px, py], i) => (
          <circle
            key={`red-pedestal-${i}`}
            cx={px}
            cy={py}
            r="28"
            fill="#fee2e2"
            stroke="#ef4444"
            strokeWidth="3.5"
          />
        ))}

        {/* 2. Green Yard (Top Right) */}
        <rect x="450" y="0" width="300" height="300" fill="url(#green-base-grad)" rx="16" />
        <rect x="490" y="40" width="220" height="220" fill="#ffffff" rx="14" opacity="0.95" />
        {[
          [530, 80],
          [530, 220],
          [670, 80],
          [670, 220],
        ].map(([px, py], i) => (
          <circle
            key={`green-pedestal-${i}`}
            cx={px}
            cy={py}
            r="28"
            fill="#dcfce7"
            stroke="#22c55e"
            strokeWidth="3.5"
          />
        ))}

        {/* 3. Yellow Yard (Bottom Right) */}
        <rect x="450" y="450" width="300" height="300" fill="url(#yellow-base-grad)" rx="16" />
        <rect x="490" y="490" width="220" height="220" fill="#ffffff" rx="14" opacity="0.95" />
        {[
          [530, 530],
          [530, 670],
          [670, 530],
          [670, 670],
        ].map(([px, py], i) => (
          <circle
            key={`yellow-pedestal-${i}`}
            cx={px}
            cy={py}
            r="28"
            fill="#fef9c3"
            stroke="#eab308"
            strokeWidth="3.5"
          />
        ))}

        {/* 4. Blue Yard (Bottom Left) */}
        <rect x="0" y="450" width="300" height="300" fill="url(#blue-base-grad)" rx="16" />
        <rect x="40" y="490" width="220" height="220" fill="#ffffff" rx="14" opacity="0.95" />
        {[
          [80, 530],
          [80, 670],
          [220, 530],
          [220, 670],
        ].map(([px, py], i) => (
          <circle
            key={`blue-pedestal-${i}`}
            cx={px}
            cy={py}
            r="28"
            fill="#dbeafe"
            stroke="#3b82f6"
            strokeWidth="3.5"
          />
        ))}

        {/* 5. Center 3x3 Home Triangle */}
        <rect x="300" y="300" width="150" height="150" fill="#0f172a" />
        <polygon points="300,300 375,375 300,450" fill="#ef4444" />
        <polygon points="300,300 375,375 450,300" fill="#22c55e" />
        <polygon points="450,300 375,375 450,450" fill="#eab308" />
        <polygon points="300,450 375,375 450,450" fill="#3b82f6" />
        <circle cx="375" cy="375" r="26" fill="#ffffff" stroke="#334155" strokeWidth="2" />
        <text
          x="375"
          y="379"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="13"
          fontWeight="900"
          fill="#0f172a"
        >
          LUDO
        </text>

        {/* 6. Perimeter Track Cells (52 squares) */}
        {TRACK_COORDINATES.map((coord, idx) => {
          const x = coord.col * CELL_SIZE;
          const y = coord.row * CELL_SIZE;
          const cx = x + CELL_SIZE / 2;
          const cy = y + CELL_SIZE / 2;

          const isRedStart = idx === START_INDICES.red;
          const isGreenStart = idx === START_INDICES.green;
          const isYellowStart = idx === START_INDICES.yellow;
          const isBlueStart = idx === START_INDICES.blue;

          const isStar = idx === 8 || idx === 21 || idx === 34 || idx === 47;

          let cellFill = '#ffffff';
          if (isRedStart) cellFill = '#fee2e2';
          if (isGreenStart) cellFill = '#dcfce7';
          if (isYellowStart) cellFill = '#fef9c3';
          if (isBlueStart) cellFill = '#dbeafe';

          return (
            <g key={`track-${idx}`}>
              <rect
                x={x}
                y={y}
                width={CELL_SIZE}
                height={CELL_SIZE}
                fill={cellFill}
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />
              {isRedStart && renderArrowIcon(cx, cy, 'right', '#ef4444')}
              {isGreenStart && renderArrowIcon(cx, cy, 'down', '#22c55e')}
              {isYellowStart && renderArrowIcon(cx, cy, 'left', '#eab308')}
              {isBlueStart && renderArrowIcon(cx, cy, 'up', '#3b82f6')}
              {isStar && renderStarIcon(cx, cy, '#64748b')}
            </g>
          );
        })}

        {/* 7. Colored Home Stretches (5 squares for each color) */}
        {(['red', 'green', 'yellow', 'blue'] as PlayerColor[]).map((col) => {
          const stretch = HOME_STRETCHES[col];
          const theme = COLOR_THEMES[col];
          return (
            <g key={`stretch-${col}`}>
              {stretch.map((coord, stepIdx) => (
                <rect
                  key={`stretch-${col}-${stepIdx}`}
                  x={coord.col * CELL_SIZE}
                  y={coord.row * CELL_SIZE}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  fill={theme.primary}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  opacity="0.9"
                />
              ))}
            </g>
          );
        })}

        {/* 8. Render All Tokens (with stack offsets) */}
        {Array.from(coordTokenMap.values()).map((items) => {
          return items.map(({ token, player }, idx) => {
            const offset = getStackOffset(idx, items.length);
            const posX = token.col * CELL_SIZE + CELL_SIZE / 2 + offset.dx;
            const posY = token.row * CELL_SIZE + CELL_SIZE / 2 + offset.dy;

            const isValidMove = validMoves.some((m) => m.tokenId === token.id && player.color === token.color);

            return (
              <TokenPiece
                key={`token-${token.color}-${token.id}`}
                color={token.color}
                tokenId={token.id}
                x={posX}
                y={posY}
                radius={items.length > 1 ? 14 : 17}
                isValidMove={isValidMove}
                onClick={() => onTokenClick(token.id)}
              />
            );
          });
        })}

        {/* 9. Render Actively Animating Token */}
        {animatingToken && (
          <TokenPiece
            color={animatingToken.color}
            tokenId={animatingToken.tokenId}
            x={animatingToken.coord.col * CELL_SIZE + CELL_SIZE / 2}
            y={animatingToken.coord.row * CELL_SIZE + CELL_SIZE / 2}
            radius={18}
            isAnimating={true}
          />
        )}
      </svg>
    </div>
  );
};
