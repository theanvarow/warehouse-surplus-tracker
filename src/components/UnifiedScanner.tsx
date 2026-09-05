'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ITEM_REASONS, ItemReason, Language, ScannedItem, UserSession } from '@/lib/types';
import { useTranslation } from '@/lib/translations';
import { soundManager } from '@/lib/sound';
import { searchPvz, getRecentPvzList, addRecentPvz, PvzItem, toCyrillic, normalizeChars } from '@/lib/pvzList';
import {
  Package,
  MapPin,
  Barcode,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  HelpCircle,
  Search,
  X,
  Sparkles,
  Check
} from 'lucide-react';

interface UnifiedScannerProps {
  language: Language;
  userSession: UserSession;
  onFinishSession: (boxNumber: string, targetBox: string, pvz: string, items: ScannedItem[]) => Promise<{ success: boolean; offline?: boolean } | void>;
}

export const UnifiedScanner: React.FC<UnifiedScannerProps> = ({
  language,
  userSession,
  onFinishSession,
}) => {
  const t = useTranslation(language);

  // Form Fields
  const [boxNumber, setBoxNumber] = useState<string>('');
  const [targetBox, setTargetBox] = useState<string>('');
  const [pvz, setPvz] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');

  // Scanned items in current box
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<boolean>(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Reason Selection Modal State
  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null);

  // PVZ Smart Autocomplete State
  const [pvzSuggestions, setPvzSuggestions] = useState<PvzItem[]>([]);
  const [isPvzDropdownOpen, setIsPvzDropdownOpen] = useState<boolean>(false);
  const [selectedPvzIndex, setSelectedPvzIndex] = useState<number>(-1);
  const [recentPvzList, setRecentPvzList] = useState<string[]>([]);
  const pvzContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecentPvzList(getRecentPvzList());
  }, []);

  // Tashqariga bosilganda PVZ ro'yxatini yopish
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pvzContainerRef.current && !pvzContainerRef.current.contains(e.target as Node)) {
        setIsPvzDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // PVZ tanlanganda
  const handleSelectPvz = (selectedCode: string) => {
    setPvz(selectedCode);
    addRecentPvz(selectedCode);
    setRecentPvzList(getRecentPvzList());
    setIsPvzDropdownOpen(false);
    setSelectedPvzIndex(-1);
    soundManager.playItemScanSound();
    barcodeRef.current?.focus();
  };

  // PVZ inputiga harf yoki raqam yozilganda
  const handlePvzChange = (val: string) => {
    setPvz(val);
    const matches = searchPvz(val, 30);
    setPvzSuggestions(matches);
    setIsPvzDropdownOpen(matches.length > 0);
    setSelectedPvzIndex(-1);
  };

  // PVZ inputida tugmalar harakati (ArrowDown, ArrowUp, Enter, Escape)
  const handlePvzKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isPvzDropdownOpen && pvzSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedPvzIndex((prev) => (prev < pvzSuggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedPvzIndex((prev) => (prev > 0 ? prev - 1 : pvzSuggestions.length - 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        // 1. Agar foydalanuvchi strelkalar bilan biror PVZ ustiga borgan bo'lsa
        if (selectedPvzIndex >= 0 && selectedPvzIndex < pvzSuggestions.length) {
          handleSelectPvz(pvzSuggestions[selectedPvzIndex].code);
          return;
        }

        // 2. Agar foydalanuvchi yozgan narsa 1-natijaga teng yoki mos kelsa (masalan: "tash-14" yoki "таш 14" -> "ТАШ-14")
        const currentNorm = normalizeChars(toCyrillic(pvz));
        const firstNorm = normalizeChars(toCyrillic(pvzSuggestions[0].code));
        if (currentNorm && currentNorm === firstNorm) {
          handleSelectPvz(pvzSuggestions[0].code);
          return;
        }

        // 3. Aks holda foydalanuvchi kiritgan qiymatni qabul qilamiz
        if (pvz.trim()) {
          handleSelectPvz(pvz.trim());
        } else {
          setIsPvzDropdownOpen(false);
          barcodeRef.current?.focus();
        }
        return;
      }
      if (e.key === 'Escape') {
        setIsPvzDropdownOpen(false);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (pvz.trim()) {
        handleSelectPvz(pvz.trim());
      } else {
        setIsPvzDropdownOpen(false);
        barcodeRef.current?.focus();
      }
    }
  };

  // Input Refs for smooth auto-focus
  const boxRef = useRef<HTMLInputElement>(null);
  const targetBoxRef = useRef<HTMLInputElement>(null);
  const pvzRef = useRef<HTMLInputElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    boxRef.current?.focus();
  }, []);

  // Hardware Scanner Universal Listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Hotkey F2 -> Finish Box
      if (e.key === 'F2') {
        e.preventDefault();
        handleFinishBox();
        return;
      }

      // If user is actively typing in an input, let normal events handle it
      if (
        document.activeElement === boxRef.current ||
        document.activeElement === targetBoxRef.current ||
        document.activeElement === pvzRef.current ||
        document.activeElement === barcodeRef.current
      ) {
        return;
      }

      const currentTime = Date.now();
      const char = e.key;

      if (char === 'Enter') {
        if (buffer.trim().length > 1) {
          const scanned = buffer.trim();
          buffer = '';

          // Command Barcode: $BT#CLEAR
          if (scanned.toUpperCase() === '$BT#CLEAR' || scanned.toUpperCase().includes('$BT#CLEAR')) {
            setBoxNumber('');
            setTargetBox('');
            setPvz('');
            setBarcodeInput('');
            setItems([]);
            setLastScannedBarcode(null);
            soundManager.playFinishBoxSound();
            boxRef.current?.focus();
            return;
          }

          // If source box is empty, fill box first
          if (!boxNumber.trim()) {
            setBoxNumber(scanned.toUpperCase());
            soundManager.playBoxScanSound();
            pvzRef.current?.focus();
          } else {
            // Append product
            addItemToCurrentBox(scanned);
          }
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
  }, [boxNumber, targetBox, pvz, items]);

  // Add Item to Box
  const addItemToCurrentBox = (rawBarcode: string) => {
    const code = rawBarcode.trim();
    if (!code) return;

    // Command Barcode: $BT#CLEAR (Skaner buyrug'i: Formani tozalash)
    if (code.toUpperCase() === '$BT#CLEAR' || code.toUpperCase().includes('$BT#CLEAR')) {
      setBoxNumber('');
      setTargetBox('');
      setPvz('');
      setBarcodeInput('');
      setItems([]);
      setLastScannedBarcode(null);
      soundManager.playFinishBoxSound();
      boxRef.current?.focus();
      return;
    }

    if (!boxNumber.trim()) {
      soundManager.playErrorSound();
      alert(language === 'uz' ? 'Iltimos, avval Gruzamesta raqamini kiriting!' : 'Пожалуйста, сначала укажите номер Грузоместа!');
      boxRef.current?.focus();
      return;
    }

    // Shtrix-kod kiritilgach, sabab (причина) tanlash so'raladi
    soundManager.playItemScanSound();
    setPendingBarcode(code);
    setBarcodeInput('');
  };

  // Sabab tanlangandan so'ng tovar qo'shiladi
  const confirmAddItemWithReason = (reasonText: string) => {
    if (!pendingBarcode) return;
    const code = pendingBarcode;
    setPendingBarcode(null);

    const existingIndex = items.findIndex((i) => i.barcode === code);
    if (existingIndex >= 0) {
      soundManager.playDuplicateSound();
      setDuplicateWarning(true);
      setTimeout(() => setDuplicateWarning(false), 2000);

      setItems((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex ? { ...item, count: item.count + 1, reason: reasonText } : item
        )
      );
    } else {
      soundManager.playBoxScanSound();
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const shiftDigit = String(userSession.shift || '').replace(/[^0-9]/g, '') || '1';
      const periodStatus = userSession.shiftPeriod === 'night' ? 'Ночная' : 'Дневная';

      const newItem: ScannedItem = {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        barcode: code,
        timestamp,
        count: 1,
        boxNumber: boxNumber.trim().toUpperCase(),
        targetBox: targetBox.trim().toUpperCase() || '—',
        pvz: pvz.trim() || '—',
        operator: userSession.employeeName,
        tableNumber: userSession.tableNumber || '—',
        reason: reasonText,
        shift: shiftDigit as any,
        shiftPeriod: userSession.shiftPeriod,
        status: periodStatus as any,
        syncStatus: 'pending',
        note: reasonText,
      };
      setItems((prev) => [newItem, ...prev]);
    }

    setLastScannedBarcode(code);
    barcodeRef.current?.focus();
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addItemToCurrentBox(barcodeInput);
  };

  // Modify Item Count (+ / -)
  const updateItemCount = (itemId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const next = item.count + delta;
            return next > 0 ? { ...item, count: next } : null;
          }
          return item;
        })
        .filter((item): item is ScannedItem => item !== null)
    );
    soundManager.playItemScanSound();
  };

  // Delete Item
  const deleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    soundManager.playItemScanSound();
  };

  // Reset current form
  const handleResetForm = () => {
    if (items.length > 0) {
      if (!confirm(language === 'uz' ? 'Hozirgi kiritilgan ma\'lumotlar bekor qilinsinmi?' : 'Сбросить текущие введенные данные?')) {
        return;
      }
    }
    setBoxNumber('');
    setTargetBox('');
    setPvz('');
    setBarcodeInput('');
    setItems([]);
    setLastScannedBarcode(null);
    boxRef.current?.focus();
  };

  // Finish Box and send to Google Sheets
  const handleFinishBox = async () => {
    const cleanBox = boxNumber.replace(/[^a-zA-Z0-9а-яА-ЯёЁ\-_ ]/g, '').trim().toUpperCase();
    if (!cleanBox || cleanBox.length < 2) {
      soundManager.playErrorSound();
      alert(language === 'uz' ? 'Chiqarilgan Gruzamesta raqamini to\'g\'ri kiriting!' : 'Укажите корректный номер Грузоместа!');
      boxRef.current?.focus();
      return;
    }

    if (items.length === 0) {
      soundManager.playErrorSound();
      alert(language === 'uz' ? 'Korup bo\'sh! Kamida 1 ta tovar skanerlang.' : 'Короб пуст! Отсканируйте хотя бы 1 товар.');
      barcodeRef.current?.focus();
      return;
    }

    const cleanTargetBox = targetBox.replace(/[^a-zA-Z0-9а-яА-ЯёЁ\-_ ]/g, '').trim().toUpperCase();
    const isValid80or85 = cleanTargetBox.length >= 2 && (cleanTargetBox.startsWith('80') || cleanTargetBox.startsWith('85'));
    if (!cleanTargetBox || !isValid80or85) {
      soundManager.playErrorSound();
      alert(
        language === 'uz'
          ? '❌ Qayta joylangan korup (Куда переложен) faqat 80 yoki 85 bilan boshlanishi shart! (Masalan: 80-..., 85-...). Boshqa hech narsa qabul qilinmaydi.'
          : '❌ Короб «Куда переложен» должен начинаться только с 80 или 85! (Напр: 80-..., 85-...). Другие номера не принимаются.'
      );
      setTargetBox('');
      targetBoxRef.current?.focus();
      return;
    }

    setIsFinishing(true);
    soundManager.playFinishBoxSound();

    try {
      const finalTargetBox = cleanTargetBox;
      const finalBoxNumber = cleanBox;
      const finalPvz = pvz.trim() || '—';
      const updatedItems = items.map((i) => ({
        ...i,
        boxNumber: finalBoxNumber,
        targetBox: finalTargetBox,
        pvz: finalPvz,
        operator: userSession.employeeName,
        tableNumber: userSession.tableNumber || i.tableNumber || '—',
      }));

      if (finalPvz && finalPvz !== '—') {
        addRecentPvz(finalPvz);
        setRecentPvzList(getRecentPvzList());
      }

      const syncResult = await onFinishSession(boxNumber.trim().toUpperCase(), finalTargetBox, finalPvz, updatedItems);

      const totalCount = items.reduce((s, i) => s + (i.count || 1), 0);
      if (syncResult && syncResult.offline) {
        setSuccessToast(
          language === 'uz'
            ? `⚠️ ${boxNumber} (${totalCount} dona) saqlandi, lekin Google Jadvalga ulanmadi (Offline). Sozlamalarni tekshiring!`
            : `⚠️ Короб ${boxNumber} (${totalCount} шт.) сохранен локально, но не отправлен в Google Таблицу! Проверьте настройки URL.`
        );
      } else {
        setSuccessToast(
          language === 'uz'
            ? `✅ ${boxNumber} ➔ ${finalTargetBox} (${totalCount} dona) yozildi!`
            : `✅ Короб ${boxNumber} ➔ ${finalTargetBox} (${totalCount} шт.) записан!`
        );
      }
      setTimeout(() => setSuccessToast(null), 5000);

      // Reset form for next box
      setBoxNumber('');
      setTargetBox('');
      setPvz('');
      setBarcodeInput('');
      setItems([]);
      setLastScannedBarcode(null);
      boxRef.current?.focus();
    } catch (err) {
      console.error('Error finishing box:', err);
    } finally {
      setIsFinishing(false);
    }
  };

  const totalQuantity = items.reduce((sum, i) => sum + (i.count || 1), 0);
  const cleanTargetBox = targetBox.replace(/[^a-zA-Z0-9а-яА-ЯёЁ\-_ ]/g, '').trim().toUpperCase();
  const isTargetBoxValid = cleanTargetBox.length >= 2 && (cleanTargetBox.startsWith('80') || cleanTargetBox.startsWith('85'));
  const isTargetBoxInvalid = cleanTargetBox.length >= 2 && !isTargetBoxValid;

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in text-slate-100">
      {/* Toast Notification */}
      {successToast && (
        <div className="bg-emerald-600 text-white font-bold text-sm sm:text-base p-3 px-5 rounded-2xl shadow-lg border-2 border-emerald-500 flex items-center space-x-2.5 animate-bounce-subtle">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* COMPACT & CLEAN MASTER CARD (Korup, PVZ, Tovar Barcode) */}
      <div className="bg-[#1f2232] border border-[#2e3347] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        {/* Top Header Row with Clear/Reset button */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2e3347]">
          <div className="flex items-center space-x-2">
            <span className="text-base font-black text-white">
              {language === 'uz' ? '📦 Skanerlash Maydoni' : '📦 Рабочая Область Сканирования'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Stats */}
            <span className="text-xs font-bold text-slate-300 bg-[#191b26] px-3 py-1 rounded-xl border border-[#2e3347]">
              {items.length} {language === 'uz' ? 'xil' : 'видов'} &bull; <strong className="text-emerald-400 font-mono text-sm">{totalQuantity}</strong> {language === 'uz' ? 'dona' : 'шт.'}
            </span>

            {(boxNumber || targetBox || pvz || items.length > 0) && (
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs font-bold text-slate-400 hover:text-rose-400 flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-rose-950/40 transition-colors cursor-pointer"
                title={language === 'uz' ? 'Maydonlarni tozalash' : 'Очистить поля'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'uz' ? 'Tozalash' : 'Сброс'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Simple, Compact Inputs in 1 Clean Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* FIELD 1: GRUZAMESTA RAQAMI (Qaysi Gruzamestadan chiqdi) */}
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-slate-300 flex items-center space-x-1">
              <Package className="w-3.5 h-3.5 text-indigo-400" />
              <span>1. {language === 'uz' ? 'Qaysi Gruzamestadan chiqdi?' : 'Из какого Грузоместа вышел?'}</span>
            </label>
            <input
              ref={boxRef}
              type="text"
              value={boxNumber}
              onChange={(e) => setBoxNumber(e.target.value.replace(/[^a-zA-Z0-9а-яА-ЯёЁ\-_ ]/g, '').toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (boxNumber.trim().toUpperCase() === '$BT#CLEAR' || boxNumber.trim().toUpperCase().includes('$BT#CLEAR')) {
                    setBoxNumber('');
                    setTargetBox('');
                    setPvz('');
                    setBarcodeInput('');
                    setItems([]);
                    setLastScannedBarcode(null);
                    soundManager.playFinishBoxSound();
                    return;
                  }
                  pvzRef.current?.focus();
                }
              }}
              placeholder={language === 'uz' ? 'Masalan: 85-000' : 'Напр: 85-000'}
              className="w-full px-3.5 py-3 bg-[#191b26] border border-[#2e3347] focus:border-indigo-500 rounded-xl text-white placeholder-slate-500 font-mono text-base font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all uppercase"
              autoComplete="off"
            />
          </div>

          {/* FIELD 2: PVZ INPUT WITH SMART AUTOCOMPLETE */}
          <div ref={pvzContainerRef} className="space-y-1 relative">
            <label className="text-xs font-black uppercase text-slate-300 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>2. {language === 'uz' ? 'ПВЗ' : 'ПВЗ'}</span>
            </label>

            <div className="relative">
              <input
                ref={pvzRef}
                type="text"
                value={pvz}
                onChange={(e) => handlePvzChange(e.target.value)}
                onFocus={() => {
                  const matches = searchPvz(pvz, 30);
                  setPvzSuggestions(matches);
                  setIsPvzDropdownOpen(matches.length > 0);
                  setSelectedPvzIndex(-1);
                }}
                onKeyDown={handlePvzKeyDown}
                placeholder={language === 'uz' ? 'Bosh harf yoki raqam (masalan: таш, 12, гул...)' : 'Код или номер (напр: таш, 12, гул...)'}
                className="w-full pl-3.5 pr-8 py-3 bg-[#191b26] border border-[#2e3347] focus:border-indigo-500 rounded-xl text-white placeholder-slate-500 font-bold text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                autoComplete="off"
              />

              {pvz && (
                <button
                  type="button"
                  onClick={() => {
                    setPvz('');
                    const matches = searchPvz('', 30);
                    setPvzSuggestions(matches);
                    setIsPvzDropdownOpen(true);
                    setSelectedPvzIndex(-1);
                    pvzRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Smart Suggestions Floating Dropdown */}
            {isPvzDropdownOpen && pvzSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#1b1e2c] border border-indigo-500/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md max-h-72 overflow-y-auto divide-y divide-[#282d3f] animate-fade-in">
                <div className="px-3 py-1.5 bg-[#141622] text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between border-b border-[#282d3f]">
                  <span>{language === 'uz' ? 'Mos keluvchi PVZlar' : 'Подходящие ПВЗ'}</span>
                  <span className="text-slate-400 font-mono">{pvzSuggestions.length} {language === 'uz' ? 'ta' : 'вариантов'}</span>
                </div>
                {pvzSuggestions.map((item, idx) => {
                  const isSelected = selectedPvzIndex === idx;
                  return (
                    <button
                      key={item.code + idx}
                      type="button"
                      onClick={() => handleSelectPvz(item.code)}
                      onMouseEnter={() => setSelectedPvzIndex(idx)}
                      className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/30 text-white font-black'
                          : 'hover:bg-[#25283a] text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono text-sm font-black text-indigo-400 bg-indigo-950/80 border border-indigo-700/60 px-2 py-0.5 rounded-md">
                          {item.code}
                        </span>
                        <span className="text-xs text-slate-300 font-medium truncate max-w-[180px] sm:max-w-xs">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-bold uppercase shrink-0">
                        {item.city}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* FIELD 3: TOVAR SHTRIX-KODI */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-slate-300 flex items-center space-x-1">
                <Barcode className="w-3.5 h-3.5 text-indigo-400" />
                <span>3. {language === 'uz' ? 'Tovar Barcode' : 'Штрих-код'}</span>
              </label>
              {lastScannedBarcode && (
                <span className="text-[11px] font-mono font-bold text-emerald-400">
                  {lastScannedBarcode}
                </span>
              )}
            </div>

            <form onSubmit={handleBarcodeSubmit} className="relative flex">
              <input
                ref={barcodeRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder={language === 'uz' ? 'Skanerlang...' : 'Сканируйте...'}
                className="w-full pl-3.5 pr-20 py-3 bg-[#191b26] border border-[#2e3347] focus:border-indigo-500 rounded-xl text-white placeholder-slate-500 font-mono text-sm sm:text-base font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                autoComplete="off"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'uz' ? 'Qo\'shish' : 'Ввод'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Duplicate Warning */}
        {duplicateWarning && (
          <div className="flex items-center space-x-2 text-amber-300 bg-amber-950/50 border border-amber-800/80 px-3 py-1.5 rounded-xl text-xs font-bold animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{t.barcodeAlreadyScanned} (+1)</span>
          </div>
        )}
      </div>

      {/* COMPACT SCANNED ITEMS LIST */}
      <div className="bg-[#1f2232] border border-[#2e3347] rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-black text-white">
            {language === 'uz' ? 'Jadvaldagi tovarlar:' : 'Товары в текущем коробе:'}
          </span>
          <span className="text-xs text-slate-400 font-bold">
            {items.length} {language === 'uz' ? 'ta tovar' : 'позиций'}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 text-slate-500 border border-dashed border-[#2e3347] rounded-xl bg-[#191b26]/50">
            <Barcode className="w-8 h-8 mx-auto text-slate-600 mb-1" />
            <p className="text-xs font-bold text-slate-400">
              {language === 'uz' ? 'Hozircha tovar yo\'q. 4-maydonga shtrix-kodni skanerlang.' : 'Штрихкоды товаров пока не отсканированы.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {items.map((item, index) => (
              <div
                key={item.id || index}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#191b26] border border-[#2e3347] hover:border-indigo-900/60 transition-all"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-950/70 border border-indigo-800/80 flex items-center justify-center font-mono font-bold text-xs text-indigo-400">
                    {items.length - index}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-white block">
                        {item.barcode}
                      </span>
                      {item.targetBox && item.targetBox !== '—' && (
                        <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700">
                          ➔ {item.targetBox}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {item.timestamp?.split(' ')[1]}
                      </span>
                      {item.reason && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-950/70 border border-amber-800/80 text-amber-300 truncate max-w-[200px]">
                          {item.reason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Compact Quantity Controls & Delete */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-[#191b26] rounded-lg p-0.5 border border-[#2e3347]">
                    <button
                      type="button"
                      onClick={() => updateItemCount(item.id, -1)}
                      className="w-7 h-7 rounded bg-[#25283a] hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors"
                      title="-1"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-mono font-black text-sm text-white">
                      {item.count}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateItemCount(item.id, 1)}
                      className="w-7 h-7 rounded bg-[#25283a] hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-400 flex items-center justify-center cursor-pointer transition-colors"
                      title="+1"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title={language === 'uz' ? 'O\'chirish' : 'Удалить'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DESTINATION BOX INPUT (Kuda perelojen - Qayta joylangan Korup) */}
        <div className="pt-2 border-t border-[#2e3347]/80">
          <div className={`bg-[#191b26] border rounded-xl p-3 sm:p-4 space-y-2 transition-all ${
            isTargetBoxInvalid
              ? 'border-rose-500 shadow-sm shadow-rose-500/20 bg-rose-950/10'
              : isTargetBoxValid
              ? 'border-emerald-500/80 shadow-sm shadow-emerald-500/10'
              : items.length > 0 && !targetBox.trim()
              ? 'border-amber-500/70 shadow-sm shadow-amber-500/10'
              : 'border-indigo-500/40'
          }`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-indigo-400 flex items-center space-x-1.5">
                <Package className="w-4 h-4 text-indigo-400" />
                <span>{language === 'uz' ? '📦 Qayta joylangan Korup (Куда переложен)' : '📦 Куда переложен (Новый короб)'}</span>
                <span className="text-rose-400 font-black text-sm">*</span>
              </label>
              <div className="flex items-center space-x-2">
                {boxNumber.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      const cleanCurrentBox = boxNumber.trim().replace(/[^a-zA-Z0-9а-яА-ЯёЁ\-_ ]/g, '').toUpperCase();
                      if (!cleanCurrentBox.startsWith('80') && !cleanCurrentBox.startsWith('85')) {
                        soundManager.playErrorSound();
                        alert(
                          language === 'uz'
                            ? 'Ushbu korup raqami 80 yoki 85 bilan boshlanmagan! Qayta joylangan korup faqat 80 yoki 85 bilan boshlanishi shart.'
                            : 'Текущий короб не начинается с 80 или 85! Короб «Куда переложен» должен начинаться только с 80 или 85.'
                        );
                        return;
                      }
                      setTargetBox(cleanCurrentBox);
                    }}
                    className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 transition-all flex items-center space-x-1 cursor-pointer active:scale-95 shadow-sm"
                    title={language === 'uz' ? 'Tovar yangi korupga o\'tkazilmagan bo\'lsa, shu korup raqamini qo\'yish' : 'Если товар остался в том же коробе'}
                  >
                    <span>🔄 {language === 'uz' ? 'Shu korupning o\'zi' : 'В тот же короб'}</span>
                  </button>
                )}
                <span className={`text-[11px] font-bold ${
                  isTargetBoxInvalid
                    ? 'text-rose-400'
                    : isTargetBoxValid
                    ? 'text-emerald-400'
                    : items.length > 0 && !targetBox.trim()
                    ? 'text-amber-400'
                    : 'text-slate-400'
                }`}>
                  {isTargetBoxInvalid
                    ? (language === 'uz' ? '❌ Faqat 80 yoki 85!' : '❌ Только 80 или 85!')
                    : isTargetBoxValid
                    ? (language === 'uz' ? '✅ Qabul qilindi' : '✅ Принято')
                    : items.length > 0 && !targetBox.trim()
                    ? (language === 'uz' ? '⚠️ Majburiy (80/85)!' : '⚠️ Обязательно (80/85)!')
                    : (language === 'uz' ? 'Faqat 80/85' : 'Только 80/85')}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <input
                ref={targetBoxRef}
                type="text"
                value={targetBox}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^a-zA-Z0-9а-яА-ЯёЁ\-_ ]/g, '').toUpperCase().trimStart();
                  setTargetBox(clean);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!isTargetBoxValid) {
                      soundManager.playErrorSound();
                      alert(
                        language === 'uz'
                          ? '❌ Qayta joylangan korup (Куда переложен) faqat 80 yoki 85 bilan boshlanishi shart! Boshqa raqam qabul qilinmaydi.'
                          : '❌ Короб «Куда переложен» должен начинаться только с 80 или 85! Другие номера не принимаются.'
                      );
                      setTargetBox('');
                      targetBoxRef.current?.focus();
                      return;
                    }
                    handleFinishBox();
                  }
                }}
                onBlur={() => {
                  if (cleanTargetBox.length > 0 && !isTargetBoxValid) {
                    soundManager.playErrorSound();
                    alert(
                      language === 'uz'
                        ? '❌ Qayta joylangan korup faqat 80 yoki 85 bilan boshlanishi shart! Boshqa raqam qabul qilinmaydi.'
                        : '❌ Короб «Куда переложен» должен начинаться только с 80 или 85! Другие номера не принимаются.'
                    );
                    setTargetBox('');
                  }
                }}
                placeholder={language === 'uz' ? 'Faqat 80-... yoki 85-... (skanerlang yoki yozing)' : 'Только 80-... или 85-... (сканируйте или введите)'}
                className={`w-full px-4 py-3 bg-[#161822] border rounded-xl text-white placeholder-slate-500 font-mono text-base font-black focus:outline-none focus:ring-2 transition-all uppercase shadow-inner ${
                  isTargetBoxInvalid
                    ? 'border-rose-500 text-rose-200 focus:border-rose-400 focus:ring-rose-500/30'
                    : isTargetBoxValid
                    ? 'border-emerald-500 text-emerald-100 focus:border-emerald-400 focus:ring-emerald-500/30'
                    : 'border-indigo-700/60 focus:border-indigo-400 focus:ring-indigo-500/30'
                }`}
                autoComplete="off"
              />
              {isTargetBoxInvalid && (
                <div className="flex items-center space-x-2 text-rose-400 bg-rose-950/40 border border-rose-800/80 px-3 py-1.5 rounded-xl text-xs font-bold animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>
                    {language === 'uz'
                      ? '❌ Korup raqami faqat 80 yoki 85 bilan boshlanishi shart! Boshqa qabul qilinmaydi.'
                      : '❌ Номер короба должен начинаться только с 80 или 85! Другие не принимаются.'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Master Finish Action Button */}
        <div>
          <button
            type="button"
            onClick={handleFinishBox}
            disabled={isFinishing || items.length === 0 || !isTargetBoxValid}
            className={`w-full py-4 px-6 text-white text-base sm:text-lg font-black rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer border ${
              items.length > 0 && isTargetBoxValid && !isFinishing
                ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 shadow-emerald-900/40 active:translate-y-0.5'
                : 'bg-[#25283a] border-[#2e3347] text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            {isFinishing ? (
              <span className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{language === 'uz' ? 'Jadvalga yozilmoqda...' : 'Запись в Таблицу...'}</span>
              </span>
            ) : isTargetBoxInvalid ? (
              <span className="text-rose-400">
                {language === 'uz'
                  ? '❌ Korup faqat 80 yoki 85 bilan boshlanishi shart!'
                  : '❌ Короб должен начинаться только с 80 или 85!'}
              </span>
            ) : !targetBox.trim() && items.length > 0 ? (
              <span>
                {language === 'uz'
                  ? '«Куда переложен» (80 yoki 85) maydonini to\'ldiring'
                  : 'Укажите «Куда переложен» (80 или 85) для завершения'}
              </span>
            ) : (
              <span>{language === 'uz' ? 'Завершить' : 'Завершить'}</span>
            )}
          </button>
        </div>
      </div>

      {/* MODAL: PRICHINA / SABABNI TANLASH OYNASI (Har bir SHK urilganda chiqadi) */}
      {pendingBarcode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#1f2232] border-2 border-indigo-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 relative overflow-hidden animate-scale-up">
            {/* Top Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2e3347]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  {language === 'uz' ? 'Tovar qabul qilish' : 'Фиксация товара'}
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  {t.selectReasonTitle}
                </h3>
              </div>
              <span className="px-3 py-1 bg-indigo-950/80 border border-indigo-700/80 rounded-xl font-mono text-sm font-black text-indigo-300">
                {pendingBarcode}
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium mb-4">
              {language === 'uz'
                ? 'Iltimos, ushbu tovar nima sababdan ortiqcha yoki muammoli ekanligini tanlang:'
                : 'Пожалуйста, выберите точную причину обнаружения данного товара:'}
            </p>

            {/* List of 8 Reasons as big clickable touch buttons */}
            <div className="space-y-2 max-h-[min(540px,65vh)] overflow-y-auto pr-1">
              {ITEM_REASONS.map((reason, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => confirmAddItemWithReason(reason)}
                  className="w-full text-left p-3 rounded-2xl bg-[#161822] hover:bg-indigo-600/30 border border-[#2e3347] hover:border-indigo-400/80 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-lg bg-[#25283a] group-hover:bg-indigo-600 text-slate-300 group-hover:text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-white leading-snug">
                      {reason}
                    </span>
                  </div>
                  <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold shrink-0 ml-2">
                    ➔
                  </span>
                </button>
              ))}
            </div>

            {/* Cancel option */}
            <div className="mt-4 pt-3 border-t border-[#2e3347] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setPendingBarcode(null);
                  barcodeRef.current?.focus();
                }}
                className="text-xs font-bold text-slate-400 hover:text-rose-400 px-4 py-2 rounded-xl hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                {language === 'uz' ? 'Bekor qilish' : 'Отмена'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
