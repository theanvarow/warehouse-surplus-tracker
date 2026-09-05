export type Language = 'uz' | 'ru';

export type ShiftId = '1' | '2' | '3' | '4';
export type ShiftPeriod = 'day' | 'night';

export interface ShiftInfo {
  id: ShiftId;
  nameUz: string;
  nameRu: string;
  timeRange: string;
  color: string;
}

export interface UserSession {
  employeeName: string;
  tableNumber: string; // Stol raqami (Номер стола)
  shift: ShiftId;
  shiftPeriod: ShiftPeriod;
  loginTime: string;
  expiresAt?: number; // Smena tugash vaqti timestamp (09:00 yoki 21:00)
}

export const ITEM_REASONS = [
  'Лишний товар в коробе',
  'QR / IMEI',
  'Товар без акта',
  'Ранее отменен',
  'Неверный товар',
  'Пустая упаковка без товара внутри',
  'Заказ в статусе "Выдан / К выдаче / Доставляется"',
  'Товар уже пересчитан',
] as const;

export type ItemReason = typeof ITEM_REASONS[number];

export interface ScannedItem {
  id: string;
  barcode: string;
  timestamp: string;
  count: number;
  boxNumber: string;
  targetBox?: string; // Qaysi korupga qaytib joylanganligi (Куда переложен)
  pvz: string;
  operator: string;
  tableNumber?: string; // Stol raqami (Номер стола)
  reason?: string; // Sabab / Prichina
  shift: ShiftId;
  shiftPeriod: ShiftPeriod;
  condition?: 'good' | 'defect'; // 'good' = Yaxshi tovar (Годный), 'defect' = Brak tovar (Брак)
  status: 'Yangi' | 'Tekshirilmoqda' | 'Qayta ishlandi' | 'Muammo hal qilindi' | 'Дневная' | 'Ночная';
  syncStatus: 'pending' | 'synced' | 'error';
  note?: string;
}

export interface BoxSession {
  boxNumber: string;
  targetBox?: string;
  pvz: string;
  operator: string;
  shift: ShiftId;
  shiftPeriod: ShiftPeriod;
  startTime: string;
  endTime?: string;
  items: ScannedItem[];
  totalItems: number;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
}

export interface GoogleSheetSettings {
  sheetUrl: string;
  scriptUrl: string;
  autoSync: boolean;
  soundEnabled: boolean;
  language: Language;
}
