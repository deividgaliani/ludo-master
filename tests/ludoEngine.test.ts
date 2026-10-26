import { describe, expect, it } from 'vitest';
import {
  getTokenCoord,
  SAFE_SQUARE_INDICES,
  START_INDICES,
} from '../src/constants/boardPath';
import { selectBestAIMove } from '../src/engine/aiStrategy';
import {
  checkCapture,
  createInitialPlayers,
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
});
