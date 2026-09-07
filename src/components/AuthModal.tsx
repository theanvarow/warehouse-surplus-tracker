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
  Lock
} from 'lucide-react';

interface AuthModalProps {
  language: Language;
  onLogin: (session: { employeeName: string; tableNumber: string; shift: ShiftId }) => void;
  onLanguageChange?: (lang: Language) => void;
}

const SHIFTS: { id: ShiftId; titleUz: string; titleRu: string }[] = [
  { id: '1', titleUz: '1-Smena', titleRu: '1-я Смена' },
  { id: '2', titleUz: '2-Smena', titleRu: '2-я Смена' },
  { id: '3', titleUz: '3-Smena', titleRu: '3-я Смена' },
  { id: '4', titleUz: '4-Smena', titleRu: '4-я Смена' },
];

// Russian QWERTY <-> ЙЦУКЕН mapping for decoding hardware scanner input
const RU_TO_EN_MAP: Record<string, string> = {
  'й': 'q', 'ц': 'w', 'у': 'e', 'к': 'r', 'е': 't', 'н': 'y', 'г': 'u', 'ш': 'i', 'щ': 'o', 'з': 'p', 'х': '[', 'ъ': ']',
  'ф': 'a', 'ы': 's', 'в': 'd', 'а': 'f', 'п': 'g', 'р': 'h', 'о': 'j', 'л': 'k', 'д': 'l', 'ж': ';', 'э': "'",
  'я': 'z', 'ч': 'x', 'с': 'c', 'м': 'v', 'и': 'b', 'т': 'n', 'ь': 'm', 'б': ',', 'ю': '.', '.': '/',
  'Й': 'Q', 'Ц': 'W', 'У': 'E', 'К': 'R', 'Е': 'T', 'Н': 'Y', 'Г': 'U', 'Ш': 'I', 'Щ': 'O', 'З': 'P', 'Х': '{', 'Ъ': '}',
  'Ф': 'A', 'Ы': 'S', 'В': 'D', 'А': 'F', 'П': 'G', 'Р': 'H', 'О': 'J', 'Л': 'K', 'Д': 'L', 'Ж': ':', 'Э': '"',
  'Я': 'Z', 'Ч': 'X', 'С': 'C', 'М': 'V', 'И': 'B', 'Т': 'N', 'Ь': 'M', 'Б': '<', 'Ю': '>', ',': '?',
  '"': '@', '№': '#', ';': '$', ':': '^', '?': '&'
};

export function convertRuLayoutToEn(str: string): string {
  return str
    .split('')
    .map((c) => RU_TO_EN_MAP[c] ?? c)
    .join('');
}

const SYMBOL_CODE_MAP: Record<string, [string, string]> = {
  Space: [' ', ' '],
  Minus: ['-', '_'],
  Equal: ['=', '+'],
  BracketLeft: ['[', '{'],
  BracketRight: [']', '}'],
  Backslash: ['\\', '|'],
  Semicolon: [';', ':'],
  Quote: ["'", '"'],
  Comma: [',', '<'],
  Period: ['.', '>'],
  Slash: ['/', '?'],
  Backquote: ['`', '~'],
  Numpad0: ['0', '0'],
  Numpad1: ['1', '1'],
  Numpad2: ['2', '2'],
  Numpad3: ['3', '3'],
  Numpad4: ['4', '4'],
  Numpad5: ['5', '5'],
  Numpad6: ['6', '6'],
  Numpad7: ['7', '7'],
  Numpad8: ['8', '8'],
  Numpad9: ['9', '9'],
  NumpadDivide: ['/', '/'],
  NumpadMultiply: ['*', '*'],
  NumpadSubtract: ['-', '-'],
  NumpadAdd: ['+', '+'],
  NumpadDecimal: ['.', '.']
};

const SHIFT_DIGITS: Record<string, string> = {
  '1': '!',
  '2': '@',
  '3': '#',
  '4': '$',
  '5': '%',
  '6': '^',
  '7': '&',
  '8': '*',
  '9': '(',
  '0': ')'
};

function getAsciiCharFromEvent(e: React.KeyboardEvent): string {
  const code = e.code;
  const shift = e.shiftKey;

  // 1. Letters: KeyA - KeyZ (Always ASCII regardless of OS layout)
  if (code && code.startsWith('Key') && code.length === 4) {
    const letter = code[3];
    return shift ? letter.toUpperCase() : letter.toLowerCase();
  }

  // 2. Numbers: Digit0 - Digit9
  if (code && code.startsWith('Digit') && code.length === 6) {
    const digit = code[5];
    return shift ? (SHIFT_DIGITS[digit] || digit) : digit;
  }

  // 3. Special symbols
  if (code && SYMBOL_CODE_MAP[code]) {
    return shift ? SYMBOL_CODE_MAP[code][1] : SYMBOL_CODE_MAP[code][0];
  }

  // 4. If e.code is missing/Unidentified, fallback to e.key with Russian layout check
  if (e.key && e.key.length === 1) {
    return RU_TO_EN_MAP[e.key] ?? e.key;
  }

  return e.key;
}

interface ScannerBuffer {
  chars: string[];
  times: number[];
  timer: NodeJS.Timeout | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({ language, onLogin, onLanguageChange }) => {
  const t = useTranslation(language);

  // Form State
  const [name, setName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [isNameScanned, setIsNameScanned] = useState(false);
  const [isTableScanned, setIsTableScanned] = useState(false);

  // Shift state: starts null or saved shift, but NEVER auto-logins until user confirms
  const [selectedShift, setSelectedShift] = useState<ShiftId | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vp_last_shift') as ShiftId;
      if (saved && ['1', '2', '3', '4'].includes(saved)) {
        return saved;
      }
    }
    return null;
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

  // Sanitize scanned text with automatic Russian keyboard layout recovery
  const sanitizeScannedString = (raw: string): string => {
    let clean = raw.trim();

    // 1. Agar skaner rus klaviatura tartibida harflarni yuborgan bo'lsa (masalan: Х" yoki ХЭ yoki ашщ yoki ые-)
    if (
      clean.startsWith('Х') ||
      clean.startsWith('х') ||
      clean.includes('ашщ') ||
      clean.toUpperCase().startsWith('ЫЕ-') ||
      clean.toUpperCase().startsWith('ЫЕ_') ||
      clean.toUpperCase().startsWith('ЫЕЩД') ||
      clean.toUpperCase().startsWith('ЕФИТУ') ||
      clean.toUpperCase().startsWith('АШЩ:') ||
      clean.toUpperCase().startsWith('АШЩЖ')
    ) {
      clean = convertRuLayoutToEn(clean).trim();
    }

    // 2. JSON formatni tekshirish
    if (
      (clean.startsWith('{') && clean.endsWith('}')) ||
      (clean.startsWith('{"') && clean.includes('}'))
    ) {
      try {
        const parsed = JSON.parse(clean);
        clean =
          parsed.fio ||
          parsed.name ||
          parsed.employeeName ||
          parsed.fullName ||
          parsed.full_name ||
          parsed.worker ||
          clean;
      } catch (e) {
        // Ruscha tartibni inglizchaga o'girib qayta JSON tekshiramiz
        try {
          const converted = convertRuLayoutToEn(clean);
          const parsed = JSON.parse(converted);
          clean =
            parsed.fio ||
            parsed.name ||
            parsed.employeeName ||
            parsed.fullName ||
            parsed.full_name ||
            parsed.worker ||
            clean;
        } catch {}
      }
    }

    if (clean.toUpperCase().startsWith('FIO:') || clean.toUpperCase().startsWith('ФИО:')) {
      clean = clean.slice(4).trim();
    }
    return clean;
  };

  // Process Employee QR Scan
  const handleBadgeScanned = useCallback(
    (scannedVal: string) => {
      let clean = sanitizeScannedString(scannedVal);
      if (!clean || clean.length < 2) {
        triggerManualError();
        return;
      }

      // Check if user accidentally scanned a table code into the name field
      const upper = clean.toUpperCase();
      const isTableCode =
        upper.startsWith('STOL-') ||
        upper.startsWith('STOL_') ||
        upper.startsWith('STOL ') ||
        upper.startsWith('ST-') ||
        upper.startsWith('TABLE-') ||
        upper.startsWith('TABLE ') ||
        upper.startsWith('СТОЛ-') ||
        upper.startsWith('СТОЛ ') ||
        upper.startsWith('ЫЕ-') ||
        upper.startsWith('ЫЕЩД-') ||
        /^(STOL|СТОЛ|TABLE|ЫЕ|ЫЕЩД)\d+$/i.test(upper);

      if (isTableCode) {
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
      let clean = sanitizeScannedString(scannedVal).toUpperCase();
      if (
        clean.startsWith('ЫЕ-') ||
        clean.startsWith('ЫЕ_') ||
        clean.startsWith('ЫЕЩД') ||
        clean.startsWith('ЕФИТУ')
      ) {
        clean = convertRuLayoutToEn(clean).toUpperCase();
      }

      if (!clean || clean.length < 1) {
        triggerManualError();
        return;
      }

      // Check if user accidentally scanned employee badge again into the table field
      if (clean.includes(' ') && !clean.startsWith('ST') && !clean.startsWith('TABLE') && !clean.startsWith('СТОЛ')) {
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
      // Operator bemalol smenani ko'rib tanlaydi va 'Tizimga kirish' tugmasini bosadi.
    },
    [triggerManualError, language]
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

  // Apparat skaneri buferini tekshirish va tasdiqlash:
  // Har qanday uzunlikdagi (qisqa stol raqamlaridan tortib uzun 50-60 belgili FIO QR kodlarigacha)
  // apparat skaneri tezligini tekshiradi va inson qo'li bilan yozishni 100% bloklaydi.
  const validateAndCommitScannerBuffer = useCallback(
    (target: 'badge' | 'table', snapshot: { chars: string[]; times: number[] }) => {
      const chars = snapshot.chars;
      const times = snapshot.times;

      // Kamida talab qilinadigan belgilar soni
      const minLen = target === 'badge' ? 3 : 2;
      if (chars.length < minLen) {
        triggerManualError();
        return;
      }

      // Bir xil harflarni ushlab turishni rad etish (masalan: 'aaaaaa')
      const uniqueChars = new Set(chars);
      if (uniqueChars.size < 2 && chars.length > 2) {
        triggerManualError();
        return;
      }

      const totalDuration = times[times.length - 1] - times[0];
      const avgInterval = totalDuration / Math.max(times.length - 1, 1);

      // Inson klaviaturada harflarni bittalab terishi o'rtacha 150ms-400ms oladi.
      // Apparat skanerlari esa harflarni 5ms - 35ms oralig'ida yuboradi.
      // O'rtacha oraliq tezligi 50ms dan oshsa - qo'lda yozilgan deb topiladi.
      if (avgInterval > 50) {
        triggerManualError();
        return;
      }

      // Belgilar orasidagi eng katta uzilish (gap) tekshiruvi:
      // Skanerda harflar oqimi uzluksiz keladi (USB buferlash hisobiga ba'zan 40-60ms gacha cho'zilishi mumkin).
      // Agar biror harf orasida 75ms dan ortiq uzilish bo'lsa - inson tergan bo'ladi.
      let isManual = false;
      for (let i = 1; i < times.length; i++) {
        if (times[i] - times[i - 1] > 75) {
          isManual = true;
          break;
        }
      }

      // Umumiy vaqt belgilar soniga mutanosib bo'lishi kerak:
      // Har bir belgi uchun 60ms + 300ms zaxira (uzun FIO lar va 50-60 belgili QR kodlar bemalol o'qiladi)
      const maxAllowedDuration = chars.length * 60 + 300;
      if (totalDuration > maxAllowedDuration) {
        isManual = true;
      }

      if (isManual) {
        triggerManualError();
        return;
      }

      // Faqat haqiqiy apparat skaneri tasdiqlandi!
      const scannedString = chars.join('');
      if (target === 'badge') {
        handleBadgeScanned(scannedString);
      } else {
        handleTableScanned(scannedString);
      }
    },
    [triggerManualError, handleBadgeScanned, handleTableScanned]
  );

  // Generic keydown handler for strict hardware scanner velocity detection
  const handleScannerKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    target: 'badge' | 'table'
  ) => {
    // 1. Block Paste (Ctrl+V / Cmd+V)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
      e.preventDefault();
      triggerManualError();
      return;
    }

    // 2. Block holding down keys (Key Repeat on keyboard)
    if (e.repeat) {
      e.preventDefault();
      const bufferRef = target === 'badge' ? nameBufferRef : tableBufferRef;
      if (bufferRef.current.timer) clearTimeout(bufferRef.current.timer);
      bufferRef.current = { chars: [], times: [], timer: null };
      triggerManualError();
      return;
    }

    // 3. Allow browser navigation keys
    if (e.key === 'Tab' || e.key === 'Escape') {
      return;
    }

    // 4. STRICT ANTI-MANUAL:
    // Prevent default on ANY printable or typing key!
    // Hand-typed characters will NEVER be placed into the DOM input field.
    e.preventDefault();

    const bufferRef = target === 'badge' ? nameBufferRef : tableBufferRef;
    const now = Date.now();

    // 5. Skaner Enter tugmasi bilan yakunlaganda (Hardware Scanner Enter Suffix)
    if (e.key === 'Enter') {
      if (bufferRef.current.timer) {
        clearTimeout(bufferRef.current.timer);
        bufferRef.current.timer = null;
      }

      const snapshot = {
        chars: [...bufferRef.current.chars],
        times: [...bufferRef.current.times],
      };
      bufferRef.current = { chars: [], times: [], timer: null };

      validateAndCommitScannerBuffer(target, snapshot);
      return;
    }

    // 6. Belgilarni yig'ish (harflar, bo'sh joy, maxsus belgilar)
    // Skaner OS ning rus/ingliz klaviatura tartibidan qat'i nazar,
    // QR-kodning haqiqiy original belgilarini aniqlaydi.
    const char = getAsciiCharFromEvent(e);
    if (char && char.length === 1) {
      bufferRef.current.chars.push(char);
      bufferRef.current.times.push(now);

      if (bufferRef.current.timer) {
        clearTimeout(bufferRef.current.timer);
      }

      // Harflar oqimi tugashini kutish (160ms):
      // Skaner o'z oqimini yuborib bo'lgach (hatto Enter bo'lmasa ham),
      // 160ms dan so'ng avtomatik tekshirilib tasdiqlanadi.
      // Inson esa 160ms ichida faqat 1 ta yoki sekin harf bosa oladi va xatolik ko'rsatiladi.
      bufferRef.current.timer = setTimeout(() => {
        const snapshot = {
          chars: [...bufferRef.current.chars],
          times: [...bufferRef.current.times],
        };
        bufferRef.current = { chars: [], times: [], timer: null };

        validateAndCommitScannerBuffer(target, snapshot);
      }, 160);
    }
  };

  // Handle Shift Select: faqat smenani belgilaydi, avtomatik kiritib yubormaydi!
  const handleShiftSelect = (shiftId: ShiftId) => {
    setSelectedShift(shiftId);
    setError('');
    soundManager.playItemScanSound();
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

        {/* Modal Top Bar: Mode Badge & Language Switcher */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{language === 'uz' ? 'Faqat Skaner Rejimi' : 'Только режим сканера'}</span>
          </div>

          {/* Quick Language Switcher directly inside modal */}
          {onLanguageChange && (
            <div className="flex items-center bg-[#161824] border border-[#2e3347] rounded-xl p-0.5 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  onLanguageChange('uz');
                  soundManager.playItemScanSound();
                }}
                className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  language === 'uz'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#25283a]'
                }`}
              >
                UZ
              </button>
              <button
                type="button"
                onClick={() => {
                  onLanguageChange('ru');
                  soundManager.playItemScanSound();
                }}
                className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  language === 'ru'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#25283a]'
                }`}
              >
                RU
              </button>
            </div>
          )}
        </div>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center mb-6 relative">
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
                  className="w-full pl-11 pr-4 py-3 bg-[#191b26] border border-[#2e3347] focus:border-indigo-500 rounded-xl text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner cursor-default select-none"
                  autoComplete="off"
                  autoFocus
                />
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <QrCode className="w-5 h-5 text-indigo-400 animate-pulse" />
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
                  className="w-full pl-11 pr-4 py-3 bg-[#191b26] border border-[#2e3347] focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner cursor-default select-none"
                  autoComplete="off"
                />
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Barcode className="w-5 h-5 text-indigo-400" />
                </div>
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
          <div
            className={`p-3.5 rounded-2xl border transition-all duration-200 ${
              isNameScanned && isTableScanned && !selectedShift
                ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/20'
                : selectedShift
                ? 'bg-emerald-950/15 border-emerald-500/40'
                : 'bg-[#191b26]/50 border-[#2e3347]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{language === 'uz' ? '3. Ish smenasini tanlang' : '3. Выберите смену'}</span>
              </label>
              {selectedShift ? (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {language === 'uz' ? `✓ ${selectedShift}-smena` : `✓ ${selectedShift}-я смена`}
                </span>
              ) : isNameScanned && isTableScanned ? (
                <span className="text-[11px] font-bold text-amber-400 animate-pulse">
                  {language === 'uz' ? 'Smenani bosing 👇' : 'Нажмите смену 👇'}
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SHIFTS.map((shift) => {
                const isSelected = selectedShift === shift.id;
                return (
                  <button
                    key={shift.id}
                    type="button"
                    onClick={() => handleShiftSelect(shift.id)}
                    className={`py-2.5 px-1 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer flex flex-col items-center justify-center space-y-0.5 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30 scale-[1.03]'
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

        {/* Action Button: Explicit Confirmation via Login button */}
        <div className="mt-6 pt-3 border-t border-[#2e3347]/80">
          {isLoggingIn ? (
            <div className="w-full py-4 px-6 bg-emerald-600 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 animate-spin" />
              <span>{t.autoLoggingIn}</span>
            </div>
          ) : isNameScanned && isTableScanned ? (
            <button
              type="button"
              onClick={() => {
                if (!selectedShift) {
                  setError(
                    language === 'uz'
                      ? 'Iltimos, avval ish smenasini tanlang!'
                      : 'Пожалуйста, сначала выберите смену!'
                  );
                  soundManager.playErrorSound();
                  return;
                }
                performLogin(name, tableNumber, selectedShift);
              }}
              className={`w-full py-4 px-6 font-extrabold text-base rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer group ${
                selectedShift
                  ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-indigo-600/30 scale-[1.01]'
                  : 'bg-indigo-600/70 hover:bg-indigo-600 text-white shadow-indigo-600/20'
              }`}
            >
              <span>
                {selectedShift
                  ? language === 'uz'
                    ? `${selectedShift}-Smena bilan tizimga kirish`
                    : `Войти в систему (${selectedShift}-я Смена)`
                  : language === 'uz'
                  ? 'Smenani tanlang va kiring'
                  : 'Выберите смену для входа'}
              </span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#191b26] border border-[#2e3347] text-slate-400 text-xs font-semibold text-center">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                {!isNameScanned
                  ? language === 'uz'
                    ? '1-qadam: Xodim beydjidagi QR kodni skanerlang'
                    : 'Шаг 1: Отсканируйте QR-код бейджа'
                  : language === 'uz'
                  ? '2-qadam: Ish stoli shtrix-kodini skanerlang'
                  : 'Шаг 2: Отсканируйте штрих-код стола'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
