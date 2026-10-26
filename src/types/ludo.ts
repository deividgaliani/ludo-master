export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export type PlayerType = 'human' | 'ai';

export type AIDifficulty = 'smart' | 'normal';

export interface PlayerConfig {
  id: string;
  name: string;
  color: PlayerColor;
  type: PlayerType;
  difficulty?: AIDifficulty;
}

export type TokenState = 'base' | 'track' | 'homeStretch' | 'home';

export interface Token {
  id: number; // 0, 1, 2, 3
  color: PlayerColor;
  state: TokenState;
  // stepCount: 0 when just entered start square; reaches 51 at gate; 52-56 in home stretch; 57 at goal
  stepCount: number; 
  // Global board coordinate for rendering
  row: number;
  col: number;
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  type: PlayerType;
  difficulty: AIDifficulty;
  tokens: Token[];
  tokensHome: number;
  rank?: number; // 1st, 2nd, 3rd, 4th
}

export interface MoveOption {
  tokenId: number;
  fromStep: number;
  toStep: number;
  isEnterTrack: boolean;
  isCapture: boolean;
  isHome: boolean;
  score?: number; // Used by AI heuristic
}

export type GamePhase = 'setup' | 'playing' | 'gameover';

export interface GameLogEntry {
  id: string;
  timestamp: number;
  color: PlayerColor;
  playerName: string;
  message: string;
  type: 'roll' | 'move' | 'capture' | 'home' | 'turn' | 'extraTurn' | 'win';
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  diceValue: number | null;
  isRolling: boolean;
  canRoll: boolean;
  consecutiveSixes: number;
  validMoves: MoveOption[];
  animatingTokenId: number | null;
  animationPath: { row: number; col: number }[];
  winners: PlayerColor[];
  logs: GameLogEntry[];
}
