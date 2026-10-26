import React from 'react';
import { COLOR_THEMES } from '../constants/colors';
import type { PlayerColor } from '../types/ludo';

interface TokenPieceProps {
  color: PlayerColor;
  tokenId: number;
  x: number; // Center pixel coordinate
  y: number; // Center pixel coordinate
  radius?: number;
  isValidMove?: boolean;
  isAnimating?: boolean;
  onClick?: () => void;
}

export const TokenPiece: React.FC<TokenPieceProps> = ({
  color,
  tokenId,
  x,
  y,
  radius = 18,
  isValidMove = false,
  isAnimating = false,
  onClick,
}) => {
  const theme = COLOR_THEMES[color];

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={isValidMove ? onClick : undefined}
      style={{
        cursor: isValidMove ? 'pointer' : 'default',
        transition: isAnimating ? 'transform 0.15s ease-out' : 'none',
      }}
      className={isValidMove ? 'select-none group' : 'select-none'}
    >
      {/* Glow pulse when token can be moved */}
      {isValidMove && (
        <>
          <circle
            r={radius + 8}
            fill="none"
            stroke="#fef08a"
            strokeWidth="3.5"
            strokeDasharray="4 2"
            className="animate-spin"
            style={{ animationDuration: '3s' }}
            opacity="0.9"
          />
          <circle
            r={radius + 5}
            fill={theme.primary}
            opacity="0.35"
            className="animate-pulse"
          />
        </>
      )}

      {/* Drop Shadow */}
      <ellipse
        cx="0"
        cy={radius * 0.75}
        rx={radius * 0.85}
        ry={radius * 0.35}
        fill="rgba(0, 0, 0, 0.4)"
      />

      {/* Pawn Base */}
      <circle
        r={radius}
        fill={`url(#token-gradient-${color})`}
        stroke="#ffffff"
        strokeWidth="2.5"
        filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"
      />

      {/* Pawn Center Ring */}
      <circle
        r={radius * 0.65}
        fill={theme.darkHex}
        opacity="0.35"
      />

      {/* Inner Sphere/Head */}
      <circle
        r={radius * 0.45}
        fill="#ffffff"
        opacity="0.9"
      />

      <circle
        r={radius * 0.35}
        fill={theme.primary}
      />

      {/* Specular highlight */}
      <circle
        cx={-radius * 0.22}
        cy={-radius * 0.22}
        r={radius * 0.2}
        fill="#ffffff"
        opacity="0.75"
      />

      {/* Subtle Token Number */}
      <text
        x="0"
        y="3"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={radius * 0.6}
        fontWeight="800"
        fill="#ffffff"
        pointerEvents="none"
      >
        {tokenId + 1}
      </text>
    </g>
  );
};
