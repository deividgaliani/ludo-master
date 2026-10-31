import {
  SAFE_SQUARE_INDICES,
  START_INDICES,
} from '../constants/boardPath';
import type { AIDifficulty, MoveOption, Player, PlayerColor } from '../types/ludo';
import { checkCapture } from './ludoEngine';

export interface ThreatAssessment {
  isThreatened: boolean;
  /** Effective number of enemy dice rolls (out of 6 per opponent) that can capture this square */
  threatRollCount: number;
}

/**
 * Calculates probabilistic threat on a global track square.
 * Accounts for:
 * - Multiple enemy tokens at different distances (1..6 steps behind)
 * - Whether an enemy token would turn into its own Home Stretch (> 50) instead of reaching globalSquare
 * - Enemy tokens in base threatening squares 1..6 steps ahead of their start square via a 6 + bonus roll
 */
export function assessSquareThreat(
  globalSquare: number,
  myColor: PlayerColor,
  allPlayers: Player[],
  includeBaseExitThreat = true
): ThreatAssessment {
  if (SAFE_SQUARE_INDICES.has(globalSquare)) {
    return { isThreatened: false, threatRollCount: 0 };
  }

  let totalThreatRolls = 0;

  for (const opp of allPlayers) {
    if (opp.color === myColor) continue;

    // Track unique dice faces (1..6) for this opponent that result in a capture on globalSquare
    const capturingDiceFaces = new Set<number>();

    for (const token of opp.tokens) {
      if (token.state === 'track' && token.stepCount >= 0 && token.stepCount <= 50) {
        const oppGlobal = (START_INDICES[opp.color] + token.stepCount) % 52;
        const dist = (globalSquare - oppGlobal + 52) % 52;

        // Enemy can only capture on globalSquare if they don't turn into their own Home Stretch (step > 50)
        if (dist >= 1 && dist <= 6 && token.stepCount + dist <= 50) {
          capturingDiceFaces.add(dist);
        }
      }
    }

    totalThreatRolls += capturingDiceFaces.size;

    // Check if globalSquare is 1..6 steps ahead of this opponent's start square while they have tokens in base
    if (includeBaseExitThreat) {
      const hasTokensInBase = opp.tokens.some((t) => t.state === 'base');
      if (hasTokensInBase) {
        const distFromOppStart = (globalSquare - START_INDICES[opp.color] + 52) % 52;
        if (distFromOppStart >= 1 && distFromOppStart <= 6) {
          // Rolling a 6 exits base to START_INDICES[opp.color] and grants an immediate extra roll
          totalThreatRolls += 0.35;
        }
      }
    }
  }

  return {
    isThreatened: totalThreatRolls > 0,
    threatRollCount: totalThreatRolls,
  };
}

/**
 * Checks if a pawn at a specific global square is threatened by any enemy pawn within 1..6 steps behind it.
 */
export function isUnderThreat(
  globalSquare: number,
  myColor: PlayerColor,
  allPlayers: Player[]
): boolean {
  return assessSquareThreat(globalSquare, myColor, allPlayers, false).isThreatened;
}

/**
 * Calculates how close an opponent is to winning to prioritize stopping the leader.
 */
function getOpponentProgressScore(opp: Player): number {
  const homeWeight = opp.tokensHome * 65;
  const trackWeight = opp.tokens.reduce(
    (sum, t) => sum + (t.state === 'home' ? 0 : Math.max(0, t.stepCount)),
    0
  );
  return homeWeight + trackWeight;
}

/**
 * Calculates offensive stalking bonus when landing 1..6 steps behind exposed enemy tokens.
 */
function calculateStalkingBonus(
  targetStep: number,
  myColor: PlayerColor,
  allPlayers: Player[]
): number {
  if (targetStep < 0 || targetStep >= 50) return 0;

  const targetGlobal = (START_INDICES[myColor] + targetStep) % 52;
  let bestTargetScore = 0;
  let extraTargetsBonus = 0;

  for (const opp of allPlayers) {
    if (opp.color === myColor) continue;

    for (const oppToken of opp.tokens) {
      if (oppToken.state === 'track' && oppToken.stepCount >= 0 && oppToken.stepCount <= 50) {
        const oppGlobal = (START_INDICES[opp.color] + oppToken.stepCount) % 52;
        if (SAFE_SQUARE_INDICES.has(oppGlobal)) continue;

        const distToEnemy = (oppGlobal - targetGlobal + 52) % 52;
        // Ensure our token can reach oppGlobal without turning into our own Home Stretch first
        if (distToEnemy >= 1 && distToEnemy <= 6 && targetStep + distToEnemy <= 50) {
          const targetValue =
            75 +
            oppToken.stepCount * 2.2 +
            opp.tokensHome * 40 +
            (opp.tokensHome === 3 ? 120 : 0);

          if (targetValue > bestTargetScore) {
            if (bestTargetScore > 0) extraTargetsBonus += 25;
            bestTargetScore = targetValue;
          } else {
            extraTargetsBonus += 25;
          }
        }
      }
    }
  }

  return bestTargetScore + extraTargetsBonus;
}

/**
 * Easy AI heuristic: focuses on basic progress and obvious captures, without deep threat or ambush awareness.
 */
function evaluateEasyMoveScore(
  move: MoveOption,
  player: Player
): number {
  let score = 0;
  const token = player.tokens.find((t) => t.id === move.tokenId);
  if (!token) return score;

  if (move.isHome) return 900;
  if (move.isCapture) score += 600;
  if (move.isEnterTrack) score += 480;
  if (token.stepCount <= 50 && move.toStep > 50) score += 280;

  score += move.toStep * 2;
  // Deterministic slight preference variation based on token id and step so it feels casual
  score += ((token.id * 37 + Math.max(0, token.stepCount) * 13) % 90) - 45;

  return score;
}

/**
 * Normal AI heuristic: classic balanced evaluation (single-level threat check, safe squares, captures).
 */
function evaluateNormalMoveScore(
  move: MoveOption,
  player: Player,
  allPlayers: Player[]
): number {
  let score = 0;
  const token = player.tokens.find((t) => t.id === move.tokenId);
  if (!token) return score;

  if (move.isHome) {
    return 1000;
  }

  if (move.isCapture) {
    score += 850;
    const captureResult = checkCapture(player.color, move.toStep, allPlayers);
    if (captureResult.capturedToken) {
      const victim = allPlayers[captureResult.capturedToken.playerIndex].tokens.find(
        (t) => t.id === captureResult.capturedToken!.tokenId
      );
      if (victim && victim.stepCount > 15) {
        score += victim.stepCount * 5;
      }
    }
  }

  if (move.isEnterTrack) {
    score += 600;
  }

  if (token.stepCount <= 50 && move.toStep > 50) {
    score += 450;
  }

  if (token.stepCount >= 0 && token.stepCount <= 50) {
    const currentGlobal = (START_INDICES[player.color] + token.stepCount) % 52;
    if (isUnderThreat(currentGlobal, player.color, allPlayers)) {
      score += 400;
    }
  }

  if (move.toStep <= 50) {
    const targetGlobal = (START_INDICES[player.color] + move.toStep) % 52;
    if (SAFE_SQUARE_INDICES.has(targetGlobal)) {
      score += 350;
    } else if (isUnderThreat(targetGlobal, player.color, allPlayers)) {
      score -= 420;
    }
  }

  score += move.toStep * 2;

  if (token.stepCount >= 0 && token.stepCount < 20) {
    score += 40;
  }

  return score;
}

/**
 * Master ('smart') AI heuristic:
 * - Probabilistic multi-attacker threat assessment & enemy base-exit danger
 * - Value-at-risk scaling (protecting advanced tokens much more aggressively)
 * - Anti-leader targeting (prioritizing captures & ambushes against the leading opponent)
 * - Safe-square camping (avoiding stepping out of safe stars into danger or neutral ground unnecessarily)
 * - Offensive stalking & Dice-6 extra-turn synergy (ambushing with extra roll, avoiding overshooting targets on a 6)
 * - Granular Home Stretch management (avoiding wasting moves inside already-safe corridor)
 */
function evaluateSmartMoveScore(
  move: MoveOption,
  player: Player,
  allPlayers: Player[]
): number {
  let score = 0;
  const token = player.tokens.find((t) => t.id === move.tokenId);
  if (!token) return score;

  const diceRolled = move.isEnterTrack ? 6 : move.toStep - move.fromStep;

  // Identify the leading active opponent for anti-leader targeting
  const opponents = allPlayers.filter((p) => p.color !== player.color && p.tokensHome < 4);
  const maxOpponentProgress =
    opponents.length > 0
      ? Math.max(...opponents.map((opp) => getOpponentProgressScore(opp)))
      : 0;

  // 1. Victory / Reaching Goal (step 56)
  if (move.isHome) {
    // Immediate match win takes absolute priority
    if (player.tokensHome === 3) {
      return 10000;
    }
    // If entering goal directly from outer track gate (step 50 + 6 = 56), also saves piece from track
    if (token.stepCount <= 50) {
      return 1250;
    }
    // Piece was already safe in Home Stretch (51..55): still high value (grants extra turn),
    // but allows critical captures on the outer track (e.g. stopping a leader) to compete
    return 940;
  }

  // 2. Capture Opponent (grants extra turn + sets opponent back to base)
  if (move.isCapture) {
    score += 880;
    const captureResult = checkCapture(player.color, move.toStep, allPlayers);
    if (captureResult.capturedToken) {
      const victimPlayer = allPlayers[captureResult.capturedToken.playerIndex];
      const victimToken = victimPlayer.tokens.find(
        (t) => t.id === captureResult.capturedToken!.tokenId
      );

      if (victimToken) {
        // Scale by how far the victim token had progressed
        score += victimToken.stepCount * 6;
      }

      // Anti-leader bonus: prioritize capturing pieces of opponents close to winning
      score += victimPlayer.tokensHome * 120;
      if (victimPlayer.tokensHome === 3) {
        score += 450; // Emergency: stop opponent on match point!
      } else if (
        opponents.length > 1 &&
        getOpponentProgressScore(victimPlayer) === maxOpponentProgress &&
        maxOpponentProgress > 40
      ) {
        score += 110; // Target the leading opponent
      }
    }
  }

  // 3. Leaving Base (on roll of 6)
  if (move.isEnterTrack) {
    const activeOnTrack = player.tokens.filter(
      (t) => t.state === 'track' || t.state === 'homeStretch'
    ).length;
    // Higher urgency to deploy when we have few tokens on the board
    score += activeOnTrack === 0 ? 720 : activeOnTrack === 1 ? 640 : 560;
  }

  // 4. Entering Home Stretch (Crossing from outer track <= 50 into safe corridor > 50)
  if (token.stepCount <= 50 && move.toStep > 50) {
    score += 520;
  }

  // 5. Current Position Analysis (Escaping Danger vs. Leaving Safe Refuge)
  if (token.stepCount >= 0 && token.stepCount <= 50) {
    const currentGlobal = (START_INDICES[player.color] + token.stepCount) % 52;
    const currentThreat = assessSquareThreat(currentGlobal, player.color, allPlayers);

    if (currentThreat.isThreatened) {
      // Scale escape urgency by number of threatening dice rolls AND how far our token has traveled
      const tokenValueFactor = 1 + token.stepCount * 0.025;
      const rollMultiplier = 1 + (currentThreat.threatRollCount - 1) * 0.35;
      score += Math.round(380 * tokenValueFactor * rollMultiplier);
    } else if (
      SAFE_SQUARE_INDICES.has(currentGlobal) &&
      !move.isCapture &&
      move.toStep <= 50
    ) {
      const targetGlobal = (START_INDICES[player.color] + move.toStep) % 52;
      if (!SAFE_SQUARE_INDICES.has(targetGlobal)) {
        // Reluctance to abandon a safe star/start square for an exposed non-capturing square
        score -= 145;
      }
    }

    // Dice 6 Overshoot Check: If this token was stalking an exposed enemy 1..5 steps ahead,
    // moving it by 6 jumps past the prey right before our bonus roll!
    if (diceRolled === 6 && !move.isCapture && token.stepCount < 45) {
      const preStalking = calculateStalkingBonus(token.stepCount, player.color, allPlayers);
      if (preStalking >= 110) {
        score -= 130;
      }
    }
  }

  // 6. Destination Square Analysis (Safe Square, Threat Risk, and Offensive Stalking)
  if (move.toStep <= 50) {
    const targetGlobal = (START_INDICES[player.color] + move.toStep) % 52;

    if (SAFE_SQUARE_INDICES.has(targetGlobal)) {
      score += 360;
    } else {
      const targetThreat = assessSquareThreat(targetGlobal, player.color, allPlayers);
      if (targetThreat.isThreatened) {
        // Risk penalty scales with how much progress we stand to lose and how many rolls hit us
        const lossSeverity = 1 + Math.max(0, move.toStep) * 0.025;
        const rollMultiplier = 1 + (targetThreat.threatRollCount - 1) * 0.4;
        score -= Math.round(410 * lossSeverity * rollMultiplier);
      }
    }

    // 7. Offensive Stalking / Ambush Bonus
    const targetThreat = assessSquareThreat(targetGlobal, player.color, allPlayers);
    if (!targetThreat.isThreatened) {
      const stalkingBonus = calculateStalkingBonus(move.toStep, player.color, allPlayers);
      // If we rolled a 6 (or just captured), we get an immediate bonus turn to execute the ambush!
      const extraTurnMultiplier = diceRolled === 6 || move.isCapture ? 1.45 : 1.0;
      score += Math.round(stalkingBonus * extraTurnMultiplier);
    }
  }

  // 8. Progress & Home Stretch Management
  if (token.stepCount >= 51 && move.toStep < 56) {
    // Inside Home Stretch, pieces are already 100% immune. Advancing without finishing (e.g. 51 -> 55)
    // reduces future valid dice rolls and wastes a turn that could help outer-track tokens.
    score += 15;
  } else {
    score += move.toStep * 2.2;
  }

  // 9. Mobilization balance: slight bonus for advancing trailing pieces out of early congestion
  if (token.stepCount >= 0 && token.stepCount < 18) {
    score += 35;
  }

  return Math.round(score);
}

/**
 * Evaluates the strategic score of a potential move according to the player's AI difficulty.
 */
export function evaluateMoveScore(
  move: MoveOption,
  player: Player,
  allPlayers: Player[],
  difficulty?: AIDifficulty
): number {
  const level = difficulty ?? player.difficulty ?? 'smart';

  if (level === 'easy') {
    return evaluateEasyMoveScore(move, player);
  }
  if (level === 'normal') {
    return evaluateNormalMoveScore(move, player, allPlayers);
  }
  return evaluateSmartMoveScore(move, player, allPlayers);
}

/**
 * AI Decision Maker: Picks the optimal move from the list of valid moves.
 */
export function selectBestAIMove(
  validMoves: MoveOption[],
  player: Player,
  allPlayers: Player[]
): MoveOption | null {
  if (validMoves.length === 0) return null;
  if (validMoves.length === 1) return validMoves[0];

  let bestMove = validMoves[0];
  let bestScore = -Infinity;

  for (const move of validMoves) {
    const score = evaluateMoveScore(move, player, allPlayers, player.difficulty);
    move.score = score;
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
