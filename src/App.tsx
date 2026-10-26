import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  BookOpen,
  FastForward,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import type {
  GameLogEntry,
  MoveOption,
  Player,
  PlayerColor,
  PlayerConfig,
} from './types/ludo';
import {
  checkCapture,
  createInitialPlayers,
  getAnimationPath,
  getValidMoves,
} from './engine/ludoEngine';
import { selectBestAIMove } from './engine/aiStrategy';
import { getTokenCoord, TOTAL_STEPS_TO_GOAL } from './constants/boardPath';
import { COLOR_THEMES } from './constants/colors';
import { soundFX } from './audio/soundEffects';
import { SetupScreen } from './components/SetupScreen';
import { LudoBoard } from './components/LudoBoard';
import { DiceRoller } from './components/DiceRoller';
import { PlayerCard } from './components/PlayerCard';
import { GameHistory } from './components/GameHistory';
import { RulesModal } from './components/RulesModal';
import { VictoryModal } from './components/VictoryModal';

export function App() {
  const [phase, setPhase] = useState<'setup' | 'playing' | 'gameover'>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState<number>(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [canRoll, setCanRoll] = useState<boolean>(true);
  const [consecutiveSixes, setConsecutiveSixes] = useState<number>(0);
  const [validMoves, setValidMoves] = useState<MoveOption[]>([]);
  const [logs, setLogs] = useState<GameLogEntry[]>([]);
  const [, setWinners] = useState<PlayerColor[]>([]);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundFX.isMuted);
  const [speed, setSpeed] = useState<number>(1); // 1x, 1.5x, 2x

  // Token being animated along the board
  const [animatingToken, setAnimatingToken] = useState<{
    color: PlayerColor;
    tokenId: number;
    coord: { row: number; col: number };
  } | null>(null);

  const isAIActing = useRef<boolean>(false);
  const animationInProgress = useRef<boolean>(false);

  const addLog = useCallback((
    color: PlayerColor,
    playerName: string,
    message: string,
    type: GameLogEntry['type']
  ) => {
    setLogs((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        color,
        playerName,
        message,
        type,
      },
    ]);
  }, []);

  const toggleMute = () => {
    soundFX.isMuted = !soundFX.isMuted;
    setIsMuted(soundFX.isMuted);
  };

  const toggleSpeed = () => {
    setSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1));
  };

  const handleStartGame = (configs: PlayerConfig[]) => {
    const initPlayers = createInitialPlayers(configs);
    setPlayers(initPlayers);
    setCurrentPlayerIdx(0);
    setDiceValue(null);
    setIsRolling(false);
    setCanRoll(true);
    setConsecutiveSixes(0);
    setValidMoves([]);
    setWinners([]);
    setLogs([]);
    setPhase('playing');
    addLog(
      initPlayers[0].color,
      initPlayers[0].name,
      'A partida começou! Boa sorte a todos.',
      'turn'
    );
  };

  const currentPlayer = players[currentPlayerIdx];

  // Advance turn to next active player
  const advanceToNextPlayer = useCallback((currentList: Player[], currentIdx: number) => {
    let nextIdx = (currentIdx + 1) % currentList.length;
    let attempts = 0;

    // Skip players who have already completed all 4 tokens
    while (currentList[nextIdx].tokensHome === 4 && attempts < currentList.length) {
      nextIdx = (nextIdx + 1) % currentList.length;
      attempts++;
    }

    // Check if game is complete (only 1 player remaining without finishing)
    const unfinished = currentList.filter((p) => p.tokensHome < 4);
    if (unfinished.length <= 1 && currentList.length > 1) {
      setPhase('gameover');
      return;
    }

    setCurrentPlayerIdx(nextIdx);
    setDiceValue(null);
    setValidMoves([]);
    setConsecutiveSixes(0);
    setCanRoll(true);
    isAIActing.current = false;
  }, []);

  // Execute a selected move with step-by-step animation
  const executeMove = useCallback((move: MoveOption) => {
    if (animationInProgress.current) return;
    animationInProgress.current = true;
    setValidMoves([]);

    const player = players[currentPlayerIdx];
    const path = getAnimationPath(player.color, move.tokenId, move.fromStep, move.toStep);

    let stepIndex = 0;
    const stepDuration = Math.max(50, 110 / speed);

    const stepInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < path.length) {
        setAnimatingToken({
          color: player.color,
          tokenId: move.tokenId,
          coord: path[stepIndex],
        });
        soundFX.playMoveStep();
      } else {
        clearInterval(stepInterval);
        setAnimatingToken(null);
        animationInProgress.current = false;

        // Apply Move State Updates
        let extraTurn = false;
        let captureOccurred = false;
        let tokenFinished = false;

        const updated = players.map((p, pIdx) => {
          if (pIdx !== currentPlayerIdx) return p;

          const updatedTokens = p.tokens.map((tok) => {
            if (tok.id !== move.tokenId) return tok;

            const endCoord = getTokenCoord(p.color, tok.id, move.toStep);
            let newState = tok.state;
            if (move.toStep === TOTAL_STEPS_TO_GOAL) {
              newState = 'home';
              tokenFinished = true;
            } else if (move.toStep > 50) {
              newState = 'homeStretch';
            } else {
              newState = 'track';
            }

            return {
              ...tok,
              stepCount: move.toStep,
              state: newState,
              row: endCoord.row,
              col: endCoord.col,
            };
          });

          const tokensHome = updatedTokens.filter((t) => t.state === 'home').length;
          return {
            ...p,
            tokens: updatedTokens,
            tokensHome,
          };
        });

        // Check Opponent Capture
        const captureCheck = checkCapture(player.color, move.toStep, updated);
        if (captureCheck.canCapture && captureCheck.capturedToken) {
          captureOccurred = true;
          extraTurn = true;
          const oppPlayerIdx = captureCheck.capturedToken.playerIndex;
          const oppTokenId = captureCheck.capturedToken.tokenId;
          const oppColor = updated[oppPlayerIdx].color;
          const baseCoord = getTokenCoord(oppColor, oppTokenId, -1);

          updated[oppPlayerIdx] = {
            ...updated[oppPlayerIdx],
            tokens: updated[oppPlayerIdx].tokens.map((tok) => {
              if (tok.id === oppTokenId) {
                return {
                  ...tok,
                  state: 'base',
                  stepCount: -1,
                  row: baseCoord.row,
                  col: baseCoord.col,
                };
              }
              return tok;
            }),
          };

          soundFX.playCapture();
          addLog(
            player.color,
            player.name,
            `⚔️ Capturou o peão #${oppTokenId + 1} de ${updated[oppPlayerIdx].name}! Ganhou turno extra!`,
            'capture'
          );
        }

        // Handle Token Entering Home
        if (tokenFinished) {
          soundFX.playHomeGoal();
          addLog(
            player.color,
            player.name,
            `✨ Peão #${move.tokenId + 1} chegou à Meta Final!`,
            'home'
          );
          extraTurn = true;
        }

        // Extra turn for rolling a 6
        if (diceValue === 6 && !tokenFinished && !captureOccurred) {
          extraTurn = true;
          addLog(
            player.color,
            player.name,
            `Rolou um 6! Tem direito a mais uma jogada.`,
            'extraTurn'
          );
        }

        const isPlayerFinished = updated[currentPlayerIdx].tokensHome === 4;

        // If this player completed all 4 tokens: GAME WON!
        if (isPlayerFinished) {
          extraTurn = false; // Never grant extra turn when all tokens are already finished!

          const currentRank = updated.filter((p) => p.rank).length + 1;
          updated[currentPlayerIdx].rank = currentRank;
          addLog(
            player.color,
            player.name,
            `🏆 ${player.name} completou todos os 4 peões e VENCEU A PARTIDA!`,
            'win'
          );

          // Rank all remaining players based on tokens home and progress
          let nextRank = currentRank + 1;
          const remaining = updated
            .map((p, idx) => ({ p, idx }))
            .filter(({ p }) => !p.rank)
            .sort((a, b) => {
              if (b.p.tokensHome !== a.p.tokensHome) {
                return b.p.tokensHome - a.p.tokensHome;
              }
              const sumA = a.p.tokens.reduce((acc, t) => acc + Math.max(0, t.stepCount), 0);
              const sumB = b.p.tokens.reduce((acc, t) => acc + Math.max(0, t.stepCount), 0);
              return sumB - sumA;
            });

          remaining.forEach(({ idx }) => {
            updated[idx].rank = nextRank++;
          });

          setPlayers(updated);

          // Trigger victory modal celebration
          setTimeout(() => {
            setPhase('gameover');
          }, 1100 / speed);
          return;
        }

        setPlayers(updated);

        // Determine next turn
        setTimeout(() => {
          if (extraTurn && consecutiveSixes < 3) {
            setCanRoll(true);
            setDiceValue(null);
            isAIActing.current = false;
          } else {
            advanceToNextPlayer(updated, currentPlayerIdx);
          }
        }, 400 / speed);
      }
    }, stepDuration);
  }, [currentPlayerIdx, players, speed, diceValue, consecutiveSixes, addLog, advanceToNextPlayer]);

  // Roll Dice Action
  const handleRollDice = useCallback(() => {
    const player = players[currentPlayerIdx];
    if (!canRoll || isRolling || animationInProgress.current || !player || player.tokensHome === 4) return;

    setCanRoll(false);
    setIsRolling(true);
    soundFX.playDiceRoll();

    // Dice rolling animation
    setTimeout(() => {
      const rolled = Math.floor(Math.random() * 6) + 1;
      setDiceValue(rolled);
      setIsRolling(false);

      const player = players[currentPlayerIdx];
      const newConsecutive = rolled === 6 ? consecutiveSixes + 1 : 0;
      setConsecutiveSixes(newConsecutive);

      addLog(player.color, player.name, `Rolou [${rolled}] no dado.`, 'roll');

      // Rule: Three 6s in a row passes turn immediately
      if (newConsecutive === 3) {
        addLog(
          player.color,
          player.name,
          `Tirou três 6 seguidos! Perdeu a vez por excesso de sorte.`,
          'turn'
        );
        setTimeout(() => {
          advanceToNextPlayer(players, currentPlayerIdx);
        }, 1000 / speed);
        return;
      }

      // Compute valid moves
      const moves = getValidMoves(player, rolled, players);

      if (moves.length === 0) {
        addLog(
          player.color,
          player.name,
          `Sem lances possíveis com [${rolled}]. Passando a vez...`,
          'turn'
        );
        setTimeout(() => {
          advanceToNextPlayer(players, currentPlayerIdx);
        }, 900 / speed);
      } else {
        setValidMoves(moves);

        // If AI, trigger AI decision automatically after a brief human-friendly thinking pause
        if (player.type === 'ai') {
          setTimeout(() => {
            const bestMove = selectBestAIMove(moves, player, players);
            if (bestMove) {
              executeMove(bestMove);
            }
          }, 650 / speed);
        }
      }
    }, 450);
  }, [canRoll, isRolling, players, currentPlayerIdx, consecutiveSixes, speed, addLog, advanceToNextPlayer, executeMove]);

  // Handle Token Click from Human Player
  const handleTokenClick = (tokenId: number) => {
    if (!currentPlayer || currentPlayer.type === 'ai') return;
    const move = validMoves.find((m) => m.tokenId === tokenId);
    if (move) {
      executeMove(move);
    }
  };

  // AI Turn Auto-Trigger
  useEffect(() => {
    if (phase !== 'playing') return;
    if (!currentPlayer) return;

    if (
      currentPlayer.type === 'ai' &&
      canRoll &&
      !isRolling &&
      !animationInProgress.current &&
      !isAIActing.current
    ) {
      isAIActing.current = true;
      const timer = setTimeout(() => {
        handleRollDice();
      }, 700 / speed);

      return () => clearTimeout(timer);
    }
  }, [phase, currentPlayer, canRoll, isRolling, speed, handleRollDice]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* 1. Header Bar */}
      <header className="w-full bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-4 py-3 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {phase === 'playing' && (
            <button
              onClick={() => setPhase('setup')}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Voltar para o Menu"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 via-amber-500 to-cyan-500 flex items-center justify-center font-black text-slate-950 text-sm shadow-md">
              L
            </div>
            <span className="font-black text-lg tracking-tight text-white hidden sm:inline">
              LUDO MASTER
            </span>
          </div>
        </div>

        {/* Status / Quick Action Controls */}
        <div className="flex items-center gap-2">
          {phase === 'playing' && (
            <>
              {/* Animation Speed Toggle */}
              <button
                onClick={toggleSpeed}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                title="Velocidade da animação"
              >
                <FastForward className="w-3.5 h-3.5 text-cyan-400" />
                <span>{speed}x</span>
              </button>

              {/* Reset Match Button */}
              <button
                onClick={() => handleStartGame(players)}
                className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Reiniciar partida"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Ativar som' : 'Desativar som'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* Rules Button */}
          <button
            onClick={() => setIsRulesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Regras</span>
          </button>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center">
        {phase === 'setup' ? (
          <SetupScreen
            onStartGame={handleStartGame}
            onOpenRules={() => setIsRulesOpen(true)}
          />
        ) : (
          <div className="w-full max-w-7xl mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Side: Player Cards (2 on top or left) */}
            <div className="lg:col-span-3 space-y-3 order-2 lg:order-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 px-1">
                Jogadores
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {players.map((p, idx) => (
                  <PlayerCard
                    key={p.id}
                    player={p}
                    isCurrentTurn={idx === currentPlayerIdx}
                    canRoll={canRoll}
                    diceValue={diceValue}
                  />
                ))}
              </div>
            </div>

            {/* Center: The Board & Interactive Dice Area */}
            <div className="lg:col-span-6 flex flex-col items-center gap-5 order-1 lg:order-2">
              <LudoBoard
                players={players}
                validMoves={validMoves}
                onTokenClick={handleTokenClick}
                animatingToken={animatingToken}
              />

              {/* Bottom Floating Control Bar */}
              {currentPlayer && (
                <div className="w-full max-w-[620px] bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl flex items-center justify-between gap-4 backdrop-blur-md">
                  {/* Current Player Prompt */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-md text-base"
                      style={{ backgroundColor: COLOR_THEMES[currentPlayer.color].primary }}
                    >
                      {currentPlayer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-medium">
                        Vez de Jogar:
                      </div>
                      <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                        <span>{currentPlayer.name}</span>
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: COLOR_THEMES[currentPlayer.color].primary }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dice Roller */}
                  <DiceRoller
                    value={diceValue}
                    isRolling={isRolling}
                    canRoll={canRoll}
                    color={currentPlayer.color}
                    onRoll={handleRollDice}
                    isAI={currentPlayer.type === 'ai'}
                  />
                </div>
              )}
            </div>

            {/* Right Side: Game History & Live Feed */}
            <div className="lg:col-span-3 space-y-3 order-3">
              <GameHistory logs={logs} />

              {/* Quick Strategy Tip Card */}
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-4 text-xs text-slate-400 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-slate-200 mb-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Dica Tática</span>
                </div>
                As casas com <strong>Estrela</strong> e as de saída protegem seus peões de serem capturados. A IA prioriza eliminar adversários desprotegidos e avançar para o centro!
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. Modals */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      <VictoryModal
        isOpen={phase === 'gameover'}
        players={players}
        onPlayAgain={() => handleStartGame(players)}
        onReturnToMenu={() => setPhase('setup')}
      />
    </div>
  );
}

export default App;
