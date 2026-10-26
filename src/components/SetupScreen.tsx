import React, { useState } from 'react';
import { Bot, User, Play, Users, Sparkles, BookOpen, Volume2, VolumeX, Brain } from 'lucide-react';
import { COLOR_THEMES } from '../constants/colors';
import type { AIDifficulty, PlayerConfig, PlayerType } from '../types/ludo';
import { soundFX } from '../audio/soundEffects';

const DIFFICULTY_OPTIONS: { value: AIDifficulty; label: string; desc: string }[] = [
  { value: 'easy', label: 'Fácil', desc: 'Casual: foca em avançar sem calcular emboscadas' },
  { value: 'normal', label: 'Normal', desc: 'Equilibrada: protege peças e aproveita capturas' },
  { value: 'smart', label: 'Mestre', desc: 'Estrategista: calcula probabilidades, emboscadas e foca no líder' },
];

interface SetupScreenProps {
  onStartGame: (players: PlayerConfig[]) => void;
  onOpenRules: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  onStartGame,
  onOpenRules,
}) => {
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [isMuted, setIsMuted] = useState<boolean>(soundFX.isMuted);

  const [configs, setConfigs] = useState<PlayerConfig[]>([
    { id: '1', name: 'Você (Humano)', color: 'red', type: 'human', difficulty: 'smart' },
    { id: '2', name: 'Bot Verde', color: 'green', type: 'ai', difficulty: 'smart' },
    { id: '3', name: 'Bot Amarelo', color: 'yellow', type: 'ai', difficulty: 'smart' },
    { id: '4', name: 'Bot Azul', color: 'blue', type: 'ai', difficulty: 'smart' },
  ]);

  const toggleMute = () => {
    soundFX.isMuted = !soundFX.isMuted;
    setIsMuted(soundFX.isMuted);
  };

  const handlePlayerTypeToggle = (index: number) => {
    setConfigs((prev) => {
      const copy = [...prev];
      const newType: PlayerType = copy[index].type === 'human' ? 'ai' : 'human';
      copy[index] = {
        ...copy[index],
        type: newType,
        difficulty: copy[index].difficulty || 'smart',
        name:
          newType === 'ai'
            ? `Bot ${COLOR_THEMES[copy[index].color].namePt}`
            : `Jogador ${COLOR_THEMES[copy[index].color].namePt}`,
      };
      return copy;
    });
  };

  const handleDifficultyChange = (index: number, difficulty: AIDifficulty) => {
    setConfigs((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], difficulty };
      return copy;
    });
  };

  const handleGlobalDifficultyChange = (difficulty: AIDifficulty) => {
    setConfigs((prev) => prev.map((cfg) => ({ ...cfg, difficulty })));
  };

  const handleNameChange = (index: number, name: string) => {
    setConfigs((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], name };
      return copy;
    });
  };

  // Quick Preset Presets
  const applyPreset = (preset: 'solo' | 'duo' | 'party' | 'demo') => {
    if (preset === 'solo') {
      setPlayerCount(4);
      setConfigs([
        { id: '1', name: 'Você', color: 'red', type: 'human', difficulty: 'smart' },
        { id: '2', name: 'Bot Verde', color: 'green', type: 'ai', difficulty: 'smart' },
        { id: '3', name: 'Bot Amarelo', color: 'yellow', type: 'ai', difficulty: 'smart' },
        { id: '4', name: 'Bot Azul', color: 'blue', type: 'ai', difficulty: 'smart' },
      ]);
    } else if (preset === 'duo') {
      setPlayerCount(2);
      setConfigs([
        { id: '1', name: 'Jogador 1', color: 'red', type: 'human' },
        { id: '2', name: 'Jogador 2', color: 'yellow', type: 'human' },
        { id: '3', name: 'Bot Verde', color: 'green', type: 'ai' },
        { id: '4', name: 'Bot Azul', color: 'blue', type: 'ai' },
      ]);
    } else if (preset === 'party') {
      setPlayerCount(4);
      setConfigs([
        { id: '1', name: 'Jogador 1', color: 'red', type: 'human' },
        { id: '2', name: 'Jogador 2', color: 'green', type: 'human' },
        { id: '3', name: 'Jogador 3', color: 'yellow', type: 'human' },
        { id: '4', name: 'Jogador 4', color: 'blue', type: 'human' },
      ]);
    } else if (preset === 'demo') {
      setPlayerCount(4);
      setConfigs([
        { id: '1', name: 'Bot Vermelho', color: 'red', type: 'ai', difficulty: 'smart' },
        { id: '2', name: 'Bot Verde', color: 'green', type: 'ai', difficulty: 'smart' },
        { id: '3', name: 'Bot Amarelo', color: 'yellow', type: 'ai', difficulty: 'smart' },
        { id: '4', name: 'Bot Azul', color: 'blue', type: 'ai', difficulty: 'smart' },
      ]);
    }
  };

  const handleStart = () => {
    soundFX.playDiceRoll();
    // Return only active players based on playerCount
    // If 2 players, Red & Yellow is the standard opposite-corner pair for best balance!
    let activeConfigs = configs.slice(0, playerCount);
    if (playerCount === 2) {
      activeConfigs = [
        configs[0], // Red
        configs.find((c) => c.color === 'yellow') || configs[2], // Yellow (opposite)
      ];
    }
    onStartGame(activeConfigs);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top action row */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-6 z-10">
        <button
          onClick={onOpenRules}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors shadow-sm cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Como Jogar</span>
        </button>

        <button
          onClick={toggleMute}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors shadow-sm cursor-pointer"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 text-rose-400" />
              <span>Som Desativado</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Som Ativado</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl z-10">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Jogo Web de Tabuleiro</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white m-0">
            LUDO MASTER
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Jogue contra IA Inteligente ou com amigos no mesmo computador!
          </p>
        </div>

        {/* Quick Presets */}
        <div className="mb-6">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Configuração Rápida:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => applyPreset('solo')}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-slate-200 transition-all hover:border-cyan-500/50 cursor-pointer"
            >
              1 Humano vs 3 IAs
            </button>
            <button
              onClick={() => applyPreset('duo')}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-slate-200 transition-all hover:border-cyan-500/50 cursor-pointer"
            >
              2 Jogadores (Duelo)
            </button>
            <button
              onClick={() => applyPreset('party')}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-slate-200 transition-all hover:border-cyan-500/50 cursor-pointer"
            >
              4 Humanos (Mesa)
            </button>
            <button
              onClick={() => applyPreset('demo')}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-slate-200 transition-all hover:border-cyan-500/50 cursor-pointer"
            >
              4 IAs (Demo)
            </button>
          </div>
        </div>

        {/* Number of players selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Número de Jogadores:</span>
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => setPlayerCount(count)}
                className={`py-2 rounded-xl font-bold text-sm transition-all border cursor-pointer ${
                  playerCount === count
                    ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-600/30'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-750'
                }`}
              >
                {count} Jogadores {count === 2 ? '(Opostos)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Player configuration slots */}
        <div className="space-y-3 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Personalizar Jogadores:
            </label>
            {configs.slice(0, playerCount).some((c) => c.type === 'ai') && (
              <div className="flex items-center gap-1.5 text-xs">
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400 font-semibold">Nível de todas as IAs:</span>
                <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-700/80">
                  {DIFFICULTY_OPTIONS.map((opt) => {
                    const allSame = configs
                      .slice(0, playerCount)
                      .filter((c) => c.type === 'ai')
                      .every((c) => (c.difficulty || 'smart') === opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleGlobalDifficultyChange(opt.value)}
                        title={opt.desc}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          allSame
                            ? 'bg-cyan-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {configs.slice(0, playerCount).map((cfg, idx) => {
            const theme = COLOR_THEMES[cfg.color];
            const isHuman = cfg.type === 'human';
            const currentDiff = cfg.difficulty || 'smart';

            return (
              <div
                key={cfg.color}
                className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80"
              >
                {/* Color icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md shrink-0"
                  style={{ backgroundColor: theme.primary }}
                >
                  {isHuman ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>

                {/* Name input */}
                <div className="flex-1 min-w-[140px]">
                  <input
                    type="text"
                    value={cfg.name}
                    onChange={(e) => handleNameChange(idx, e.target.value)}
                    maxLength={18}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500"
                    placeholder={`Nome (${theme.namePt})`}
                  />
                </div>

                {/* AI Difficulty selector (only shown for AI players) */}
                {!isHuman && (
                  <div
                    className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 gap-0.5"
                    title="Selecione o nível de inteligência deste Bot"
                  >
                    {DIFFICULTY_OPTIONS.map((opt) => {
                      const isActive = currentDiff === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleDifficultyChange(idx, opt.value)}
                          title={opt.desc}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            isActive
                              ? opt.value === 'smart'
                                ? 'bg-amber-500 text-slate-950 shadow-sm'
                                : opt.value === 'normal'
                                  ? 'bg-cyan-600 text-white shadow-sm'
                                  : 'bg-slate-700 text-slate-200 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Type toggle: Human vs AI */}
                <button
                  type="button"
                  onClick={() => handlePlayerTypeToggle(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    isHuman
                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400 hover:bg-emerald-900'
                      : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400 hover:bg-cyan-900'
                  }`}
                  title="Clique para alternar entre Humano e Computador (IA)"
                >
                  {isHuman ? (
                    <>
                      <User className="w-3.5 h-3.5" />
                      <span>Humano</span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-3.5 h-3.5" />
                      <span>IA</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Start Game Action */}
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-lg tracking-wide uppercase shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-slate-950" />
          <span>Começar Partida</span>
        </button>
      </div>
    </div>
  );
};
