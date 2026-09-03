'use client';

import React, { useState, useEffect } from 'react';
import { Language, UserSession } from '@/lib/types';
import { useTranslation } from '@/lib/translations';
import { soundManager } from '@/lib/sound';
import { storageService } from '@/lib/storage';
import {
  Barcode,
  LayoutDashboard,
  Settings,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  User,
  Clock,
  LogOut,
  MapPin,
  CheckCircle2,
  CloudOff
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'scanner' | 'dashboard';
  setCurrentTab: (tab: 'scanner' | 'dashboard') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  userSession: UserSession | null;
  onLogout: () => void;
  onChangeShift: () => void;
  pendingCount?: number;
  currentPvz?: string;
  onChangePvz?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  language,
  setLanguage,
  userSession,
  onLogout,
  onChangeShift,
  pendingCount = 0,
  currentPvz,
  onChangePvz,
}) => {
  const t = useTranslation(language);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    const settings = storageService.getSettings();
    setSoundOn(settings.soundEnabled ?? true);
    soundManager.setEnabled(settings.soundEnabled ?? true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundManager.setEnabled(next);
    storageService.saveSettings({ soundEnabled: next });
    if (next) {
      soundManager.playItemScanSound();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const toggleLanguage = (lang: Language) => {
    setLanguage(lang);
    storageService.setLanguage(lang);
    soundManager.playBoxScanSound();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1f2232]/95 backdrop-blur-md border-b border-[#2e3347] text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Official Uzum Logo & Compact Title */}
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#7000FF] flex items-center justify-center shadow-lg shadow-purple-600/40 text-white shrink-0">
            <svg viewBox="0 0 100 100" className="w-6 h-6 fill-current">
              {/* Official Uzum 'U' symbol with inner vertical cut */}
              <rect x="43" y="16" width="14" height="34" rx="7" fill="#FFFFFF" />
              <path
                d="M 21 34 
                   L 21 64 
                   C 21 82, 79 82, 79 64 
                   L 79 34 
                   L 66 34 
                   L 66 63 
                   C 66 73, 34 73, 34 63 
                   L 34 34 Z"
                fill="#FFFFFF"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-black tracking-tight text-white">
                Возвратный поток <span className="font-extrabold text-white">пересчёт</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-bold leading-none mt-0.5 hidden sm:block">
              Фиксация лишнего товара
            </p>
          </div>
        </div>

        {/* Center: Compact Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-[#191b26] p-1 rounded-xl border border-[#2e3347]">
          <button
            onClick={() => {
              setCurrentTab('scanner');
              soundManager.playItemScanSound();
            }}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-black transition-all cursor-pointer ${
              currentTab === 'scanner'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#25283a]'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>{t.scannerMode}</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('dashboard');
              soundManager.playItemScanSound();
            }}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-black transition-all cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#25283a]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{t.dashboard}</span>
          </button>
        </nav>

        {/* Right: User, PVZ, Controls (Compact) */}
        <div className="flex items-center space-x-2">
          {/* Active PVZ badge */}
          {currentPvz && (
            <button
              onClick={onChangePvz}
              title={t.changePvzBtn}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/80 text-indigo-300 text-xs font-bold transition-all cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span className="max-w-[130px] truncate">{currentPvz}</span>
            </button>
          )}

          {/* User Session Pill & Shift Button */}
          {userSession ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#191b26] border border-[#2e3347] text-xs font-bold shadow-sm">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-extrabold text-slate-200 max-w-[110px] truncate">
                    {userSession.employeeName}
                  </span>
                  {userSession.tableNumber && (
                    <span className="px-1.5 py-0.5 rounded bg-[#161822] border border-[#2e3347] font-mono text-[10px] font-black text-indigo-300">
                      {userSession.tableNumber}
                    </span>
                  )}
                </div>

                <span className="text-slate-600">&bull;</span>

                {/* Shift Switcher Button */}
                <button
                  onClick={onChangeShift}
                  title={language === 'uz' ? 'Smenani almashtirish' : 'Сменить смену'}
                  className="flex items-center space-x-1.5 text-indigo-400 hover:text-indigo-300 bg-indigo-950/70 hover:bg-indigo-900/80 px-2.5 py-1 rounded-lg border border-indigo-800/60 transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-mono font-black">{userSession.shift}</span>
                </button>
              </div>

              {/* Prominent, Clearly Visible Logout Button */}
              <button
                onClick={onLogout}
                title={language === 'uz' ? 'Akkountdan chiqish' : 'Выйти из аккаунта'}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800/80 hover:border-rose-500 text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95 group"
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-rose-400 group-hover:text-white" />
                <span className="hidden sm:inline">{language === 'uz' ? 'Chiqish' : 'Выход'}</span>
              </button>
            </div>
          ) : null}

          {/* Sync Status Badge */}
          {pendingCount > 0 ? (
            <div
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-800/80 text-xs font-black animate-pulse"
              title={t.syncPending}
            >
              <CloudOff className="w-3.5 h-3.5" />
              <span>{pendingCount}</span>
            </div>
          ) : (
            <div
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 text-xs font-black"
              title={t.syncedSuccess}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          )}

          {/* Sound Toggle Button */}
          <button
            onClick={toggleSound}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              soundOn
                ? 'bg-[#191b26] border-[#2e3347] text-slate-300 hover:text-white hover:bg-[#25283a]'
                : 'bg-rose-950/60 border-rose-800/80 text-rose-400'
            }`}
            title={t.soundEffects}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-[#191b26] border border-[#2e3347] text-slate-300 hover:text-white hover:bg-[#25283a] transition-all hidden sm:block cursor-pointer"
            title="To'liq ekran"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Language Switcher Button Group */}
          <div className="flex items-center bg-[#191b26] border border-[#2e3347] rounded-lg p-0.5">
            <button
              onClick={() => toggleLanguage('uz')}
              className={`px-2 py-0.5 text-[11px] font-black rounded transition-all cursor-pointer ${
                language === 'uz'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              UZ
            </button>
            <button
              onClick={() => toggleLanguage('ru')}
              className={`px-2 py-0.5 text-[11px] font-black rounded transition-all cursor-pointer ${
                language === 'ru'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              RU
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
