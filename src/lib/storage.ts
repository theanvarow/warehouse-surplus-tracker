import { BoxSession, GoogleSheetSettings, Language, ScannedItem, ShiftId, UserSession } from './types';

const STORAGE_KEYS = {
  USER_SESSION: 'vp_user_session',
  ACTIVE_BOX: 'vp_active_box',
  BOX_HISTORY: 'vp_box_history',
  OFFLINE_QUEUE: 'vp_offline_sync_queue',
  SETTINGS: 'vp_settings',
  ALL_ITEMS: 'vp_all_scanned_items',
};

export const DEFAULT_SETTINGS: GoogleSheetSettings = {
  sheetUrl: 'https://docs.google.com/spreadsheets/d/1ITy_OER1O6YIjoopZUR31rBxj9v8bwsBfp1rUalJO3A/edit?gid=0#gid=0',
  scriptUrl: 'https://script.google.com/macros/s/AKfycbyBwdwK1JAMFDHHNHPGe5SOsg2t5-0vSQc1grC9NBOlFiLQOPLXeNY_zHNK9ypmgjo2sA/exec',
  autoSync: true,
  soundEnabled: true,
  language: 'uz',
};

class StorageService {
  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  // Session
  public getUserSession(): UserSession | null {
    if (!this.isClient()) return null;
    const raw = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    return raw ? JSON.parse(raw) : null;
  }

  public saveUserSession(session: UserSession | null) {
    if (!this.isClient()) return;
    if (session) {
      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    }
  }

  // Active Box
  public getActiveBox(): BoxSession | null {
    if (!this.isClient()) return null;
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_BOX);
    return raw ? JSON.parse(raw) : null;
  }

  public saveActiveBox(box: BoxSession | null) {
    if (!this.isClient()) return;
    if (box) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_BOX, JSON.stringify(box));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_BOX);
    }
  }

  // Box History
  public getBoxHistory(): BoxSession[] {
    if (!this.isClient()) return [];
    const raw = localStorage.getItem(STORAGE_KEYS.BOX_HISTORY);
    return raw ? JSON.parse(raw) : [];
  }

  public addBoxToHistory(box: BoxSession) {
    if (!this.isClient()) return;
    const history = this.getBoxHistory();
    const updated = [box, ...history].slice(0, 100); // Oxirgi 100 ta korup
    localStorage.setItem(STORAGE_KEYS.BOX_HISTORY, JSON.stringify(updated));

    // Shuningdek barcha tovarlar omboriga qo'shish
    const allItems = this.getAllItems();
    const updatedItems = [...box.items, ...allItems].slice(0, 1000);
    localStorage.setItem(STORAGE_KEYS.ALL_ITEMS, JSON.stringify(updatedItems));
  }

  // All Items (Muammoli otdel uchun kesh)
  public getAllItems(): ScannedItem[] {
    if (!this.isClient()) return [];
    const raw = localStorage.getItem(STORAGE_KEYS.ALL_ITEMS);
    return raw ? JSON.parse(raw) : [];
  }

  public updateItemStatus(itemId: string, status: ScannedItem['status']) {
    if (!this.isClient()) return;
    const items = this.getAllItems();
    const updated = items.map(item => item.id === itemId ? { ...item, status } : item);
    localStorage.setItem(STORAGE_KEYS.ALL_ITEMS, JSON.stringify(updated));
  }

  // Offline Sync Queue
  public getOfflineQueue(): ScannedItem[] {
    if (!this.isClient()) return [];
    const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return raw ? JSON.parse(raw) : [];
  }

  public addToOfflineQueue(items: ScannedItem[]) {
    if (!this.isClient()) return;
    const current = this.getOfflineQueue();
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify([...current, ...items]));
  }

  public clearOfflineQueue() {
    if (!this.isClient()) return;
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  }

  // Settings
  public getSettings(): GoogleSheetSettings {
    if (!this.isClient()) return DEFAULT_SETTINGS;
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      const saved = JSON.parse(raw);
      // Agar scriptUrl bo'sh bo'lsa, default dan foydalanish
      if (!saved.scriptUrl) {
        saved.scriptUrl = DEFAULT_SETTINGS.scriptUrl;
      }
      return { ...DEFAULT_SETTINGS, ...saved };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(settings: Partial<GoogleSheetSettings>) {
    if (!this.isClient()) return;
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  }

  public getLanguage(): Language {
    return this.getSettings().language || 'uz';
  }

  public setLanguage(language: Language) {
    this.saveSettings({ language });
  }
}

export const storageService = new StorageService();
