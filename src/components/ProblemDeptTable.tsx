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
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight
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

  useEffect(() => {
    if (!isUnlocked) {
      passwordInputRef.current?.focus();
    }
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

  // Faqat bugungi fiksatsiyalar
  const todayItems = useMemo(() => {
    return items.filter((item) => {
      const itemDate = item.timestamp ? item.timestamp.slice(0, 10) : '';
      return itemDate === todayStr;
    });
  }, [items, todayStr]);

  // Bugungi jami fiksatsiya qilingan tovarlar soni
  const todayTotalCount = useMemo(() => {
    return todayItems.reduce((sum, i) => sum + (i.count || 1), 0);
  }, [todayItems]);

  // Bugungi unikal koruplar soni
  const todayTotalBoxes = useMemo(() => {
    return new Set(todayItems.map((i) => i.boxNumber)).size;
  }, [todayItems]);

  // Qaysi PVZ dan ko'proq (Bugungi reyting)
  const topPvzList = useMemo(() => {
    const pvzMap: Record<string, number> = {};
    todayItems.forEach((item) => {
      const pvz = (item.pvz && item.pvz !== '—') ? item.pvz.trim() : (language === 'uz' ? 'Noma\'lum PVZ' : 'Без ПВЗ');
      pvzMap[pvz] = (pvzMap[pvz] || 0) + (item.count || 1);
    });

    return Object.entries(pvzMap)
      .map(([pvz, count]) => ({ pvz, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Eng ko'p 5 ta PVZ
  }, [todayItems, language]);

  // Qaysi Prichina (sabab) bo'yicha ko'proq (Bugungi reyting)
  const topReasonsList = useMemo(() => {
    const reasonMap: Record<string, number> = {};
    todayItems.forEach((item) => {
      const r = item.reason || item.note || (language === 'uz' ? 'Boshqa' : 'Другое');
      reasonMap[r] = (reasonMap[r] || 0) + (item.count || 1);
    });

    return Object.entries(reasonMap)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Eng ko'p 5 ta Sabab
  }, [todayItems, language]);

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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 transition-colors"
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
      {/* 📊 BUGUNGI KUN ANALITIKASI PANELI */}
      <div className="bg-[#1f2232] border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#2e3347] pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>{language === 'uz' ? 'Bugungi Kunlik Monitoring' : 'Мониторинг за сегодня'}</span>
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded-lg">
                {todayStr}
              </span>
            </h2>
          </div>

          <div className="flex items-center space-x-2.5">
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

            <span className="text-xs font-bold text-slate-400 pl-1">
              {todayItems.length} {language === 'uz' ? 'ta qayd' : 'записей'}
            </span>
          </div>
        </div>

        {/* 1. TOP STATS CARDS: JAMI BUGUN */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3.5">
          {/* Bugun fiksatsiya qilingan tovarlar */}
          <div className="bg-[#191b26] border border-[#2e3347] rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                {language === 'uz' ? 'Bugun fiksatsiya qilingan' : 'Зафиксировано за сегодня'}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                {todayTotalCount}{' '}
                <span className="text-xs font-bold text-slate-400">{language === 'uz' ? 'dona tovar' : 'шт.'}</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/70 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          {/* Bugun ochilgan/yopilgan koruplar */}
          <div className="bg-[#191b26] border border-[#2e3347] rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                {language === 'uz' ? 'Bugungi koruplar' : 'Коробов за сегодня'}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black font-mono text-indigo-400">
                {todayTotalBoxes}{' '}
                <span className="text-xs font-bold text-slate-400">{language === 'uz' ? 'ta quti' : 'коробов'}</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/70 border border-indigo-800/80 flex items-center justify-center text-indigo-400">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 2. ANALITIKA REYTINGLARI: QAYSI PVZ VA QAYSI PRICHINA KO'PROQ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* A. Qaysi PVZ dan ko'proq */}
          <div className="bg-[#191b26] border border-[#2e3347] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span>{language === 'uz' ? 'Qaysi PVZ dan ko\'proq (Bugun)' : 'Топ ПВЗ по проблемным товарам (Сегодня)'}</span>
              </span>
              <span className="text-[11px] font-bold text-slate-500">{language === 'uz' ? 'Top 5' : 'Топ 5'}</span>
            </div>

            {topPvzList.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs font-bold">
                {language === 'uz' ? 'Bugun hali fiksatsiya qilinmagan' : 'Сегодня записей пока нет'}
              </div>
            ) : (
              <div className="space-y-2">
                {topPvzList.map((item, idx) => {
                  const percent = todayTotalCount > 0 ? Math.round((item.count / todayTotalCount) * 100) : 0;
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
                <span>{language === 'uz' ? 'Qaysi sabab ko\'proq (Bugun)' : 'Топ причин фиксации (Сегодня)'}</span>
              </span>
              <span className="text-[11px] font-bold text-slate-500">{language === 'uz' ? 'Top 5' : 'Топ 5'}</span>
            </div>

            {topReasonsList.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs font-bold">
                {language === 'uz' ? 'Bugun hali fiksatsiya qilinmagan' : 'Сегодня записей пока нет'}
              </div>
            ) : (
              <div className="space-y-2">
                {topReasonsList.map((item, idx) => {
                  const percent = todayTotalCount > 0 ? Math.round((item.count / todayTotalCount) * 100) : 0;
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
