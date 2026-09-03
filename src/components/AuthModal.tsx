'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Language, ShiftId } from '@/lib/types';
import { useTranslation } from '@/lib/translations';
import { soundManager } from '@/lib/sound';
import { User, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  language: Language;
  onLogin: (session: { employeeName: string; tableNumber: string; shift: ShiftId }) => void;
}

const SHIFTS: { id: ShiftId; titleUz: string; titleRu: string }[] = [
  { id: '1', titleUz: '1-Smena', titleRu: '1-я Смена' },
  { id: '2', titleUz: '2-Smena', titleRu: '2-я Смена' },
  { id: '3', titleUz: '3-Smena', titleRu: '3-я Смена' },
  { id: '4', titleUz: '4-Smena', titleRu: '4-я Смена' },
];

export const AuthModal: React.FC<AuthModalProps> = ({ language, onLogin }) => {
  const t = useTranslation(language);
  const [name, setName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [selectedShift, setSelectedShift] = useState<ShiftId | null>(null);
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanTable = tableNumber.trim();

    if (!cleanName) {
      setError(language === 'uz' ? 'Iltimos, FIO ni kiriting' : 'Пожалуйста, укажите ФИО');
      soundManager.playErrorSound();
      nameRef.current?.focus();
      return;
    }

    if (!cleanTable) {
      setError(language === 'uz' ? 'Iltimos, stol raqamini skanerlang yoki kiriting' : 'Пожалуйста, отсканируйте или укажите номер стола');
      soundManager.playErrorSound();
      tableRef.current?.focus();
      return;
    }

    if (!selectedShift) {
      setError(language === 'uz' ? 'Iltimos, ish smenasini tanlang!' : 'Пожалуйста, выберите рабочую смену!');
      soundManager.playErrorSound();
      return;
    }

    soundManager.playBoxScanSound();
    onLogin({
      employeeName: cleanName,
      tableNumber: cleanTable,
      shift: selectedShift
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#1f2232] border border-[#2e3347] rounded-3xl p-7 sm:p-9 shadow-2xl text-slate-100 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {t.authTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 font-medium">
            {t.authSubtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* FIELD 1: FIO */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              {t.operator}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <User className="w-5 h-5 text-indigo-400" />
              </div>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!name.trim()) {
                      setError(language === 'uz' ? 'Iltimos, FIO ni kiriting' : 'Пожалуйста, укажите ФИО');
                      soundManager.playErrorSound();
                      return;
                    }
                    tableRef.current?.focus();
                  }
                }}
                placeholder={t.enterName}
                className="w-full pl-12 pr-4 py-3 bg-[#191b26] border border-[#2e3347] focus:border-indigo-500 rounded-2xl text-white placeholder-slate-500 text-sm sm:text-base font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                autoComplete="off"
              />
            </div>
          </div>

          {/* FIELD 2: STOL RAQAMI (Skanerlash / kiritish) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              {t.tableNumberLabel}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <span className="text-indigo-400 font-mono font-black text-base">#</span>
              </div>
              <input
                ref={tableRef}
                type="text"
                value={tableNumber}
                onChange={(e) => { setTableNumber(e.target.value); setError(''); }}
                placeholder={t.enterTableNumber}
                className="w-full pl-12 pr-4 py-3 bg-[#191b26] border border-indigo-700/60 focus:border-indigo-400 rounded-2xl text-white placeholder-slate-500 text-sm sm:text-base font-black font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner uppercase"
                autoComplete="off"
              />
            </div>
          </div>

          {/* FIELD 3: SMENA TANLASH */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{language === 'uz' ? 'Smenani tanlang' : 'Выберите смену'}</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SHIFTS.map((shift) => {
                const isSelected = selectedShift === shift.id;
                return (
                  <button
                    key={shift.id}
                    type="button"
                    onClick={() => {
                      setSelectedShift(shift.id);
                      setError('');
                      soundManager.playItemScanSound();
                    }}
                    className={`py-2.5 px-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30 scale-[1.02]'
                        : 'bg-[#191b26] hover:bg-[#25283a] border-[#2e3347] text-slate-300 hover:text-white'
                    }`}
                  >
                    <span className="font-mono text-sm font-black">{shift.id}</span>
                    <span className="text-[11px] font-medium leading-none">
                      {language === 'uz' ? 'Smena' : 'Смена'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-rose-400 text-xs font-bold animate-shake">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer group mt-3"
          >
            <span>{t.loginBtn}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};
