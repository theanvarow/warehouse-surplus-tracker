'use client';

import React, { useState } from 'react';
import { Language, ShiftId, ShiftPeriod } from '@/lib/types';
import { soundManager } from '@/lib/sound';
import { CheckCircle2 } from 'lucide-react';

interface ShiftSelectorProps {
  language: Language;
  onSelectShift: (shift: ShiftId, period: ShiftPeriod) => void;
  currentShift?: ShiftId;
}

interface ShiftCardItem {
  id: ShiftId;
  titleUz: string;
  titleRu: string;
}

const SHIFT_CARDS: ShiftCardItem[] = [
  { id: '1', titleUz: '1-Smena', titleRu: '1-я Смена' },
  { id: '2', titleUz: '2-Smena', titleRu: '2-я Смена' },
  { id: '3', titleUz: '3-Smena', titleRu: '3-я Смена' },
  { id: '4', titleUz: '4-Smena', titleRu: '4-я Смена' },
];

export const ShiftSelector: React.FC<ShiftSelectorProps> = ({
  language,
  onSelectShift,
  currentShift,
}) => {
  const handleNumberSelect = (id: ShiftId) => {
    soundManager.playBoxScanSound();
    onSelectShift(id, 'day');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-[#1f2232] border border-[#2e3347] rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 relative overflow-hidden">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {language === 'uz' ? 'Ish smenasini tanlang' : 'Выберите рабочую смену'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 font-medium">
            {language === 'uz' ? 'O\'z ish smenangizni tanlang' : 'Нажмите на номер вашей рабочей смены'}
          </p>
        </div>

        {/* 4 Shift Cards in Clean Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {SHIFT_CARDS.map((shift) => {
            const isSelected = currentShift === shift.id;
            return (
              <button
                key={shift.id}
                type="button"
                onClick={() => handleNumberSelect(shift.id)}
                className={`relative p-5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 group hover:scale-[1.03] active:scale-[0.98] ${
                  isSelected
                    ? 'bg-indigo-950/70 border-indigo-500 shadow-lg ring-2 ring-indigo-500/40'
                    : 'bg-[#191b26] hover:bg-[#25283a] border-[#2e3347] hover:border-indigo-500/50 shadow-sm'
                }`}
              >
                {/* Number box */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl transition-transform ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-indigo-950/70 text-indigo-400 border border-indigo-800/80 group-hover:bg-indigo-600 group-hover:text-white'
                  }`}
                >
                  {shift.id}
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-white">
                    {language === 'uz' ? shift.titleUz : shift.titleRu}
                  </h4>
                </div>

                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 absolute top-2.5 right-2.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
