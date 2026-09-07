'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Language, ShiftId } from '@/lib/types';
import { useTranslation } from '@/lib/translations';
import { soundManager } from '@/lib/sound';
import {
  QrCode,
  Barcode,
  CheckCircle2,
  RotateCcw,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Lock
} from 'lucide-react';

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

interface ScannerBuffer {
  chars: string[];
  times: number[];
  timer: NodeJS.Timeout | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({ language, onLogin }) => {
  const t = useTranslation(language);

  // Form State
  const [name, setName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [isNameScanned, setIsNameScanned] = useState(false);
  const [isTableScanned, setIsTableScanned] = useState(false);

  // Remember last shift or default to shift 1
  const [selectedShift, setSelectedShift] = useState<ShiftId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vp_last_shift') as ShiftId;
      if (saved && ['1', '2', '3', '4'].includes(saved)) {
        return saved;
      }
    }
    return '1';
  });

  const [error, setError] = useState('');
  const [isManualShake, setIsManualShake] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Input refs
  const nameRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLInputElement>(null);

  // Hardware Scanner Buffers:
  // Hardware scanners send characters in rapid bursts (< 45ms per character).
  // Human typing is slow (> 80ms).
  // We completely preventDefault on keydown, so manual typing CANNOT type anything into the input!
  const nameBufferRef = useRef<ScannerBuffer>({ chars: [], times: [], timer: null });
  const tableBufferRef = useRef<ScannerBuffer>({ chars: [], times: [], timer: null });

  // Focus initially on employee QR input
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // Trigger manual typing blocked error
  const triggerManualError = useCallback(() => {
    setError(
      language === 'uz'
        ? "⚠️ Qo'lda yozish taqiqlangan! Iltimos, faqat skaner qurilmasi bilan skanerlang."
        : '⚠️ Ручной ввод запрещен! Пожалуйста, используйте только сканер.'
    );
    setIsManualShake(true);
    soundManager.playErrorSound();
    setTimeout(() => setIsManualShake(false), 500);
  }, [language]);

  // Complete Login
  const performLogin = useCallback(
    (empName: string, tblNum: string, shift: ShiftId) => {
      setIsLoggingIn(true);
      soundManager.playBoxScanSound();
      if (typeof window !== 'undefined') {
        localStorage.setItem('vp_last_shift', shift);
      }
      setTimeout(() => {
        onLogin({
          employeeName: empName,
          tableNumber: tblNum,
          shift: shift,
        });
      }, 350);
    },
    [onLogin]
  );

  // Sanitize scanned text
  const sanitizeScannedString = (raw: string): string => {
    let clean = raw.trim();
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const parsed = JSON.parse(clean);
        clean = parsed.fio || parsed.name || parsed.employeeName || clean;
      } catch (e) {
        // ignore json parse error
      }
    }
    return clean;
  };

  // Process Employee QR Scan
  const handleBadgeScanned = useCallback(
    (scannedVal: string) => {
      const clean = sanitizeScannedString(scannedVal);
      if (!clean || clean.length < 2) {
        triggerManualError();
        return;
      }

      // Check if user accidentally scanned a table code into the name field
      const upper = clean.toUpperCase();
      if (
        upper.startsWith('STOL') ||
        upper.startsWith('ST-') ||
        upper.startsWith('TABLE') ||
        upper.startsWith('СТОЛ')
      ) {
        setError(
          language === 'uz'
            ? 'Bu stol kodi! Iltimos, avval xodim beydjidagi QR kodni skanerlang.'
            : 'Это код стола! Пожалуйста, сначала отсканируйте бейдж сотрудника.'
        );
        soundManager.playErrorSound();
        return;
      }

      setName(clean);
      setIsNameScanned(true);
      setError('');
      soundManager.playItemScanSound();

      // Automatically focus table barcode input
      setTimeout(() => {
        tableRef.current?.focus();
      }, 100);
    },
    [language, triggerManualError]
  );

  // Process Desk / Table Barcode Scan
  const handleTableScanned = useCallback(
    (scannedVal: string) => {
      const clean = sanitizeScannedString(scannedVal).toUpperCase();
      if (!clean || clean.length < 1) {
        triggerManualError();
        return;
      }

      // Check if user accidentally scanned employee badge again into the table field
      if (clean.includes(' ') && !clean.startsWith('ST') && !clean.startsWith('TABLE')) {
        setError(
          language === 'uz'
            ? 'Bu xodim beydjigi! Iltimos, stoldagi shtrix-kodni skanerlang.'
            : 'Это бейдж сотрудника! Пожалуйста, отсканируйте штрих-код стола.'
        );
        soundManager.playErrorSound();
        return;
      }

      setTableNumber(clean);
      setIsTableScanned(true);
      setError('');
      soundManager.playItemScanSound();

      // If shift is already selected and name is scanned -> Auto Login immediately!
      if (name && selectedShift) {
        performLogin(name, clean, selectedShift);
      }
    },
    [name, selectedShift, performLogin, triggerManualError, language]
  );

  // Reset Employee Badge to re-scan
  const handleResetBadge = () => {
    setName('');
    setIsNameScanned(false);
    nameBufferRef.current = { chars: [], times: [], timer: null };
    setTimeout(() => nameRef.current?.focus(), 50);
  };

  // Reset Table Barcode to re-scan
  const handleResetTable = () => {
    setTableNumber('');
    setIsTableScanned(false);
    tableBufferRef.current = { chars: [], times: [], timer: null };
    setTimeout(() => tableRef.current?.focus(), 50);
  };

  // Generic keydown handler for strict hardware scanner velocity detection
  const handleScannerKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    target: 'badge' | 'table'
  ) => {
    // Block Paste (Ctrl+V / Cmd+V)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
      e.preventDefault();
      triggerManualError();
      return;
    }

    // Allow browser navigation keys
    if (e.key === 'Tab' || e.key === 'Escape') {
      return;
    }

    // STRICT ANTI-MANUAL:
    // Prevent default on ANY printable or typing key!
    // Hand-typed characters will NEVER be placed into the DOM input field.
    e.preventDefault();

    const bufferRef = target === 'badge' ? nameBufferRef : tableBufferRef;
    const now = Date.now();

    // Skaner Enter tugmasi bilan yakunlaganda
    if (e.key === 'Enter') {
      if (bufferRef.current.timer) {
        clearTimeout(bufferRef.current.timer);
        bufferRef.current.timer = null;
      }

      const chars = [...bufferRef.current.chars];
      const times = [...bufferRef.current.times];
      bufferRef.current = { chars: [], times: [], timer: null };

      // Skaner kamida 1-2 belgini o'ta tez (< 55ms interval) yuborishi kerak
      const minLen = target === 'badge' ? 2 : 1;
      if (chars.length < minLen) {
        triggerManualError();
        return;
      }

      // Tezlik tahlili (Hardware scanner velocity check)
      let isManual = false;
      for (let i = 1; i < times.length; i++) {
        if (times[i] - times[i - 1] > 55) {
          isManual = true;
          break;
        }
      }

      if (isManual) {
        triggerManualError();
        return;
      }

      // Qabul qilindi: haqiqiy skaner qurilmasi
      const scannedString = chars.join('');
      if (target === 'badge') {
        handleBadgeScanned(scannedString);
      } else {
        handleTableScanned(scannedString);
      }
      return;
    }

    // Belgilarni yig'ish (printable keys)
    if (e.key.length === 1) {
      bufferRef.current.chars.push(e.key);
      bufferRef.current.times.push(now);

      if (bufferRef.current.timer) {
        clearTimeout(bufferRef.current.timer);
      }

      // Agar skaner Enter yubormasa yoki inson klaviaturani sekin bossa
      // 65ms kutamiz: apparat skaneri bu vaqt ichida barcha belgilarni yuborib bo'ladi.
      bufferRef.current.timer = setTimeout(() => {
        const chars = [...bufferRef.current.chars];
        const times = [...bufferRef.current.times];
        bufferRef.current = { chars: [], times: [], timer: null };

        if (chars.length === 0) return;

        // Agar atigi 1 ta belgi kelgan bo'lsa va 65ms o'tgan bo'lsa: bu inson qo'li!
        if (chars.length === 1) {
          triggerManualError();
          return;
        }

        // Barcha belgilar orasidagi oraliqni tekshirish
        let isManual = false;
        for (let i = 1; i < times.length; i++) {
          if (times[i] - times[i - 1] > 55) {
            isManual = true;
            break;
          }
        }

        if (isManual) {
          triggerManualError();
          return;
        }

        // Enter-siz skaner oqimi qabul qilindi
        const scannedString = chars.join('');
        if (target === 'badge') {
          handleBadgeScanned(scannedString);
        } else {
          handleTableScanned(scannedString);
        }
      }, 65);
    }
  };

  // Handle Shift Select & Instant Login if both scans are ready
  const handleShiftSelect = (shiftId: ShiftId) => {
    setSelectedShift(shiftId);
    setError('');
    soundManager.playItemScanSound();

    if (isNameScanned && isTableScanned) {
      performLogin(name, tableNumber, shiftId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-md bg-[#1f2232] border border-[#2e3347] rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 relative overflow-hidden transition-all duration-300 ${
          isManualShake ? 'animate-shake border-rose-500/80 shadow-rose-500/20' : ''
        }`}
      >
        {/* Glowing top ambient light */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-indigo-600/20 blur-3xl rounded-full pointer-events-none" />

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center mb-6 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{language === 'uz' ? 'Faqat Skaner Rejimi' : 'Только режим сканера'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <span>{t.authTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium max-w-xs">
            {t.authSubtitle}
          </p>
        </div>

        {/* Error / Manual Warning Alert */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-950/70 border border-rose-600/60 rounded-2xl flex items-start gap-2.5 text-rose-200 text-xs font-semibold animate-shake shadow-lg shadow-rose-950/40">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        <div className="space-y-4">
          {/* ============================================================ */}
          {/* STEP 1: XODIM BEYDJI (QR KOD) */}
          {/* ============================================================ */}
          <div
            className={`relative p-3.5 rounded-2xl border transition-all duration-200 ${
              isNameScanned
                ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md shadow-emerald-950/30'
                : 'bg-[#191b26] border-indigo-500 shadow-lg shadow-indigo-500/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <QrCode className={`w-4 h-4 ${isNameScanned ? 'text-emerald-400' : 'text-indigo-400'}`} />
                <span>{t.scanBadgePrompt}</span>
              </label>

              {isNameScanned && (
                <button
                  type="button"
                  onClick={handleResetBadge}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-rose-400 transition-colors cursor-pointer px-2 py-0.5 rounded-md hover:bg-[#25283a]"
                  title={t.rescanBtn}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.rescanBtn}</span>
                </button>
              )}
            </div>

            {isNameScanned ? (
              <div className="flex items-center justify-between bg-[#191b26] px-4 py-3 rounded-xl border border-emerald-500/30">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs text-slate-400 font-medium">
                      {language === 'uz' ? 'Xodim (Operator)' : 'Сотрудник (Оператор)'}
                    </p>
                    <p className="text-sm sm:text-base font-black text-white truncate">
                      {name}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 shrink-0 ml-2">
                  ✓ {t.scannedSuccess}
                </span>
              </div>
            ) : (
              <div className="relative group">
                <input
                  ref={nameRef}
                  type="text"
                  value=""
                  readOnly={false}
                  onChange={(e) => e.preventDefault()}
                  onKeyDown={(e) => handleScannerKeyDown(e, 'badge')}
                  onPaste={(e) => {
                    e.preventDefault();
                    triggerManualError();
                  }}
                  placeholder={t.scanBadgePlaceholder}
                  className="w-full pl-11 pr-28 py-3 bg-[#191b26] border border-[#2e3347] focus:border-indigo-500 rounded-xl text-white placeholder-slate-400 text-sm sm:text-base font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner cursor-default select-none"
                  autoComplete="off"
                  autoFocus
                />
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <QrCode className="w-5 h-5 text-indigo-400 animate-pulse" />
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-indigo-400 text-xs font-semibold pointer-events-none">
                  <Zap className="w-3.5 h-3.5 animate-bounce-subtle" />
                  <span className="text-[11px]">{t.waitingForScan}</span>
                </div>
              </div>
            )}

            {!isNameScanned && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1.5 px-1">
                <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                <span>
                  {language === 'uz'
                    ? 'Klaviaturadan yozish bloklangan (faqat skanerlash)'
                    : 'Ввод с клавиатуры заблокирован (только сканер)'}
                </span>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* STEP 2: ISH STOLI (BARKOD / QR KOD) */}
          {/* ============================================================ */}
          <div
            className={`relative p-3.5 rounded-2xl border transition-all duration-200 ${
              isTableScanned
                ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md shadow-emerald-950/30'
                : isNameScanned
                ? 'bg-[#191b26] border-indigo-500 shadow-lg shadow-indigo-500/10'
                : 'bg-[#191b26]/40 border-[#2e3347] opacity-65'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Barcode className={`w-4 h-4 ${isTableScanned ? 'text-emerald-400' : 'text-indigo-400'}`} />
                <span>{t.scanTablePrompt}</span>
              </label>

              {isTableScanned && (
                <button
                  type="button"
                  onClick={handleResetTable}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-rose-400 transition-colors cursor-pointer px-2 py-0.5 rounded-md hover:bg-[#25283a]"
                  title={t.rescanBtn}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.rescanBtn}</span>
                </button>
              )}
            </div>

            {isTableScanned ? (
              <div className="flex items-center justify-between bg-[#191b26] px-4 py-3 rounded-xl border border-emerald-500/30">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">{t.tableNumberLabel}</p>
                    <p className="text-sm sm:text-base font-black text-white font-mono uppercase">
                      {tableNumber}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 shrink-0 ml-2">
                  ✓ {t.scannedSuccess}
                </span>
              </div>
            ) : (
              <div className="relative group">
                <input
                  ref={tableRef}
                  type="text"
                  value=""
                  disabled={!isNameScanned}
                  readOnly={false}
                  onChange={(e) => e.preventDefault()}
                  onKeyDown={(e) => handleScannerKeyDown(e, 'table')}
                  onPaste={(e) => {
                    e.preventDefault();
                    triggerManualError();
                  }}
                  placeholder={
                    isNameScanned
                      ? t.scanTablePlaceholder
                      : language === 'uz'
                      ? 'Avval xodimni skanerlang...'
                      : 'Сначала сканируйте сотрудника...'
                  }
                  className="w-full pl-11 pr-28 py-3 bg-[#191b26] border border-[#2e3347] focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white placeholder-slate-400 text-sm sm:text-base font-mono font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner uppercase cursor-default select-none"
                  autoComplete="off"
                />
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Barcode className="w-5 h-5 text-indigo-400" />
                </div>
                {isNameScanned && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-indigo-400 text-xs font-semibold pointer-events-none">
                    <Zap className="w-3.5 h-3.5 animate-bounce-subtle" />
                    <span className="text-[11px]">{t.waitingForScan}</span>
                  </div>
                )}
              </div>
            )}

            {isNameScanned && !isTableScanned && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1.5 px-1">
                <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                <span>
                  {language === 'uz'
                    ? "Stol raqami ham qo'lda yozilmaydi (faqat skanerlash)"
                    : 'Номер стола также не вводится вручную (только сканирование)'}
                </span>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* STEP 3: ISH SMENASI */}
          {/* ============================================================ */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{language === 'uz' ? 'Ish smenasi' : 'Рабочая смена'}</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SHIFTS.map((shift) => {
                const isSelected = selectedShift === shift.id;
                return (
                  <button
                    key={shift.id}
                    type="button"
                    onClick={() => handleShiftSelect(shift.id)}
                    className={`py-2 px-1 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer flex flex-col items-center justify-center space-y-0.5 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30 scale-[1.02]'
                        : 'bg-[#191b26] hover:bg-[#25283a] border-[#2e3347] text-slate-300 hover:text-white'
                    }`}
                  >
                    <span className="font-mono text-sm font-black">{shift.id}</span>
                    <span className="text-[10px] font-medium leading-none">
                      {language === 'uz' ? 'Smena' : 'Смена'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Button: Auto-login or Manual trigger if both scanned */}
        <div className="mt-6 pt-3 border-t border-[#2e3347]/80">
          {isLoggingIn ? (
            <div className="w-full py-3.5 px-6 bg-emerald-600 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 animate-spin" />
              <span>{t.autoLoggingIn}</span>
            </div>
          ) : isNameScanned && isTableScanned ? (
            <button
              type="button"
              onClick={() => performLogin(name, tableNumber, selectedShift)}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer group"
            >
              <span>{t.loginBtn}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#191b26] border border-[#2e3347] text-slate-400 text-xs font-semibold text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {language === 'uz'
                  ? 'Ikkala kod skanerlangach, tizimga avtomatik kiriladi'
                  : 'После сканирования обоих кодов вход выполнится автоматически'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
