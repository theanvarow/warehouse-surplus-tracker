import { NextRequest, NextResponse } from 'next/server';

// 50 kishilik bir vaqtda ishlash uchun Server In-Memory Keshi
let cachedSheetItems: any[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15000; // 15 soniya server keshi

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, scriptUrl, items } = body;

    // Test connection action
    if (action === 'test_connection') {
      if (!scriptUrl) {
        return NextResponse.json({
          success: true,
          message: 'Lokal rejim faol (Google Apps Script URL kiritilmagan)'
        });
      }

      try {
        const testRes = await fetch(scriptUrl, {
          method: 'GET',
          redirect: 'follow',
        });
        if (testRes.ok) {
          const testData = await testRes.json().catch(() => ({}));
          return NextResponse.json({
            success: true,
            message: 'Google Apps Script bilan aloqa o\'rnatildi!',
            data: testData
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return NextResponse.json({
          success: false,
          error: `Google Apps Script ga ulanib bo'lmadi: ${msg}`
        });
      }
    }

    // Append items action (50 ta xodim bir vaqtda yozganda LockService/Server band bo'lmasligi uchun qayta urinish mexanizmi)
    if (scriptUrl) {
      let lastError = '';
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain',
            },
            body: JSON.stringify(body),
            redirect: 'follow',
          });

          const responseText = await response.text();
          let resData: Record<string, unknown> = {};
          try {
            resData = JSON.parse(responseText);
          } catch {
            resData = { raw: responseText };
          }

          if (response.ok || response.status === 0) {
            if (typeof resData.raw === 'string' && (resData.raw.includes('<!DOCTYPE html>') || resData.raw.includes('Не удалось открыть файл'))) {
              return NextResponse.json({
                success: false,
                error: 'Google Apps Script URL manzili xato yoki ruxsat yo\'q.'
              }, { status: 400 });
            }

            // Yangi tovar qo'shilgach, server keshini tozalaymiz, keyingi so'rov yangisini olsin
            cachedSheetItems = null;
            lastCacheTime = 0;

            return NextResponse.json({
              success: true,
              message: `${items?.length || 1} ta tovar Google Sheets ga yuborildi`,
              data: resData
            });
          } else {
            lastError = `Google Apps Script xatosi: HTTP ${response.status}`;
          }
        } catch (err: unknown) {
          lastError = err instanceof Error ? err.message : String(err);
        }

        // Agar 50 kishi bir vaqtda bosib lock bo'lib qolgan bo'lsa, 800ms kutib yana urinib ko'ramiz
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 600));
        }
      }

      return NextResponse.json({
        success: false,
        error: `Google Apps Script bilan bog'lanishda xato (3 ta urinishdan so'ng): ${lastError}`
      }, { status: 502 });
    }

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  // To'g'ridan-to'g'ri Google Sheets jadvalidan o'qish (In-memory Server Keshi bilan)
  if (action === 'fetch_sheet_items') {
    try {
      const now = Date.now();
      // Agar kesh mavjud bo'lsa va 15 soniyadan eski bo'lmasa, Google ga bormasdan keshdan qaytaramiz (50 ta xodim bir vaqtda so'rov berganda)
      if (cachedSheetItems && now - lastCacheTime < CACHE_TTL_MS) {
        return NextResponse.json({
          success: true,
          cached: true,
          total: cachedSheetItems.length,
          items: cachedSheetItems
        });
      }

      const SHEET_ID = '1ITy_OER1O6YIjoopZUR31rBxj9v8bwsBfp1rUalJO3A';
      const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
      
      const csvRes = await fetch(csvUrl, { cache: 'no-store' });
      if (!csvRes.ok) {
        // Agar Google bir onda band bo'lsa va eski kesh bo'lsa, xato o'rniga eski keshni beramiz
        if (cachedSheetItems) {
          return NextResponse.json({
            success: true,
            cached: true,
            total: cachedSheetItems.length,
            items: cachedSheetItems
          });
        }
        return NextResponse.json({ success: false, error: 'Jadvaldan yuklab bo\'lmadi' }, { status: 500 });
      }

      const csvText = await csvRes.text();
      // Parse CSV rows
      const lines = csvText.split('\n').filter(l => l.trim().length > 0);
      if (lines.length <= 1) {
        return NextResponse.json({ success: true, items: [] });
      }

      // Helper to parse standard CSV line with quotes
      const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const parsedItems = [];
      // 1-qator header bo'lgani uchun 1 dan boshlaymiz
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        // Agar № yoki shtrix-kod bo'lmasa o'tkazib yuboramiz
        if (!cols[0] && !cols[5]) continue;

        // Ustunlar:
        // 0: №, 1: Дата, 2: Смена, 3: Сотрудник, 4: Номер коруба, 5: Шк товар, 6: Кол, 7: новый коруба, 8: ПВЗ, 9: Причина, 10: Номер стол
        const countNum = parseInt(cols[6], 10);

        parsedItems.push({
          id: 'sheet_row_' + (cols[0] || i),
          timestamp: cols[1] || '',
          shift: cols[2] || '',
          operator: cols[3] || '',
          boxNumber: cols[4] || '',
          barcode: (cols[5] || '').replace(/^'/, ''),
          count: isNaN(countNum) || countNum <= 0 ? 1 : countNum,
          targetBox: cols[7] || '—',
          pvz: cols[8] || '—',
          reason: cols[9] || 'Лишний товар в коробе',
          tableNumber: cols[10] || '—',
          note: cols[9] || '',
          status: 'Дневная',
          syncStatus: 'synced'
        });
      }

      // Oxirgi qo'shilganlar yuqorida turishi uchun teskari tartibda qaytaramiz
      parsedItems.reverse();

      // Keshga saqlaymiz (keyingi xodimlar bir zumda olishi uchun)
      cachedSheetItems = parsedItems;
      lastCacheTime = Date.now();

      return NextResponse.json({
        success: true,
        total: parsedItems.length,
        items: parsedItems
      });

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  }

  const scriptUrl = searchParams.get('scriptUrl');
  if (scriptUrl) {
    try {
      const response = await fetch(scriptUrl, {
        method: 'GET',
        redirect: 'follow',
      });
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (err) {
      console.warn('Failed to fetch from scriptUrl:', err);
    }
  }

  return NextResponse.json({
    status: 'online',
    message: 'VP Pershot API tayyor'
  });
}
