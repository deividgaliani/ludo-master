import React, { useEffect, useRef } from 'react';
import type { GameLogEntry } from '../types/ludo';
import { COLOR_THEMES } from '../constants/colors';
import { History, Swords, Sparkles, Trophy, Dices, ArrowRight } from 'lucide-react';

interface GameHistoryProps {
  logs: GameLogEntry[];
}

export const GameHistory: React.FC<GameHistoryProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const renderIcon = (type: GameLogEntry['type']) => {
    switch (type) {
      case 'roll':
        return <Dices className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'capture':
        return <Swords className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'home':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'win':
        return <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
      default:
        return <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-3.5 flex flex-col h-56 backdrop-blur-md">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
        <History className="w-4 h-4 text-cyan-400" />
        <span>Histórico de Lances</span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs text-slate-300 font-sans"
      >
        {logs.length === 0 ? (
          <div className="text-slate-500 italic text-center py-6">
            O jogo começou! Role o dado para dar a partida.
          </div>
        ) : (
          logs.map((log) => {
            const theme = COLOR_THEMES[log.color];
            return (
              <div
                key={log.id}
                className="flex items-start gap-2 p-1.5 rounded-lg bg-slate-800/40 border border-slate-800 hover:bg-slate-800/70 transition-colors"
              >
                <div className="mt-0.5">{renderIcon(log.type)}</div>
                <div className="flex-1 leading-snug">
                  <span
                    className="font-bold mr-1.5"
                    style={{ color: theme.primary }}
                  >
                    {log.playerName}:
                  </span>
                  <span>{log.message}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
