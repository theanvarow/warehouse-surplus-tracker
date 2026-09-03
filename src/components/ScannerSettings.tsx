'use client';

import React, { useState, useEffect } from 'react';
import { GoogleSheetSettings, Language } from '@/lib/types';
import { useTranslation } from '@/lib/translations';
import { storageService } from '@/lib/storage';
import { soundManager } from '@/lib/sound';
import { testConnection } from '@/lib/sheets';
import {
  FileSpreadsheet,
  Link,
  Code,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Sparkles,
  ExternalLink,
  Save,
  Volume2
} from 'lucide-react';

interface ScannerSettingsProps {
  language: Language;
}

const GOOGLE_APPS_SCRIPT_CODE = `/**
 * VP Pershot - Ortiqcha tovarlarni fiksatsiya qilish Google Apps Script (Uzum PVZ qo'llab-quvvatlanadi)
 * Jadval ID: 1ITy_OER1O6YIjoopZUR31rBxj9v8bwsBfp1rUalJO3A
 */

const SHEET_ID = '1ITy_OER1O6YIjoopZUR31rBxj9v8bwsBfp1rUalJO3A';
const SHEET_NAME = 'Лишний_Товар';

function getOrCreateSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID) || SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    const firstSheet = ss.getSheets()[0];
    if (firstSheet && firstSheet.getLastRow() === 0) {
      sheet = firstSheet;
      sheet.setName(SHEET_NAME);
    } else {
      sheet = ss.insertSheet(SHEET_NAME);
    }
  }

  if (sheet.getLastRow() === 0) {
    const headers = [
      '№',
      'Дата и Время',
      'Смена',
      'Сотрудник (Оператор)',
      'Номер Стола',
      'Номер Короба (Исходный)',
      'Куда переложен (Новый короб)',
      'ПВЗ',
      'Штрих-код Товара',
      'Количество',
      'Примечание'
    ];
    
    sheet.appendRow(headers);
    
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#0f172a');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    headerRange.setVerticalAlignment('middle');
    sheet.setRowHeight(1, 35);
    sheet.setFrozenRows(1);

    sheet.setColumnWidth(1, 50);  // №
    sheet.setColumnWidth(2, 160); // Дата и Время
    sheet.setColumnWidth(3, 150); // Смена
    sheet.setColumnWidth(4, 160); // Сотрудник
    sheet.setColumnWidth(5, 130); // Номер Стола
    sheet.setColumnWidth(6, 150); // Номер Короба (Исходный)
    sheet.setColumnWidth(7, 170); // Куда переложен (Новый короб)
    sheet.setColumnWidth(8, 170); // ПВЗ
    sheet.setColumnWidth(9, 200); // Штрих-код
    sheet.setColumnWidth(10, 100); // Количество
    sheet.setColumnWidth(11, 160); // Примечание
  }

  return sheet;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    const sheet = getOrCreateSheet();
    let postData = {};

    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        postData = e.parameter || {};
      }
    } else if (e && e.parameter) {
      postData = e.parameter;
    }

    const action = postData.action || 'append_items';

    if (action === 'append_items' || Array.isArray(postData.items)) {
      const items = Array.isArray(postData.items) ? postData.items : [postData];
      let startRow = sheet.getLastRow();
      
      const rowsToAdd = [];
      const now = new Date();
      const formattedDate = Utilities.formatDate(now, "Asia/Tashkent", "yyyy-MM-dd HH:mm:ss");

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const rowNum = startRow + i;
        const targetBoxValue = item.targetBox && item.targetBox !== '—' ? item.targetBox : (item.status || '—');
        const reasonValue = item.reason || item.note || 'Лишний товар в коробе';
        const pvzValue = item.pvz && item.pvz !== '—' ? item.pvz : '—';
        const shiftText = item.shift ? String(item.shift).replace('Smena ', '') : 'Смена 1';

        rowsToAdd.push([
          rowNum,                                     // 1. №
          item.timestamp || formattedDate,            // 2. Дата
          shiftText,                                  // 3. Смена
          item.operator || 'Неизвестно',              // 4. Сотрудник
          item.tableNumber || '—',                    // 5. Номер Стола
          item.boxNumber || '',                       // 6. Номер коруба
          "'" + (item.barcode || ''),                 // 7. Шк товар
          item.count || 1,                            // 8. Кол
          targetBoxValue,                             // 9. новый коруба
          pvzValue,                                   // 10. ПВЗ
          reasonValue                                 // 11. Причина
        ]);
      }

      if (rowsToAdd.length > 0) {
        const range = sheet.getRange(startRow + 1, 1, rowsToAdd.length, rowsToAdd[0].length);
        range.setValues(rowsToAdd);
        range.setVerticalAlignment('middle');
        
        sheet.getRange(startRow + 1, 1, rowsToAdd.length, 1).setHorizontalAlignment('center');
        sheet.getRange(startRow + 1, 3, rowsToAdd.length, 1).setHorizontalAlignment('center');
        sheet.getRange(startRow + 1, 5, rowsToAdd.length, 1).setHorizontalAlignment('center'); // Номер Стола
        sheet.getRange(startRow + 1, 6, rowsToAdd.length, 2).setHorizontalAlignment('center'); // Исходный + Новый короб
        sheet.getRange(startRow + 1, 8, rowsToAdd.length, 1).setHorizontalAlignment('center');
        sheet.getRange(startRow + 1, 10, rowsToAdd.length, 1).setHorizontalAlignment('center');
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: rowsToAdd.length + ' ta tovar muvaffaqiyatli jadvalga yozildi',
        count: rowsToAdd.length,
        timestamp: formattedDate
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Amal bajarildi'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'online',
      sheetId: SHEET_ID
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

export const ScannerSettings: React.FC<ScannerSettingsProps> = ({ language }) => {
  const t = useTranslation(language);
  const [settings, setSettings] = useState<GoogleSheetSettings>(storageService.getSettings());
  const [copied, setCopied] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setSettings(storageService.getSettings());
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    soundManager.playItemScanSound();
    setTimeout(() => setCopied(false), 3000);
  };

  const handleTest = async () => {
    if (!settings.scriptUrl) {
      setTestStatus('error');
      setTestMessage(language === 'uz' ? 'Iltimos, avval Script URL kiriting' : 'Пожалуйста, сначала введите Script URL');
      return;
    }

    setTestStatus('testing');
    setTestMessage('');
    soundManager.playItemScanSound();

    const res = await testConnection(settings.scriptUrl);
    if (res.success) {
      setTestStatus('success');
      setTestMessage(res.message || t.testSuccess);
      soundManager.playBoxScanSound();
    } else {
      setTestStatus('error');
      setTestMessage(res.message || t.testFail);
      soundManager.playErrorSound();
    }
  };

  const handleSave = () => {
    storageService.saveSettings(settings);
    soundManager.playFinishBoxSound();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-slate-100">
      {/* Title Card */}
      <div className="bg-[#1f2232] border border-[#2e3347] rounded-3xl p-6 sm:p-8 shadow-xl flex items-center space-x-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-950/70 border border-indigo-800/80 flex items-center justify-center text-indigo-400 shadow-sm">
          <FileSpreadsheet className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">{t.settingsTitle}</h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">{t.settingsSubtitle}</p>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="bg-[#1f2232] border border-[#2e3347] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Google Sheet URL */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            {t.sheetLink}
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={settings.sheetUrl}
              onChange={(e) => setSettings({ ...settings, sheetUrl: e.target.value })}
              className="flex-1 px-4 py-3.5 bg-[#191b26] border border-[#2e3347] focus:border-indigo-500 rounded-2xl text-white text-sm font-semibold focus:outline-none"
            />
            {settings.sheetUrl && (
              <a
                href={settings.sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-800/80 text-indigo-300 transition-all shadow-xs"
                title={t.openGoogleSheet}
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>

        {/* Script Web App URL */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            {t.scriptUrlLabel}
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <input
              type="text"
              value={settings.scriptUrl}
              onChange={(e) => setSettings({ ...settings, scriptUrl: e.target.value })}
              placeholder={t.scriptUrlPlaceholder}
              className="flex-1 px-4 py-3.5 bg-[#191b26] border border-[#2e3347] focus:border-indigo-500 rounded-2xl text-white font-mono text-xs sm:text-sm font-bold focus:outline-none"
            />
            <button
              onClick={handleTest}
              disabled={testStatus === 'testing'}
              className="px-5 py-3.5 bg-[#191b26] hover:bg-[#25283a] border border-[#2e3347] rounded-2xl text-slate-200 text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer"
            >
              {testStatus === 'testing' ? '...' : t.testConnectionBtn}
            </button>
          </div>

        {/* Test Status Message */}
        {testStatus === 'success' && (
          <div className="flex items-center space-x-2 text-emerald-400 text-xs sm:text-sm font-bold bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/80">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{testMessage}</span>
          </div>
        )}
        {testStatus === 'error' && (
          <div className="flex items-center space-x-2 text-rose-400 text-xs sm:text-sm font-bold bg-rose-950/60 p-3 rounded-xl border border-rose-800/80">
            <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{testMessage}</span>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-[#2e3347] flex items-center justify-between">
        {savedSuccess && (
          <span className="text-emerald-400 text-xs sm:text-sm font-bold flex items-center space-x-1">
            <Check className="w-4 h-4" />
            <span>{t.settingsSaved}</span>
          </span>
        )}
        <button
          onClick={handleSave}
          className="ml-auto py-3.5 px-7 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{t.saveSettingsBtn}</span>
        </button>
      </div>
    </div>

    {/* Google Apps Script Code Box */}
    <div className="bg-[#1f2232] border border-[#2e3347] rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Code className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-extrabold text-white">{t.appsScriptTitle}</h3>
        </div>
        <button
          onClick={handleCopyCode}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-800/80 text-indigo-300 text-xs font-bold transition-all cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? t.codeCopied : t.copyCodeBtn}</span>
        </button>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        {t.appsScriptDesc}
      </p>

      <pre className="p-4 bg-[#141520] border border-[#2e3347] rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto max-h-60 leading-relaxed">
        <code>{GOOGLE_APPS_SCRIPT_CODE}</code>
      </pre>
    </div>
    </div>
  );
};
