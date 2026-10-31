import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  RotateCcw,
  Home,
  Swords,
  ShieldAlert,
  Footprints,
  Dices,
  Timer,
  BarChart3,
  Award,
} from 'lucide-react';
import type { Player } from '../types/ludo';
import { COLOR_THEMES } from '../constants/colors';
import { soundFX } from '../audio/soundEffects';

interface VictoryModalProps {
  isOpen: boolean;
  players: Player[];
  durationSeconds?: number;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
}

const DICE_FACES = [1, 2, 3, 4, 5, 6] as const;

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  players,
  durationSeconds = 0,
  onPlayAgain,
  onReturnToMenu,
}) => {
  const [activeTab, setActiveTab] = useState<'podium' | 'details' | 'dice'>('podium');

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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalMatchCaptures = players.reduce((acc, p) => acc + (p.stats?.piecesCaptured ?? 0), 0);
  const totalMatchMoves = players.reduce((acc, p) => acc + (p.stats?.totalMoves ?? 0), 0);
  const totalMatchRolls = players.reduce((acc, p) => acc + (p.stats?.totalRolls ?? 0), 0);

  const globalDiceCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const face of DICE_FACES) {
    globalDiceCounts[face] = players.reduce(
      (acc, p) => acc + (p.stats?.diceRollsByFace?.[face] ?? 0),
      0
    );
  }
  const maxGlobalFaceCount = Math.max(1, ...Object.values(globalDiceCounts));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border-2 border-amber-500/50 w-full max-w-xl rounded-3xl p-5 sm:p-7 shadow-2xl text-center relative overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Glow backdrop */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: winnerTheme.primary }}
        />

        {/* Header Icon & Title */}
        <div className="flex-shrink-0">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mb-2 shadow-inner ring-4 ring-amber-500/30">
            <Trophy className="w-9 h-9" />
          </div>

          <h2 className="text-2xl font-black text-white mb-0.5 tracking-tight">
            Fim de Partida!
          </h2>
          <p className="text-slate-300 text-sm mb-3">
            Vitória de <strong style={{ color: winnerTheme.primary }}>{winner.name}</strong>!
          </p>

          {/* Quick Match Global Badges */}
          <div className="flex items-center justify-center gap-2 mb-4 flex-wrap text-xs">
            {durationSeconds > 0 && (
              <span className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-full text-slate-300">
                <Timer className="w-3.5 h-3.5 text-cyan-400" />
                Tempo: <strong className="text-white">{formatDuration(durationSeconds)}</strong>
              </span>
            )}
            <span className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-full text-slate-300">
              <Swords className="w-3.5 h-3.5 text-rose-400" />
              Capturas totais: <strong className="text-white">{totalMatchCaptures}</strong>
            </span>
            <span className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-full text-slate-300">
              <Footprints className="w-3.5 h-3.5 text-amber-400" />
              Movimentos totais: <strong className="text-white">{totalMatchMoves}</strong>
            </span>
            <span className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-full text-slate-300">
              <Dices className="w-3.5 h-3.5 text-emerald-400" />
              Roladas de dado: <strong className="text-white">{totalMatchRolls}</strong>
            </span>
          </div>

          {/* Champion Highlight Box */}
          <div
            className="p-3.5 rounded-2xl border mb-4 text-left relative overflow-hidden"
            style={{
              backgroundColor: `${winnerTheme.primary}15`,
              borderColor: `${winnerTheme.primary}50`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Destaque do Campeão
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-300">
                {winner.tokensHome}/4 peões salvos
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mb-0.5">
                  <Swords className="w-3 h-3 text-rose-400" />
                  <span>Capturadas</span>
                </div>
                <div className="text-base font-extrabold text-rose-300">
                  {winner.stats?.piecesCaptured ?? 0}
                </div>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mb-0.5">
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  <span>Perdidas</span>
                </div>
                <div className="text-base font-extrabold text-amber-300">
                  {winner.stats?.piecesLost ?? 0}
                </div>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mb-0.5">
                  <Footprints className="w-3 h-3 text-cyan-400" />
                  <span>Movimentos</span>
                </div>
                <div className="text-base font-extrabold text-cyan-300">
                  {winner.stats?.totalMoves ?? 0}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center justify-center p-1 bg-slate-800/80 rounded-xl mb-3 border border-slate-750 gap-1">
            <button
              onClick={() => setActiveTab('podium')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'podium'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Classificação</span>
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Tabela Geral</span>
            </button>
            <button
              onClick={() => setActiveTab('dice')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'dice'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Dices className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Dados (1–6)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Player List */}
        <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 mb-4 text-left">
          {activeTab === 'podium' ? (
            sortedPlayers.map((p, idx) => {
              const pTheme = COLOR_THEMES[p.color];
              const isWinner = idx === 0;

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isWinner
                      ? 'bg-amber-950/30 border-amber-500/50 shadow-md'
                      : 'bg-slate-800/40 border-slate-800'
                  }`}
                >
                  {/* Player Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center ${
                          idx === 0
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-900'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {idx + 1}º
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{p.name}</span>
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: pTheme.primary }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {p.type === 'ai' ? 'IA' : 'Humano'} • {p.tokensHome}/4 peões na meta
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Player Stats Pills */}
                  <div className="grid grid-cols-4 gap-1.5 text-center text-[11px]">
                    <div
                      className="bg-slate-900/80 py-1.5 px-1 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center"
                      title="Peças que este jogador capturou dos adversários"
                    >
                      <span className="text-[9px] text-slate-400 flex items-center gap-0.5 mb-0.5">
                        <Swords className="w-2.5 h-2.5 text-rose-400" />
                        <span>Capturas</span>
                      </span>
                      <span className="font-extrabold text-rose-300">
                        {p.stats?.piecesCaptured ?? 0}
                      </span>
                    </div>

                    <div
                      className="bg-slate-900/80 py-1.5 px-1 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center"
                      title="Peças deste jogador que foram enviadas de volta à base"
                    >
                      <span className="text-[9px] text-slate-400 flex items-center gap-0.5 mb-0.5">
                        <ShieldAlert className="w-2.5 h-2.5 text-amber-400" />
                        <span>Perdidas</span>
                      </span>
                      <span className="font-extrabold text-amber-300">
                        {p.stats?.piecesLost ?? 0}
                      </span>
                    </div>

                    <div
                      className="bg-slate-900/80 py-1.5 px-1 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center"
                      title="Total de lances/movimentos efetuados"
                    >
                      <span className="text-[9px] text-slate-400 flex items-center gap-0.5 mb-0.5">
                        <Footprints className="w-2.5 h-2.5 text-cyan-400" />
                        <span>Movimentos</span>
                      </span>
                      <span className="font-extrabold text-cyan-300">
                        {p.stats?.totalMoves ?? 0}
                      </span>
                    </div>

                    <div
                      className="bg-slate-900/80 py-1.5 px-1 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center"
                      title="Quantidade de vezes que rolou o número 6"
                    >
                      <span className="text-[9px] text-slate-400 flex items-center gap-0.5 mb-0.5">
                        <Dices className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Tirou [6]</span>
                      </span>
                      <span className="font-extrabold text-emerald-300">
                        {p.stats?.sixesRolled ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : activeTab === 'details' ? (
            <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-2.5 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                    <th className="py-2 px-2">Jogador</th>
                    <th className="py-2 px-1 text-center" title="Peças Capturadas">Capt.</th>
                    <th className="py-2 px-1 text-center" title="Peças Perdidas">Perd.</th>
                    <th className="py-2 px-1 text-center" title="Total de Movimentos">Mov.</th>
                    <th className="py-2 px-1 text-center" title="Dados Rolados">Dados</th>
                    <th className="py-2 px-1 text-center" title="Casas Percorridas">Dist.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {sortedPlayers.map((p, idx) => {
                    const pTheme = COLOR_THEMES[p.color];
                    return (
                      <tr key={p.id} className="text-slate-200 hover:bg-slate-800/40">
                        <td className="py-2.5 px-2 flex items-center gap-1.5 font-bold">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: pTheme.primary }}
                          />
                          <span className="truncate max-w-[110px]">
                            {idx + 1}º {p.name}
                          </span>
                        </td>
                        <td className="py-2.5 px-1 text-center text-rose-300 font-semibold">
                          {p.stats?.piecesCaptured ?? 0}
                        </td>
                        <td className="py-2.5 px-1 text-center text-amber-300 font-semibold">
                          {p.stats?.piecesLost ?? 0}
                        </td>
                        <td className="py-2.5 px-1 text-center text-cyan-300 font-semibold">
                          {p.stats?.totalMoves ?? 0}
                        </td>
                        <td className="py-2.5 px-1 text-center text-slate-300 font-medium text-[11px]">
                          {p.stats?.totalRolls ?? 0} <span className="text-[10px] text-emerald-400">({p.stats?.sixesRolled ?? 0}★)</span>
                        </td>
                        <td className="py-2.5 px-1 text-center text-slate-300 font-medium text-[11px]">
                          {p.stats?.distanceTraveled ?? 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Global Summary Card (Sum of all players) */}
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-3">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <Dices className="w-4 h-4 text-emerald-400" />
                    <span>Estatística Geral (Soma de Todos)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Total: <strong className="text-white">{totalMatchRolls}</strong> rolagens
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-1.5 text-center">
                  {DICE_FACES.map((face) => {
                    const count = globalDiceCounts[face];
                    const pct = totalMatchRolls > 0 ? Math.round((count / totalMatchRolls) * 100) : 0;
                    const barHeightPct = totalMatchRolls > 0 ? Math.round((count / maxGlobalFaceCount) * 100) : 0;
                    const isSix = face === 6;

                    return (
                      <div
                        key={face}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-between ${
                          isSix
                            ? 'bg-emerald-950/25 border-emerald-500/40'
                            : 'bg-slate-900/90 border-slate-800'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center mb-1 border ${
                            isSix
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-slate-800 text-slate-200 border-slate-700'
                          }`}
                        >
                          {face}
                        </span>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden my-1">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isSix ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                            style={{ width: `${barHeightPct}%` }}
                          />
                        </div>
                        <span
                          className={`text-sm font-extrabold ${
                            isSix ? 'text-emerald-300' : 'text-white'
                          }`}
                        >
                          {count}x
                        </span>
                        <span className="text-[10px] text-slate-400">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Per-Player Breakdown Table */}
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-2.5 overflow-x-auto">
                <div className="text-[11px] font-bold text-slate-300 px-1.5 mb-1.5">
                  Frequência por Jogador
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                      <th className="py-2 px-2">Jogador</th>
                      {DICE_FACES.map((face) => (
                        <th
                          key={face}
                          className={`py-2 px-1 text-center ${
                            face === 6 ? 'text-emerald-400 font-extrabold' : ''
                          }`}
                          title={`Vezes que saiu o número ${face}`}
                        >
                          [{face}]
                        </th>
                      ))}
                      <th className="py-2 px-1.5 text-right" title="Total de dados rolados pelo jogador">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {sortedPlayers.map((p, idx) => {
                      const pTheme = COLOR_THEMES[p.color];
                      const byFace = p.stats?.diceRollsByFace ?? {};
                      return (
                        <tr key={p.id} className="text-slate-200 hover:bg-slate-800/40">
                          <td className="py-2.5 px-2 flex items-center gap-1.5 font-bold">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: pTheme.primary }}
                            />
                            <span className="truncate max-w-[105px]">
                              {idx + 1}º {p.name}
                            </span>
                          </td>
                          {DICE_FACES.map((face) => {
                            const count = byFace[face] ?? 0;
                            return (
                              <td
                                key={face}
                                className={`py-2.5 px-1 text-center font-semibold ${
                                  face === 6
                                    ? 'text-emerald-300 bg-emerald-950/15'
                                    : count > 0
                                    ? 'text-slate-200'
                                    : 'text-slate-600'
                                }`}
                              >
                                {count}
                              </td>
                            );
                          })}
                          <td className="py-2.5 px-1.5 text-right font-extrabold text-amber-300">
                            {p.stats?.totalRolls ?? 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-800 bg-slate-900/70 text-xs font-extrabold text-white">
                      <td className="py-2 px-2 text-amber-400">Soma Geral</td>
                      {DICE_FACES.map((face) => (
                        <td
                          key={face}
                          className={`py-2 px-1 text-center ${
                            face === 6 ? 'text-emerald-300' : 'text-slate-200'
                          }`}
                        >
                          {globalDiceCounts[face]}
                        </td>
                      ))}
                      <td className="py-2 px-1.5 text-right text-amber-400">
                        {totalMatchRolls}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-shrink-0 pt-2 border-t border-slate-800/80">
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
