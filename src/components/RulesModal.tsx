import React from 'react';
import { X, BookOpen, Shield, Dices, Swords, Trophy, Sparkles } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Regras Oficiais do Ludo</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 py-4 text-sm text-slate-300">
          <div className="flex gap-3">
            <div className="mt-1 text-amber-400"><Dices className="w-5 h-5" /></div>
            <div>
              <h3 className="font-bold text-white mb-0.5">1. Sair da Base e Tirar 6</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Para tirar um peão da base para a casa inicial de saída, você precisa rolar um <strong>6</strong> no dado.
                Tirar 6 concede imediatamente uma <strong>jogada extra</strong>! Três números 6 seguidos passam a vez para o próximo jogador.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="mt-1 text-rose-400"><Swords className="w-5 h-5" /></div>
            <div>
              <h3 className="font-bold text-white mb-0.5">2. Capturas</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Se você parar exatamente na mesma casa de um peão adversário, ele é <strong>capturado e volta para a base</strong>!
                Além disso, capturar um peão concede a você um <strong>turno bônus</strong>.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="mt-1 text-cyan-400"><Shield className="w-5 h-5" /></div>
            <div>
              <h3 className="font-bold text-white mb-0.5">3. Casas Seguras (Estrelas & Saídas)</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                As casas com <strong>Estrela</strong> e as casas de saída de cada cor são áreas protegidas. Nenhum peão pode ser capturado dentro de uma casa segura.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="mt-1 text-emerald-400"><Sparkles className="w-5 h-5" /></div>
            <div>
              <h3 className="font-bold text-white mb-0.5">4. Reta Final e Chegada Exata</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Após dar a volta completa de 51 casas no tabuleiro, o peão entra na sua <strong>Reta Final colorida</strong> exclusiva (onde nenhum inimigo pode alcançá-lo).
                Para entrar no triângulo central final, é exigido o <strong>número exato</strong> no dado!
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="mt-1 text-yellow-400"><Trophy className="w-5 h-5" /></div>
            <div>
              <h3 className="font-bold text-white mb-0.5">5. Vitória</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                O primeiro jogador a levar seus <strong>4 peões</strong> para o centro é consagrado o grande Campeão (1º Lugar)! A partida continua para definir 2º e 3º lugares.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg cursor-pointer"
          >
            Entendido, Vamos Jogar!
          </button>
        </div>
      </div>
    </div>
  );
};
