'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Language } from '@/lib/types';
import { useTranslation } from '@/lib/translations';
import { soundManager } from '@/lib/sound';
import {
  Package,
  Barcode,
  ArrowRight,
  ShieldAlert,
  Zap
} from 'lucide-react';

interface BoxScannerProps {
  language: Language;
  onBoxScanned: (boxNumber: string) => void;
}

export const BoxScanner: React.FC<BoxScannerProps> = ({
  language,
  onBoxScanned,
}) => {
  const t = useTranslation(language);
  const [boxInput, setBoxInput] = useState('');
  const [inputError, setInputError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();

    const handleClick = () => {
      if (document.activeElement?.tagName !== 'BUTTON' && document.activeElement?.tagName !== 'INPUT') {
        inputRef.current?.focus();
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Hardware Laser barcode listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current) return;

      const currentTime = Date.now();
      const char = e.key;

      if (char === 'Enter') {
        if (buffer.trim().length > 1) {
          const scannedCode = buffer.trim();
          buffer = '';
          submitBoxNumber(scannedCode);
        }
        buffer = '';
        return;
      }

      if (currentTime - lastKeyTime > 80) {
        buffer = '';
      }

      if (char.length === 1) {
        buffer += char;
        lastKeyTime = currentTime;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const submitBoxNumber = (rawBox: string) => {
    const cleanBox = rawBox.trim().toUpperCase();
    if (!cleanBox) {
      setInputError(language === 'uz' ? 'Iltimos, korup raqamini kiriting!' : 'Пожалуйста, введите номер короба!');
      soundManager.playErrorSound();
      return;
    }

    soundManager.playBoxScanSound();
    onBoxScanned(cleanBox);
    setBoxInput('');
    setInputError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitBoxNumber(boxInput);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-slate-900 pt-2">
      {/* Hero Scanner Box Card (Large and high-contrast) */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/80 relative overflow-hidden">
        {/* Top Centered Header with Pastel Badge */}
        <div className="flex flex-col items-center justify-center text-center mb-10">
          <span className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border-2 border-indigo-200 text-xs font-black uppercase tracking-wider mb-4 shadow-xs">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span>{t.hardwareScannerReady}</span>
          </span>

          <div className="w-24 h-24 rounded-3xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 mb-5 shadow-sm relative overflow-hidden">
            <Package className="w-12 h-12" />
            {/* Subtle laser line */}
            <div className="absolute left-0 right-0 h-1 bg-indigo-600 animate-scan-laser shadow-[0_0_10px_#6366F1]" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t.boxScanTitle}
          </h2>
          <p className="text-base sm:text-lg text-slate-500 mt-2.5 max-w-md font-medium">
            {t.boxScanSubtitle}
          </p>
        </div>

        {/* Huge Input Form */}
        <form onSubmit={handleSubmit} className="space-y-5 max-w-xl mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400">
              <Barcode className="w-8 h-8 text-indigo-600" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={boxInput}
              onChange={(e) => {
                setBoxInput(e.target.value);
                setInputError('');
              }}
              placeholder={t.boxInputPlaceholder}
              className="w-full pl-16 pr-5 py-6 bg-slate-50 border-2 border-slate-300 focus:border-indigo-600 focus:bg-white rounded-2xl text-slate-900 placeholder-slate-400 font-mono text-2xl sm:text-3xl font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all shadow-inner tracking-wider uppercase"
              autoComplete="off"
            />
          </div>

          {inputError && (
            <div className="flex items-center space-x-2.5 text-rose-700 text-sm font-bold bg-rose-50 p-4 rounded-2xl border-2 border-rose-200 animate-bounce-subtle">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{inputError}</span>
            </div>
          )}

          {/* Large Master Button */}
          <button
            type="submit"
            className="w-full py-5 px-8 bg-indigo-600 hover:bg-indigo-700 active:translate-y-0.5 text-white text-lg sm:text-xl font-black rounded-2xl shadow-xl shadow-indigo-600/30 border-2 border-indigo-700 flex items-center justify-center space-x-3 transition-all cursor-pointer"
          >
            <span>{t.confirmBoxBtn}</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};
