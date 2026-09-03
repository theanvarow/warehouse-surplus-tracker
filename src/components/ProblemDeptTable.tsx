'use client';

import React, { useState, useMemo } from 'react';
import { Language, ScannedItem } from '@/lib/types';
import { soundManager } from '@/lib/sound';
import {
  Package,
  Layers,
  MapPin,
  RotateCcw,
  CheckCircle2
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

          <div className="flex items-center space-x-3">
            {onRefresh && (
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                title={language === 'uz' ? 'Google Sheets dan ma\'lumotlarni yangilash' : 'Обновить данные из Google Sheets'}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-300 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
                <span>{language === 'uz' ? 'Google Sheets bilan yangilash' : 'Обновить из таблицы'}</span>
              </button>
            )}

            <span className="text-xs font-bold text-slate-400">
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
                <span>{language === 'uz' ? 'Qaysi PVZ dan ko\'proq (Bugun)' : 'Топ ПВЗ по излишкам (Сегодня)'}</span>
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
