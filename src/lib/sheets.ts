import { storageService } from './storage';
import { ScannedItem } from './types';

export interface SyncResponse {
  success: boolean;
  message?: string;
  count?: number;
  offline?: boolean;
}

export async function syncItemsToGoogleSheets(items: ScannedItem[]): Promise<SyncResponse> {
  if (!items || items.length === 0) {
    return { success: true, count: 0 };
  }

  const settings = storageService.getSettings();

  try {
    const payload = {
      action: 'append_items',
      scriptUrl: settings.scriptUrl,
      items: items.map(item => {
        // Faqat smena raqamini ajratib olamiz (masalan '1', '2', '3', '4')
        const shiftDigit = String(item.shift || '').replace(/[^0-9]/g, '') || '1';
        const shiftValue = `Смена ${shiftDigit}`;

        const targetBoxValue = item.targetBox && item.targetBox !== '—' ? item.targetBox : '—';

        // Koment/Izoh ustuniga Tanlangan Prichina yoziladi
        const reasonValue = item.reason || 'Лишний товар в коробе';
        const pvzValue = item.pvz && item.pvz !== '—' ? item.pvz : '—';

        return {
          timestamp: item.timestamp,
          shift: shiftValue,         // -> Смена 1 / Смена 2 / Смена 3 / Смена 4
          operator: item.operator,
          tableNumber: item.tableNumber || '—', // -> Номер стола
          boxNumber: item.boxNumber,
          targetBox: targetBoxValue, // -> Куда переложен (Новый короб)
          pvz: pvzValue,
          barcode: item.barcode,
          count: item.count || 1,
          status: targetBoxValue,    // -> Status o'rniga yangi korup raqami
          note: reasonValue,         // -> Tanlangan Prichina (Причина)
          reason: reasonValue,
        };
      })
    };

    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        count: items.length,
        message: data.message || 'Muvaffaqiyatli sinxronlashtirildi'
      };
    } else {
      throw new Error(`Server status: ${response.status}`);
    }
  } catch (error) {
    console.warn('Google Sheets-ga yuborishda xatolik yuz berdi. Offline navbatga qo\'shildi:', error);
    storageService.addToOfflineQueue(items);
    return {
      success: false,
      count: 0,
      offline: true,
      message: 'Offline rejimda saqlandi'
    };
  }
}

export async function testConnection(scriptUrl: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'test_connection',
        scriptUrl,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: data.success,
        message: data.message || (data.success ? 'Aloqa muvaffaqiyatli' : 'Aloqa xatosi'),
      };
    }
    return { success: false, message: `Server javobi: ${response.status}` };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Xatolik: ${msg}` };
  }
}
