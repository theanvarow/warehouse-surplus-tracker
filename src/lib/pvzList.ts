import rawSheetPvzs from './sheetPvzCache.json';

export interface PvzItem {
  code: string; // e.g., 'ТАШ-12', 'FrКРШ-28', 'ГУЛ-2'
  name: string; // e.g., 'ПВЗ Ташкент №12'
  city: string; // e.g., 'Ташкент'
  region?: string;
  address?: string;
  keywords: string;
}

// Viloyatlar konfiguratsiyasi
interface RegionGroup {
  prefix: string;
  latinPrefix: string;
  cityUz: string;
  cityRu: string;
  maxNum: number;
  hasFranchise?: boolean;
}

const REGION_CONFIGS: RegionGroup[] = [
  { prefix: 'ТАШ', latinPrefix: 'TASH', cityUz: 'Toshkent', cityRu: 'Ташкент', maxNum: 350, hasFranchise: true },
  { prefix: 'САМ', latinPrefix: 'SAM', cityUz: 'Samarqand', cityRu: 'Самарканд', maxNum: 70, hasFranchise: true },
  { prefix: 'ФЕР', latinPrefix: 'FER', cityUz: 'Fargʻona', cityRu: 'Фергана', maxNum: 50, hasFranchise: true },
  { prefix: 'АНД', latinPrefix: 'AND', cityUz: 'Andijon', cityRu: 'Андижан', maxNum: 50, hasFranchise: true },
  { prefix: 'НАМ', latinPrefix: 'NAM', cityUz: 'Namangan', cityRu: 'Наманган', maxNum: 50, hasFranchise: true },
  { prefix: 'БУХ', latinPrefix: 'BUX', cityUz: 'Buxoro', cityRu: 'Бухара', maxNum: 40, hasFranchise: true },
  { prefix: 'КРШ', latinPrefix: 'KRSH', cityUz: 'Qarshi', cityRu: 'Карши', maxNum: 40, hasFranchise: true },
  { prefix: 'ГУЛ', latinPrefix: 'GUL', cityUz: 'Guliston', cityRu: 'Гулистан', maxNum: 30, hasFranchise: true },
  { prefix: 'НУК', latinPrefix: 'NUK', cityUz: 'Nukus', cityRu: 'Нукус', maxNum: 30, hasFranchise: true },
  { prefix: 'УРГ', latinPrefix: 'URG', cityUz: 'Urganch', cityRu: 'Ургенч', maxNum: 35, hasFranchise: true },
  { prefix: 'ТЕР', latinPrefix: 'TER', cityUz: 'Termiz', cityRu: 'Термез', maxNum: 30, hasFranchise: true },
  { prefix: 'ЖИЗ', latinPrefix: 'JIZ', cityUz: 'Jizzax', cityRu: 'Джизак', maxNum: 30, hasFranchise: true },
  { prefix: 'НАВ', latinPrefix: 'NAV', cityUz: 'Navoiy', cityRu: 'Навои', maxNum: 30, hasFranchise: true },
  { prefix: 'ЧИР', latinPrefix: 'CHIR', cityUz: 'Chirchiq', cityRu: 'Чирчик', maxNum: 20, hasFranchise: true },
  { prefix: 'АЛМ', latinPrefix: 'ALM', cityUz: 'Olmaliq', cityRu: 'Алмалык', maxNum: 20 },
  { prefix: 'АНГ', latinPrefix: 'ANG', cityUz: 'Angren', cityRu: 'Ангрен', maxNum: 20 },
  { prefix: 'КОК', latinPrefix: 'KOK', cityUz: 'Qoʻqon', cityRu: 'Коканд', maxNum: 30, hasFranchise: true },
  { prefix: 'МАР', latinPrefix: 'MAR', cityUz: 'Margʻilon', cityRu: 'Маргилан', maxNum: 25 },
  { prefix: 'ДЕН', latinPrefix: 'DEN', cityUz: 'Denov', cityRu: 'Денов', maxNum: 20 },
  { prefix: 'ЗАР', latinPrefix: 'ZAR', cityUz: 'Zarafshon', cityRu: 'Зарафшан', maxNum: 15 },
  { prefix: 'ШАХ', latinPrefix: 'SHAX', cityUz: 'Shahrisabz', cityRu: 'Шахрисабз', maxNum: 20 },
  { prefix: 'КАТ', latinPrefix: 'KAT', cityUz: 'Kattaqoʻrgʻon', cityRu: 'Каттакурган', maxNum: 15 },
  { prefix: 'АСА', latinPrefix: 'ASA', cityUz: 'Asaka', cityRu: 'Асака', maxNum: 15 },
  { prefix: 'ХИВ', latinPrefix: 'XIV', cityUz: 'Xiva', cityRu: 'Хива', maxNum: 15 },
  { prefix: 'ГИЖ', latinPrefix: 'GIJ', cityUz: 'Gʻijduvon', cityRu: 'Гиждуван', maxNum: 15 },
  { prefix: 'ЯНГ', latinPrefix: 'YANG', cityUz: 'Yangiyoʻl', cityRu: 'Янгиюль', maxNum: 15 },
  { prefix: 'БЕК', latinPrefix: 'BEK', cityUz: 'Bekobod', cityRu: 'Бекабад', maxNum: 15 },
  { prefix: 'ЧУС', latinPrefix: 'CHUS', cityUz: 'Chust', cityRu: 'Чуст', maxNum: 15 },
  { prefix: 'УРГТ', latinPrefix: 'URGT', cityUz: 'Urgut', cityRu: 'Ургут', maxNum: 15 },
  { prefix: 'СМК', latinPrefix: 'CMK', cityUz: 'Samarqand Xab', cityRu: 'Самарканд Хаб', maxNum: 25, hasFranchise: true },
  { prefix: 'ПШБ', latinPrefix: 'PSHB', cityUz: 'Paxtachi', cityRu: 'Пахтачи / ПШБ', maxNum: 15 },
  { prefix: 'ЖУМ', latinPrefix: 'JUM', cityUz: 'Juma', cityRu: 'Жума', maxNum: 15 },
  { prefix: 'МНГ', latinPrefix: 'MNG', cityUz: 'Mingbuloq', cityRu: 'Мингбулак', maxNum: 15, hasFranchise: true },
  { prefix: 'ТТЗ', latinPrefix: 'TTZ', cityUz: 'TTZ', cityRu: 'ТТЗ', maxNum: 10, hasFranchise: true },
  { prefix: 'ЗГН', latinPrefix: 'ZGN', cityUz: 'Zangiota', cityRu: 'Зангиота', maxNum: 10, hasFranchise: true },
  { prefix: 'КТБ', latinPrefix: 'KTB', cityUz: 'Kitob', cityRu: 'Китаб', maxNum: 10 },
  { prefix: 'КЗШ', latinPrefix: 'KZSH', cityUz: 'Qiziltepa', cityRu: 'Кизилтепа', maxNum: 10, hasFranchise: true },
  { prefix: 'ЯГБ', latinPrefix: 'YAGB', cityUz: 'Yangibozor', cityRu: 'Янгибозор', maxNum: 10 },
  { prefix: 'ГАЗ', latinPrefix: 'GAZ', cityUz: 'Gazalkent', cityRu: 'Газалкент', maxNum: 10, hasFranchise: true },
  { prefix: 'ШХР', latinPrefix: 'SHXR', cityUz: 'Shahrixon', cityRu: 'Шахрихан', maxNum: 10 },
  { prefix: 'САЛ', latinPrefix: 'SAL', cityUz: 'Salar', cityRu: 'Салар', maxNum: 10, hasFranchise: true },
  { prefix: 'ЯКК', latinPrefix: 'YAKK', cityUz: 'Yakkabogʻ', cityRu: 'Яккабог', maxNum: 10 },
  { prefix: 'ХЛД', latinPrefix: 'XLD', cityUz: 'Xonobod', cityRu: 'Хонобод', maxNum: 10, hasFranchise: true },
  { prefix: 'НАЗ', latinPrefix: 'NAZ', cityUz: 'Nazarbek', cityRu: 'Назарбек', maxNum: 10 },
  { prefix: 'МУС', latinPrefix: 'MUS', cityUz: 'Mustaqillik', cityRu: 'Мустакиллик', maxNum: 10, hasFranchise: true },
  { prefix: 'ГУЗ', latinPrefix: 'GUZ', cityUz: 'Gʻuzor', cityRu: 'Гузар', maxNum: 10, hasFranchise: true },
  { prefix: 'ГЛН', latinPrefix: 'GLN', cityUz: 'Galaosiyo', cityRu: 'Галаосиё', maxNum: 10, hasFranchise: true },
  { prefix: 'ХАВ', latinPrefix: 'XAV', cityUz: 'Xovos', cityRu: 'Хаваст', maxNum: 10 },
  { prefix: 'БЕШ', latinPrefix: 'BESH', cityUz: 'Beshariq', cityRu: 'Бешарык', maxNum: 10 },
  { prefix: 'ХНК', latinPrefix: 'XNK', cityUz: 'Xonqa', cityRu: 'Ханка', maxNum: 10 },
  { prefix: 'БХР', latinPrefix: 'BXR', cityUz: 'Buxoro', cityRu: 'Бухара', maxNum: 25 },
  { prefix: 'ДЗК', latinPrefix: 'DZK', cityUz: 'Jizzax', cityRu: 'Джизак', maxNum: 15 },
  { prefix: 'ШРЗ', latinPrefix: 'SHRZ', cityUz: 'Sherobod / Shoʻrchi', cityRu: 'Шурабад / Шурчи', maxNum: 15, hasFranchise: true },
  { prefix: 'ЯМР', latinPrefix: 'YAMR', cityUz: 'Yangimargʻilon', cityRu: 'Янгимаргилан', maxNum: 10 },
  { prefix: 'ТЕСТ', latinPrefix: 'TEST', cityUz: 'Test PVZ', cityRu: 'Тестовый ПВЗ', maxNum: 10 },
];

function buildComprehensiveDatabase(): PvzItem[] {
  const map = new Map<string, PvzItem>();

  // 1. Google Sheets dan kelgan 226 ta haqiqiy real PVZ lar
  for (const rawCode of (rawSheetPvzs as string[])) {
    const code = rawCode.trim();
    if (!code || code === '—' || code.toUpperCase() === 'BEZ PVZ') continue;
    const cleanKey = code.toLowerCase().replace(/[^a-zа-яё0-9]/g, '');
    if (!map.has(cleanKey)) {
      map.set(cleanKey, {
        code,
        name: `ПВЗ ${code}`,
        city: code.startsWith('Fr') || code.startsWith('FR') || code.startsWith('Фр') ? 'Франшиза' : 'ПВЗ',
        keywords: code.toLowerCase(),
      });
    }
  }

  // 2. Tizimli prefikslar bo'yicha to'liq ro'yxat
  for (const cfg of REGION_CONFIGS) {
    for (let i = 1; i <= cfg.maxNum; i++) {
      // Kirill: ТАШ-1
      const cyrCode = `${cfg.prefix}-${i}`;
      const cyrKey = cyrCode.toLowerCase().replace(/[^a-zа-яё0-9]/g, '');
      if (!map.has(cyrKey)) {
        map.set(cyrKey, {
          code: cyrCode,
          name: `ПВЗ ${cfg.cityRu} №${i}`,
          city: cfg.cityRu,
          keywords: `${cfg.prefix} ${cfg.latinPrefix} ${cfg.cityUz.toLowerCase()} ${cfg.cityRu.toLowerCase()} ${i}`,
        });
      }

      // Lotin: TASH-1
      const latCode = `${cfg.latinPrefix}-${i}`;
      const latKey = latCode.toLowerCase().replace(/[^a-zа-яё0-9]/g, '');
      if (!map.has(latKey)) {
        map.set(latKey, {
          code: latCode,
          name: `ПВЗ ${cfg.cityRu} №${i}`,
          city: cfg.cityRu,
          keywords: `${cfg.prefix} ${cfg.latinPrefix} ${cfg.cityUz.toLowerCase()} ${cfg.cityRu.toLowerCase()} ${i}`,
        });
      }

      // Franshiza: FrТАШ-1 & FrTASH-1
      if (cfg.hasFranchise) {
        const frCode = `Fr${cfg.prefix}-${i}`;
        const frKey = frCode.toLowerCase().replace(/[^a-zа-яё0-9]/g, '');
        if (!map.has(frKey)) {
          map.set(frKey, {
            code: frCode,
            name: `ПВЗ Fr ${cfg.cityRu} №${i}`,
            city: `${cfg.cityRu} (Fr)`,
            keywords: `fr ${cfg.prefix} fr${cfg.prefix} ${cfg.latinPrefix} ${cfg.cityUz.toLowerCase()} ${i}`,
          });
        }
      }
    }
  }

  return Array.from(map.values());
}

export const ALL_PVZ_DATABASE: PvzItem[] = buildComprehensiveDatabase();
export const POPULAR_PVZ_LIST: PvzItem[] = ALL_PVZ_DATABASE;

// Lotin va Kirill o'rtasidagi aqlli bog'lanish (Transliteratsiya)
const PHONETIC_MAP: Record<string, string> = {
  'tash': 'таш', 'tas': 'таш', 'taw': 'таш', 'sam': 'сам', 'fer': 'фер',
  'and': 'анд', 'nam': 'нам', 'bux': 'бух', 'bkr': 'бхр', 'bxr': 'бхр',
  'krsh': 'крш', 'kar': 'крш', 'qar': 'крш', 'gul': 'гул', 'nuk': 'нук',
  'urg': 'ург', 'jiz': 'жиз', 'nav': 'нав', 'chir': 'чир', 'alm': 'алм',
  'ang': 'анг', 'kok': 'кок', 'qoq': 'кок', 'mar': 'мар', 'den': 'ден',
  'zar': 'зар', 'cmk': 'смк', 'smk': 'смк', 'pshb': 'пшб', 'zhum': 'жум',
  'jum': 'жум', 'besh': 'беш', 'xnk': 'хнк', 'xav': 'хав', 'shxr': 'шхр',
  'zgn': 'згн', 'ttz': 'ттз', 'mng': 'мнг', 'yagb': 'ягб', 'gaz': 'газ',
  'sal': 'сал', 'yakk': 'якк', 'xld': 'хлд', 'naz': 'наз', 'mus': 'мус',
  'guz': 'гуз', 'gln': 'глн', 'dzk': 'дзк', 'shrz': 'шрз', 'yamr': 'ямр',
  'fr': 'фр', 'franchise': 'фр'
};

function normalizeChars(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]/g, '');
}

// 🔍 ULTRA-MOSLASHUVCHAN SMART PVZ QIDIRUVI
export function searchPvz(query: string, limit = 25): PvzItem[] {
  const rawClean = query.trim().toLowerCase();
  if (!rawClean) {
    // Agar qidiruv bo'sh bo'lsa (fokus bo'lganda), eng mashhur PVZ larni chiqaramiz
    return ALL_PVZ_DATABASE.slice(0, 15);
  }

  const clean = normalizeChars(rawClean);

  // Lotincha kiritilgan so'zning kirill muqobili
  let phoneticQuery = clean;
  for (const [lat, cyr] of Object.entries(PHONETIC_MAP)) {
    if (phoneticQuery.includes(lat)) {
      phoneticQuery = phoneticQuery.replaceAll(lat, cyr);
    }
  }

  const isDigitsOnly = /^\d+$/.test(clean);

  const matched: { item: PvzItem; score: number }[] = [];

  for (const item of ALL_PVZ_DATABASE) {
    const itemNorm = normalizeChars(item.code);
    const itemCyrNorm = normalizeChars(item.keywords);

    let score = 0;

    // 1. To'liq 100% tenglik
    if (itemNorm === clean || itemNorm === phoneticQuery) {
      score = 1000;
    }
    // 2. Boshlanishi aynan mos kelishi (masalan 'таш' -> 'таш-1', 'fr' -> 'fr-таш')
    else if (itemNorm.startsWith(clean) || itemNorm.startsWith(phoneticQuery)) {
      score = 800;
    }
    // 3. Faqat raqam kiritilganda (masalan '12' -> ТАШ-12, САМ-12)
    else if (isDigitsOnly && (item.code.endsWith(`-${clean}`) || itemNorm.endsWith(clean))) {
      score = 650;
    }
    // 4. Qidiruv so'zi kod ichida uchrashi (masalan '28' -> 'FrКРШ-28')
    else if (itemNorm.includes(clean) || itemNorm.includes(phoneticQuery)) {
      score = 500;
    }
    // 5. Kalit so'zlar yoki shahar nomi bo'yicha mos kelishi
    else if (itemCyrNorm.includes(clean) || itemCyrNorm.includes(phoneticQuery)) {
      score = 300;
    }

    if (score > 0) {
      matched.push({ item, score });
    }
  }

  return matched
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(m => m.item);
}

// 🕒 Oxirgi tanlangan PVZ lar xotirasi (LocalStorage)
const RECENT_PVZ_KEY = 'vp_recent_pvz_list';

export function getRecentPvzList(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_PVZ_KEY);
    return raw ? JSON.parse(raw) : ['ТАШ-1', 'ТАШ-12', 'САМ-5', 'ГУЛ-2', 'FrКРШ-28'];
  } catch {
    return ['ТАШ-1', 'ТАШ-12', 'САМ-5', 'ГУЛ-2', 'FrКРШ-28'];
  }
}

export function addRecentPvz(pvzCode: string): void {
  if (typeof window === 'undefined' || !pvzCode) return;
  try {
    const clean = pvzCode.trim();
    if (!clean || clean === '—') return;
    const current = getRecentPvzList().filter(p => p.toLowerCase() !== clean.toLowerCase());
    const updated = [clean, ...current].slice(0, 8);
    localStorage.setItem(RECENT_PVZ_KEY, JSON.stringify(updated));
  } catch {}
}
