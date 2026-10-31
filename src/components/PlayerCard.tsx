import React from 'react';
import { Bot, User, Trophy, Home, Swords, ShieldAlert, Footprints, Dices } from 'lucide-react';
import { COLOR_THEMES } from '../constants/colors';
import { TOTAL_STEPS_TO_GOAL } from '../constants/boardPath';
import type { Player } from '../types/ludo';

interface PlayerCardProps {
  player: Player;
  isCurrentTurn: boolean;
  canRoll: boolean;
  diceValue: number | null;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentTurn,
}) => {
  const theme = COLOR_THEMES[player.color];

  const inBaseCount = player.tokens.filter((t) => t.state === 'base').length;
  const onTrackCount = player.tokens.filter((t) => t.state === 'track' || t.state === 'homeStretch').length;
  const inHomeCount = player.tokens.filter((t) => t.state === 'home').length;

  const maxStepsPerToken = TOTAL_STEPS_TO_GOAL + 1;
  const completedSteps = player.tokens.reduce(
    (sum, t) => sum + (t.state === 'base' ? 0 : Math.min(maxStepsPerToken, t.stepCount + 1)),
    0
  );
  const progressPct = Math.round((completedSteps / (4 * maxStepsPerToken)) * 100);

  return (
    <div
      className={`relative p-3 rounded-2xl border transition-all duration-300 backdrop-blur-md flex flex-col justify-between ${
        isCurrentTurn
          ? 'bg-slate-800/95 shadow-xl scale-[1.01]'
          : 'bg-slate-900/60 opacity-85 hover:opacity-100'
      }`}
      style={{
        borderColor: isCurrentTurn ? theme.primary : 'rgba(51, 65, 85, 0.6)',
        boxShadow: isCurrentTurn ? `0 8px 24px -4px ${theme.primary}55` : undefined,
      }}
    >
      {/* Active turn indicator marker */}
      {isCurrentTurn && (
        <span
          className="absolute -top-2.5 right-4 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full shadow-md animate-pulse text-white"
          style={{ backgroundColor: theme.primary }}
        >
          Vez Atual
        </span>
      )}

      {/* Header: Avatar, Name & Type */}
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md font-bold shrink-0"
          style={{ backgroundColor: theme.primary }}
        >
          {player.type === 'ai' ? (
            <Bot className="w-5 h-5 text-white" />
          ) : (
            <User className="w-5 h-5 text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold truncate text-slate-100">
              {player.name}
            </h3>
            {player.rank && (
              <span className="flex items-center gap-0.5 text-xs font-black text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/40">
                <Trophy className="w-3 h-3" />
                {player.rank}º
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: theme.primary }}
            />
            <span>{theme.namePt}</span>
            <span>•</span>
            <span
              className={
                player.type === 'ai'
                  ? player.difficulty === 'smart'
                    ? 'text-amber-400 font-semibold'
                    : player.difficulty === 'normal'
                      ? 'text-cyan-400 font-semibold'
                      : 'text-slate-300 font-semibold'
                  : 'text-emerald-400 font-semibold'
              }
            >
              {player.type === 'ai'
                ? player.difficulty === 'easy'
                  ? 'IA Fácil'
                  : player.difficulty === 'normal'
                    ? 'IA Normal'
                    : 'IA Mestre'
                : 'Humano'}
            </span>
          </div>
        </div>
      </div>

      {/* Pawn distribution badges */}
      <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
        <div className="bg-slate-800/80 rounded-lg py-1 px-1 border border-slate-700/50">
          <div className="text-[10px] text-slate-400">Na Base</div>
          <div className="font-bold text-slate-200">{inBaseCount}</div>
        </div>
        <div className="bg-slate-800/80 rounded-lg py-1 px-1 border border-slate-700/50">
          <div className="text-[10px] text-slate-400">Em Jogo</div>
          <div className="font-bold text-cyan-300">{onTrackCount}</div>
        </div>
        <div className="bg-slate-800/80 rounded-lg py-1 px-1 border border-slate-700/50">
          <div className="text-[10px] text-slate-400">Chegaram</div>
          <div className="font-bold text-emerald-400 flex items-center justify-center gap-0.5">
            <Home className="w-3 h-3" />
            {inHomeCount}/4
          </div>
        </div>
      </div>

      {/* Overall Race Progress Bar */}
      <div className="mt-2">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 px-0.5">
          <span>Progresso na partida</span>
          <span className="font-bold text-slate-200">{progressPct}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/40">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progressPct}%`,
              backgroundColor: theme.primary,
            }}
          />
        </div>
      </div>

      {/* Live Match Metrics */}
      <div className="mt-2 pt-1.5 border-t border-slate-700/40 grid grid-cols-4 gap-1 text-center text-[11px]">
        <div
          className="flex items-center justify-center gap-1 bg-rose-950/40 text-rose-300 rounded-lg py-1 px-1 border border-rose-900/40 font-semibold"
          title="Peças capturadas por este jogador"
        >
          <Swords className="w-3 h-3 text-rose-400 shrink-0" />
          <span className="truncate">{player.stats?.piecesCaptured ?? 0}</span>
        </div>
        <div
          className="flex items-center justify-center gap-1 bg-amber-950/40 text-amber-300 rounded-lg py-1 px-1 border border-amber-900/40 font-semibold"
          title="Peças perdidas (capturadas por oponentes)"
        >
          <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="truncate">{player.stats?.piecesLost ?? 0}</span>
        </div>
        <div
          className="flex items-center justify-center gap-1 bg-cyan-950/40 text-cyan-300 rounded-lg py-1 px-1 border border-cyan-900/40 font-semibold"
          title={`Movimentos realizados (${player.stats?.distanceTraveled ?? 0} casas percorridas)`}
        >
          <Footprints className="w-3 h-3 text-cyan-400 shrink-0" />
          <span className="truncate">{player.stats?.totalMoves ?? 0}</span>
        </div>
        <div
          className="flex items-center justify-center gap-1 bg-emerald-950/40 text-emerald-300 rounded-lg py-1 px-1 border border-emerald-900/40 font-semibold"
          title={`Vezes que tirou 6 no dado (${player.stats?.sixesRolled ?? 0} de ${player.stats?.totalRolls ?? 0} rolagens)`}
        >
          <Dices className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="truncate">{player.stats?.sixesRolled ?? 0}</span>
        </div>
      </div>
    </div>
  );
};
