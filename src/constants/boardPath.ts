import type { PlayerColor } from '../types/ludo';

export interface BoardCoord {
  row: number;
  col: number;
}

// 52 Perimeter track squares in clockwise order starting from Red start (row 6, col 1)
export const TRACK_COORDINATES: BoardCoord[] = [
  // Red Arm (top-left moving right and up)
  { row: 6, col: 1 },  // 0  - Red Start [SAFE]
  { row: 6, col: 2 },  // 1
  { row: 6, col: 3 },  // 2
  { row: 6, col: 4 },  // 3
  { row: 6, col: 5 },  // 4
  { row: 5, col: 6 },  // 5
  { row: 4, col: 6 },  // 6
  { row: 3, col: 6 },  // 7
  { row: 2, col: 6 },  // 8  - Star 1 [SAFE]
  { row: 1, col: 6 },  // 9
  { row: 0, col: 6 },  // 10
  { row: 0, col: 7 },  // 11
  { row: 0, col: 8 },  // 12

  // Green Arm (top-right moving down and right)
  { row: 1, col: 8 },  // 13 - Green Start [SAFE]
  { row: 2, col: 8 },  // 14
  { row: 3, col: 8 },  // 15
  { row: 4, col: 8 },  // 16
  { row: 5, col: 8 },  // 17
  { row: 6, col: 9 },  // 18
  { row: 6, col: 10 }, // 19
  { row: 6, col: 11 }, // 20
  { row: 6, col: 12 }, // 21 - Star 2 [SAFE]
  { row: 6, col: 13 }, // 22
  { row: 6, col: 14 }, // 23
  { row: 7, col: 14 }, // 24
  { row: 8, col: 14 }, // 25

  // Yellow Arm (bottom-right moving left and down)
  { row: 8, col: 13 }, // 26 - Yellow Start [SAFE]
  { row: 8, col: 12 }, // 27
  { row: 8, col: 11 }, // 28
  { row: 8, col: 10 }, // 29
  { row: 8, col: 9 },  // 30
  { row: 9, col: 8 },  // 31
  { row: 10, col: 8 }, // 32
  { row: 11, col: 8 }, // 33
  { row: 12, col: 8 }, // 34 - Star 3 [SAFE]
  { row: 13, col: 8 }, // 35
  { row: 14, col: 8 }, // 36
  { row: 14, col: 7 }, // 37
  { row: 14, col: 6 }, // 38

  // Blue Arm (bottom-left moving up and left)
  { row: 13, col: 6 }, // 39 - Blue Start [SAFE]
  { row: 12, col: 6 }, // 40
  { row: 11, col: 6 }, // 41
  { row: 10, col: 6 }, // 42
  { row: 9, col: 6 },  // 43
  { row: 8, col: 5 },  // 44
  { row: 8, col: 4 },  // 45
  { row: 8, col: 3 },  // 46
  { row: 8, col: 2 },  // 47 - Star 4 [SAFE]
  { row: 8, col: 1 },  // 48
  { row: 8, col: 0 },  // 49
  { row: 7, col: 0 },  // 50
  { row: 6, col: 0 },  // 51 - Red entry gate
];

export const START_INDICES: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

// Star squares (safe spots marked with stars)
export const STAR_INDICES = [8, 21, 34, 47] as const;
export const STAR_SQUARE_INDICES = new Set(STAR_INDICES);

// Safe squares globally (starts + stars)
export const SAFE_SQUARE_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Home Stretch lanes (5 steps each, indices 52 to 56)
export const HOME_STRETCHES: Record<PlayerColor, BoardCoord[]> = {
  red: [
    { row: 7, col: 1 },
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 7, col: 4 },
    { row: 7, col: 5 },
  ],
  green: [
    { row: 1, col: 7 },
    { row: 2, col: 7 },
    { row: 3, col: 7 },
    { row: 4, col: 7 },
    { row: 5, col: 7 },
  ],
  yellow: [
    { row: 7, col: 13 },
    { row: 7, col: 12 },
    { row: 7, col: 11 },
    { row: 7, col: 10 },
    { row: 7, col: 9 },
  ],
  blue: [
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row: 9, col: 7 },
  ],
};

// Center Goal coordinate (step 57)
export const GOAL_COORDINATES: Record<PlayerColor, BoardCoord> = {
  red: { row: 7, col: 6.5 },
  green: { row: 6.5, col: 7 },
  yellow: { row: 7, col: 7.5 },
  blue: { row: 7.5, col: 7 },
};

// Yard positions for tokens in base
export const YARD_POSITIONS: Record<PlayerColor, BoardCoord[]> = {
  red: [
    { row: 1.8, col: 1.8 },
    { row: 1.8, col: 3.8 },
    { row: 3.8, col: 1.8 },
    { row: 3.8, col: 3.8 },
  ],
  green: [
    { row: 1.8, col: 10.8 },
    { row: 1.8, col: 12.8 },
    { row: 3.8, col: 10.8 },
    { row: 3.8, col: 12.8 },
  ],
  yellow: [
    { row: 10.8, col: 10.8 },
    { row: 10.8, col: 12.8 },
    { row: 12.8, col: 10.8 },
    { row: 12.8, col: 12.8 },
  ],
  blue: [
    { row: 10.8, col: 1.8 },
    { row: 10.8, col: 3.8 },
    { row: 12.8, col: 1.8 },
    { row: 12.8, col: 3.8 },
  ],
};

export const TOTAL_STEPS_TO_GOAL = 56;

export function getTokenCoord(color: PlayerColor, tokenId: number, stepCount: number): BoardCoord {
  if (stepCount < 0) {
    return YARD_POSITIONS[color][tokenId];
  }
  // Track has 51 perimeter squares for each player (stepCount 0..50)
  // Step 50 is the gate square directly facing the colored home stretch
  if (stepCount <= 50) {
    const globalIdx = (START_INDICES[color] + stepCount) % 52;
    return TRACK_COORDINATES[globalIdx];
  }
  // Home stretch has 5 colored squares (stepCount 51..55)
  if (stepCount <= 55) {
    return HOME_STRETCHES[color][stepCount - 51];
  }
  // Goal is step 56
  return GOAL_COORDINATES[color];
}

export function getGlobalTrackIndex(color: PlayerColor, stepCount: number): number | null {
  if (stepCount < 0 || stepCount > 50) return null;
  return (START_INDICES[color] + stepCount) % 52;
}
