import { describe, expect, it } from 'vitest';
import {
  AUTO_MODE_PRESETS,
  DEFAULT_AUTO_CONFIG,
  resolveAutoMove,
} from '../src/engine/ludoEngine';
import type { AutoModeConfig, MoveOption, Player } from '../src/types/ludo';

function createMockPlayer(): { player: Player; allPlayers: Player[] } {
  const player: Player = {
    id: 'p1',
    name: 'Player 1',
    color: 'red',
    type: 'human',
    difficulty: 'normal',
    tokensHome: 0,
    tokens: [
      { id: 0, color: 'red', state: 'base', stepCount: -1, row: 0, col: 0 },
      { id: 1, color: 'red', state: 'track', stepCount: 10, row: 0, col: 0 },
      { id: 2, color: 'red', state: 'track', stepCount: 25, row: 0, col: 0 },
      { id: 3, color: 'red', state: 'track', stepCount: 55, row: 0, col: 0 },
    ],
    stats: {
      piecesCaptured: 0,
      piecesLost: 0,
      totalMoves: 0,
      totalRolls: 0,
      sixesRolled: 0,
      diceRollsByFace: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      distanceTraveled: 0,
      turnsPassedWithoutMove: 0,
    },
  };

  return { player, allPlayers: [player] };
}

describe('resolveAutoMove', () => {
  it('should return null when Auto Mode is disabled', () => {
    const { player, allPlayers } = createMockPlayer();
    const config: AutoModeConfig = { ...DEFAULT_AUTO_CONFIG, enabled: false };
    const moves: MoveOption[] = [
      { tokenId: 0, fromStep: -1, toStep: 0, isEnterTrack: true, isCapture: false, isHome: false },
    ];

    const result = resolveAutoMove(moves, 6, config, player, allPlayers);
    expect(result.move).toBeNull();
  });

  it('should automatically pick the single valid move regardless of configuration', () => {
    const { player, allPlayers } = createMockPlayer();
    const config: AutoModeConfig = { ...DEFAULT_AUTO_CONFIG, enabled: true };
    const singleMove: MoveOption = {
      tokenId: 1,
      fromStep: 10,
      toStep: 14,
      isEnterTrack: false,
      isCapture: false,
      isHome: false,
    };

    const result = resolveAutoMove([singleMove], 4, config, player, allPlayers);
    expect(result.move).toEqual(singleMove);
    expect(result.reason).toBe('single');
  });

  it('should automatically resolve moves that share the exact same origin', () => {
    const { player, allPlayers } = createMockPlayer();
    const config: AutoModeConfig = { ...DEFAULT_AUTO_CONFIG, enabled: true };
    const baseMoves: MoveOption[] = [
      { tokenId: 0, fromStep: -1, toStep: 0, isEnterTrack: true, isCapture: false, isHome: false },
      { tokenId: 1, fromStep: -1, toStep: 0, isEnterTrack: true, isCapture: false, isHome: false },
    ];

    const result = resolveAutoMove(baseMoves, 6, config, player, allPlayers);
    expect(result.move).toEqual(baseMoves[0]);
    expect(result.reason).toBe('same-origin');
  });

  describe('exitBaseOnSix option', () => {
    const baseAndTrackMoves: MoveOption[] = [
      { tokenId: 0, fromStep: -1, toStep: 0, isEnterTrack: true, isCapture: false, isHome: false },
      { tokenId: 1, fromStep: 10, toStep: 16, isEnterTrack: false, isCapture: false, isHome: false },
    ];

    it('should return null when exitBaseOnSix is disabled on a roll of 6 with ambiguity', () => {
      const { player, allPlayers } = createMockPlayer();
      const config: AutoModeConfig = {
        ...DEFAULT_AUTO_CONFIG,
        enabled: true,
        exitBaseOnSix: false,
      };

      const result = resolveAutoMove(baseAndTrackMoves, 6, config, player, allPlayers);
      expect(result.move).toBeNull();
    });

    it('should prioritize exiting the base when exitBaseOnSix is enabled and dice is 6', () => {
      const { player, allPlayers } = createMockPlayer();
      const config: AutoModeConfig = {
        ...DEFAULT_AUTO_CONFIG,
        enabled: true,
        exitBaseOnSix: true,
      };

      const result = resolveAutoMove(baseAndTrackMoves, 6, config, player, allPlayers);
      expect(result.move).toBeDefined();
      expect(result.move?.tokenId).toBe(0);
      expect(result.move?.isEnterTrack).toBe(true);
      expect(result.reason).toBe('exit-base');
    });

    it('should not apply exitBaseOnSix if the dice roll is not 6', () => {
      const { player, allPlayers } = createMockPlayer();
      const config: AutoModeConfig = {
        ...DEFAULT_AUTO_CONFIG,
        enabled: true,
        exitBaseOnSix: true,
      };
      const trackMoves: MoveOption[] = [
        { tokenId: 1, fromStep: 10, toStep: 14, isEnterTrack: false, isCapture: false, isHome: false },
        { tokenId: 2, fromStep: 25, toStep: 29, isEnterTrack: false, isCapture: false, isHome: false },
      ];

      const result = resolveAutoMove(trackMoves, 4, config, player, allPlayers);
      expect(result.move).toBeNull();
    });
  });

  describe('prioritizeHome option', () => {
    it('should prioritize winning / reaching goal when prioritizeHome is active', () => {
      const { player, allPlayers } = createMockPlayer();
      const config: AutoModeConfig = {
        ...DEFAULT_AUTO_CONFIG,
        enabled: true,
        prioritizeHome: true,
        exitBaseOnSix: true,
      };
      const moves: MoveOption[] = [
        { tokenId: 0, fromStep: -1, toStep: 0, isEnterTrack: true, isCapture: false, isHome: false },
        { tokenId: 3, fromStep: 55, toStep: 57, isEnterTrack: false, isCapture: false, isHome: true },
      ];

      const result = resolveAutoMove(moves, 2, config, player, allPlayers);
      expect(result.move?.tokenId).toBe(3);
      expect(result.move?.isHome).toBe(true);
      expect(result.reason).toBe('home');
    });
  });

  describe('prioritizeCapture option', () => {
    it('should prioritize capture over other moves when prioritizeCapture is active', () => {
      const { player, allPlayers } = createMockPlayer();
      const config: AutoModeConfig = {
        ...DEFAULT_AUTO_CONFIG,
        enabled: true,
        prioritizeCapture: true,
      };
      const moves: MoveOption[] = [
        { tokenId: 1, fromStep: 10, toStep: 13, isEnterTrack: false, isCapture: false, isHome: false },
        { tokenId: 2, fromStep: 25, toStep: 28, isEnterTrack: false, isCapture: true, isHome: false },
      ];

      const result = resolveAutoMove(moves, 3, config, player, allPlayers);
      expect(result.move?.tokenId).toBe(2);
      expect(result.move?.isCapture).toBe(true);
      expect(result.reason).toBe('capture');
    });
  });

  describe('fullAutoAi autopilot option', () => {
    it('should fallback to AI heuristic when fullAutoAi is active and ambiguity remains', () => {
      const { player, allPlayers } = createMockPlayer();
      const config: AutoModeConfig = {
        ...DEFAULT_AUTO_CONFIG,
        enabled: true,
        fullAutoAi: true,
      };
      const moves: MoveOption[] = [
        { tokenId: 1, fromStep: 10, toStep: 14, isEnterTrack: false, isCapture: false, isHome: false },
        { tokenId: 2, fromStep: 25, toStep: 29, isEnterTrack: false, isCapture: false, isHome: false },
      ];

      const result = resolveAutoMove(moves, 4, config, player, allPlayers);
      expect(result.move).not.toBeNull();
      expect(result.reason).toBe('ai');
    });
  });

  describe('Presets definition', () => {
    it('should have consistent configurations across presets', () => {
      expect(AUTO_MODE_PRESETS.basic.exitBaseOnSix).toBe(false);
      expect(AUTO_MODE_PRESETS.fluid.exitBaseOnSix).toBe(true);
      expect(AUTO_MODE_PRESETS.fluid.autoRollDice).toBe(true);
      expect(AUTO_MODE_PRESETS.aggressive.prioritizeCapture).toBe(true);
      expect(AUTO_MODE_PRESETS.full.fullAutoAi).toBe(true);
    });
  });
});
