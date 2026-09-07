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
  Zap
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

interface ScannerTracker {
  lastTime: number;
  count: number;
  isManual: boolean;
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

  // Active step: 'badge' (waiting for employee QR) -> 'table' (waiting for desk barcode) -> 'ready'
  const [activeStep, setActiveStep] = useState<'badge' | 'table' | 'ready'>('badge');

  // Input refs
  const nameRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLInputElement>(null);

  // Scanner velocity tracking refs
  // Barcode/QR scanners typically emit keys < 40ms apart. Human typing is > 70ms.
  const nameTracker = useRef<ScannerTracker>({
    lastTime: 0,
    count: 0,
    isManual: false,
    timer: null,
  });

  const tableTracker = useRef<ScannerTracker>({
    lastTime: 0,
    count: 0,
    isManual: false,
    timer: null,
  });

  // Focus initially on employee QR input
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // Trigger manual typing blocked error
  const triggerManualError = useCallback(() => {
    setError(t.manualTypingBlocked);
    setIsManualShake(true);
    soundManager.playErrorSound();
    setTimeout(() => setIsManualShake(false), 500);
  }, [t.manualTypingBlocked]);

  // Complete Login
  const performLogin = useCallback(
    (empName: string, tblNum: string, shift: ShiftId) => {
      setIsLoggingIn(true);
      soundManager.playBoxScanSound();
      // Save last selected shift to localStorage
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
    // Support JSON encoded QR badges: e.g. {"name": "...", "fio": "..."}
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const parsed = JSON.parse(clean);
        clean = parsed.fio || parsed.name || parsed.employeeName || clean;
      } catch (e) {
        // Ignore json parse error and keep clean
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
        setName('');
        return;
      }

      // Check if user accidentally scanned a table code first
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
        setName('');
        return;
      }

      setName(clean);
      setIsNameScanned(true);
      setActiveStep('table');
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
        setTableNumber('');
        return;
      }

      setTableNumber(clean);
      setIsTableScanned(true);
      setActiveStep('ready');
      setError('');
      soundManager.playItemScanSound();

      // If shift is already selected and name is scanned -> Auto Login immediately!
      if (name && selectedShift) {
        performLogin(name, clean, selectedShift);
      }
    },
    [name, selectedShift, performLogin, triggerManualError]
  );

  // Reset Employee Badge to re-scan
  const handleResetBadge = () => {
    setName('');
    setIsNameScanned(false);
    setActiveStep('badge');
    nameTracker.current = { lastTime: 0, count: 0, isManual: false, timer: null };
    setTimeout(() => nameRef.current?.focus(), 50);
  };

  // Reset Table Barcode to re-scan
  const handleResetTable = () => {
    setTableNumber('');
    setIsTableScanned(false);
    setActiveStep('table');
    tableTracker.current = { lastTime: 0, count: 0, isManual: false, timer: null };
    setTimeout(() => tableRef.current?.focus(), 50);
  };

  // KeyDown Handler for Badge QR input
  const handleBadgeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Block Paste (Ctrl+V / Cmd+V)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
      e.preventDefault();
      triggerManualError();
      setName('');
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const tracker = nameTracker.current;
      if (tracker.timer) clearTimeout(tracker.timer);

      // If manual typing detected or too few keys entered manually
      if (tracker.isManual || tracker.count <= 1) {
        triggerManualError();
        setName('');
        nameTracker.current = { lastTime: 0, count: 0, isManual: false, timer: null };
        return;
      }

      // Valid scanner stream!
      handleBadgeScanned(name);
      nameTracker.current = { lastTime: 0, count: 0, isManual: false, timer: null };
      return;
    }

    // Velocity detection: check interval between printable keys
    if (e.key.length === 1) {
      const now = Date.now();
      const tracker = nameTracker.current;

      if (tracker.lastTime > 0) {
        const diff = now - tracker.lastTime;
        // If typing speed is slower than 65ms per char, it is human manual typing
        if (diff > 65) {
          tracker.isManual = true;
        }
      }
      tracker.lastTime = now;
      tracker.count += 1;

      // Clear any pending debounce timer
      if (tracker.timer) clearTimeout(tracker.timer);

      // In case scanner does not send Enter, auto-process after 120ms burst ends
      tracker.timer = setTimeout(() => {
        if (tracker.isManual) {
          triggerManualError();
          setName('');
          nameTracker.current = { lastTime: 0, count: 0, isManual: false, timer: null };
        } else if (nameRef.current && nameRef.current.value.trim().length >= 2) {
          handleBadgeScanned(nameRef.current.value);
          nameTracker.current = { lastTime: 0, count: 0, isManual: false, timer: null };
        }
      }, 120);
    }
  };

  // KeyDown Handler for Table Barcode input
  const handleTableKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Block Paste (Ctrl+V / Cmd+V)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
      e.preventDefault();
      triggerManualError();
      setTableNumber('');
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const tracker = tableTracker.current;
      if (tracker.timer) clearTimeout(tracker.timer);

      // If manual typing detected
      if (tracker.isManual || tracker.count <= 1) {
        triggerManualError();
        setTableNumber('');
        tableTracker.current = { lastTime: 0, count: 0, isManual: false, timer: null };
        return;
      }

      // Valid scanner stream!
      handleTableScanned(tableNumber);
      tableTracker.current = { lastTime: 0, count: 0, isManual: false, timer: null };
      return;
    }

    // Velocity detection for table input
    if (e.key.length === 1) {
      const now = Date.now();
      const tracker = tableTracker.current;

      if (tracker.lastTime > 0) {
        const diff = now - tracker.lastTime;
        if (diff > 65) {
          tracker.isManual = true;
        }
      }
      tracker.lastTime = now;
      tracker.count += 1;

      if (tracker.timer) clearTimeout(tracker.timer);

      tracker.timer = setTimeout(() => {
        if (tracker.isManual) {
          triggerManualError();
          setTableNumber('');
          tableTracker.current = { lastTime: 0, count: 0, isManual: false, timer: null };
        } else if (tableRef.current && tableRef.current.value.trim().length >= 1) {
          handleTableScanned(tableRef.current.value);
          tableTracker.current = { lastTime: 0, count: 0, isManual: false, timer: null };
        }
      }, 120);
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
                : activeStep === 'badge'
                ? 'bg-[#191b26] border-indigo-500 shadow-lg shadow-indigo-500/10'
                : 'bg-[#191b26]/60 border-[#2e3347]'
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleBadgeKeyDown}
                  onPaste={(e) => {
                    e.preventDefault();
                    triggerManualError();
                  }}
                  placeholder={t.scanBadgePlaceholder}
                  className="w-full pl-11 pr-4 py-3 bg-[#191b26] border border-[#2e3347] focus:border-indigo-500 rounded-xl text-white placeholder-slate-500 text-sm sm:text-base font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                  autoComplete="off"
                  autoFocus
                />
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <QrCode className="w-5 h-5 text-indigo-400 animate-pulse" />
                </div>
                {/* Laser animation indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-indigo-400 text-xs font-semibold pointer-events-none">
                  <Zap className="w-3.5 h-3.5 animate-bounce-subtle" />
                  <span className="text-[11px]">{t.waitingForScan}</span>
                </div>
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
                : activeStep === 'table'
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
                  value={tableNumber}
                  disabled={!isNameScanned}
                  onChange={(e) => setTableNumber(e.target.value)}
                  onKeyDown={handleTableKeyDown}
                  onPaste={(e) => {
                    e.preventDefault();
                    triggerManualError();
                  }}
                  placeholder={
                    isNameScanned ? t.scanTablePlaceholder : language === 'uz' ? 'Avval xodimni skanerlang...' : 'Сначала сканируйте сотрудника...'
                  }
                  className="w-full pl-11 pr-4 py-3 bg-[#191b26] border border-[#2e3347] focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white placeholder-slate-500 text-sm sm:text-base font-mono font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner uppercase"
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
