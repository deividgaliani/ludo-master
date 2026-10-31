import type { BoardCoord } from '../constants/boardPath';
import {
  getTokenCoord,
  SAFE_SQUARE_INDICES,
  START_INDICES,
  TOTAL_STEPS_TO_GOAL,
} from '../constants/boardPath';
import type {
  AutoModeConfig,
  AutoModePreset,
  MoveOption,
  Player,
  PlayerColor,
  PlayerConfig,
  PlayerStats,
  Token,
} from '../types/ludo';
import { selectBestAIMove } from './aiStrategy';

export function createInitialStats(): PlayerStats {
  return {
    piecesCaptured: 0,
    piecesLost: 0,
    totalMoves: 0,
    totalRolls: 0,
    sixesRolled: 0,
    diceRollsByFace: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    distanceTraveled: 0,
    turnsPassedWithoutMove: 0,
  };
}

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
      stats: createInitialStats(),
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

/**
 * Checks if the available valid moves require no tactical decision-making:
 * 1. Exactly 1 valid move available in total.
 * 2. Or, all valid moves share the exact same origin square (fromStep)
 *    (e.g., all tokens in base, or multiple tokens stacked on the same track/homestretch square).
 *    Since tokens of the same player are interchangeable, choosing between them produces
 *    the exact same game state and has zero tactical difference.
 * Returns the MoveOption to execute, or null if player decision is required.
 */
export function getNoBrainerMove(validMoves: MoveOption[]): MoveOption | null {
  if (validMoves.length === 0) return null;

  // 1. Only one move exists in total
  if (validMoves.length === 1) {
    return validMoves[0];
  }

  // 2. Multiple moves, but all share the exact same starting position
  // (e.g. all from base -1, or all sharing square X on track or home stretch)
  const allSameOrigin = validMoves.every((m) => m.fromStep === validMoves[0].fromStep);
  if (allSameOrigin) {
    return validMoves[0];
  }

  // Tactical decision required (e.g. choose between moving a token on track vs exiting yard, or tokens on different squares)
  return null;
}

export const DEFAULT_AUTO_CONFIG: AutoModeConfig = {
  enabled: false,
  autoRollDice: false,
  exitBaseOnSix: false,
  prioritizeCapture: false,
  prioritizeHome: false,
  fullAutoAi: false,
  preset: 'basic',
};

export const AUTO_MODE_PRESETS: Record<AutoModePreset, Omit<AutoModeConfig, 'enabled'>> = {
  basic: {
    autoRollDice: false,
    exitBaseOnSix: false,
    prioritizeCapture: false,
    prioritizeHome: false,
    fullAutoAi: false,
    preset: 'basic',
  },
  fluid: {
    autoRollDice: true,
    exitBaseOnSix: true,
    prioritizeCapture: false,
    prioritizeHome: true,
    fullAutoAi: false,
    preset: 'fluid',
  },
  aggressive: {
    autoRollDice: true,
    exitBaseOnSix: true,
    prioritizeCapture: true,
    prioritizeHome: true,
    fullAutoAi: false,
    preset: 'aggressive',
  },
  full: {
    autoRollDice: true,
    exitBaseOnSix: true,
    prioritizeCapture: true,
    prioritizeHome: true,
    fullAutoAi: true,
    preset: 'full',
  },
  custom: {
    autoRollDice: false,
    exitBaseOnSix: true,
    prioritizeCapture: false,
    prioritizeHome: false,
    fullAutoAi: false,
    preset: 'custom',
  },
};

export interface AutoMoveResult {
  move: MoveOption | null;
  reason?: 'single' | 'same-origin' | 'home' | 'capture' | 'exit-base' | 'ai';
  description?: string;
}

/**
 * Resolves an automated move for a human player with Auto Mode enabled,
 * applying configured heuristics and priority rules.
 */
export function resolveAutoMove(
  validMoves: MoveOption[],
  diceValue: number | null,
  config: AutoModeConfig,
  player: Player,
  allPlayers: Player[]
): AutoMoveResult {
  if (validMoves.length === 0 || !config.enabled) {
    return { move: null };
  }

  // 1. Single valid move
  if (validMoves.length === 1) {
    return {
      move: validMoves[0],
      reason: 'single',
      description: 'Única jogada disponível',
    };
  }

  // 2. All moves originate from the exact same position (e.g. all in base or stacked)
  const allSameOrigin = validMoves.every((m) => m.fromStep === validMoves[0].fromStep);
  if (allSameOrigin) {
    return {
      move: validMoves[0],
      reason: 'same-origin',
      description: 'Jogadas com origem equivalente',
    };
  }

  // 3. Prioritize reaching the final goal (Home)
  if (config.prioritizeHome) {
    const homeMove = validMoves.find((m) => m.isHome);
    if (homeMove) {
      return {
        move: homeMove,
        reason: 'home',
        description: 'Prioridade: finalização no centro',
      };
    }
  }

  // 4. Prioritize enemy captures
  if (config.prioritizeCapture) {
    const captureMoves = validMoves.filter((m) => m.isCapture);
    if (captureMoves.length > 0) {
      // Pick capture move that advances furthest
      const bestCapture = captureMoves.reduce((best, cur) => (cur.toStep > best.toStep ? cur : best), captureMoves[0]);
      return {
        move: bestCapture,
        reason: 'capture',
        description: 'Prioridade: captura de peão adversário',
      };
    }
  }

  // 5. Prioritize exiting base on rolling 6
  if (config.exitBaseOnSix && diceValue === 6) {
    const exitMove = validMoves.find((m) => m.isEnterTrack || m.fromStep === -1);
    if (exitMove) {
      return {
        move: exitMove,
        reason: 'exit-base',
        description: 'Prioridade: sair da base com 6',
      };
    }
  }

  // 6. Full AI autopilot fallback
  if (config.fullAutoAi) {
    const aiMove = selectBestAIMove(validMoves, player, allPlayers);
    if (aiMove) {
      return {
        move: aiMove,
        reason: 'ai',
        description: 'Piloto IA: melhor decisão tática',
      };
    }
  }

  // Ambiguity remaining: requires manual human choice
  return { move: null };
}

