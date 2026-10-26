import type { BoardCoord } from '../constants/boardPath';
import {
  getTokenCoord,
  SAFE_SQUARE_INDICES,
  START_INDICES,
  TOTAL_STEPS_TO_GOAL,
} from '../constants/boardPath';
import type {
  MoveOption,
  Player,
  PlayerColor,
  PlayerConfig,
  Token,
} from '../types/ludo';

export function createInitialPlayers(configs: PlayerConfig[]): Player[] {
  return configs.map((cfg) => {
    const tokens: Token[] = [0, 1, 2, 3].map((id) => {
      const coord = getTokenCoord(cfg.color, id, -1);
      return {
        id,
        color: cfg.color,
        state: 'base',
        stepCount: -1,
        row: coord.row,
        col: coord.col,
      };
    });

    return {
      id: cfg.id,
      name: cfg.name,
      color: cfg.color,
      type: cfg.type,
      difficulty: cfg.difficulty || 'smart',
      tokens,
      tokensHome: 0,
    };
  });
}

/**
 * Checks if a destination global track square has an opponent token that can be captured.
 */
export function checkCapture(
  movingColor: PlayerColor,
  targetStepCount: number,
  allPlayers: Player[]
): { canCapture: boolean; capturedToken: { playerIndex: number; tokenId: number } | null } {
  // Captures only occur on the standard track (stepCount 0..50)
  if (targetStepCount < 0 || targetStepCount > 50) {
    return { canCapture: false, capturedToken: null };
  }

  const globalTarget = (START_INDICES[movingColor] + targetStepCount) % 52;

  // Safe squares protect from capture
  if (SAFE_SQUARE_INDICES.has(globalTarget)) {
    return { canCapture: false, capturedToken: null };
  }

  for (let pIdx = 0; pIdx < allPlayers.length; pIdx++) {
    const opp = allPlayers[pIdx];
    if (opp.color === movingColor) continue;

    for (const oppToken of opp.tokens) {
      if (oppToken.state === 'track' && oppToken.stepCount >= 0 && oppToken.stepCount <= 50) {
        const oppGlobal = (START_INDICES[opp.color] + oppToken.stepCount) % 52;
        if (oppGlobal === globalTarget) {
          return {
            canCapture: true,
            capturedToken: { playerIndex: pIdx, tokenId: oppToken.id },
          };
        }
      }
    }
  }

  return { canCapture: false, capturedToken: null };
}

/**
 * Calculates valid moves for the given player and dice value.
 */
export function getValidMoves(
  player: Player,
  diceValue: number,
  allPlayers: Player[]
): MoveOption[] {
  const moves: MoveOption[] = [];

  for (const token of player.tokens) {
    // 1. Token in base
    if (token.state === 'base') {
      if (diceValue === 6) {
        const captureInfo = checkCapture(player.color, 0, allPlayers);
        moves.push({
          tokenId: token.id,
          fromStep: -1,
          toStep: 0,
          isEnterTrack: true,
          isCapture: captureInfo.canCapture,
          isHome: false,
        });
      }
      continue;
    }

    // 2. Token already reached home goal
    if (token.state === 'home' || token.stepCount === TOTAL_STEPS_TO_GOAL) {
      continue;
    }

    // 3. Token on track or home stretch
    const targetStep = token.stepCount + diceValue;

    // Exact roll required to reach home goal (step 57)
    if (targetStep > TOTAL_STEPS_TO_GOAL) {
      continue; // Overshoot not allowed
    }

    if (targetStep === TOTAL_STEPS_TO_GOAL) {
      moves.push({
        tokenId: token.id,
        fromStep: token.stepCount,
        toStep: targetStep,
        isEnterTrack: false,
        isCapture: false,
        isHome: true,
      });
      continue;
    }

    // Moving on track or into home stretch
    const captureInfo = checkCapture(player.color, targetStep, allPlayers);
    moves.push({
      tokenId: token.id,
      fromStep: token.stepCount,
      toStep: targetStep,
      isEnterTrack: false,
      isCapture: captureInfo.canCapture,
      isHome: false,
    });
  }

  return moves;
}

/**
 * Returns the path of board coordinates from fromStep to toStep for animation.
 */
export function getAnimationPath(
  color: PlayerColor,
  tokenId: number,
  fromStep: number,
  toStep: number
): BoardCoord[] {
  const path: BoardCoord[] = [];

  if (fromStep === -1) {
    // Coming out of yard directly to start square (step 0)
    path.push(getTokenCoord(color, tokenId, -1));
    path.push(getTokenCoord(color, tokenId, 0));
    return path;
  }

  for (let s = fromStep; s <= toStep; s++) {
    path.push(getTokenCoord(color, tokenId, s));
  }

  return path;
}
