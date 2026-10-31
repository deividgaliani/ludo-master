import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Check,
  ChevronDown,
  Crosshair,
  Crown,
  Dices,
  DoorOpen,
  Settings2,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { AUTO_MODE_PRESETS } from '../engine/ludoEngine';
import type { AutoModeConfig, AutoModePreset } from '../types/ludo';

interface AutoModeDropdownProps {
  config: AutoModeConfig;
  onChange: (newConfig: AutoModeConfig) => void;
}

const PRESET_LABELS: Record<
  AutoModePreset,
  { label: string; desc: string; icon: React.ReactNode; color: string }
> = {
  basic: {
    label: 'Básico',
    desc: 'Executa apenas jogadas 100% óbvias (sem decisão tática)',
    icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
    color: 'border-amber-500/30 text-amber-300',
  },
  fluid: {
    label: 'Fluido (Semi-Auto)',
    desc: 'Dado automático, sai da base no 6 e finaliza vitórias',
    icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />,
    color: 'border-cyan-500/30 text-cyan-300',
  },
  aggressive: {
    label: 'Agressivo',
    desc: 'Prioriza ataques/capturas, saídas no 6 e vitórias',
    icon: <Crosshair className="w-3.5 h-3.5 text-rose-400" />,
    color: 'border-rose-500/30 text-rose-300',
  },
  full: {
    label: 'Piloto Total 100%',
    desc: 'Totalmente autônomo: a IA decide todas as jogadas (AFK)',
    icon: <Bot className="w-3.5 h-3.5 text-emerald-400" />,
    color: 'border-emerald-500/30 text-emerald-300',
  },
  custom: {
    label: 'Personalizado',
    desc: 'Combinação personalizada de opções manuais',
    icon: <Settings2 className="w-3.5 h-3.5 text-violet-400" />,
    color: 'border-violet-500/30 text-violet-300',
  },
};

export const AutoModeDropdown: React.FC<AutoModeDropdownProps> = ({ config, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const toggleMaster = () => {
    onChange({
      ...config,
      enabled: !config.enabled,
    });
  };

  const selectPreset = (preset: AutoModePreset) => {
    if (preset === 'custom') {
      onChange({
        ...config,
        preset: 'custom',
      });
      return;
    }
    const presetValues = AUTO_MODE_PRESETS[preset];
    onChange({
      ...config,
      ...presetValues,
      preset,
    });
  };

  const updateOption = (key: keyof Omit<AutoModeConfig, 'enabled' | 'preset'>, value: boolean) => {
    const updated = {
      ...config,
      [key]: value,
      preset: 'custom' as AutoModePreset,
    };
    onChange(updated);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Header Pill Button */}
      <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-xl p-0.5 shadow-sm">
        {/* Toggle On/Off Button */}
        <button
          type="button"
          onClick={toggleMaster}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            config.enabled
              ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
          }`}
          title={
            config.enabled
              ? 'Modo Automático ATIVADO: clique para pausar'
              : 'Ativar Modo Automático'
          }
        >
          <Zap className={`w-3.5 h-3.5 ${config.enabled ? 'fill-slate-950' : 'text-amber-400'}`} />
          <span className="hidden sm:inline">Modo Auto</span>
          <span className="sm:hidden">Auto</span>
        </button>

        {/* Dropdown Options Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
            isOpen
              ? 'bg-slate-700 text-white'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
          }`}
          title="Configurar opções e estratégias do Modo Automático"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span className="text-[10px] font-semibold text-slate-400 hidden md:inline">
            {PRESET_LABELS[config.preset].label.split(' ')[0]}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-white' : ''
            }`}
          />
        </button>
      </div>

      {/* Popover / Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-black/70 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400">
                <Settings2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                  Opções do Modo Auto
                </h3>
                <p className="text-[11px] text-slate-400">
                  {config.enabled ? 'Ativo para seus turnos' : 'Desativado'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Master Enable/Disable Switch inside modal */}
          <div className="py-2.5 flex items-center justify-between border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${config.enabled ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className="text-xs font-semibold text-slate-200">Ativação Geral</span>
            </div>
            <button
              type="button"
              onClick={toggleMaster}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                config.enabled ? 'bg-amber-400' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-slate-950 transition-transform ${
                  config.enabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Preset Selector */}
          <div className="py-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Modo / Perfil Predefinido
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['basic', 'fluid', 'aggressive', 'full'] as AutoModePreset[]).map((preset) => {
                const meta = PRESET_LABELS[preset];
                const isSelected = config.preset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => selectPreset(preset)}
                    className={`flex items-center gap-1.5 p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-amber-400/60 shadow-sm shadow-amber-400/10 text-white'
                        : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="shrink-0">{meta.icon}</div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold leading-tight truncate">
                        {meta.label.split(' ')[0]}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate leading-tight">
                        {preset === 'fluid'
                          ? '6 + Gol + Dado'
                          : preset === 'aggressive'
                            ? 'Ataque + 6'
                            : preset === 'full'
                              ? '100% IA'
                              : 'Apenas óbvias'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Granular Checkboxes */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Opções Granulares
            </label>

            {/* Checkbox: Auto Dado */}
            <label className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:bg-slate-800/40 transition-colors cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.autoRollDice}
                onChange={(e) => updateOption('autoRollDice', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 accent-amber-400 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                  <Dices className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rolar Dado Automaticamente (Auto Dado)</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  Gira o dado sozinho no início de cada um dos seus turnos.
                </p>
              </div>
            </label>

            {/* Checkbox: Priorizar Saída da Base no 6 */}
            <label className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:bg-slate-800/40 transition-colors cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.exitBaseOnSix}
                onChange={(e) => updateOption('exitBaseOnSix', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 accent-amber-400 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                  <DoorOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Priorizar Saída da Base no 6</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  Ao tirar 6 com peças na base, sai imediatamente sem pausar para escolha.
                </p>
              </div>
            </label>

            {/* Checkbox: Priorizar Vitória (Gol) */}
            <label className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:bg-slate-800/40 transition-colors cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.prioritizeHome}
                onChange={(e) => updateOption('prioritizeHome', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 accent-amber-400 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Priorizar Chegar ao Fim (Gol)</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  Executa imediatamente qualquer movimento que finalize o peão na casa central.
                </p>
              </div>
            </label>

            {/* Checkbox: Priorizar Captura */}
            <label className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:bg-slate-800/40 transition-colors cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.prioritizeCapture}
                onChange={(e) => updateOption('prioritizeCapture', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 accent-amber-400 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                  <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                  <span>Priorizar Captura de Peça Inimiga</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  Se puder eliminar um peão adversário, ataca automaticamente.
                </p>
              </div>
            </label>

            {/* Checkbox: Piloto Total IA */}
            <label className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:bg-slate-800/40 transition-colors cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.fullAutoAi}
                onChange={(e) => updateOption('fullAutoAi', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 accent-amber-400 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Piloto Total por IA (Modo AFK)</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  Se ainda houver dúvida tática, a IA calcula e joga a melhor opção para você.
                </p>
              </div>
            </label>
          </div>

          {/* Footer note */}
          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
            <span>Salvo automaticamente</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              <span>Concluir</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
