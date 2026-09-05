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
  Calendar
} from 'lucide-react';

interface ProblemDeptTableProps {
  language: Language;
  items: ScannedItem[];
  onUpdateStatus?: (itemId: string, status: ScannedItem['status']) => void;
  onRefresh?: () => Promise<void> | void;
  sheetUrl?: string;
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

  // Monitoring filtrlari
  const [periodFilter, setPeriodFilter] = useState<'today' | 'all'>('today');
  const [employeeSearch, setEmployeeSearch] = useState<string>('');

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
      setPasswordError(language === 'uz' ? 'Noto\'g\'ri parol! Qayta urinib ko\'ring.' : 'Неверный пароль! Попробуйте снова.');
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

  // Bugungi sana (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Tanlangan davr bo'yicha tovarlar
  const displayedItems = useMemo(() => {
    if (periodFilter === 'all') return items;
    return items.filter((item) => {
      const itemDate = item.timestamp ? item.timestamp.slice(0, 10) : '';
      return itemDate === todayStr;
    });
  }, [items, periodFilter, todayStr]);

  // Jami tovarlar soni
  const totalCount = useMemo(() => {
    return displayedItems.reduce((sum, i) => sum + (i.count || 1), 0);
  }, [displayedItems]);

  // Unikal koruplar soni
  const totalBoxes = useMemo(() => {
    return new Set(displayedItems.map((i) => i.boxNumber)).size;
  }, [displayedItems]);

  // 👥 XODIMLAR BO'YICHA SAMARADORLIK (Kim qancha qilyapti)
  const employeeStats = useMemo(() => {
    const map: Record<string, {
      operator: string;
      itemsCount: number;
      boxes: Set<string>;
      tables: Set<string>;
      shifts: Set<string>;
      lastTimestamp: string;
    }> = {};

    displayedItems.forEach((item) => {
      const name = (item.operator && item.operator.trim())
        ? item.operator.trim()
        : (language === 'uz' ? 'Noma\'lum xodim' : 'Неизвестный сотрудник');

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
      map[name].itemsCount += (item.count || 1);
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
        avgPerBox: op.boxes.size > 0 ? (op.itemsCount / op.boxes.size).toFixed(1) : op.itemsCount.toString(),
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

  // Qaysi PVZ dan ko'proq (Reyting)
  const topPvzList = useMemo(() => {
    const pvzMap: Record<string, number> = {};
    displayedItems.forEach((item) => {
      const pvz = (item.pvz && item.pvz !== '—') ? item.pvz.trim() : (language === 'uz' ? 'Noma\'lum PVZ' : 'Без ПВЗ');
      pvzMap[pvz] = (pvzMap[pvz] || 0) + (item.count || 1);
    });

    return Object.entries(pvzMap)
      .map(([pvz, count]) => ({ pvz, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Eng ko'p 5 ta PVZ
  }, [displayedItems, language]);

  // Qaysi Prichina (sabab) bo'yicha ko'proq (Reyting)
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
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const formatActivityTime = (ts: string) => {
    if (!ts) return '—';
    if (ts.includes(' ')) {
      return ts.split(' ')[1];
    }
    if (ts.includes('T')) {
      return ts.split('T')[1]?.slice(0, 8) || ts;
    }
    return ts;
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
        <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-md shadow-amber-500/30" title="1-o'rin (Lider)">
          🥇
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 flex items-center justify-center font-black text-xs shadow-md shadow-slate-400/20" title="2-o'rin">
          🥈
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center font-black text-xs shadow-md shadow-amber-800/30" title="3-o'rin">
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
              {language === 'uz' ? 'Monitoring Bo\'limi' : 'Раздел Мониторинга'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              {language === 'uz'
                ? 'Ma\'lumotlarni ko\'rish uchun maxsus parolni kiriting'
                : 'Введите пароль для доступа к просмотру аналитики'}
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

  return (
    <div className="space-y-5 animate-fade-in text-slate-100">
      {/* 📊 ASOSIY MONITORING PANELI */}
      <div className="bg-[#1f2232] border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 relative overflow-hidden">
        
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2e3347] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-700/80 flex items-center justify-center text-indigo-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{language === 'uz' ? 'Omborxona Monitoringi' : 'Мониторинг склада'}</span>
                <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded-lg">
                  {periodFilter === 'today' ? todayStr : (language === 'uz' ? 'Barcha vaqt' : 'Все время')}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {language === 'uz'
                  ? 'Xodimlar mehnati, koruplar va tovarlar hisobi'
                  : 'Показатели сотрудников, выработка и учет коробов'}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Davr tanlash tugmalari: Bugun / Barchasi */}
            <div className="bg-[#161822] p-1 rounded-xl border border-[#2e3347] flex items-center">
              <button
                type="button"
                onClick={() => setPeriodFilter('today')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  periodFilter === 'today'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'uz' ? '☀️ Bugun' : '☀️ Сегодня'}
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  periodFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'uz' ? '📅 Barchasi' : '📅 Все время'}
              </button>
            </div>

            {onRefresh && (
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                title={language === 'uz' ? 'Google Sheets dan ma\'lumotlarni yangilash' : 'Обновить данные из Google Sheets'}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-300 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
                <span>{language === 'uz' ? 'Yangilash' : 'Обновить'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLock}
              title={language === 'uz' ? 'Monitoringni qulflash' : 'Заблокировать мониторинг'}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/80 border border-rose-800/80 text-rose-300 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{language === 'uz' ? 'Qulflash' : 'Заблокировать'}</span>
            </button>
          </div>
        </div>

        {/* 1. TOP STATS CARDS: JAMI KO'RSATKICHLAR (4 CARDS) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Tovarlar soni */}
          <div className="bg-[#191b26] border border-[#2e3347] rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                {language === 'uz' ? 'Fiksatsiya qilingan' : 'Зафиксировано'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                {totalCount}{' '}
                <span className="text-xs font-bold text-slate-400">{language === 'uz' ? 'dona' : 'шт.'}</span>
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
                <span className="text-xs font-bold text-slate-400">{language === 'uz' ? 'ta quti' : 'кор.'}</span>
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
                <span className="text-xs font-bold text-slate-400">{language === 'uz' ? 'nafar' : 'чел.'}</span>
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
                <span>{language === 'uz' ? 'Eng sermahsul' : 'Лидер смены'}</span>
              </span>
              <div className="truncate font-black text-sm sm:text-base text-white">
                {topPerformer ? topPerformer.operator : '—'}
              </div>
              {topPerformer && (
                <span className="text-[11px] font-mono text-amber-300 font-bold">
                  {topPerformer.itemsCount} {language === 'uz' ? 'dona' : 'шт.'} ({topPerformer.boxesCount} {language === 'uz' ? 'quti' : 'кор.'})
                </span>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-950/70 border border-amber-800/80 flex items-center justify-center text-amber-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 2. 👥 XODIMLAR BO'YICHA SAMARADORLIK (Kim qancha qilyapti) */}
        <div className="bg-[#191b26] border border-[#2e3347] rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2e3347] pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span>
                    {language === 'uz'
                      ? 'Xodimlar samaradorligi (Kim qancha qilyapti)'
                      : 'Показатели сотрудников (Рейтинг выработки)'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400 bg-[#25283a] px-2 py-0.5 rounded-md">
                    {filteredEmployees.length} {language === 'uz' ? 'xodim' : 'сотр.'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {language === 'uz'
                    ? 'Eng ko\'p tovar chiqargan xodimlar bo\'yicha tartiblangan'
                    : 'Отсортировано по общему количеству зафиксированных товаров'}
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
                placeholder={language === 'uz' ? 'Xodim FIO yoki stol...' : 'Поиск по ФИО или столу...'}
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
                  ? (language === 'uz' ? 'Ushbu qidiruv bo\'yicha xodim topilmadi' : 'Сотрудник по данному запросу не найден')
                  : (language === 'uz' ? 'Tanlangan davrda xodimlar fiksatsiyalari mavjud emas' : 'В выбранном периоде нет записей сотрудников')}
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#2e3347] text-slate-400 uppercase tracking-wider font-black text-[10px]">
                      <th className="py-2.5 px-3 w-14 text-center">№</th>
                      <th className="py-2.5 px-3">{language === 'uz' ? 'Xodim (FIO)' : 'Сотрудник (ФИО)'}</th>
                      <th className="py-2.5 px-3 text-center">{language === 'uz' ? 'Stol raqami' : 'Номер стола'}</th>
                      <th className="py-2.5 px-3 text-right">{language === 'uz' ? 'Tovar soni' : 'Товаров'}</th>
                      <th className="py-2.5 px-3 text-right">{language === 'uz' ? 'Koruplar' : 'Коробов'}</th>
                      <th className="py-2.5 px-3 text-right">{language === 'uz' ? 'O\'rtacha / korup' : 'Ср. на короб'}</th>
                      <th className="py-2.5 px-4 w-48">{language === 'uz' ? 'Ulushi (Foiz)' : 'Доля в выработке'}</th>
                      <th className="py-2.5 px-3 text-right">{language === 'uz' ? 'Oxirgi faollik' : 'Посл. запись'}</th>
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
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center">
                            {getRankBadge(idx)}
                          </div>
                        </td>

                        {/* 2. Xodim FIO */}
                        <td className="py-3 px-3 font-bold text-white">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 ${
                              idx === 0
                                ? 'bg-amber-500 text-slate-950 shadow-xs shadow-amber-500/30'
                                : idx === 1
                                ? 'bg-slate-300 text-slate-900'
                                : idx === 2
                                ? 'bg-amber-800 text-white'
                                : 'bg-[#25283a] text-indigo-300 border border-indigo-900/60'
                            }`}>
                              {getInitials(emp.operator)}
                            </div>
                            <span className="truncate max-w-[200px] text-slate-100 font-extrabold">
                              {emp.operator}
                            </span>
                          </div>
                        </td>

                        {/* 3. Stol raqami */}
                        <td className="py-3 px-3 text-center">
                          {emp.tables.length > 0 ? (
                            <div className="flex items-center justify-center gap-1 flex-wrap">
                              {emp.tables.map((tbl, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="px-2 py-0.5 bg-indigo-950/70 border border-indigo-700/60 rounded-md font-mono text-[11px] font-bold text-indigo-300"
                                >
                                  {tbl}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>

                        {/* 4. Tovar soni */}
                        <td className="py-3 px-3 text-right font-mono font-black text-sm text-emerald-400">
                          {emp.itemsCount}{' '}
                          <span className="text-[10px] font-normal text-slate-400">{language === 'uz' ? 'dona' : 'шт.'}</span>
                        </td>

                        {/* 5. Koruplar soni */}
                        <td className="py-3 px-3 text-right font-mono font-black text-indigo-300">
                          {emp.boxesCount}{' '}
                          <span className="text-[10px] font-normal text-slate-400">{language === 'uz' ? 'ta' : 'кор.'}</span>
                        </td>

                        {/* 6. O'rtacha / korup */}
                        <td className="py-3 px-3 text-right font-mono text-slate-300 font-bold">
                          {emp.avgPerBox}
                        </td>

                        {/* 7. Ulush va progress bar */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className="text-slate-400">{emp.percent}%</span>
                            </div>
                            <div className="w-full bg-[#25283a] h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  idx === 0
                                    ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                                    : 'bg-indigo-500'
                                }`}
                                style={{ width: `${Math.max(emp.percent, 3)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 8. Oxirgi faollik */}
                        <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-400">
                          <div className="flex items-center justify-end space-x-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{formatActivityTime(emp.lastTimestamp)}</span>
                          </div>
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
                      <div className="bg-[#191b26] p-2 rounded-xl border border-[#2e3347]/60">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">
                          {language === 'uz' ? 'Tovarlar' : 'Товаров'}
                        </span>
                        <span className="font-mono font-black text-emerald-400 text-sm">
                          {emp.itemsCount} {language === 'uz' ? 'dona' : 'шт.'}
                        </span>
                      </div>
                      <div className="bg-[#191b26] p-2 rounded-xl border border-[#2e3347]/60">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">
                          {language === 'uz' ? 'Koruplar' : 'Коробов'}
                        </span>
                        <span className="font-mono font-black text-indigo-300 text-sm">
                          {emp.boxesCount} {language === 'uz' ? 'ta' : 'кор.'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-400">{language === 'uz' ? 'Umumiy ulush' : 'Доля в выработке'}:</span>
                        <span className="text-indigo-300 font-mono">{emp.percent}%</span>
                      </div>
                      <div className="w-full bg-[#25283a] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(emp.percent, 3)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 3. ANALITIKA REYTINGLARI: QAYSI PVZ VA QAYSI PRICHINA KO'PROQ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* A. Qaysi PVZ dan ko'proq */}
          <div className="bg-[#191b26] border border-[#2e3347] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span>
                  {language === 'uz'
                    ? `Qaysi PVZ dan ko'proq (${periodFilter === 'today' ? 'Bugun' : 'Barchasi'})`
                    : `Топ ПВЗ (${periodFilter === 'today' ? 'Сегодня' : 'Все время'})`}
                </span>
              </span>
              <span className="text-[11px] font-bold text-slate-500">{language === 'uz' ? 'Top 5' : 'Топ 5'}</span>
            </div>

            {topPvzList.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs font-bold">
                {language === 'uz' ? 'Hozircha fiksatsiyalar mavjud emas' : 'Записей пока нет'}
              </div>
            ) : (
              <div className="space-y-2">
                {topPvzList.map((item, idx) => {
                  const percent = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
                  return (
                    <div key={item.pvz} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-white">
                          <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-black ${
                            idx === 0 ? 'bg-amber-500 text-black' : 'bg-[#25283a] text-slate-400'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-[180px] sm:max-w-[220px]">{item.pvz}</span>
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
                    ? `Qaysi sabab ko'proq (${periodFilter === 'today' ? 'Bugun' : 'Barchasi'})`
                    : `Топ причин фиксации (${periodFilter === 'today' ? 'Сегодня' : 'Все время'})`}
                </span>
              </span>
              <span className="text-[11px] font-bold text-slate-500">{language === 'uz' ? 'Top 5' : 'Топ 5'}</span>
            </div>

            {topReasonsList.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs font-bold">
                {language === 'uz' ? 'Hozircha fiksatsiyalar mavjud emas' : 'Записей пока нет'}
              </div>
            ) : (
              <div className="space-y-2">
                {topReasonsList.map((item, idx) => {
                  const percent = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
                  return (
                    <div key={item.reason} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-white">
                          <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-black ${
                            idx === 0 ? 'bg-amber-500 text-black' : 'bg-[#25283a] text-slate-400'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-[180px] sm:max-w-[220px] text-amber-200">{item.reason}</span>
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
      </div>
    </div>
  );
};
