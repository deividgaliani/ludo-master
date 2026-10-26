import type { PlayerColor } from '../types/ludo';

export interface ColorTheme {
  primary: string;
  secondary: string;
  bgLight: string;
  border: string;
  tokenGradient: string;
  tokenShadow: string;
  namePt: string;
  darkHex: string;
}

export const COLOR_THEMES: Record<PlayerColor, ColorTheme> = {
  red: {
    primary: '#ef4444',
    secondary: '#b91c1c',
    bgLight: '#fee2e2',
    border: '#dc2626',
    tokenGradient: 'linear-gradient(135deg, #f87171, #dc2626, #991b1b)',
    tokenShadow: 'rgba(239, 68, 68, 0.4)',
    namePt: 'Vermelho',
    darkHex: '#7f1d1d',
  },
  green: {
    primary: '#22c55e',
    secondary: '#15803d',
    bgLight: '#dcfce7',
    border: '#16a34a',
    tokenGradient: 'linear-gradient(135deg, #4ade80, #16a34a, #166534)',
    tokenShadow: 'rgba(34, 197, 94, 0.4)',
    namePt: 'Verde',
    darkHex: '#14532d',
  },
  yellow: {
    primary: '#eab308',
    secondary: '#a16207',
    bgLight: '#fef9c3',
    border: '#ca8a04',
    tokenGradient: 'linear-gradient(135deg, #fde047, #ca8a04, #854d0e)',
    tokenShadow: 'rgba(234, 179, 8, 0.4)',
    namePt: 'Amarelo',
    darkHex: '#713f12',
  },
  blue: {
    primary: '#3b82f6',
    secondary: '#1d4ed8',
    bgLight: '#dbeafe',
    border: '#2563eb',
    tokenGradient: 'linear-gradient(135deg, #60a5fa, #2563eb, #1e40af)',
    tokenShadow: 'rgba(59, 130, 246, 0.4)',
    namePt: 'Azul',
    darkHex: '#1e3a8a',
  },
};
