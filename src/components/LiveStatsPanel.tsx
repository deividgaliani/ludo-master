import React, { useState } from 'react';
import { BarChart3, Dices, Footprints, Swords, Ban } from 'lucide-react';
import type { Player } from '../types/ludo';
import { COLOR_THEMES } from '../constants/colors';

interface LiveStatsPanelProps {
  players: Player[];
}

const DICE_FACES = [1, 2, 3, 4, 5, 6] as const;

export const LiveStatsPanel: React.FC<LiveStatsPanelProps> = ({ players }) => {
  const [selectedScope, setSelectedScope] = useState<'all' | string>('all');

  const activePlayer =
    selectedScope === 'all' ? null : players.find((p) => p.id === selectedScope) ?? null;

  const targetPlayers = activePlayer ? [activePlayer] : players;

  const totalRolls = targetPlayers.reduce((acc, p) => acc + (p.stats?.totalRolls ?? 0), 0);
  const sixesRolled = targetPlayers.reduce((acc, p) => acc + (p.stats?.sixesRolled ?? 0), 0);
  const distanceTraveled = targetPlayers.reduce((acc, p) => acc + (p.stats?.distanceTraveled ?? 0), 0);
  const piecesCaptured = targetPlayers.reduce((acc, p) => acc + (p.stats?.piecesCaptured ?? 0), 0);
  const turnsPassed = targetPlayers.reduce(
    (acc, p) => acc + (p.stats?.turnsPassedWithoutMove ?? 0),
    0
  );

  const diceCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const face of DICE_FACES) {
    diceCounts[face] = targetPlayers.reduce(
      (acc, p) => acc + (p.stats?.diceRollsByFace?.[face] ?? 0),
      0
    );
  }
  const maxFaceCount = Math.max(1, ...Object.values(diceCounts));

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between backdrop-blur-md space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <span>Estatísticas ao Vivo</span>
        </div>
        <span className="text-[10px] font-semibold text-slate-500">
          {activePlayer ? activePlayer.name : 'Soma Geral'}
        </span>
      </div>

      {/* Scope Filter Pills (All vs Individual Players) */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => setSelectedScope('all')}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border ${
            selectedScope === 'all'
              ? 'bg-amber-500 text-slate-950 border-amber-400'
              : 'bg-slate-800/80 text-slate-400 border-slate-700/70 hover:text-slate-200'
          }`}
        >
          Geral
        </button>
        {players.map((p) => {
          const theme = COLOR_THEMES[p.color];
          const isSelected = selectedScope === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedScope(p.id)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border flex items-center gap-1 max-w-[90px] ${
                isSelected
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-800/50 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              style={{
                borderColor: isSelected ? theme.primary : undefined,
              }}
              title={`Ver estatísticas de ${p.name}`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: theme.primary }}
              />
              <span className="truncate">{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Live Dice Distribution (1 to 6) */}
      <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 p-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2.5">
          <span className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Dices className="w-3.5 h-3.5 text-emerald-400" />
            Frequência do Dado
          </span>
          <span>
            <strong className="text-slate-200">{totalRolls}</strong> roladas
          </span>
        </div>

        <div className="grid grid-cols-6 gap-1.5 text-center">
          {DICE_FACES.map((face) => {
            const count = diceCounts[face];
            const pct = totalRolls > 0 ? Math.round((count / totalRolls) * 100) : 0;
            const barWidth = totalRolls > 0 ? Math.round((count / maxFaceCount) * 100) : 0;
            const isSix = face === 6;

            return (
              <div
                key={face}
                className={`py-2 px-1 rounded-lg border flex flex-col items-center ${
                  isSix
                    ? 'bg-emerald-950/25 border-emerald-500/30'
                    : 'bg-slate-900/80 border-slate-800/90'
                }`}
                title={`Face [${face}]: saiu ${count}x (${pct}%)`}
              >
                <span
                  className={`text-[10px] font-black mb-1 ${
                    isSix ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  [{face}]
                </span>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isSix ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span
                  className={`text-sm font-extrabold leading-tight ${
                    isSix ? 'text-emerald-300' : count > 0 ? 'text-slate-100' : 'text-slate-500'
                  }`}
                >
                  {count}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2x2 Summary Metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div
          className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5"
          title="Total de casas percorridas no tabuleiro"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Footprints className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 truncate">Distância</div>
            <div className="font-extrabold text-cyan-300 text-sm">{distanceTraveled} casas</div>
          </div>
        </div>

        <div
          className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5"
          title="Total de peões adversários capturados"
        >
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
            <Swords className="w-4 h-4 text-rose-400" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 truncate">Capturas</div>
            <div className="font-extrabold text-rose-300 text-sm">{piecesCaptured}</div>
          </div>
        </div>

        <div
          className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5"
          title="Quantidade de vezes que saiu o número 6"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Dices className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 truncate">Rolagens [6]</div>
            <div className="font-extrabold text-emerald-300 text-sm">
              {sixesRolled}{' '}
              <span className="text-[10px] font-normal text-slate-400">
                ({totalRolls > 0 ? Math.round((sixesRolled / totalRolls) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>

        <div
          className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5"
          title="Turnos passados sem nenhum movimento válido disponível"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Ban className="w-4 h-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 truncate">Sem Jogada</div>
            <div className="font-extrabold text-amber-300 text-sm">{turnsPassed}x</div>
          </div>
        </div>
      </div>
    </div>
  );
};
