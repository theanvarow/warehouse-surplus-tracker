'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Language } from '@/lib/types';
import { useTranslation } from '@/lib/translations';
import { soundManager } from '@/lib/sound';
import { POPULAR_PVZ_LIST, PvzItem, getRecentPvzList, addRecentPvz } from '@/lib/pvzList';
import {
  MapPin,
  Search,
  CheckCircle2,
  Sparkles,
  Building2,
  X,
  ArrowRight,
  PlusCircle,
  Keyboard,
  Compass,
  Check
} from 'lucide-react';

interface PvzSelectorModalProps {
  language: Language;
  boxNumber: string;
  onSelectPvz: (pvzName: string) => void;
  onCancel?: () => void;
  initialPvz?: string;
}

export const PvzSelectorModal: React.FC<PvzSelectorModalProps> = ({
  language,
  boxNumber,
  onSelectPvz,
  onCancel,
  initialPvz = '',
}) => {
  const t = useTranslation(language);
  const [inputValue, setInputValue] = useState(initialPvz);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [recentList, setRecentList] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecentList(getRecentPvzList());
    inputRef.current?.focus();
  }, []);

  const regions = [
    { id: 'all', label: t.allRegions },
    { id: 'tashkent', label: t.tashkent },
    { id: 'samarkand', label: t.samarkand },
    { id: 'fergana', label: t.ferganaValley },
    { id: 'bukhara', label: t.bukharaNavoiy },
    { id: 'regions', label: t.otherRegions },
  ];

  // Real-time suggestions filtering (Tafsiyalar)
  const suggestions = useMemo(() => {
    const query = inputValue.toLowerCase().trim();
    if (!query && selectedRegion === 'all') {
      return POPULAR_PVZ_LIST.slice(0, 10);
    }

    return POPULAR_PVZ_LIST.filter((item: PvzItem) => {
      const matchRegion = selectedRegion === 'all' || item.region === selectedRegion;
      if (!matchRegion) return false;
      if (!query) return true;

      return (
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        item.city.toLowerCase().includes(query) ||
        (item.address && item.address.toLowerCase().includes(query)) ||
        (item.keywords && item.keywords.toLowerCase().includes(query))
      );
    });
  }, [inputValue, selectedRegion]);

  // Handle final selection
  const handleConfirm = (pvzName: string) => {
    const clean = pvzName.trim();
    if (!clean) return;
    addRecentPvz(clean);
    soundManager.playItemScanSound();
    onSelectPvz(clean);
  };

  // Keyboard navigation inside input (ArrowDown, ArrowUp, Enter, Esc)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        const picked = suggestions[selectedIndex];
        handleConfirm(`${picked.code} - ${picked.name}`);
      } else if (inputValue.trim()) {
        handleConfirm(inputValue.trim());
      }
    } else if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-[#1f2232] border border-[#2e3347] rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-100 relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header (Clean MyQRCode style) */}
        <div className="flex items-start justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/70 border border-indigo-800/80 flex items-center justify-center text-indigo-400 shrink-0 shadow-sm">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-950/70 text-indigo-300 border border-indigo-800/80 text-xs font-bold uppercase tracking-wider">
                  UZUM PVZ
                </span>
                {boxNumber && (
                  <span className="text-xs font-mono font-bold text-slate-400 bg-[#191b26] px-2 py-0.5 rounded-md border border-[#2e3347]">
                    {boxNumber}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
                {language === 'uz' ? 'ПВЗ (Punkt)ni Belgilang' : 'Укажите ПВЗ (Пункт выдачи)'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                {language === 'uz'
                  ? 'Qidiruvga yozing (masalan: Tash, Chil, Sam) yoki o\'zingiz kiriting'
                  : 'Введите название/код (напр: Tash, Chil, Sam) или введите свой ПВЗ'}
              </p>
            </div>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 rounded-xl bg-[#191b26] hover:bg-[#25283a] text-slate-400 hover:text-white border border-[#2e3347] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Hero Interactive Autocomplete Search Box */}
        <div className="mt-5 space-y-2 relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-indigo-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setSelectedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder={language === 'uz' ? 'ПВЗ nomini yozing... (masalan: Tash, Юнусабад, SAM-01)' : 'Начните вводить ПВЗ... (напр: Tash, Юнусабад, SAM-01)'}
              className="w-full pl-12 pr-28 py-3.5 bg-[#191b26] border border-[#2e3347] focus:border-indigo-500 rounded-2xl text-white placeholder-slate-500 font-bold text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
              autoComplete="off"
            />
            {/* Direct confirm button inside input bar */}
            {inputValue.trim() && (
              <button
                type="button"
                onClick={() => handleConfirm(inputValue)}
                className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <span>{language === 'uz' ? 'Tanlash' : 'Выбрать'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center space-x-1">
              <Keyboard className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'uz' ? 'Enter — tasdiqlash, ↓↑ — tanlash' : 'Enter — подтвердить, ↓↑ — выбор'}</span>
            </span>
            {inputValue.trim() && (
              <span className="text-indigo-400 font-bold">
                {language === 'uz' ? 'Ro\'yxatda yo\'q bo\'lsa ham Enter bosing' : 'Можно ввести любой текст'}
              </span>
            )}
          </div>
        </div>

        {/* Region Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto py-2.5 no-scrollbar shrink-0">
          {regions.map((reg) => {
            const isActive = selectedRegion === reg.id;
            return (
              <button
                key={reg.id}
                type="button"
                onClick={() => {
                  setSelectedRegion(reg.id);
                  setSelectedIndex(-1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm scale-105'
                    : 'bg-[#191b26] text-slate-400 hover:bg-[#25283a] hover:text-white border border-[#2e3347]'
                }`}
              >
                {reg.label}
              </button>
            );
          })}
        </div>

        {/* Recent PVZ Badges */}
        {recentList.length > 0 && !inputValue && (
          <div className="mb-2 shrink-0">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.recentPvz}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recentList.slice(0, 4).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleConfirm(name)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-800/80 text-xs font-bold text-indigo-300 flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <MapPin className="w-3 h-3 text-indigo-400" />
                  <span>{name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Suggestions List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto pr-1 space-y-2 my-2 max-h-[260px] sm:max-h-[300px]"
        >
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 space-y-3 bg-[#191b26] rounded-2xl border border-dashed border-[#2e3347] p-4">
              <Building2 className="w-10 h-10 mx-auto text-slate-600" />
              <div>
                <p className="text-sm font-bold text-white">
                  {language === 'uz' ? `"${inputValue}" ro'yxatda topilmadi` : `"${inputValue}" не найден в списке`}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'uz'
                    ? 'Lekin uni qo\'lda kiritilgan ПВЗ sifatida to\'g\'ridan-to\'g\'ri saqlashingiz mumkin 👇'
                    : 'Но вы можете сохранить его как пользовательский ПВЗ 👇'}
                </p>
              </div>

              {inputValue.trim() && (
                <button
                  type="button"
                  onClick={() => handleConfirm(inputValue)}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>
                    {language === 'uz' ? `"${inputValue}" deb saqlash` : `Использовать "${inputValue}"`}
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {suggestions.map((item: PvzItem, idx: number) => {
                const isHighlighted = selectedIndex === idx;
                const fullPvzName = `${item.code} - ${item.name}`;
                return (
                  <button
                    key={item.code || idx}
                    type="button"
                    onClick={() => handleConfirm(fullPvzName)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between ${
                      isHighlighted
                        ? 'bg-indigo-950/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/30 scale-[1.01]'
                        : 'bg-[#191b26] hover:bg-[#25283a] border-[#2e3347] shadow-sm'
                    }`}
                  >
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 font-mono text-xs font-extrabold border border-indigo-800">
                          {item.code}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">
                          {item.city}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-white leading-snug">
                        {item.name}
                      </h4>
                      {item.address && (
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {item.address}
                        </p>
                      )}
                    </div>
                    <div className="p-1 rounded-lg bg-[#25283a] text-slate-400 shrink-0 mt-1">
                      <Check className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom manual custom submit bar */}
        {inputValue.trim() && (
          <div className="pt-3 border-t border-[#2e3347] flex items-center justify-between gap-2 shrink-0">
            <span className="text-xs text-slate-400 truncate">
              {language === 'uz' ? 'Tanlangan / Kiritilgan:' : 'Выбрано / Введено:'}{' '}
              <strong className="text-white font-mono">{inputValue}</strong>
            </span>
            <button
              type="button"
              onClick={() => handleConfirm(inputValue)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
            >
              <span>{t.confirmPvzBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
