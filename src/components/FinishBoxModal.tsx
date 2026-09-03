'use client';

import React, { useState, useEffect } from 'react';
import { BoxSession, Language } from '@/lib/types';
import { useTranslation } from '@/lib/translations';
import { soundManager } from '@/lib/sound';
import {
  CheckCircle2,
  Package,
  Clock,
  ArrowRight,
  Sparkles,
  MapPin
} from 'lucide-react';

interface FinishBoxModalProps {
  language: Language;
  completedBox: BoxSession;
  onNextBox: () => void;
}

export const FinishBoxModal: React.FC<FinishBoxModalProps> = ({
  language,
  completedBox,
  onNextBox,
}) => {
  const t = useTranslation(language);
  const [countdown, setCountdown] = useState<number>(8);

  useEffect(() => {
    soundManager.playFinishBoxSound();

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onNextBox();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onNextBox]);

  const handleNextClick = () => {
    soundManager.playBoxScanSound();
    onNextBox();
  };

  const totalQuantity = completedBox.items.reduce((sum, i) => sum + (i.count || 1), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#1f2232] border border-[#2e3347] rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 relative overflow-hidden">
        {/* Celebration Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-18 h-18 rounded-3xl bg-emerald-950/70 border border-emerald-800/80 flex items-center justify-center text-emerald-400 mb-4 shadow-sm animate-bounce-subtle">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="inline-flex items-center space-x-1.5 text-xs font-extrabold tracking-wider uppercase text-emerald-400 bg-emerald-950/70 px-3 py-1 rounded-full border border-emerald-800/80 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>GOOGLE SHEETS SYNCED</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t.boxFinishedTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm">
            {t.boxFinishedSubtitle}
          </p>
        </div>

        {/* Summary Card */}
        <div className="bg-[#191b26] border border-[#2e3347] rounded-2xl p-4 sm:p-5 space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">{t.colBox}:</span>
            <span className="font-mono font-black text-xl text-white">
              {completedBox.boxNumber}
            </span>
          </div>

          {completedBox.targetBox && completedBox.targetBox !== '—' && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400">{t.colTargetBox}:</span>
              <span className="font-mono font-black text-base text-indigo-300 bg-indigo-950 px-2.5 py-0.5 rounded-lg border border-indigo-700">
                {completedBox.targetBox}
              </span>
            </div>
          )}

          {completedBox.pvz && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400">{t.pvz}:</span>
              <span className="font-bold text-sm text-indigo-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>{completedBox.pvz}</span>
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">{t.itemsCountLabel}:</span>
            <span className="font-mono font-black text-lg text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-800/80">
              {totalQuantity} {language === 'uz' ? 'dona' : 'шт.'} ({completedBox.items.length} {language === 'uz' ? 'xil' : 'вида'})
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">{t.timeLabel}:</span>
            <span className="text-xs font-mono font-bold text-slate-400 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{completedBox.endTime || completedBox.startTime}</span>
            </span>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={handleNextClick}
          className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white text-base sm:text-lg font-black rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
        >
          <span>{t.nextBoxBtn}</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Auto Next Timer Bar */}
        <div className="mt-4 flex flex-col items-center">
          <p className="text-[11px] font-bold text-slate-400">
            <span className="font-mono text-indigo-400">{countdown}</span> {t.autoNextHint}
          </p>
          <div className="w-full bg-[#191b26] rounded-full h-1.5 mt-1.5 overflow-hidden border border-[#2e3347]">
            <div
              className="bg-indigo-500 h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${(countdown / 8) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
