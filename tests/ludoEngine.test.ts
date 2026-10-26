import { describe, expect, it } from 'vitest';
import {
  getTokenCoord,
  SAFE_SQUARE_INDICES,
} from '../src/constants/boardPath';
import {
  assessSquareThreat,
  evaluateMoveScore,
  selectBestAIMove,
} from '../src/engine/aiStrategy';
import {
  checkCapture,
  createInitialPlayers,
  getNoBrainerMove,
  getValidMoves,
} from '../src/engine/ludoEngine';
import { PlayerConfig } from '../src/types/ludo';

describe('Ludo Engine & Rules', () => {
  const sampleConfigs: PlayerConfig[] = [
    { id: '1', name: 'Player 1', color: 'red', type: 'human' },
    { id: '2', name: 'Bot Green', color: 'green', type: 'ai' },
  ];

  it('initializes players with 4 tokens in base', () => {
    const players = createInitialPlayers(sampleConfigs);
    expect(players).toHaveLength(2);
    expect(players[0].tokens).toHaveLength(4);
    expect(players[0].tokens.every((t) => t.state === 'base')).toBe(true);
  });

  it('only allows token to leave base when rolling 6', () => {
    const players = createInitialPlayers(sampleConfigs);

    // Roll 5 -> No valid moves
    const movesOn5 = getValidMoves(players[0], 5, players);
    expect(movesOn5).toHaveLength(0);

    // Roll 6 -> 4 tokens can leave base
    const movesOn6 = getValidMoves(players[0], 6, players);
    expect(movesOn6).toHaveLength(4);
    expect(movesOn6[0].isEnterTrack).toBe(true);
    expect(movesOn6[0].toStep).toBe(0);
  });

  it('correctly detects token capture on unsafe square', () => {
    const players = createInitialPlayers(sampleConfigs);

    // Position Red token 0 on track step 10
    players[0].tokens[0].state = 'track';
    players[0].tokens[0].stepCount = 10; // Global index = (0 + 10) = 10

    // Green starts at 13. If Green travels: global 10 = (13 + stepCount) % 52 -> stepCount = 49
    players[1].tokens[0].state = 'track';
    players[1].tokens[0].stepCount = 49; // Global index = (13 + 49) % 52 = 10

    // Square 10 is NOT in SAFE_SQUARE_INDICES
    expect(SAFE_SQUARE_INDICES.has(10)).toBe(false);

    // If Red moves from 6 to 10 with dice 4:
    players[0].tokens[0].stepCount = 6;
    const captureResult = checkCapture('red', 10, players);
    expect(captureResult.canCapture).toBe(true);
    expect(captureResult.capturedToken?.playerIndex).toBe(1);
    expect(captureResult.capturedToken?.tokenId).toBe(0);
  });

  it('prevents capture on safe square (star or start)', () => {
    const players = createInitialPlayers(sampleConfigs);

    // Red start (global index 0) is a safe square
    expect(SAFE_SQUARE_INDICES.has(0)).toBe(true);

    // Green pawn on global index 0
    // (13 + 39) % 52 = 52 % 52 = 0
    players[1].tokens[0].state = 'track';
    players[1].tokens[0].stepCount = 39;

    // Red moves to stepCount 0 (its start square)
    const captureResult = checkCapture('red', 0, players);
    expect(captureResult.canCapture).toBe(false);
  });

  it('enters the home stretch directly from step 50 without passing into step 51 on the outer track', () => {
    const players = createInitialPlayers(sampleConfigs);
    // Red starts at 0 (row 6, col 1)
    // Step 50 is (row 7, col 0)
    const coord50 = getTokenCoord('red', 0, 50);
    expect(coord50).toEqual({ row: 7, col: 0 });

    // Step 51 must enter Red's home stretch at (row 7, col 1), NOT outer track (row 6, col 0)
    const coord51 = getTokenCoord('red', 0, 51);
    expect(coord51).toEqual({ row: 7, col: 1 });

    // Green enters green home stretch
    const greenGate = getTokenCoord('green', 0, 50);
    expect(greenGate).toEqual({ row: 0, col: 7 });
    const greenHome1 = getTokenCoord('green', 0, 51);
    expect(greenHome1).toEqual({ row: 1, col: 7 });
  });

  it('enforces exact roll to reach home goal (step 56)', () => {
    const players = createInitialPlayers(sampleConfigs);
    players[0].tokens[0].state = 'homeStretch';
    players[0].tokens[0].stepCount = 54; // Needs exactly 2 to reach 56

    // Roll 3 -> Overshoot, invalid!
    const movesOn3 = getValidMoves(players[0], 3, players);
    expect(movesOn3.find((m) => m.tokenId === 0)).toBeUndefined();

    // Roll 2 -> Exact hit!
    const movesOn2 = getValidMoves(players[0], 2, players);
    const winMove = movesOn2.find((m) => m.tokenId === 0);
    expect(winMove).toBeDefined();
    expect(winMove?.isHome).toBe(true);
  });

  it('returns no valid moves if all tokens have already reached home', () => {
    const players = createInitialPlayers(sampleConfigs);
    players[0].tokens.forEach((t) => {
      t.state = 'home';
      t.stepCount = 56;
    });
    players[0].tokensHome = 4;

    const moves = getValidMoves(players[0], 6, players);
    expect(moves).toHaveLength(0);
  });
});

describe('AI Strategy & Heuristics', () => {
  const configs: PlayerConfig[] = [
    { id: '1', name: 'Bot Green', color: 'green', type: 'ai' },
    { id: '2', name: 'Human Red', color: 'red', type: 'human' },
  ];

  it('AI chooses capturing an opponent over a plain advance', () => {
    const players = createInitialPlayers(configs);

    // Green Bot has token 0 at step 5 and token 1 at step 20
    players[0].tokens[0].state = 'track';
    players[0].tokens[0].stepCount = 5;

    players[0].tokens[1].state = 'track';
    players[0].tokens[1].stepCount = 20;

    // Red has a token where Green token 0 can land with dice 4
    // Green start is 13. Token 0 landing on step 9 -> global (13+9)=22 (unsafe)
    // Red start is 0. If Red is at step 22 -> global 22.
    players[1].tokens[0].state = 'track';
    players[1].tokens[0].stepCount = 22;

    const validMoves = getValidMoves(players[0], 4, players);
    const bestMove = selectBestAIMove(validMoves, players[0], players);

    // Best move MUST be tokenId 0 because it captures Red's token!
    expect(bestMove).toBeDefined();
    expect(bestMove?.tokenId).toBe(0);
    expect(bestMove?.isCapture).toBe(true);
  });

  it('AI chooses to finish a piece into the goal over other moves', () => {
    const players = createInitialPlayers(configs);

    // Token 0 can reach goal (step 54 + 2 = 56)
    players[0].tokens[0].state = 'homeStretch';
    players[0].tokens[0].stepCount = 54;

    // Token 1 is at step 10
    players[0].tokens[1].state = 'track';
    players[0].tokens[1].stepCount = 10;

    const validMoves = getValidMoves(players[0], 2, players);
    const bestMove = selectBestAIMove(validMoves, players[0], players);

    expect(bestMove?.tokenId).toBe(0);
    expect(bestMove?.isHome).toBe(true);
  });

  it('ignores false threat when enemy behind would turn into its own Home Stretch (> 50)', () => {
    const players = createInitialPlayers(configs);
    // Red starts at 0. At step 49, Red is at global index 49.
    // Red's gate into Home Stretch is step 50 (global 50).
    // So if Red rolls 3, 4, 5, or 6 from step 49, Red enters its Home Stretch (steps 52..55), NOT global 0..3!
    players[1].tokens[0].state = 'track';
    players[1].tokens[0].stepCount = 49;

    // Global square 1 is 4 steps ahead of global 49 along the perimeter ((1 - 49 + 52) % 52 = 4),
    // but Red at step 49 + 4 = 53 is inside Red's Home Stretch!
    const threatAtGlobal1 = assessSquareThreat(1, 'green', players, false);
    expect(threatAtGlobal1.isThreatened).toBe(false);
    expect(threatAtGlobal1.threatRollCount).toBe(0);
  });

  it('Smart AI prioritizes capturing a leader on match point over finishing an already-safe Home Stretch piece', () => {
    const players = createInitialPlayers(configs);
    players[0].difficulty = 'smart';

    // Green token 0 is already safe in Home Stretch at step 54 (needs 2 to reach 56)
    players[0].tokens[0].state = 'homeStretch';
    players[0].tokens[0].stepCount = 54;

    // Green token 1 is on outer track at step 5 (can land on step 7 -> global 20 with dice 2)
    players[0].tokens[1].state = 'track';
    players[0].tokens[1].stepCount = 5;

    // Red opponent is on match point (3 tokens already home!) and its last token is at step 20 (global 20)
    players[1].tokensHome = 3;
    players[1].tokens[0].state = 'track';
    players[1].tokens[0].stepCount = 20;

    const validMoves = getValidMoves(players[0], 2, players);
    const bestMove = selectBestAIMove(validMoves, players[0], players);

    // Smart AI stops Red from winning by capturing Red's last token instead of casually moving its safe token 0
    expect(bestMove?.tokenId).toBe(1);
    expect(bestMove?.isCapture).toBe(true);
  });

  it('Smart AI prefers advancing an outer-track token over shuffling an already-safe token inside Home Stretch', () => {
    const players = createInitialPlayers(configs);
    players[0].difficulty = 'smart';

    // Token 0 is inside Home Stretch at step 51; rolling 2 moves it to 53 (does not finish)
    players[0].tokens[0].state = 'homeStretch';
    players[0].tokens[0].stepCount = 51;

    // Token 1 is on outer track at step 25; rolling 2 moves it to 27 (safe from enemies)
    players[0].tokens[1].state = 'track';
    players[0].tokens[1].stepCount = 25;

    const validMoves = getValidMoves(players[0], 2, players);
    const bestMove = selectBestAIMove(validMoves, players[0], players);

    expect(bestMove?.tokenId).toBe(1);
  });

  it('evaluates differently across easy, normal, and smart difficulty levels', () => {
    const players = createInitialPlayers(configs);
    // Green token 0 is on a safe star (step 8 -> global 21)
    players[0].tokens[0].state = 'track';
    players[0].tokens[0].stepCount = 8;

    const validMoves = getValidMoves(players[0], 3, players);
    const move = validMoves[0];

    const normalScore = evaluateMoveScore(move, players[0], players, 'normal');
    const smartScore = evaluateMoveScore(move, players[0], players, 'smart');

    // Smart AI applies a safe-square camping penalty for leaving a star square for a non-capturing unsafe square
    expect(smartScore).toBeLessThan(normalScore);
  });
});

describe('Auto Mode Decision Engine (getNoBrainerMove)', () => {
  const configs: PlayerConfig[] = [
    { id: '1', name: 'Human Red', color: 'red', type: 'human' },
    { id: '2', name: 'Bot Green', color: 'green', type: 'ai' },
  ];

  it('returns null when validMoves is empty', () => {
    expect(getNoBrainerMove([])).toBeNull();
  });

  it('returns the move when exactly one move is possible on the board', () => {
    const players = createInitialPlayers(configs);
    // 3 tokens in base, 1 token on track step 10
    players[0].tokens[0].state = 'track';
    players[0].tokens[0].stepCount = 10;

    // Roll 3 (not 6, so tokens in base cannot move)
    const validMoves = getValidMoves(players[0], 3, players);
    expect(validMoves).toHaveLength(1);

    const autoMove = getNoBrainerMove(validMoves);
    expect(autoMove).toBeDefined();
    expect(autoMove?.tokenId).toBe(0);
    expect(autoMove?.fromStep).toBe(10);
    expect(autoMove?.toStep).toBe(13);
  });

  it('returns a move to exit base when rolling 6 and NO other tokens are on the track', () => {
    const players = createInitialPlayers(configs);
    // All 4 tokens in base
    const validMoves = getValidMoves(players[0], 6, players);
    expect(validMoves).toHaveLength(4);
    expect(validMoves.every((m) => m.fromStep === -1)).toBe(true);

    const autoMove = getNoBrainerMove(validMoves);
    expect(autoMove).not.toBeNull();
    expect(autoMove?.fromStep).toBe(-1);
    expect(autoMove?.toStep).toBe(0);
  });

  it('returns null when rolling 6 with tokens in base AND a token on track (decision required)', () => {
    const players = createInitialPlayers(configs);
    // Token 0 on track, tokens 1, 2, 3 in base
    players[0].tokens[0].state = 'track';
    players[0].tokens[0].stepCount = 5;

    // Roll 6 allows: move token 0 forward OR exit token 1, 2, or 3
    const validMoves = getValidMoves(players[0], 6, players);
    expect(validMoves.length).toBeGreaterThan(1);

    // Some moves are from track, some from base
    const hasBase = validMoves.some((m) => m.fromStep === -1);
    const hasTrack = validMoves.some((m) => m.fromStep >= 0);
    expect(hasBase).toBe(true);
    expect(hasTrack).toBe(true);

    // Auto mode MUST NOT play because player has a strategic choice
    const autoMove = getNoBrainerMove(validMoves);
    expect(autoMove).toBeNull();
  });

  it('returns null when multiple tokens on track can move (decision required)', () => {
    const players = createInitialPlayers(configs);
    // Token 0 and Token 1 on track at different positions
    players[0].tokens[0].state = 'track';
    players[0].tokens[0].stepCount = 4;
    players[0].tokens[1].state = 'track';
    players[0].tokens[1].stepCount = 12;

    const validMoves = getValidMoves(players[0], 3, players);
    expect(validMoves).toHaveLength(2);

    // Auto mode MUST NOT play because player must choose which piece to advance
    const autoMove = getNoBrainerMove(validMoves);
    expect(autoMove).toBeNull();
  });

  it('returns the move when only one token can move because other token on track is blocked by overshoot', () => {
    const players = createInitialPlayers(configs);
    // Token 0 near goal (step 55, needs exactly 1 to reach 56)
    players[0].tokens[0].state = 'homeStretch';
    players[0].tokens[0].stepCount = 55;

    // Token 1 on track
    players[0].tokens[1].state = 'track';
    players[0].tokens[1].stepCount = 10;

    // Roll 3: Token 0 cannot move (55 + 3 = 58 > 56). Only Token 1 can move.
    const validMoves = getValidMoves(players[0], 3, players);
    expect(validMoves).toHaveLength(1);
    expect(validMoves[0].tokenId).toBe(1);

    const autoMove = getNoBrainerMove(validMoves);
    expect(autoMove).not.toBeNull();
    expect(autoMove?.tokenId).toBe(1);
  });

  it('returns a move automatically when multiple tokens are on the exact same square and no other moves exist', () => {
    const players = createInitialPlayers(configs);
    // Tokens 0 and 1 are both on track step 0 (start square)
    players[0].tokens[0].state = 'track';
    players[0].tokens[0].stepCount = 0;
    players[0].tokens[1].state = 'track';
    players[0].tokens[1].stepCount = 0;
    // Tokens 2 and 3 are in base (-1)

    // Roll 1: tokens 2 and 3 cannot move (needs 6). Tokens 0 and 1 both can move from 0 to 1.
    const validMoves = getValidMoves(players[0], 1, players);
    expect(validMoves).toHaveLength(2);
    expect(validMoves.every((m) => m.fromStep === 0)).toBe(true);

    // Auto mode SHOULD play because choosing between tokens on the same square is isomorphic
    const autoMove = getNoBrainerMove(validMoves);
    expect(autoMove).not.toBeNull();
    expect(autoMove?.fromStep).toBe(0);
    expect(autoMove?.toStep).toBe(1);
  });
});
