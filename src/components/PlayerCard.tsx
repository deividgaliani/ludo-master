import React from 'react';
import { Bot, User, Trophy, Home } from 'lucide-react';
import { COLOR_THEMES } from '../constants/colors';
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

  return (
    <div
      className={`relative p-3.5 rounded-2xl border transition-all duration-300 backdrop-blur-md ${
        isCurrentTurn
          ? 'bg-slate-800/95 shadow-xl scale-[1.02]'
          : 'bg-slate-900/60 opacity-80 hover:opacity-100'
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
      <div className="flex items-center gap-2.5 mb-2.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md font-bold"
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
            <span className={player.type === 'ai' ? 'text-cyan-400 font-semibold' : 'text-emerald-400 font-semibold'}>
              {player.type === 'ai' ? 'IA Inteligente' : 'Humano'}
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
    </div>
  );
};
