'use client';

import React, { useState, useEffect } from 'react';
import {
  BoxSession,
  Language,
  ScannedItem,
  ShiftId,
  ShiftPeriod,
  UserSession,
} from '@/lib/types';
import { storageService, getNextShiftChangeTimestamp } from '@/lib/storage';
import { syncItemsToGoogleSheets } from '@/lib/sheets';
import { soundManager } from '@/lib/sound';
import { Header } from '@/components/Header';
import { AuthModal } from '@/components/AuthModal';
import { ShiftSelector } from '@/components/ShiftSelector';
import { UnifiedScanner } from '@/components/UnifiedScanner';
import { ProblemDeptTable } from '@/components/ProblemDeptTable';

export default function Home() {
  // Global States
  const [currentTab, setCurrentTab] = useState<'scanner' | 'dashboard'>('scanner');
  const [language, setLanguage] = useState<Language>('uz');
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isShiftSelecting, setIsShiftSelecting] = useState<boolean>(false);
  const [allItems, setAllItems] = useState<ScannedItem[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isClientReady, setIsClientReady] = useState<boolean>(false);

  // Fetch latest items directly from Google Sheets
  const refreshFromGoogleSheets = async () => {
    try {
      const res = await fetch('/api/sync?action=fetch_sheet_items', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.items) && data.items.length > 0) {
          setAllItems(data.items);
          // LocalStorage keshini ham Google Sheets bilan yangilab qo'yamiz
          if (typeof window !== 'undefined') {
            localStorage.setItem('vp_all_scanned_items', JSON.stringify(data.items));
          }
        }
      }
    } catch (err) {
      console.warn('Failed to sync from Google Sheets:', err);
    }
  };

  // Initialize from LocalStorage and then Google Sheets
  useEffect(() => {
    const lang = storageService.getLanguage();
    setLanguage(lang);

    const session = storageService.getUserSession();
    setUserSession(session);

    const items = storageService.getAllItems();
    setAllItems(items);

    const pending = storageService.getOfflineQueue();
    setPendingCount(pending.length);

    setIsClientReady(true);

    // Google Sheets dan eng oxirgi ma'lumotlarni tortib olamiz
    refreshFromGoogleSheets();

    // Har 25 soniyada Google Sheets dan yangilab turish
    const syncInterval = setInterval(refreshFromGoogleSheets, 25000);

    // ⏰ Smena almashish vaqtlarini (Ertalab 09:00 va Kechki 21:00) har 5 soniyada tekshirib,
    // vaqti kelishi bilan avtomatik ravishda xavfsizlik uchun hisobdan chiqarib yuborish
    const shiftCheckInterval = setInterval(() => {
      const validSession = storageService.getUserSession();
      if (!validSession) {
        setUserSession((prev) => {
          if (prev !== null) {
            console.log('⏰ Smena almashdi (09:00 / 21:00). Yangi xodim kirishi uchun tizimdan chiqildi.');
            soundManager.playErrorSound();
            return null;
          }
          return null;
        });
      }
    }, 5000);

    return () => {
      clearInterval(syncInterval);
      clearInterval(shiftCheckInterval);
    };
  }, []);

  // Format current date and time
  const getFormattedTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // Step 1: Login — name, tableNumber & shift entered in 1 modal
  const handleLogin = (data: { employeeName: string; tableNumber: string; shift: ShiftId }) => {
    const session: UserSession = {
      employeeName: data.employeeName,
      tableNumber: data.tableNumber,
      shift: data.shift,
      shiftPeriod: 'day',
      loginTime: getFormattedTimestamp(),
      expiresAt: getNextShiftChangeTimestamp(new Date()),
    };
    setUserSession(session);
    storageService.saveUserSession(session);
    setIsShiftSelecting(false);
  };

  // Step 2: Shift selected
  const handleShiftSelect = (shiftId: ShiftId, period: ShiftPeriod) => {
    if (!userSession) return;
    const updatedSession: UserSession = {
      ...userSession,
      shift: shiftId,
      shiftPeriod: period,
    };
    setUserSession(updatedSession);
    storageService.saveUserSession(updatedSession);
    setIsShiftSelecting(false);
  };

  // Logout
  const handleLogout = () => {
    setUserSession(null);
    storageService.saveUserSession(null);
    setIsShiftSelecting(false);
  };

  // Unified Session Finished (Box, TargetBox, PVZ, Items)
  const handleFinishUnifiedSession = async (
    boxNumber: string,
    targetBox: string,
    pvz: string,
    scannedItems: ScannedItem[]
  ) => {
    if (!userSession || scannedItems.length === 0) return;

    const normalizedItems = scannedItems.map(item => ({
      ...item,
      boxNumber: boxNumber || item.boxNumber,
      targetBox: targetBox || item.targetBox || '—',
      pvz: pvz || item.pvz || '—',
      operator: userSession.employeeName,
      tableNumber: item.tableNumber || userSession.tableNumber || '—',
    }));

    const completedBox: BoxSession = {
      boxNumber,
      targetBox,
      pvz,
      operator: userSession.employeeName,
      shift: userSession.shift,
      shiftPeriod: userSession.shiftPeriod,
      startTime: normalizedItems[normalizedItems.length - 1]?.timestamp || getFormattedTimestamp(),
      endTime: getFormattedTimestamp(),
      items: normalizedItems,
      totalItems: normalizedItems.reduce((sum, i) => sum + (i.count || 1), 0),
      syncStatus: 'syncing',
    };

    // Save to history and all items
    storageService.addBoxToHistory(completedBox);
    setAllItems(storageService.getAllItems());

    // Sync to Google Sheets
    try {
      const syncResult = await syncItemsToGoogleSheets(normalizedItems);
      setPendingCount(storageService.getOfflineQueue().length);
      return syncResult;
    } catch (err) {
      console.warn('Background sync queued:', err);
      return { success: false, offline: true };
    }
  };

  const handleUpdateItemStatus = (itemId: string, newStatus: ScannedItem['status']) => {
    storageService.updateItemStatus(itemId, newStatus);
    setAllItems(storageService.getAllItems());
  };

  if (!isClientReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#191b26] text-slate-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-sm" />
          <p className="text-sm font-bold text-slate-300">VP Pershot yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-[#191b26] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Clean Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        language={language}
        setLanguage={setLanguage}
        userSession={userSession}
        onLogout={handleLogout}
        onChangeShift={() => setIsShiftSelecting(true)}
        pendingCount={pendingCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 relative z-10">
        {/* TAB 1: UNIFIED SCANNER WORKFLOW (Korup, PVZ, Tovar Barcode in 1 Screen) */}
        {currentTab === 'scanner' && (
          <>
            {/* Step 1: All-in-one Login Modal (FIO + Stol + Smena) */}
            {!userSession && (
              <AuthModal language={language} onLogin={handleLogin} />
            )}

            {/* Step 2: Shift Selector Modal (Only when changing shift from Header) */}
            {userSession && isShiftSelecting && (
              <ShiftSelector
                language={language}
                onSelectShift={handleShiftSelect}
                currentShift={userSession.shift}
              />
            )}

            {/* Step 3: ALL-IN-ONE SINGLE WORKSTATION SCREEN */}
            {userSession && !isShiftSelecting && (
              <UnifiedScanner
                language={language}
                userSession={userSession}
                onFinishSession={handleFinishUnifiedSession}
              />
            )}
          </>
        )}

        {/* TAB 2: PROBLEM DEPARTMENT DASHBOARD */}
        {currentTab === 'dashboard' && (
          <ProblemDeptTable
            language={language}
            items={allItems}
            onUpdateStatus={handleUpdateItemStatus}
            onRefresh={refreshFromGoogleSheets}
            sheetUrl={storageService.getSettings().sheetUrl}
          />
        )}
      </main>
    </div>
  );
}
