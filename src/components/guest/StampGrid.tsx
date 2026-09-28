'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Gift, Sparkles, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StampGridProps {
  currentStamps: number; // Например, 3
  targetStamps?: number; // По умолчанию 6
  rewardTitle?: string;
  onRewardUnlocked?: () => void;
}

export const StampGrid: React.FC<StampGridProps> = ({
  currentStamps,
  targetStamps = 6,
  rewardTitle = 'Бесплатный напиток',
  onRewardUnlocked,
}) => {
  const isFull = currentStamps >= targetStamps;
  const prevStampsRef = useRef(currentStamps);

  // Запуск праздничного конфетти при заполнении всех штампов
  useEffect(() => {
    if (isFull && prevStampsRef.current < targetStamps) {
      if (onRewardUnlocked) onRewardUnlocked();

      // Двойной залп конфетти с двух сторон экрана
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999,
      };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
        colors: ['#F59E0B', '#D97706', '#FBBF24'],
      });
      fire(0.2, {
        spread: 60,
        colors: ['#FFFFFF', '#F59E0B', '#FDE68A'],
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
        colors: ['#D97706', '#B45309', '#FCD34D'],
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    }

    prevStampsRef.current = currentStamps;
  }, [currentStamps, targetStamps, isFull, onRewardUnlocked]);

  // Генерация слотов штампов
  const stampSlots = Array.from({ length: targetStamps }, (_, i) => {
    const stampNumber = i + 1;
    const isEarned = i < currentStamps;
    const isRewardSlot = stampNumber === targetStamps;
    const isNext = i === currentStamps;

    return {
      index: i,
      number: stampNumber,
      isEarned,
      isRewardSlot,
      isNext,
    };
  });

  return (
    <div className="w-full select-none">
      {/* Сетка кружочков (для 6 штампов — 2 ряда по 3 кружка) */}
      <div className="grid grid-cols-3 gap-3.5 sm:gap-4.5 p-5 rounded-3xl bg-stone-900/90 border border-stone-800/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Мягкое фоновое свечение */}
        <div className="absolute -top-10 -left-10 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />

        {stampSlots.map((slot) => {
          return (
            <div key={slot.number} className="flex flex-col items-center justify-center">
              <motion.div
                layout
                initial={false}
                animate={{
                  scale: slot.isEarned ? [0.92, 1.06, 1] : slot.isNext ? [1, 1.04, 1] : 1,
                  transition: {
                    duration: slot.isNext ? 2 : 0.4,
                    repeat: slot.isNext ? Infinity : 0,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                  },
                }}
                className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-full flex flex-col items-center justify-center transition-colors duration-300 ${
                  slot.isRewardSlot
                    ? slot.isEarned
                      ? 'bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-stone-950 shadow-lg shadow-amber-500/30 ring-4 ring-amber-400/40'
                      : 'bg-stone-850/80 border-2 border-dashed border-amber-500/40 text-amber-400/80 hover:border-amber-400'
                    : slot.isEarned
                    ? 'bg-gradient-to-br from-amber-500/25 via-amber-600/15 to-transparent border-2 border-amber-500 text-amber-400 shadow-md shadow-amber-950/40'
                    : slot.isNext
                    ? 'bg-stone-800/80 border-2 border-dashed border-amber-500/50 text-stone-400 ring-4 ring-amber-500/10'
                    : 'bg-stone-800/40 border border-stone-800 text-stone-600'
                }`}
              >
                {/* Содержимое ячейки со штампом */}
                <AnimatePresence mode="wait">
                  {slot.isEarned ? (
                    <motion.div
                      key={`earned-${slot.number}`}
                      initial={{ scale: 0, rotate: -25, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 18,
                      }}
                      className="flex flex-col items-center justify-center relative"
                    >
                      {slot.isRewardSlot ? (
                        <>
                          <Gift className="w-8 h-8 stroke-[2.2] text-stone-950 drop-shadow-sm" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-stone-950 mt-0.5">
                            Приз!
                          </span>
                          <Sparkles className="w-3.5 h-3.5 absolute -top-2 -right-2 text-stone-950 animate-spin" />
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                            <Coffee className="w-6 h-6 stroke-[2.2]" />
                          </div>
                          {/* Маленький бейдж галочки */}
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-stone-950 shadow-sm">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`empty-${slot.number}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center"
                    >
                      {slot.isRewardSlot ? (
                        <div className="flex flex-col items-center">
                          <Gift className="w-7 h-7 stroke-[1.8] text-amber-400/70" />
                          <span className="text-[9px] font-bold text-amber-400/80 tracking-tight mt-0.5">
                            Подарок
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center opacity-40">
                          <Coffee className="w-6 h-6 stroke-[1.5]" />
                          <span className="text-[11px] font-medium text-stone-400 mt-0.5">
                            {slot.number}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Информационный статус-бар */}
      <div className="mt-4 text-center">
        {isFull ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-lg shadow-amber-950/30"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span>Поздравляем! Карточка заполнена — получите {rewardTitle}!</span>
          </motion.div>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-xs text-stone-400 font-medium">
            <span>До бесплатного кофе осталось:</span>
            <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              {targetStamps - currentStamps}{' '}
              {targetStamps - currentStamps === 1 ? 'штамп' : 'штампа'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
