/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Trophy, RefreshCw, Info, ChevronRight, Zap, Languages } from 'lucide-react';

// --- Types ---
interface Color {
  h: number;
  s: number;
  l: number;
}

interface GameState {
  score: number;
  timeLeft: number;
  isActive: boolean;
  level: number;
  gridSize: number;
  targetIndex: number;
  baseColor: Color;
  diffColor: Color;
  isGameOver: boolean;
  bestScore: number;
  difficulty: Difficulty;
}

type Language = 'en' | 'zh';
type Difficulty = 'easy' | 'medium' | 'hell';

interface DifficultyConfig {
  baseDiff: number;
  scaling: number;
  timeBonus: number;
}

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultyConfig> = {
  easy: { baseDiff: 25, scaling: 1.5, timeBonus: 1.5 },
  medium: { baseDiff: 15, scaling: 1.2, timeBonus: 1.0 },
  hell: { baseDiff: 8, scaling: 1.0, timeBonus: 0.5 },
};

// --- Translations ---
const translations = {
  en: {
    title: "Chromatic Vision",
    subtitle: "Art Student Challenge",
    best: "Best Score",
    current: "Current",
    level: "Level",
    time: "Time",
    startTitle: "Test your perception",
    startDesc: "Find the block with the slightly different shade. Difficulty increases as you progress.",
    startBtn: "Start Challenge",
    gameOver: "Challenge Complete",
    reached: "You reached level",
    finalScore: "Final Score:",
    tryAgain: "Try Again",
    howItWorks: "How it works",
    step1: "Identify the unique color block in the grid.",
    step2: "Correct picks add time; wrong picks penalize you.",
    step3: "Color similarity increases with level (Fixed 5x5 grid).",
    analysis: "Chromatic Analysis",
    delta: "Current Delta (ΔL)",
    base: "Base",
    target: "Target",
    note: "* Art students typically perceive differences as low as 1-2% in lightness. Most untrained eyes struggle below 5%.",
    footer: "Precision Visual Training Tool © 2024",
    easy: "Easy",
    medium: "Medium",
    hell: "Hell",
    selectDiff: "Select Difficulty"
  },
  zh: {
    title: "色彩视觉挑战",
    subtitle: "艺术生专项训练",
    best: "最高分",
    current: "当前得分",
    level: "关卡",
    time: "剩余时间",
    startTitle: "测试你的色彩感知力",
    startDesc: "在色块矩阵中找出那个颜色略有不同的色块。难度会随关卡递增。",
    startBtn: "开始挑战",
    gameOver: "挑战结束",
    reached: "你达到了第",
    finalScore: "最终得分：",
    tryAgain: "再试一次",
    howItWorks: "游戏规则",
    step1: "在网格中找出唯一的异色块。",
    step2: "选对增加时间，选错会扣除惩罚时间。",
    step3: "颜色差异会随关卡缩小（固定 5x5 网格）。",
    analysis: "色彩分析",
    delta: "当前亮度差 (ΔL)",
    base: "基准色",
    target: "目标色",
    note: "* 艺术生通常能察觉到 1-2% 的亮度差异。未经训练的眼睛通常难以察觉 5% 以下的差异。",
    footer: "高精度视觉训练工具 © 2024",
    easy: "简单",
    medium: "中等",
    hell: "地狱",
    selectDiff: "选择难度"
  }
};

// --- Constants ---
const INITIAL_TIME = 30;
const BASE_DIFFICULTY = 15; // Initial L difference (Reduced from 25)

export default function App() {
  const [lang, setLang] = useState<Language>('zh');
  const [state, setState] = useState<GameState>({
    score: 0,
    timeLeft: INITIAL_TIME,
    isActive: false,
    level: 1,
    gridSize: 5,
    targetIndex: -1,
    baseColor: { h: 0, s: 0, l: 0 },
    diffColor: { h: 0, s: 0, l: 0 },
    isGameOver: false,
    bestScore: parseInt(localStorage.getItem('chroma_best') || '0'),
    difficulty: 'medium',
  });

  const t = translations[lang];
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Helpers ---
  const generateLevel = useCallback((level: number, difficulty: Difficulty) => {
    const gridSize = 5; 
    const h = Math.floor(Math.random() * 360);
    const s = Math.floor(Math.random() * 40) + 40; 
    const l = Math.floor(Math.random() * 40) + 30; 

    const config = DIFFICULTY_SETTINGS[difficulty];
    const diff = Math.max(1, config.baseDiff - Math.floor(level / config.scaling));
    
    const isLighter = Math.random() > 0.5;
    const diffL = isLighter ? l + diff : l - diff;

    const targetIndex = Math.floor(Math.random() * (gridSize * gridSize));

    return {
      gridSize,
      targetIndex,
      baseColor: { h, s, l },
      diffColor: { h, s, l: diffL },
    };
  }, []);

  const startGame = (difficulty: Difficulty) => {
    const initialLevel = generateLevel(1, difficulty);
    setState(prev => ({
      ...prev,
      ...initialLevel,
      score: 0,
      level: 1,
      timeLeft: INITIAL_TIME,
      isActive: true,
      isGameOver: false,
      difficulty,
    }));
  };

  const handleBlockClick = (index: number) => {
    if (!state.isActive || state.isGameOver) return;

    if (index === state.targetIndex) {
      const nextLevel = state.level + 1;
      const levelData = generateLevel(nextLevel, state.difficulty);
      
      setState(prev => {
        const newScore = prev.score + 1;
        const config = DIFFICULTY_SETTINGS[prev.difficulty];
        const newTime = Math.min(prev.timeLeft + config.timeBonus, INITIAL_TIME);
        
        return {
          ...prev,
          ...levelData,
          score: newScore,
          level: nextLevel,
          timeLeft: newTime,
        };
      });
    } else {
      setState(prev => ({
        ...prev,
        timeLeft: Math.max(0, prev.timeLeft - 3),
      }));
    }
  };

  // --- Effects ---
  useEffect(() => {
    if (state.isActive && state.timeLeft > 0 && !state.isGameOver) {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.timeLeft <= 0.1) {
            if (timerRef.current) clearInterval(timerRef.current);
            const newBest = Math.max(prev.score, prev.bestScore);
            localStorage.setItem('chroma_best', newBest.toString());
            return { ...prev, timeLeft: 0, isActive: false, isGameOver: true, bestScore: newBest };
          }
          return { ...prev, timeLeft: prev.timeLeft - 0.1 };
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isActive, state.isGameOver]);

  const colorToCss = (c: Color) => `hsl(${c.h}, ${c.s}%, ${c.l}%)`;

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-sans selection:bg-[#5A5A40] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#1A1A1A]/10 p-6 flex justify-between items-center max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-medium tracking-tight flex items-center gap-2">
              <Zap className="w-6 h-6 text-[#5A5A40]" />
              {t.title}
            </h1>
            <p className="text-xs text-[#1A1A1A]/50 uppercase tracking-widest mt-1">{t.subtitle}</p>
          </div>
          <button 
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            className="p-2 hover:bg-[#1A1A1A]/5 rounded-full transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <Languages className="w-4 h-4" />
            {lang === 'en' ? '中文' : 'EN'}
          </button>
        </div>
        <div className="flex gap-6 items-center">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-tighter opacity-50">{t.best}</p>
            <p className="text-xl font-mono leading-none">{state.bestScore}</p>
          </div>
          <div className="h-8 w-px bg-[#1A1A1A]/10" />
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-tighter opacity-50">{t.current}</p>
            <p className="text-xl font-mono leading-none">{state.score}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 flex flex-col items-center">
        {/* Stats Bar */}
        <div className="w-full flex justify-between items-center mb-8 bg-white rounded-2xl p-4 shadow-sm border border-[#1A1A1A]/5">
          <div className="flex items-center gap-3">
            <Timer className={`w-5 h-5 ${state.timeLeft < 5 ? 'text-red-500 animate-pulse' : 'text-[#5A5A40]'}`} />
            <div className="w-32 h-2 bg-[#F5F5F0] rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${state.timeLeft < 5 ? 'bg-red-500' : 'bg-[#5A5A40]'}`}
                initial={{ width: '100%' }}
                animate={{ width: `${(state.timeLeft / INITIAL_TIME) * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <span className="font-mono text-sm w-12">{state.timeLeft.toFixed(1)}s</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="opacity-50">{t.level}</span>
            <span className="bg-[#1A1A1A] text-white px-2 py-0.5 rounded text-xs">{state.level}</span>
          </div>
        </div>

        {/* Game Area */}
        <div className="relative w-full aspect-square max-w-[500px] bg-white rounded-3xl p-4 shadow-xl border border-[#1A1A1A]/5 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {!state.isActive && !state.isGameOver ? (
              <motion.div 
                key="start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center space-y-6 w-full px-4"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-serif italic">{t.startTitle}</h2>
                  <p className="text-sm text-[#1A1A1A]/60 max-w-xs mx-auto">
                    {t.startDesc}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">{t.selectDiff}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'medium', 'hell'] as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => startGame(d)}
                        className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                          d === 'hell' ? 'hover:bg-red-500 hover:text-white border-red-500/20' : 
                          d === 'medium' ? 'hover:bg-[#5A5A40] hover:text-white border-[#5A5A40]/20' :
                          'hover:bg-emerald-600 hover:text-white border-emerald-600/20'
                        }`}
                      >
                        {t[d]}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : state.isGameOver ? (
              <motion.div 
                key="over"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8"
              >
                <div className="space-y-2">
                  <Trophy className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                  <h2 className="text-4xl font-serif italic">{t.gameOver}</h2>
                  <p className="text-lg">{t.reached} <span className="font-bold">{state.level}</span> {lang === 'zh' ? '关' : ''}</p>
                  <div className="flex justify-center gap-2 items-center">
                    <span className="text-xs uppercase tracking-widest opacity-40">{t[state.difficulty]}</span>
                    <span className="h-4 w-px bg-[#1A1A1A]/10" />
                    <p className="text-sm opacity-50">{t.finalScore} {state.score}</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setState(prev => ({ ...prev, isGameOver: false, isActive: false }))}
                    className="bg-[#5A5A40] text-white px-8 py-4 rounded-full font-medium hover:bg-[#4A4A30] transition-colors flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t.tryAgain}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-2 w-full h-full"
                style={{ 
                  gridTemplateColumns: `repeat(${state.gridSize}, 1fr)`,
                  gridTemplateRows: `repeat(${state.gridSize}, 1fr)`
                }}
              >
                {Array.from({ length: state.gridSize * state.gridSize }).map((_, i) => (
                  <motion.button
                    key={`${state.level}-${i}`}
                    whileHover={{ scale: 0.98 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleBlockClick(i)}
                    className="w-full h-full rounded-lg shadow-sm transition-transform cursor-pointer"
                    style={{ 
                      backgroundColor: i === state.targetIndex ? colorToCss(state.diffColor) : colorToCss(state.baseColor)
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Section */}
        <div className="mt-12 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/50 p-6 rounded-2xl border border-[#1A1A1A]/5">
            <h3 className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" />
              {t.howItWorks}
            </h3>
            <ul className="text-sm space-y-3 text-[#1A1A1A]/70">
              <li className="flex gap-3">
                <span className="font-mono text-[10px] bg-[#1A1A1A]/5 px-1.5 py-0.5 rounded h-fit">01</span>
                <span>{t.step1}</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-[10px] bg-[#1A1A1A]/5 px-1.5 py-0.5 rounded h-fit">02</span>
                <span>{t.step2}</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-[10px] bg-[#1A1A1A]/5 px-1.5 py-0.5 rounded h-fit">03</span>
                <span>{t.step3}</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/50 p-6 rounded-2xl border border-[#1A1A1A]/5">
            <h3 className="text-xs uppercase tracking-widest font-bold mb-4">{t.analysis}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="opacity-50">{t.delta}</span>
                <span className="font-mono">
                  {Math.abs(state.baseColor.l - state.diffColor.l).toFixed(0)}%
                </span>
              </div>
              <div className="flex gap-2">
                <div 
                  className="flex-1 h-12 rounded-lg border border-[#1A1A1A]/10 flex items-center justify-center text-[10px] font-mono"
                  style={{ backgroundColor: colorToCss(state.baseColor) }}
                >
                  <span className="bg-white/80 px-1 rounded">{t.base}</span>
                </div>
                <div 
                  className="flex-1 h-12 rounded-lg border border-[#1A1A1A]/10 flex items-center justify-center text-[10px] font-mono"
                  style={{ backgroundColor: colorToCss(state.diffColor) }}
                >
                  <span className="bg-white/80 px-1 rounded">{t.target}</span>
                </div>
              </div>
              <p className="text-[10px] leading-relaxed opacity-40 italic">
                {t.note}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-[#1A1A1A]/5 p-8 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-30">
          {t.footer}
        </p>
      </footer>
    </div>
  );
}
