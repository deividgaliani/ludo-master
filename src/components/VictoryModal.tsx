import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home } from 'lucide-react';
import type { Player } from '../types/ludo';
import { COLOR_THEMES } from '../constants/colors';
import { soundFX } from '../audio/soundEffects';

interface VictoryModalProps {
  isOpen: boolean;
  players: Player[];
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  players,
  onPlayAgain,
  onReturnToMenu,
}) => {
  useEffect(() => {
    if (isOpen) {
      soundFX.playWin();

      // Confetti burst
      const duration = 3.5 * 1000;
      const animationEnd = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Sort players by rank (1st, 2nd, etc.) or by tokensHome descending
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.rank && b.rank) return a.rank - b.rank;
    if (a.rank) return -1;
    if (b.rank) return 1;
    return b.tokensHome - a.tokensHome;
  });

  const winner = sortedPlayers[0];
  const winnerTheme = COLOR_THEMES[winner.color];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border-2 border-amber-500/50 w-full max-w-md rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: winnerTheme.primary }}
        />

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mb-3 shadow-inner ring-4 ring-amber-500/30">
          <Trophy className="w-9 h-9" />
        </div>

        <h2 className="text-2xl font-black text-white mb-1 tracking-tight">
          Fim de Partida!
        </h2>
        <p className="text-slate-300 text-sm mb-6">
          Parabéns a <strong style={{ color: winnerTheme.primary }}>{winner.name}</strong> pela vitória épica!
        </p>

        {/* Podium list */}
        <div className="space-y-2 mb-6">
          {sortedPlayers.map((p, idx) => {
            const pTheme = COLOR_THEMES[p.color];
            const isWinner = idx === 0;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  isWinner
                    ? 'bg-amber-950/40 border-amber-500/60 shadow-lg'
                    : 'bg-slate-800/40 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center ${
                      idx === 0
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-900'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {idx + 1}º
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{p.name}</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: pTheme.primary }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {p.type === 'ai' ? 'IA Inteligente' : 'Jogador Humano'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400">
                    {p.tokensHome}/4
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1">peões</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToMenu}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Menu Inicial
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 transition-transform hover:scale-105 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Jogar Novamente
          </button>
        </div>
      </div>
    </div>
  );
};
