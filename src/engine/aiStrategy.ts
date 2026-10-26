import {
  SAFE_SQUARE_INDICES,
  START_INDICES,
} from '../constants/boardPath';
import type { MoveOption, Player, PlayerColor } from '../types/ludo';
import { checkCapture } from './ludoEngine';

/**
 * Checks if a pawn at a specific global square is threatened by any enemy pawn within 1..6 steps behind it.
 */
function isUnderThreat(
  globalSquare: number,
  myColor: PlayerColor,
  allPlayers: Player[]
): boolean {
  if (SAFE_SQUARE_INDICES.has(globalSquare)) return false;

  for (const opp of allPlayers) {
    if (opp.color === myColor) continue;
    for (const token of opp.tokens) {
      if (token.state === 'track' && token.stepCount >= 0 && token.stepCount <= 50) {
        const oppGlobal = (START_INDICES[opp.color] + token.stepCount) % 52;
        // Distance from oppGlobal to globalSquare along track
        const dist = (globalSquare - oppGlobal + 52) % 52;
        if (dist >= 1 && dist <= 6) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Evaluates the strategic score of a potential move.
 */
export function evaluateMoveScore(
  move: MoveOption,
  player: Player,
  allPlayers: Player[]
): number {
  let score = 0;
  const token = player.tokens.find((t) => t.id === move.tokenId);
  if (!token) return score;

  // 1. Victory / Reaching Goal
  if (move.isHome) {
    score += 1000;
    return score;
  }

  // 2. Capture Opponent
  if (move.isCapture) {
    score += 850;
    // Extra incentive if the captured opponent had traveled a lot
    const captureResult = checkCapture(player.color, move.toStep, allPlayers);
    if (captureResult.capturedToken) {
      const victim = allPlayers[captureResult.capturedToken.playerIndex].tokens.find(
        (t) => t.id === captureResult.capturedToken!.tokenId
      );
      if (victim && victim.stepCount > 15) {
        score += victim.stepCount * 5; // Extra points for capturing advanced pieces
      }
    }
  }

  // 3. Leaving Base
  if (move.isEnterTrack) {
    score += 600;
  }

  // 4. Entering Home Stretch (Safe from all enemy attacks)
  if (token.stepCount <= 50 && move.toStep > 50) {
    score += 450;
  }

  // 5. Escaping Danger
  // If current position is in danger and the move escapes danger
  if (token.stepCount >= 0 && token.stepCount <= 50) {
    const currentGlobal = (START_INDICES[player.color] + token.stepCount) % 52;
    if (isUnderThreat(currentGlobal, player.color, allPlayers)) {
      score += 400; // Urgent need to move this piece!
    }
  }

  // 6. Landing on Safe Square (Star)
  if (move.toStep <= 50) {
    const targetGlobal = (START_INDICES[player.color] + move.toStep) % 52;
    if (SAFE_SQUARE_INDICES.has(targetGlobal)) {
      score += 350;
    } else {
      // 7. Check if landing on this square puts us at risk of being captured by an enemy
      if (isUnderThreat(targetGlobal, player.color, allPlayers)) {
        score -= 420; // Risk penalty!
      }
    }
  }

  // 8. Progress bonus: Favor moving pieces closer to home
  score += move.toStep * 2;

  // 9. Balance: slight bonus for mobilizing trailing pieces to keep team active
  if (token.stepCount >= 0 && token.stepCount < 20) {
    score += 40;
  }

  return score;
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
    const score = evaluateMoveScore(move, player, allPlayers);
    move.score = score;
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
