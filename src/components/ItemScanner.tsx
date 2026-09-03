'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BoxSession, Language } from '@/lib/types';
import { useTranslation } from '@/lib/translations';
import { soundManager } from '@/lib/sound';
import {
  Package,
  Barcode,
  Trash2,
  AlertCircle,
  Plus,
  Minus,
  MapPin,
  Layers,
  ArrowRight,
  Edit3
} from 'lucide-react';

interface ItemScannerProps {
  language: Language;
  activeBox: BoxSession;
  onAddItem: (barcode: string) => void;
  onUpdateItemCount: (itemId: string, delta: number) => void;
  onDeleteItem: (itemId: string) => void;
  onFinishBox: () => void;
  onChangePvz?: () => void;
}

export const ItemScanner: React.FC<ItemScannerProps> = ({
  language,
  activeBox,
  onAddItem,
  onUpdateItemCount,
  onDeleteItem,
  onFinishBox,
  onChangePvz,
}) => {
  const t = useTranslation(language);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
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
      if (e.key === 'F2') {
        e.preventDefault();
        handleFinishTrigger();
        return;
      }

      if (document.activeElement === inputRef.current) return;

      const currentTime = Date.now();
      const char = e.key;

      if (char === 'Enter') {
        if (buffer.trim().length > 2) {
          const scannedCode = buffer.trim();
          buffer = '';
          submitBarcode(scannedCode);
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
  }, [activeBox.items.length]);

  const submitBarcode = (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    const existing = activeBox.items.find((item) => item.barcode === code);
    if (existing) {
      soundManager.playDuplicateSound();
      setDuplicateWarning(true);
      setTimeout(() => setDuplicateWarning(false), 2500);
    } else {
      soundManager.playItemScanSound();
    }

    setLastScannedBarcode(code);
    onAddItem(code);
    setBarcodeInput('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitBarcode(barcodeInput);
  };

  const handleFinishTrigger = () => {
    if (activeBox.items.length === 0) {
      soundManager.playErrorSound();
      alert(t.emptyBoxWarning);
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmFinish = () => {
    setShowConfirmModal(false);
    onFinishBox();
  };

  const totalQuantity = activeBox.items.reduce((sum, i) => sum + (i.count || 1), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in text-slate-900">
      {/* Active Box Header Card */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Box Info & PVZ */}
          <div className="flex items-center space-x-4">
            <div className="w-18 h-18 rounded-3xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
              <Package className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  {t.activeBox}:
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black border-2 border-emerald-200">
                  {language === 'uz' ? 'Ochiq (Aktiv)' : 'Открыт (Активен)'}
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black font-mono text-slate-900 tracking-wider mt-0.5">
                {activeBox.boxNumber}
              </h2>

              {/* Active PVZ display with distinct button */}
              {activeBox.pvz && (
                <div className="flex items-center space-x-2 mt-2">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-indigo-50 border-2 border-indigo-200 text-indigo-800 text-xs sm:text-sm font-black">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span>{activeBox.pvz}</span>
                  </span>
                  {onChangePvz && (
                    <button
                      onClick={onChangePvz}
                      className="px-3 py-1 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-700 hover:text-slate-900 font-extrabold text-xs flex items-center space-x-1 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <Edit3 className="w-3 h-3 text-indigo-600" />
                      <span>{language === 'uz' ? 'O\'zgartirish' : 'Сменить'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Total Items Counters */}
          <div className="flex items-center space-x-5 bg-slate-50 border-2 border-slate-200 px-6 py-4 rounded-3xl shadow-inner">
            <div className="text-right">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                {t.totalItemsInBox}
              </span>
              <span className="text-3xl sm:text-4xl font-black text-emerald-600 font-mono">
                {totalQuantity}{' '}
                <span className="text-xs font-bold text-slate-500">{language === 'uz' ? 'dona' : 'шт.'}</span>
              </span>
            </div>

            <div className="h-11 w-0.5 bg-slate-200" />

            <div className="text-right">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                {language === 'uz' ? 'Xil' : 'Видов'}
              </span>
              <span className="text-3xl sm:text-4xl font-black text-indigo-600 font-mono">
                {activeBox.items.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Item Scanner Input Bar with distinct large button */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 flex items-center space-x-2">
              <Barcode className="w-5 h-5 text-indigo-600" />
              <span>{t.itemScanTitle}</span>
            </label>

            {lastScannedBarcode && (
              <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border-2 border-emerald-200">
                Oxirgi: {lastScannedBarcode}
              </span>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400">
              <Barcode className="w-7 h-7 text-indigo-600" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder={t.itemInputPlaceholder}
              className="w-full pl-15 pr-36 py-5 bg-slate-50 border-2 border-slate-300 focus:border-indigo-600 focus:bg-white rounded-2xl text-slate-900 placeholder-slate-400 font-mono text-xl sm:text-2xl font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all shadow-inner"
              autoComplete="off"
            />
            {/* Distinct Clickable Button */}
            <button
              type="submit"
              className="absolute right-2.5 top-2.5 bottom-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-base font-black rounded-xl shadow-md border border-indigo-700 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>{language === 'uz' ? 'Qo\'shish' : 'Добавить'}</span>
            </button>
          </div>

          {/* Duplicate toast */}
          {duplicateWarning && (
            <div className="flex items-center space-x-2.5 text-amber-800 bg-amber-50 border-2 border-amber-200 px-4 py-3 rounded-2xl text-sm font-bold animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
              <span>{t.barcodeAlreadyScanned}</span>
            </div>
          )}
        </form>
      </div>

      {/* Scanned Items List */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-5">
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <Layers className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-black text-slate-900">{t.scannedItemsList}</h3>
          </div>
          <span className="text-xs font-black text-slate-600 bg-slate-100 px-4 py-1.5 rounded-full border-2 border-slate-200">
            {activeBox.items.length} {language === 'uz' ? 'xil tovar' : 'видов товаров'}
          </span>
        </div>

        {activeBox.items.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-3">
            <Barcode className="w-16 h-16 mx-auto text-slate-300 animate-pulse" />
            <p className="text-lg font-black text-slate-700">
              {language === 'uz' ? 'Hozircha birorta tovar skanerlanmadi.' : 'Пока ни одного товара не отсканировано.'}
            </p>
            <p className="text-sm text-slate-400 font-medium">
              {language === 'uz' ? 'Skaner orqali tovar shtrix-kodini urishni boshlang.' : 'Начните сканировать штрихкоды товаров через сканер.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1.5">
            {activeBox.items.map((item, index) => (
              <div
                key={item.id || index}
                className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 hover:border-indigo-300 hover:bg-white transition-all shadow-xs"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center font-mono font-black text-sm text-indigo-700">
                    {activeBox.items.length - index}
                  </div>
                  <div>
                    <span className="font-mono font-black text-lg text-slate-900 block">
                      {item.barcode}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      {item.timestamp?.split(' ')[1] || (language === 'uz' ? 'Hozir' : 'Сейчас')}
                    </span>
                  </div>
                </div>

                {/* Big Tactile Quantity Modifiers and Delete Button */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center bg-white rounded-2xl p-1 border-2 border-slate-200 shadow-xs">
                    <button
                      onClick={() => onUpdateItemCount(item.id, -1)}
                      className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-rose-50 border border-slate-200 text-slate-700 hover:text-rose-600 hover:border-rose-200 shadow-xs flex items-center justify-center transition-all cursor-pointer active:scale-90"
                      title="-1"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-11 text-center font-mono font-black text-lg text-slate-900">
                      {item.count}
                    </span>
                    <button
                      onClick={() => onUpdateItemCount(item.id, 1)}
                      className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-emerald-50 border border-slate-200 text-slate-700 hover:text-emerald-600 hover:border-emerald-200 shadow-xs flex items-center justify-center transition-all cursor-pointer active:scale-90"
                      title="+1"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-2.5 rounded-2xl bg-white border-2 border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all cursor-pointer shadow-xs active:scale-90"
                    title={language === 'uz' ? 'O\'chirish' : 'Удалить'}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Large Tactile Finish Box Master Button */}
        <div className="pt-4 border-t-2 border-slate-100">
          <button
            onClick={handleFinishTrigger}
            className="w-full py-5 px-8 bg-emerald-600 hover:bg-emerald-700 active:translate-y-0.5 text-white text-lg sm:text-xl font-black rounded-2xl shadow-xl shadow-emerald-600/30 border-2 border-emerald-700 flex items-center justify-center space-x-3 transition-all cursor-pointer"
          >
            <span>{t.finishBoxBtn}</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 space-y-5">
            <div className="flex items-center space-x-3.5">
              <div className="w-13 h-13 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-emerald-600">
                <Package className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">{t.finishBoxConfirmTitle}</h3>
                <p className="text-xs text-slate-500 font-mono font-bold">{activeBox.boxNumber}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 font-medium">{t.finishBoxConfirmText}</p>

            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 space-y-2.5 text-sm font-bold">
              <div className="flex justify-between">
                <span className="text-slate-500">{t.boxNumberLabel}:</span>
                <span className="font-mono font-black text-slate-900">{activeBox.boxNumber}</span>
              </div>
              {activeBox.pvz && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{t.pvz}:</span>
                  <span className="font-black text-indigo-700">{activeBox.pvz}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">{t.itemsCountLabel}:</span>
                <span className="font-mono font-black text-emerald-700">{totalQuantity} {language === 'uz' ? 'dona' : 'шт.'}</span>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3.5 px-4 rounded-2xl border-2 border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black transition-colors cursor-pointer"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleConfirmFinish}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-600/25 border-2 border-emerald-700 transition-all cursor-pointer"
              >
                {t.confirmFinishBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
