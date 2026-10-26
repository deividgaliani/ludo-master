import React from 'react';
import type { PlayerColor } from '../types/ludo';
import { COLOR_THEMES } from '../constants/colors';

interface DiceRollerProps {
  value: number | null;
  isRolling: boolean;
  canRoll: boolean;
  color: PlayerColor;
  onRoll: () => void;
  isAI: boolean;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({
  value,
  isRolling,
  canRoll,
  color,
  onRoll,
  isAI,
}) => {
  const theme = COLOR_THEMES[color];

  // Render dice pip dots based on value (1-6)
  const renderPips = (val: number | null) => {
    if (!val) {
      return (
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Rolar
        </div>
      );
    }

    const dotMatrix: Record<number, number[][]> = {
      1: [[1, 1]],
      2: [[0, 0], [2, 2]],
      3: [[0, 0], [1, 1], [2, 2]],
      4: [[0, 0], [0, 2], [2, 0], [2, 2]],
      5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
      6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
    };

    const pips = dotMatrix[val] || [];

    return (
      <div className="grid grid-cols-3 grid-rows-3 w-10 h-10 gap-1 p-1">
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => {
            const hasDot = pips.some(([pr, pc]) => pr === r && pc === c);
            return (
              <div key={`${r}-${c}`} className="flex items-center justify-center">
                {hasDot && (
                  <div
                    className="w-2.5 h-2.5 rounded-full shadow-inner"
                    style={{ backgroundColor: theme.primary }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onRoll}
        disabled={!canRoll || isRolling || isAI}
        className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-200 select-none ${
          isRolling
            ? 'animate-dice-shake cursor-wait'
            : canRoll && !isAI
            ? 'cursor-pointer hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl ring-4 ring-offset-2 ring-offset-slate-900'
            : 'opacity-70 cursor-not-allowed'
        }`}
        style={{
          background: 'linear-gradient(145deg, #ffffff, #e2e8f0)',
          boxShadow: canRoll && !isAI
            ? `0 10px 25px -3px ${theme.primary}66, 0 4px 6px -4px ${theme.primary}44, inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -3px 4px rgba(0,0,0,0.15)`
            : '0 4px 6px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.7)',
          border: `2px solid ${theme.primary}`,
        }}
        title={isAI ? 'Computador jogando...' : canRoll ? 'Clique para rolar o dado!' : 'Aguarde sua vez'}
      >
        {/* Glow halo when ready to roll */}
        {canRoll && !isAI && !isRolling && (
          <div
            className="absolute -inset-1 rounded-2xl animate-pulse opacity-75 blur-xs -z-10"
            style={{ backgroundColor: theme.primary }}
          />
        )}

        {renderPips(value)}
      </button>

      <div className="text-xs font-semibold px-2.5 py-1 rounded-full text-slate-200 bg-slate-800/80 border border-slate-700/60 shadow-sm flex items-center gap-1.5">
        {isRolling ? (
          <span className="text-amber-400 animate-pulse">Rolando...</span>
        ) : isAI && canRoll ? (
          <span className="text-cyan-400 animate-pulse">IA pensando...</span>
        ) : canRoll ? (
          <span className="text-emerald-400 font-bold">Sua vez: Role o dado!</span>
        ) : value ? (
          <span>Tirou: <strong className="text-white text-sm">{value}</strong></span>
        ) : (
          <span className="text-slate-400">Aguardando</span>
        )}
      </div>
    </div>
  );
};
