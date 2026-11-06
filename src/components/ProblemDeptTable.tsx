'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Language, ScannedItem } from '@/lib/types';
import { soundManager } from '@/lib/sound';
import {
  Package,
  Layers,
  MapPin,
  RotateCcw,
  CheckCircle2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  Users,
  Award,
  TrendingUp,
  Search,
  Clock,
  Sparkles,
  Calendar,
  BarChart3,
  ListFilter,
  ChevronRight,
  FileText
} from 'lucide-react';

interface ProblemDeptTableProps {
  language: Language;
  items: ScannedItem[];
  onUpdateStatus?: (itemId: string, status: ScannedItem['status']) => void;
  onRefresh?: (force?: boolean) => Promise<void> | void;
  sheetUrl?: string;
}

// YYYY-MM-DD formatida sanani aniqlash (barcha timestamp turlariga mos)
export function extractDateStr(ts?: string): string {
  if (!ts) return '';
  const clean = ts.trim();
  // 1. YYYY-MM-DD yoki YYYY/MM/DD
  const ymd = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymd) {
    const y = ymd[1];
    const m = ymd[2].padStart(2, '0');
    const d = ymd[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  // 2. DD.MM.YYYY yoki DD/MM/YYYY
  const dmy = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    const y = dmy[3];
    return `${y}-${m}-${d}`;
  }
  // 3. Fallback: 2026-11-06 kabi boshlansa
  if (clean.length >= 10 && clean[4] === '-' && clean[7] === '-') {
    return clean.slice(0, 10);
  }
  return '';
}

// Sanani DD.MM.YYYY formatida ko'rsatish
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
}

// Haftaning kuni nomi
export function getWeekdayName(dateStr: string, lang: 'uz' | 'ru'): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) return '';
    const day = date.getDay();
    if (lang === 'uz') {
      const days = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
      return days[day];
    } else {
      const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
      return days[day];
    }
  } catch {
    return '';
  }
}

interface DaySummary {
  date: string;
  formattedDate: string;
  weekday: string;
  isToday: boolean;
  isYesterday: boolean;
  itemsCount: number;
  boxesCount: number;
  operatorsCount: number;
  topOperator?: { name: string; itemsCount: number; boxesCount: number };
  topPvz?: { name: string; count: number };
}

export const ProblemDeptTable: React.FC<ProblemDeptTableProps> = ({
  language,
  items,
  onRefresh,
}) => {
  // Parol holati
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Bugungi va kechagi sanalar
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Tanlangan sana va ko'rish rejimi
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<'single' | 'daily_overview' | 'all'>('single');
  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [showDayJournal, setShowDayJournal] = useState<boolean>(false);

  useEffect(() => {
    if (!isUnlocked) {
      passwordInputRef.current?.focus();
      return;
    }

    // ⏳ 2 DAQIQALIK HARAKATSIZLIKDA AVTOMATIK QULFLASH (Inactivity Auto-Lock)
    let autoLockTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(autoLockTimer);
      // 2 daqiqa (120 000 ms) harakatsizlikdan so'ng avtomatik qulflash
      autoLockTimer = setTimeout(() => {
        setIsUnlocked(false);
        setPassword('');
        setPasswordError('');
      }, 120000);
    };

    resetTimer();

    // Harakatlarni kuzatish (sichqoncha, klaviatura, scroll, teginish)
    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    activityEvents.forEach((ev) => window.addEventListener(ev, resetTimer));

    // Brauzer vkladkasi orqaga surilganda (tab blur / minimize)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Boshqa vkladkaga o'tib ketganda 30 soniyada qulflanadi
        clearTimeout(autoLockTimer);
        autoLockTimer = setTimeout(() => {
          setIsUnlocked(false);
          setPassword('');
          setPasswordError('');
        }, 30000);
      } else {
        resetTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(autoLockTimer);
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetTimer));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isUnlocked]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = password.trim().toLowerCase();
    // Parol: Sardor 12345 (yoki Sardor12345)
    if (clean === 'sardor 12345' || clean === 'sardor12345') {
      setIsUnlocked(true);
      setPasswordError('');
      soundManager.playBoxScanSound();
    } else {
      setPasswordError(
        language === 'uz'
          ? 'Noto\'g\'ri parol! Qayta urinib ko\'ring.'
          : 'Неверный пароль! Попробуйте снова.'
      );
      soundManager.playErrorSound();
      passwordInputRef.current?.focus();
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setPassword('');
    setPasswordError('');
    soundManager.playItemScanSound();
  };

  // 📅 BARCHA MAVJUD SANALAR VA ULARNING STATISTIKASI (KUNLIK XULOSA)
  const availableDates = useMemo<DaySummary[]>(() => {
    const dateMap: Record<
      string,
      {
        itemsCount: number;
        boxes: Set<string>;
        operatorMap: Record<string, { itemsCount: number; boxes: Set<string> }>;
        pvzMap: Record<string, number>;
      }
    > = {};

    items.forEach((item) => {
      const d = extractDateStr(item.timestamp);
      if (!d) return;

      if (!dateMap[d]) {
        dateMap[d] = {
          itemsCount: 0,
          boxes: new Set<string>(),
          operatorMap: {},
          pvzMap: {},
        };
      }

      const count = item.count || 1;
      dateMap[d].itemsCount += count;
      if (item.boxNumber && item.boxNumber !== '—') dateMap[d].boxes.add(item.boxNumber);

      const opName =
        item.operator && item.operator.trim()
          ? item.operator.trim()
          : language === 'uz'
          ? 'Noma\'lum xodim'
          : 'Неизвестный сотрудник';
      if (!dateMap[d].operatorMap[opName]) {
        dateMap[d].operatorMap[opName] = { itemsCount: 0, boxes: new Set<string>() };
      }
      dateMap[d].operatorMap[opName].itemsCount += count;
      if (item.boxNumber && item.boxNumber !== '—') {
        dateMap[d].operatorMap[opName].boxes.add(item.boxNumber);
      }

      if (item.pvz && item.pvz !== '—') {
        const p = item.pvz.trim();
        dateMap[d].pvzMap[p] = (dateMap[d].pvzMap[p] || 0) + count;
      }
    });

    return Object.keys(dateMap)
      .sort((a, b) => b.localeCompare(a))
      .map((date) => {
        const dayData = dateMap[date];

        // Top operator for this day
        let topOp: { name: string; itemsCount: number; boxesCount: number } | undefined;
        const sortedOps = Object.entries(dayData.operatorMap).sort(
          (a, b) => b[1].itemsCount - a[1].itemsCount
        );
        if (sortedOps.length > 0) {
          topOp = {
            name: sortedOps[0][0],
            itemsCount: sortedOps[0][1].itemsCount,
            boxesCount: sortedOps[0][1].boxes.size,
          };
        }

        // Top PVZ for this day
        let topPvz: { name: string; count: number } | undefined;
        const sortedPvz = Object.entries(dayData.pvzMap).sort((a, b) => b[1] - a[1]);
        if (sortedPvz.length > 0) {
          topPvz = {
            name: sortedPvz[0][0],
            count: sortedPvz[0][1],
          };
        }

        return {
          date,
          formattedDate: formatDisplayDate(date),
          weekday: getWeekdayName(date, language),
          isToday: date === todayStr,
          isYesterday: date === yesterdayStr,
          itemsCount: dayData.itemsCount,
          boxesCount: dayData.boxes.size,
          operatorsCount: Object.keys(dayData.operatorMap).length,
          topOperator: topOp,
          topPvz,
        };
      });
  }, [items, language, todayStr, yesterdayStr]);

  // Agar tanlangan sana ro'yxatda bo'lmasa, eng oxirgi mavjud sanani tanlash
  useEffect(() => {
    if (availableDates.length > 0) {
      const hasSelected = availableDates.some((d) => d.date === selectedDate);
      if (!hasSelected) {
        // Agar bugungi sana mavjud bo'lsa bugun, aks holda ro'yxatdagi birinchi sana
        const hasToday = availableDates.some((d) => d.date === todayStr);
        setSelectedDate(hasToday ? todayStr : availableDates[0].date);
      }
    }
  }, [availableDates, selectedDate, todayStr]);

  // Tanlangan sana yoki barcha vaqt bo'yicha tovarlar
  const displayedItems = useMemo(() => {
    if (viewMode === 'all') return items;
    return items.filter((item) => {
      const itemDate = extractDateStr(item.timestamp);
      return itemDate === selectedDate;
    });
  }, [items, viewMode, selectedDate]);

  // Jami tovarlar soni (tanlangan sana yoki rejim bo'yicha)
  const totalCount = useMemo(() => {
    return displayedItems.reduce((sum, i) => sum + (i.count || 1), 0);
  }, [displayedItems]);

  // Unikal koruplar soni (tanlangan sana yoki rejim bo'yicha)
  const totalBoxes = useMemo(() => {
    return new Set(displayedItems.map((i) => i.boxNumber)).size;
  }, [displayedItems]);

  // Kunlar orasidagi eng katta tovarlar soni (proportsiya bar uchun)
  const maxDayItemsCount = useMemo(() => {
    return availableDates.reduce((max, d) => Math.max(max, d.itemsCount), 1);
  }, [availableDates]);

  // 👥 XODIMLAR BO'YICHA SAMARADORLIK (TANLANGAN SANA UCHUN REYTING)
  const employeeStats = useMemo(() => {
    const map: Record<
      string,
      {
        operator: string;
        itemsCount: number;
        boxes: Set<string>;
        tables: Set<string>;
        shifts: Set<string>;
        lastTimestamp: string;
      }
    > = {};

    displayedItems.forEach((item) => {
      const name =
        item.operator && item.operator.trim()
          ? item.operator.trim()
          : language === 'uz'
          ? 'Noma\'lum xodim'
          : 'Неизвестный сотрудник';

      if (!map[name]) {
        map[name] = {
          operator: name,
          itemsCount: 0,
          boxes: new Set<string>(),
          tables: new Set<string>(),
          shifts: new Set<string>(),
          lastTimestamp: item.timestamp || '',
        };
      }
      map[name].itemsCount += item.count || 1;
      if (item.boxNumber && item.boxNumber !== '—') map[name].boxes.add(item.boxNumber);
      if (item.tableNumber && item.tableNumber !== '—') map[name].tables.add(item.tableNumber);
      if (item.shift) map[name].shifts.add(String(item.shift));
      if (item.timestamp && (!map[name].lastTimestamp || item.timestamp > map[name].lastTimestamp)) {
        map[name].lastTimestamp = item.timestamp;
      }
    });

    return Object.values(map)
      .map((op) => ({
        operator: op.operator,
        itemsCount: op.itemsCount,
        boxesCount: op.boxes.size,
        tables: Array.from(op.tables).filter((t) => t && t !== '—'),
        shifts: Array.from(op.shifts),
        lastTimestamp: op.lastTimestamp,
        avgPerBox:
          op.boxes.size > 0 ? (op.itemsCount / op.boxes.size).toFixed(1) : op.itemsCount.toString(),
        percent: totalCount > 0 ? Math.round((op.itemsCount / totalCount) * 100) : 0,
      }))
      .sort((a, b) => b.itemsCount - a.itemsCount);
  }, [displayedItems, totalCount, language]);

  // Qidiruv bo'yicha filtrlangan xodimlar
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employeeStats;
    const q = employeeSearch.toLowerCase().trim();
    return employeeStats.filter(
      (e) =>
        e.operator.toLowerCase().includes(q) ||
        e.tables.some((t) => t.toLowerCase().includes(q))
    );
  }, [employeeStats, employeeSearch]);

  const topPerformer = employeeStats.length > 0 ? employeeStats[0] : null;

  // Qaysi PVZ dan ko'proq (Shu sana reytingi)
  const topPvzList = useMemo(() => {
    const pvzMap: Record<string, number> = {};
    displayedItems.forEach((item) => {
      const pvz =
        item.pvz && item.pvz !== '—'
          ? item.pvz.trim()
          : language === 'uz'
          ? 'Noma\'lum PVZ'
          : 'Без ПВЗ';
      pvzMap[pvz] = (pvzMap[pvz] || 0) + (item.count || 1);
    });

    return Object.entries(pvzMap)
      .map(([pvz, count]) => ({ pvz, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Eng ko'p 5 ta PVZ
  }, [displayedItems, language]);

  // Qaysi Prichina (sabab) bo'yicha ko'proq (Shu sana reytingi)
  const topReasonsList = useMemo(() => {
    const reasonMap: Record<string, number> = {};
    displayedItems.forEach((item) => {
      const r = item.reason || item.note || (language === 'uz' ? 'Boshqa' : 'Другое');
      reasonMap[r] = (reasonMap[r] || 0) + (item.count || 1);
    });

    return Object.entries(reasonMap)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Eng ko'p 5 ta Sabab
  }, [displayedItems, language]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    soundManager.playItemScanSound();
    try {
      await onRefresh(true);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'XO';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span
          className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-md shadow-amber-500/30"
          title="1-o'rin (Lider)"
        >
          🥇
        </span>
      );
    }
    if (index === 1) {
      return (
        <span
          className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 flex items-center justify-center font-black text-xs shadow-md shadow-slate-400/20"
          title="2-o'rin"
        >
          🥈
        </span>
      );
    }
    if (index === 2) {
      return (
        <span
          className="w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center font-black text-xs shadow-md shadow-amber-800/30"
          title="3-o'rin"
        >
          🥉
        </span>
      );
    }
    return (
      <span className="w-6 h-6 rounded-full bg-[#25283a] text-slate-400 border border-[#2e3347] flex items-center justify-center font-bold text-xs">
        {index + 1}
      </span>
    );
  };

  // 🔒 AGAR PAROL KIRITILMAGAN BO'LSA — QULF OYNASI
  if (!isUnlocked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] py-8 px-4 animate-fade-in">
        <div className="bg-[#1f2232] border border-[#2e3347] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
          {/* Lock Icon Emblem */}
          <div className="w-16 h-16 rounded-2xl bg-indigo-950/80 border border-indigo-700/80 mx-auto flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-600/20">
            <Lock className="w-8 h-8 text-indigo-400" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {language === 'uz' ? 'Statistika Bo\'limi' : 'Раздел Статистики'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              {language === 'uz'
                ? 'Kunlik va umumiy statistikani ko\'rish uchun maxsus parolni kiriting'
                : 'Введите пароль для доступа к просмотру статистики'}
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>{language === 'uz' ? 'Maxfiy Parol' : 'Пароль доступа'}</span>
              </label>
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder={language === 'uz' ? 'Parolni kiriting...' : 'Введите пароль...'}
                  className="w-full pl-4 pr-11 py-3.5 bg-[#191b26] border border-[#2e3347] focus:border-indigo-500 rounded-2xl text-white placeholder-slate-500 text-base font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {passwordError && (
              <p className="text-rose-400 text-xs font-bold animate-shake">
                {passwordError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer group"
            >
              <span>{language === 'uz' ? 'Kirish' : 'Войти'}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Active day info
  const activeDayInfo = availableDates.find((d) => d.date === selectedDate);

  return (
    <div className="space-y-5 animate-fade-in text-slate-100">
      {/* 📊 ASOSIY STATISTIKA PANELI */}
      <div className="bg-[#1f2232] border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 relative overflow-hidden">
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2e3347] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-700/80 flex items-center justify-center text-indigo-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">
                  {language === 'uz' ? 'Omborxona Statistikasi' : 'Статистика склада'}
                </h2>
                {viewMode === 'single' && (
                  <span className="text-xs font-mono font-black text-indigo-300 bg-indigo-950/80 border border-indigo-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xs">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{formatDisplayDate(selectedDate)}</span>
                    <span className="text-slate-400 font-sans font-bold">
                      ({getWeekdayName(selectedDate, language)})
                    </span>
                    {selectedDate === todayStr && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-sans font-bold">
                        {language === 'uz' ? 'Bugun' : 'Сегодня'}
                      </span>
                    )}
                    {selectedDate === yesterdayStr && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-sans font-bold">
                        {language === 'uz' ? 'Kecha' : 'Вчера'}
                      </span>
                    )}
                  </span>
                )}
                {viewMode === 'daily_overview' && (
                  <span className="text-xs font-mono font-black text-amber-300 bg-amber-950/80 border border-amber-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xs">
                    <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === 'uz' ? 'Kunlik tahlil jadvali' : 'Ежедневная разбивка'}</span>
                  </span>
                )}
                {viewMode === 'all' && (
                  <span className="text-xs font-mono font-black text-sky-300 bg-sky-950/80 border border-sky-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xs">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span>{language === 'uz' ? 'Barcha vaqt bo\'yicha jami' : 'За все время'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {language === 'uz'
                  ? 'Sanalar bo\'yicha alohida xodimlar mehnati, koruplar va tovarlar hisobi'
                  : 'Показатели сотрудников, коробов и товаров с выбором конкретной даты'}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                title={
                  language === 'uz'
                    ? 'Google Sheets dan eng yangi ma\'lumotlarni olish'
                    : 'Обновить данные из Google Sheets'
                }
                className="w-[105px] justify-center flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-300 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 shrink-0 whitespace-nowrap"
              >
                <RotateCcw
                  className={`w-3.5 h-3.5 shrink-0 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`}
                />
                <span>{language === 'uz' ? 'Yangilash' : 'Обновить'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLock}
              title={language === 'uz' ? 'Statistikani qulflash' : 'Заблокировать статистику'}
              className="w-[115px] justify-center flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/80 border border-rose-800/80 text-rose-300 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>{language === 'uz' ? 'Qulflash' : 'Заблокировать'}</span>
            </button>
          </div>
        </div>

        {/* 🗓️ SANA TANLASH VA FILTRLAR PANELI (DATE SELECTOR BAR) */}
        <div className="bg-[#191b26] border border-[#2e3347] rounded-2xl p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Tezkor sana tugmalari */}
            <div className="flex items-center flex-wrap gap-1.5">
              {/* Bugun */}
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(todayStr);
                  setViewMode('single');
                  soundManager.playItemScanSound();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'single' && selectedDate === todayStr
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-[#25283a] text-slate-300 hover:text-white hover:bg-[#2c3046] border border-[#2e3347]'
                }`}
              >
                <span>☀️ {language === 'uz' ? 'Bugun' : 'Сегодня'}</span>
              </button>

              {/* Kecha */}
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(yesterdayStr);
                  setViewMode('single');
                  soundManager.playItemScanSound();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'single' && selectedDate === yesterdayStr
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-[#25283a] text-slate-300 hover:text-white hover:bg-[#2c3046] border border-[#2e3347]'
                }`}
              >
                <span>🌙 {language === 'uz' ? 'Kecha' : 'Вчера'}</span>
              </button>

              {/* Oxirgi 3 ta mavjud sana (tezkor tugmalar) */}
              {availableDates
                .filter((d) => d.date !== todayStr && d.date !== yesterdayStr)
                .slice(0, 3)
                .map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => {
                      setSelectedDate(d.date);
                      setViewMode('single');
                      soundManager.playItemScanSound();
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer hidden md:flex items-center gap-1 ${
                      viewMode === 'single' && selectedDate === d.date
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-[#25283a] text-slate-300 hover:text-white hover:bg-[#2c3046] border border-[#2e3347]'
                    }`}
                  >
                    <span>{d.formattedDate.slice(0, 5)}</span>
                    <span className="text-[10px] text-slate-400">({d.itemsCount})</span>
                  </button>
                ))}

              <div className="h-5 w-px bg-[#2e3347] mx-1 hidden sm:block" />

              {/* Kunlar jadvali rejimi */}
              <button
                type="button"
                onClick={() => {
                  setViewMode('daily_overview');
                  soundManager.playBoxScanSound();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'daily_overview'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'bg-[#25283a] text-amber-300/80 hover:text-amber-200 hover:bg-[#2c3046] border border-amber-900/50'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{language === 'uz' ? 'Kunlik tahlil' : 'По дням'}</span>
              </button>

              {/* Barcha vaqt bo'yicha jami */}
              <button
                type="button"
                onClick={() => {
                  setViewMode('all');
                  soundManager.playItemScanSound();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'all'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-[#25283a] text-slate-300 hover:text-white hover:bg-[#2c3046] border border-[#2e3347]'
                }`}
              >
                <span>📅 {language === 'uz' ? 'Barchasi' : 'Все время'}</span>
              </button>
            </div>

            {/* Kalendar & Sanalar Ro'yxati Dropdown */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Kalendar Input */}
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      setViewMode('single');
                      soundManager.playItemScanSound();
                    }
                  }}
                  className="bg-[#161822] border border-[#2e3347] focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/20 cursor-pointer shadow-inner"
                />
              </div>

              {/* Mavjud sanalar select dropdown */}
              {availableDates.length > 0 && (
                <div className="relative min-w-[200px] w-full sm:w-auto">
                  <select
                    value={viewMode === 'single' ? selectedDate : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedDate(e.target.value);
                        setViewMode('single');
                        soundManager.playItemScanSound();
                      }
                    }}
                    className="w-full bg-[#161822] border border-[#2e3347] focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    <option value="" disabled>
                      {language === 'uz' ? '🗓️ Sanani tanlang...' : '🗓️ Выберите дату...'}
                    </option>
                    {availableDates.map((d) => (
                      <option key={d.date} value={d.date}>
                        {d.formattedDate} — {d.weekday}{' '}
                        {d.isToday ? (language === 'uz' ? '(Bugun)' : '(Сегодня)') : ''} (
                        {d.itemsCount} {language === 'uz' ? 'tovar' : 'тов.'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* REJIM 1: KUNLIK TAHLIL JADVALI (BARCHA KUNLARNING ALOHIDA TAQQOSLANISHI)  */}
        {/* ========================================================================= */}
        {viewMode === 'daily_overview' && (
          <div className="bg-[#191b26] border border-[#2e3347] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2e3347] pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    {language === 'uz'
                      ? 'Sanalar bo\'yicha kunlik hisobotlar jadvali'
                      : 'Таблица ежедневных отчетов по датам'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'uz'
                      ? 'Istalgan sananing ustiga bosib, uning batafsil statistikasini ko\'rishingiz mumkin'
                      : 'Нажмите на любую дату, чтобы просмотреть ее подробную статистику'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 bg-[#25283a] px-2.5 py-1 rounded-lg">
                {availableDates.length} {language === 'uz' ? 'kun ma\'lumoti' : 'дней в базе'}
              </span>
            </div>

            {availableDates.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs sm:text-sm font-bold">
                {language === 'uz'
                  ? 'Hozircha sanalar bo\'yicha ma\'lumotlar mavjud emas'
                  : 'Данные по датам пока отсутствуют'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#2e3347] text-slate-400 uppercase tracking-wider font-black text-[10px]">
                      <th className="py-3 px-4">{language === 'uz' ? 'Sana' : 'Дата'}</th>
                      <th className="py-3 px-4 text-right">
                        {language === 'uz' ? 'Fiksatsiya tovarlari' : 'Товаров'}
                      </th>
                      <th className="py-3 px-4 text-center">
                        {language === 'uz' ? 'Koruplar' : 'Коробов'}
                      </th>
                      <th className="py-3 px-4 text-center">
                        {language === 'uz' ? 'Xodimlar' : 'Сотрудников'}
                      </th>
                      <th className="py-3 px-4">
                        {language === 'uz' ? 'Kunning yetakchi xodimi' : 'Лидер дня'}
                      </th>
                      <th className="py-3 px-4">
                        {language === 'uz' ? 'Asosiy PVZ' : 'Топ ПВЗ'}
                      </th>
                      <th className="py-3 px-4 text-center">
                        {language === 'uz' ? 'Amal' : 'Действие'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2e3347]/60">
                    {availableDates.map((day) => {
                      const percentOfMax = Math.round((day.itemsCount / maxDayItemsCount) * 100);
                      const isCurrent = selectedDate === day.date;
                      return (
                        <tr
                          key={day.date}
                          className={`hover:bg-indigo-950/20 transition-colors ${
                            isCurrent ? 'bg-indigo-950/30' : ''
                          }`}
                        >
                          {/* 1. Sana & Kun */}
                          <td className="py-3.5 px-4 font-bold text-white">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-black">
                                {day.formattedDate}
                              </span>
                              <span className="text-slate-400 text-xs font-sans">
                                ({day.weekday})
                              </span>
                              {day.isToday && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-bold font-sans">
                                  {language === 'uz' ? 'Bugun' : 'Сегодня'}
                                </span>
                              )}
                              {day.isYesterday && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold font-sans">
                                  {language === 'uz' ? 'Kecha' : 'Вчера'}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 2. Tovarlar soni va progress bar */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-mono font-black text-emerald-400 text-sm">
                                {day.itemsCount}{' '}
                                <span className="text-[10px] text-slate-400">
                                  {language === 'uz' ? 'dona' : 'шт.'}
                                </span>
                              </span>
                              <div className="w-24 bg-[#25283a] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full"
                                  style={{ width: `${percentOfMax}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* 3. Koruplar soni */}
                          <td className="py-3.5 px-4 text-center font-mono font-black text-indigo-300 text-sm">
                            {day.boxesCount}{' '}
                            <span className="text-[10px] text-slate-400">
                              {language === 'uz' ? 'ta' : 'кор.'}
                            </span>
                          </td>

                          {/* 4. Xodimlar soni */}
                          <td className="py-3.5 px-4 text-center font-mono font-black text-sky-400 text-sm">
                            {day.operatorsCount}{' '}
                            <span className="text-[10px] text-slate-400">
                              {language === 'uz' ? 'nafar' : 'чел.'}
                            </span>
                          </td>

                          {/* 5. Kunning yetakchisi */}
                          <td className="py-3.5 px-4">
                            {day.topOperator ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-amber-400 text-xs">🏆</span>
                                <span className="font-bold text-slate-200 truncate max-w-[170px]">
                                  {day.topOperator.name}
                                </span>
                                <span className="text-amber-300 font-mono text-[11px] font-bold">
                                  ({day.topOperator.itemsCount})
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>

                          {/* 6. Asosiy PVZ */}
                          <td className="py-3.5 px-4 font-bold text-slate-300">
                            {day.topPvz ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-indigo-400" />
                                <span className="truncate max-w-[130px]">{day.topPvz.name}</span>
                                <span className="text-indigo-400 font-mono text-[11px]">
                                  ({day.topPvz.count})
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>

                          {/* 7. Amal: Batafsil ko'rish */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDate(day.date);
                                setViewMode('single');
                                soundManager.playBoxScanSound();
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1 mx-auto"
                            >
                              <span>{language === 'uz' ? 'Ko\'rish' : 'Смотреть'}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* REJIM 2: AYRANCHA TANLANGAN KUN STATISTIKASI (YOKI BARCHASI)             */}
        {/* ========================================================================= */}
        {viewMode !== 'daily_overview' && (
          <>
            {/* AGAR TANLANGAN SANADA MA'LUMOT BO'LMASA */}
            {displayedItems.length === 0 ? (
              <div className="bg-[#191b26] border border-[#2e3347] rounded-2xl p-8 sm:p-12 text-center space-y-4">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {language === 'uz'
                      ? `${formatDisplayDate(selectedDate)} sanasida fiksatsiyalar topilmadi`
                      : `За ${formatDisplayDate(selectedDate)} записей не найдено`}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {language === 'uz'
                      ? 'Ushbu sanada tovarlar fiksatsiya qilinmagan. Boshqa sanani tanlang yoki quyidagi mavjud sanalardan biriga o\'ting:'
                      : 'В выбранную дату товары не сканировались. Выберите другую дату или перейдите к одной из доступных:'}
                  </p>
                </div>

                {availableDates.length > 0 && (
                  <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
                    {availableDates.slice(0, 6).map((d) => (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => {
                          setSelectedDate(d.date);
                          setViewMode('single');
                          soundManager.playItemScanSound();
                        }}
                        className="px-3 py-1.5 bg-[#25283a] hover:bg-indigo-600 hover:text-white border border-[#2e3347] rounded-xl text-xs font-bold text-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{d.formattedDate}</span>
                        <span className="text-[10px] text-slate-400">({d.itemsCount})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* 1. TOP STATS CARDS: SHU SANADAGI JAMI KO'RSATKICHLAR (4 CARDS) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Card 1: Tovarlar soni */}
                  <div className="bg-[#191b26] border border-[#2e3347] rounded-2xl p-4 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        {language === 'uz' ? 'Fiksatsiya tovarlari' : 'Зафиксировано'}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                        {totalCount}{' '}
                        <span className="text-xs font-bold text-slate-400">
                          {language === 'uz' ? 'dona' : 'шт.'}
                        </span>
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-950/70 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card 2: Koruplar soni */}
                  <div className="bg-[#191b26] border border-[#2e3347] rounded-2xl p-4 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        {language === 'uz' ? 'Koruplar' : 'Коробов'}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black font-mono text-indigo-400">
                        {totalBoxes}{' '}
                        <span className="text-xs font-bold text-slate-400">
                          {language === 'uz' ? 'ta quti' : 'кор.'}
                        </span>
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-950/70 border border-indigo-800/80 flex items-center justify-center text-indigo-400 shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card 3: Faol xodimlar */}
                  <div className="bg-[#191b26] border border-[#2e3347] rounded-2xl p-4 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        {language === 'uz' ? 'Faol xodimlar' : 'Сотрудников'}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black font-mono text-sky-400">
                        {employeeStats.length}{' '}
                        <span className="text-xs font-bold text-slate-400">
                          {language === 'uz' ? 'nafar' : 'чел.'}
                        </span>
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-sky-950/70 border border-sky-800/80 flex items-center justify-center text-sky-400 shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card 4: Eng yuqori ko'rsatkich (Top performer) */}
                  <div className="bg-[#191b26] border border-[#2e3347] rounded-2xl p-4 flex items-center justify-between">
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>
                          {language === 'uz'
                            ? viewMode === 'all'
                              ? 'Yetakchi xodim'
                              : 'Kunning yetakchisi'
                            : 'Лидер'}
                        </span>
                      </span>
                      <div className="truncate font-black text-sm sm:text-base text-white">
                        {topPerformer ? topPerformer.operator : '—'}
                      </div>
                      {topPerformer && (
                        <span className="text-[11px] font-mono text-amber-300 font-bold">
                          {topPerformer.itemsCount} {language === 'uz' ? 'dona' : 'шт.'} (
                          {topPerformer.boxesCount} {language === 'uz' ? 'quti' : 'кор.'})
                        </span>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-950/70 border border-amber-800/80 flex items-center justify-center text-amber-400 shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* 2. 👥 XODIMLAR BO'YICHA SAMARADORLIK (SHU KUNDA KIM QANCHA QILGAN) */}
                <div className="bg-[#191b26] border border-[#2e3347] rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2e3347] pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-400" />
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                          <span>
                            {language === 'uz'
                              ? viewMode === 'all'
                                ? 'Barcha davr bo\'yicha xodimlar reytingi'
                                : `${formatDisplayDate(selectedDate)} kungi xodimlar reytingi`
                              : viewMode === 'all'
                              ? 'Рейтинг сотрудников за все время'
                              : `Рейтинг сотрудников за ${formatDisplayDate(selectedDate)}`}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-400 bg-[#25283a] px-2 py-0.5 rounded-md">
                            {filteredEmployees.length} {language === 'uz' ? 'xodim' : 'сотр.'}
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {language === 'uz'
                            ? 'Aynan tanlangan kunda eng ko\'p tovar chiqargan xodimlar bo\'yicha tartiblangan'
                            : 'Отсортировано по количеству товаров за выбранную дату'}
                        </p>
                      </div>
                    </div>

                    {/* Xodim bo'yicha qidiruv */}
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        placeholder={
                          language === 'uz'
                            ? 'Xodim FIO yoki stol...'
                            : 'Поиск по ФИО или столу...'
                        }
                        className="w-full pl-9 pr-3 py-1.5 bg-[#161822] border border-[#2e3347] focus:border-indigo-500 rounded-xl text-white placeholder-slate-500 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all"
                      />
                      {employeeSearch && (
                        <button
                          type="button"
                          onClick={() => setEmployeeSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredEmployees.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs sm:text-sm font-bold space-y-1">
                      <Users className="w-8 h-8 mx-auto text-slate-600 mb-1" />
                      <p>
                        {employeeSearch
                          ? language === 'uz'
                            ? 'Ushbu qidiruv bo\'yicha xodim topilmadi'
                            : 'Сотрудник по данному запросу не найден'
                          : language === 'uz'
                          ? 'Tanlangan sanada xodimlar fiksatsiyalari mavjud emas'
                          : 'В выбранной дате нет записей сотрудников'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* DESKTOP TABLE VIEW */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-[#2e3347] text-slate-400 uppercase tracking-wider font-black text-[10px]">
                              <th className="py-3 px-3 w-14 text-center">№</th>
                              <th className="py-3 px-4">
                                {language === 'uz' ? 'Xodim (FIO)' : 'Сотрудник (ФИО)'}
                              </th>
                              <th className="py-3 px-4 text-center">
                                {language === 'uz' ? 'Stol raqami' : 'Номер стола'}
                              </th>
                              <th className="py-3 px-4 text-right">
                                {language === 'uz' ? 'Tovar soni' : 'Товаров'}
                              </th>
                              <th className="py-3 px-4 text-right">
                                {language === 'uz' ? 'Koruplar soni' : 'Коробов'}
                              </th>
                              <th className="py-3 px-4 text-right">
                                {language === 'uz' ? 'Shu kungi ulushi' : 'Доля дня'}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#2e3347]/60">
                            {filteredEmployees.map((emp, idx) => (
                              <tr
                                key={emp.operator}
                                className={`hover:bg-indigo-950/20 transition-colors ${
                                  idx === 0 ? 'bg-amber-950/10' : ''
                                }`}
                              >
                                {/* 1. O'rin / Rank */}
                                <td className="py-3.5 px-3 text-center">
                                  <div className="flex items-center justify-center">
                                    {getRankBadge(idx)}
                                  </div>
                                </td>

                                {/* 2. Xodim FIO */}
                                <td className="py-3.5 px-4 font-bold text-white">
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                        idx === 0
                                          ? 'bg-amber-500 text-slate-950 shadow-xs shadow-amber-500/30'
                                          : idx === 1
                                          ? 'bg-slate-300 text-slate-900'
                                          : idx === 2
                                          ? 'bg-amber-800 text-white'
                                          : 'bg-[#25283a] text-indigo-300 border border-indigo-900/60'
                                      }`}
                                    >
                                      {getInitials(emp.operator)}
                                    </div>
                                    <span className="truncate max-w-[260px] text-slate-100 font-black text-sm sm:text-base">
                                      {emp.operator}
                                    </span>
                                  </div>
                                </td>

                                {/* 3. Stol raqami */}
                                <td className="py-3.5 px-4 text-center">
                                  {emp.tables.length > 0 ? (
                                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                      {emp.tables.map((tbl, tIdx) => (
                                        <span
                                          key={tIdx}
                                          className="px-2.5 py-1 bg-indigo-950/80 border border-indigo-700/70 rounded-lg font-mono text-xs font-bold text-indigo-300"
                                        >
                                          {tbl}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-500 font-bold">—</span>
                                  )}
                                </td>

                                {/* 4. Tovar soni */}
                                <td className="py-3.5 px-4 text-right font-mono font-black text-base text-emerald-400">
                                  {emp.itemsCount}{' '}
                                  <span className="text-xs font-bold text-slate-400">
                                    {language === 'uz' ? 'dona' : 'шт.'}
                                  </span>
                                </td>

                                {/* 5. Koruplar soni */}
                                <td className="py-3.5 px-4 text-right font-mono font-black text-base text-indigo-300">
                                  {emp.boxesCount}{' '}
                                  <span className="text-xs font-bold text-slate-400">
                                    {language === 'uz' ? 'ta' : 'кор.'}
                                  </span>
                                </td>

                                {/* 6. Foiz ulushi */}
                                <td className="py-3.5 px-4 text-right">
                                  <span className="px-2.5 py-1 bg-[#25283a] border border-[#2e3347] rounded-lg font-mono text-xs font-bold text-slate-300">
                                    {emp.percent}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* MOBILE CARDS VIEW */}
                      <div className="block md:hidden space-y-2.5">
                        {filteredEmployees.map((emp, idx) => (
                          <div
                            key={emp.operator}
                            className={`p-3.5 rounded-2xl bg-[#161822] border border-[#2e3347] space-y-2.5 ${
                              idx === 0 ? 'border-amber-500/40 bg-amber-950/10' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {getRankBadge(idx)}
                                <span className="font-extrabold text-sm text-white truncate max-w-[180px]">
                                  {emp.operator}
                                </span>
                              </div>
                              {emp.tables.length > 0 && (
                                <span className="px-2 py-0.5 bg-indigo-950/80 border border-indigo-700/60 rounded-md font-mono text-[10px] font-bold text-indigo-300">
                                  {emp.tables.join(', ')}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-[#191b26] p-2.5 rounded-xl border border-[#2e3347]/60">
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                                  {language === 'uz' ? 'Tovarlar' : 'Товаров'}
                                </span>
                                <span className="font-mono font-black text-emerald-400 text-sm sm:text-base">
                                  {emp.itemsCount} {language === 'uz' ? 'dona' : 'шт.'}{' '}
                                  <span className="text-slate-500 text-xs">({emp.percent}%)</span>
                                </span>
                              </div>
                              <div className="bg-[#191b26] p-2.5 rounded-xl border border-[#2e3347]/60">
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                                  {language === 'uz' ? 'Koruplar' : 'Коробов'}
                                </span>
                                <span className="font-mono font-black text-indigo-300 text-sm sm:text-base">
                                  {emp.boxesCount} {language === 'uz' ? 'ta' : 'кор.'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* 3. ANALITIKA REYTINGLARI: QAYSI PVZ VA QAYSI PRICHINA KO'PROQ (SHU SANA UCHUN) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* A. Qaysi PVZ dan ko'proq */}
                  <div className="bg-[#191b26] border border-[#2e3347] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-indigo-400" />
                        <span>
                          {language === 'uz'
                            ? `Top PVZ (${viewMode === 'all' ? 'Barchasi' : formatDisplayDate(selectedDate)})`
                            : `Топ ПВЗ (${viewMode === 'all' ? 'Все время' : formatDisplayDate(selectedDate)})`}
                        </span>
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        {language === 'uz' ? 'Top 5' : 'Топ 5'}
                      </span>
                    </div>

                    {topPvzList.length === 0 ? (
                      <div className="py-6 text-center text-slate-500 text-xs font-bold">
                        {language === 'uz' ? 'Hozircha fiksatsiyalar mavjud emas' : 'Записей пока нет'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {topPvzList.map((item, idx) => {
                          const percent =
                            totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
                          return (
                            <div key={item.pvz} className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="flex items-center gap-1.5 text-white">
                                  <span
                                    className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-black ${
                                      idx === 0
                                        ? 'bg-amber-500 text-black'
                                        : 'bg-[#25283a] text-slate-400'
                                    }`}
                                  >
                                    {idx + 1}
                                  </span>
                                  <span className="truncate max-w-[180px] sm:max-w-[220px]">
                                    {item.pvz}
                                  </span>
                                </span>
                                <span className="font-mono text-indigo-300">
                                  {item.count} {language === 'uz' ? 'dona' : 'шт.'}{' '}
                                  <span className="text-slate-500 text-[10px]">({percent}%)</span>
                                </span>
                              </div>
                              {/* Progress bar */}
                              <div className="w-full bg-[#25283a] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* B. Qaysi Prichina (sabab) bo'yicha ko'proq */}
                  <div className="bg-[#191b26] border border-[#2e3347] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        <span>
                          {language === 'uz'
                            ? `Top Sabablar (${viewMode === 'all' ? 'Barchasi' : formatDisplayDate(selectedDate)})`
                            : `Топ причин (${viewMode === 'all' ? 'Все время' : formatDisplayDate(selectedDate)})`}
                        </span>
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        {language === 'uz' ? 'Top 5' : 'Топ 5'}
                      </span>
                    </div>

                    {topReasonsList.length === 0 ? (
                      <div className="py-6 text-center text-slate-500 text-xs font-bold">
                        {language === 'uz' ? 'Hozircha fiksatsiyalar mavjud emas' : 'Записей пока нет'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {topReasonsList.map((item, idx) => {
                          const percent =
                            totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
                          return (
                            <div key={item.reason} className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="flex items-center gap-1.5 text-white">
                                  <span
                                    className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-black ${
                                      idx === 0
                                        ? 'bg-amber-500 text-black'
                                        : 'bg-[#25283a] text-slate-400'
                                    }`}
                                  >
                                    {idx + 1}
                                  </span>
                                  <span className="truncate max-w-[180px] sm:max-w-[220px] text-amber-200">
                                    {item.reason}
                                  </span>
                                </span>
                                <span className="font-mono text-amber-300">
                                  {item.count} {language === 'uz' ? 'dona' : 'шт.'}{' '}
                                  <span className="text-slate-500 text-[10px]">({percent}%)</span>
                                </span>
                              </div>
                              {/* Progress bar */}
                              <div className="w-full bg-[#25283a] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. 📋 SHU KUNGI TOVARLAR JURNALI (OXIRGI FIKSATSIYALAR RO'YXATI - TOGGLEABLE) */}
                <div className="bg-[#191b26] border border-[#2e3347] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                        {language === 'uz'
                          ? `Fiksatsiyalar Jurnali (${displayedItems.length} ta yozuv)`
                          : `Журнал фиксаций (${displayedItems.length} записей)`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowDayJournal(!showDayJournal)}
                      className="px-3 py-1 bg-[#25283a] hover:bg-indigo-600 hover:text-white border border-[#2e3347] rounded-xl text-xs font-bold text-slate-300 transition-all cursor-pointer"
                    >
                      {showDayJournal
                        ? language === 'uz'
                          ? 'Yashirish ✕'
                          : 'Скрыть ✕'
                        : language === 'uz'
                        ? 'Jadvalni ko\'rish 👁️'
                        : 'Открыть список 👁️'}
                    </button>
                  </div>

                  {showDayJournal && (
                    <div className="overflow-x-auto max-h-96 overflow-y-auto no-scrollbar pt-2 border-t border-[#2e3347]">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-[#191b26] z-10">
                          <tr className="border-b border-[#2e3347] text-slate-400 uppercase tracking-wider font-black text-[10px]">
                            <th className="py-2.5 px-3">
                              {language === 'uz' ? 'Vaqt' : 'Время'}
                            </th>
                            <th className="py-2.5 px-3">
                              {language === 'uz' ? 'Korup №' : 'Короб №'}
                            </th>
                            <th className="py-2.5 px-3">
                              {language === 'uz' ? 'Shtrix-kod' : 'Штрих-код'}
                            </th>
                            <th className="py-2.5 px-3">PVZ</th>
                            <th className="py-2.5 px-3">
                              {language === 'uz' ? 'Xodim' : 'Сотрудник'}
                            </th>
                            <th className="py-2.5 px-3 text-center">
                              {language === 'uz' ? 'Stol' : 'Стол'}
                            </th>
                            <th className="py-2.5 px-3">
                              {language === 'uz' ? 'Sabab' : 'Причина'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2e3347]/50 font-medium">
                          {displayedItems.slice(0, 100).map((it, idx) => {
                            const timePart = it.timestamp
                              ? it.timestamp.split(' ')[1] || it.timestamp
                              : '—';
                            return (
                              <tr key={it.id || idx} className="hover:bg-indigo-950/20 text-slate-200">
                                <td className="py-2 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                                  {timePart}
                                </td>
                                <td className="py-2 px-3 font-mono font-bold text-indigo-300">
                                  {it.boxNumber || '—'}
                                </td>
                                <td className="py-2 px-3 font-mono font-bold text-emerald-400">
                                  {it.barcode}
                                </td>
                                <td className="py-2 px-3 font-bold text-white whitespace-nowrap">
                                  {it.pvz || '—'}
                                </td>
                                <td className="py-2 px-3 text-slate-300 font-bold truncate max-w-[160px]">
                                  {it.operator || '—'}
                                </td>
                                <td className="py-2 px-3 text-center font-mono text-[11px] text-indigo-300">
                                  {it.tableNumber || '—'}
                                </td>
                                <td className="py-2 px-3 text-amber-300/90 text-xs">
                                  {it.reason || it.note || '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {displayedItems.length > 100 && (
                        <div className="py-2 text-center text-[11px] text-slate-500 font-bold border-t border-[#2e3347]">
                          {language === 'uz'
                            ? `(Faqat oxirgi 100 ta yozuv ko'rsatildi, jami: ${displayedItems.length} ta)`
                            : `(Показаны последние 100 записей из ${displayedItems.length})`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
