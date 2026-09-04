export interface PvzItem {
  code: string; // e.g., 'ТАШ-12', 'FrКРШ-28', 'ГУЛ-2'
  name: string; // e.g., 'ПВЗ Ташкент №12 (Чиланзар)'
  city: string; // e.g., 'Ташкент'
  region?: string;
  address?: string;
  keywords: string; // e.g., 'tashkent tash chil 12'
}

// Prefikslar va viloyatlar lug'ati
interface RegionGroup {
  prefix: string;
  latinPrefix: string;
  cityUz: string;
  cityRu: string;
  maxNum: number;
  hasFranchise?: boolean;
}

const REGION_CONFIGS: RegionGroup[] = [
  { prefix: 'ТАШ', latinPrefix: 'TAS', cityUz: 'Toshkent', cityRu: 'Ташкент', maxNum: 150, hasFranchise: true },
  { prefix: 'САМ', latinPrefix: 'SAM', cityUz: 'Samarqand', cityRu: 'Самарканд', maxNum: 60, hasFranchise: true },
  { prefix: 'ФЕР', latinPrefix: 'FER', cityUz: 'Fargʻona', cityRu: 'Фергана', maxNum: 40, hasFranchise: true },
  { prefix: 'АНД', latinPrefix: 'AND', cityUz: 'Andijon', cityRu: 'Андижан', maxNum: 40, hasFranchise: true },
  { prefix: 'НАМ', latinPrefix: 'NAM', cityUz: 'Namangan', cityRu: 'Наманган', maxNum: 40, hasFranchise: true },
  { prefix: 'БУХ', latinPrefix: 'BUX', cityUz: 'Buxoro', cityRu: 'Бухара', maxNum: 35, hasFranchise: true },
  { prefix: 'КРШ', latinPrefix: 'KRSH', cityUz: 'Qarshi', cityRu: 'Карши', maxNum: 35, hasFranchise: true },
  { prefix: 'ГУЛ', latinPrefix: 'GUL', cityUz: 'Guliston', cityRu: 'Гулистан', maxNum: 25, hasFranchise: true },
  { prefix: 'НУК', latinPrefix: 'NUK', cityUz: 'Nukus', cityRu: 'Нукус', maxNum: 25, hasFranchise: true },
  { prefix: 'УРГ', latinPrefix: 'URG', cityUz: 'Urganch', cityRu: 'Ургенч', maxNum: 30, hasFranchise: true },
  { prefix: 'ТЕР', latinPrefix: 'TER', cityUz: 'Termiz', cityRu: 'Термез', maxNum: 25, hasFranchise: true },
  { prefix: 'ЖИЗ', latinPrefix: 'JIZ', cityUz: 'Jizzax', cityRu: 'Джизак', maxNum: 25, hasFranchise: true },
  { prefix: 'НАВ', latinPrefix: 'NAV', cityUz: 'Navoiy', cityRu: 'Навои', maxNum: 25, hasFranchise: true },
  { prefix: 'ЧИР', latinPrefix: 'CHIR', cityUz: 'Chirchiq', cityRu: 'Чирчик', maxNum: 15, hasFranchise: true },
  { prefix: 'АЛМ', latinPrefix: 'ALM', cityUz: 'Olmaliq', cityRu: 'Алмалык', maxNum: 15 },
  { prefix: 'АНГ', latinPrefix: 'ANG', cityUz: 'Angren', cityRu: 'Ангрен', maxNum: 15 },
  { prefix: 'КОК', latinPrefix: 'KOK', cityUz: 'Qoʻqon', cityRu: 'Коканд', maxNum: 25, hasFranchise: true },
  { prefix: 'МАР', latinPrefix: 'MAR', cityUz: 'Margʻilon', cityRu: 'Маргилан', maxNum: 20 },
  { prefix: 'ДЕН', latinPrefix: 'DEN', cityUz: 'Denov', cityRu: 'Денов', maxNum: 15 },
  { prefix: 'ЗАР', latinPrefix: 'ZAR', cityUz: 'Zarafshon', cityRu: 'Зарафшан', maxNum: 10 },
  { prefix: 'ШАХ', latinPrefix: 'SHAX', cityUz: 'Shahrisabz', cityRu: 'Шахрисабз', maxNum: 15 },
  { prefix: 'КАТ', latinPrefix: 'KAT', cityUz: 'Kattaqoʻrgʻon', cityRu: 'Каттакурган', maxNum: 10 },
  { prefix: 'АСА', latinPrefix: 'ASA', cityUz: 'Asaka', cityRu: 'Асака', maxNum: 10 },
  { prefix: 'ХИВ', latinPrefix: 'XIV', cityUz: 'Xiva', cityRu: 'Хива', maxNum: 10 },
  { prefix: 'ГИЖ', latinPrefix: 'GIJ', cityUz: 'Gʻijduvon', cityRu: 'Гиждуван', maxNum: 10 },
  { prefix: 'ЯНГ', latinPrefix: 'YANG', cityUz: 'Yangiyoʻl', cityRu: 'Янгиюль', maxNum: 10 },
  { prefix: 'БЕК', latinPrefix: 'BEK', cityUz: 'Bekobod', cityRu: 'Бекабад', maxNum: 10 },
  { prefix: 'ЧУС', latinPrefix: 'CHUS', cityUz: 'Chust', cityRu: 'Чуст', maxNum: 10 },
  { prefix: 'УРГТ', latinPrefix: 'URGT', cityUz: 'Urgut', cityRu: 'Ургут', maxNum: 10 },
  { prefix: 'СМК', latinPrefix: 'CMK', cityUz: 'Samarqand Xab', cityRu: 'Самарканд Хаб', maxNum: 10 },
  { prefix: 'ПШБ', latinPrefix: 'PSHB', cityUz: 'Paxtachi', cityRu: 'Пахтачи / ПШБ', maxNum: 10 },
  { prefix: 'ЖУМ', latinPrefix: 'JUM', cityUz: 'Juma', cityRu: 'Жума', maxNum: 10 },
  { prefix: 'ТЕСТ', latinPrefix: 'TEST', cityUz: 'Test PVZ', cityRu: 'Тестовый ПВЗ', maxNum: 5 },
];

// Dastur ishga tushganda avtomatik ravishda to'liq ro'yxatni shakllantiramiz
function buildPvzDatabase(): PvzItem[] {
  const list: PvzItem[] = [];

  for (const cfg of REGION_CONFIGS) {
    for (let i = 1; i <= cfg.maxNum; i++) {
      // Standart prefiks (masalan: ТАШ-1)
      const code = `${cfg.prefix}-${i}`;
      const name = `ПВЗ ${cfg.cityRu} №${i}`;
      const keywords = `${cfg.prefix} ${cfg.latinPrefix} ${cfg.cityUz.toLowerCase()} ${cfg.cityRu.toLowerCase()} ${i}`;
      list.push({ code, name, city: cfg.cityRu, keywords });

      // Franshiza prefiksi (masalan: FrТАШ-1, FrКРШ-28)
      if (cfg.hasFranchise) {
        const frCode = `Fr${cfg.prefix}-${i}`;
        const frName = `ПВЗ Fr ${cfg.cityRu} №${i}`;
        const frKeywords = `fr ${cfg.prefix} fr${cfg.prefix} ${cfg.latinPrefix} ${cfg.cityUz.toLowerCase()} ${cfg.cityRu.toLowerCase()} ${i}`;
        list.push({ code: frCode, name: frName, city: cfg.cityRu, keywords: frKeywords });
      }
    }
  }

  return list;
}

export const ALL_PVZ_DATABASE: PvzItem[] = buildPvzDatabase();
export const POPULAR_PVZ_LIST: PvzItem[] = ALL_PVZ_DATABASE;

// Lotin va Kirill transliteratsiyasi
const TRANSLIT_MAP: Record<string, string> = {
  'a': 'а', 'b': 'б', 'v': 'в', 'g': 'г', 'd': 'д', 'e': 'е', 'yo': 'ё', 'j': 'ж',
  'z': 'з', 'i': 'и', 'y': 'й', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о',
  'p': 'п', 'r': 'р', 's': 'с', 't': 'т', 'u': 'у', 'f': 'ф', 'x': 'х', 'h': 'х',
  'ts': 'ц', 'ch': 'ч', 'sh': 'ш', 'q': 'к', 'gʻ': 'г', 'oʻ': 'у'
};

function transliterateLatinToCyrillic(text: string): string {
  let res = text.toLowerCase();
  for (const [lat, cyr] of Object.entries(TRANSLIT_MAP)) {
    res = res.replaceAll(lat, cyr);
  }
  return res;
}

// 🔍 Smart PVZ Qidiruv funksiyasi
export function searchPvz(query: string, limit = 12): PvzItem[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const cyrillicQuery = transliterateLatinToCyrillic(clean);
  // Bo'sh joylar yoki chiziqchalarni tozalangan shakli (masalan 'tash 12' -> 'tash-12')
  const unifiedQuery = clean.replace(/[\s_]+/g, '-');
  const unifiedCyrillic = cyrillicQuery.replace(/[\s_]+/g, '-');

  // Faqat raqam terilgan bo'lsa (masalan '12')
  const isOnlyNumber = /^\d+$/.test(clean);

  const matched: { item: PvzItem; score: number }[] = [];

  for (const item of ALL_PVZ_DATABASE) {
    const codeLower = item.code.toLowerCase();
    const cleanCode = codeLower.replace(/[^a-zа-яё0-9]/g, '');
    const cleanSearch = clean.replace(/[^a-zа-яё0-9]/g, '');
    const cleanCyrillicSearch = cyrillicQuery.replace(/[^a-zа-яё0-9]/g, '');

    let score = 0;

    // 1. To'liq aniq kod mos kelishi
    if (codeLower === clean || codeLower === unifiedQuery || codeLower === unifiedCyrillic) {
      score = 100;
    }
    // 2. Kod aynan shu so'zdan boshlanishi (masalan 'таш' yoki 'tas' yoki 'frкрш')
    else if (
      codeLower.startsWith(clean) ||
      codeLower.startsWith(cyrillicQuery) ||
      cleanCode.startsWith(cleanSearch) ||
      cleanCode.startsWith(cleanCyrillicSearch)
    ) {
      score = 80;
    }
    // 3. Agar faqat raqam yozilgan bo'lsa (masalan '12' -> ТАШ-12, САМ-12)
    else if (isOnlyNumber && (item.code.endsWith(`-${clean}`) || item.code.endsWith(clean))) {
      score = 60;
    }
    // 4. Kod ichida so'z yoki raqam uchrashi
    else if (
      codeLower.includes(clean) ||
      codeLower.includes(cyrillicQuery) ||
      cleanCode.includes(cleanSearch) ||
      cleanCode.includes(cleanCyrillicSearch)
    ) {
      score = 40;
    }
    // 5. Shahar nomi yoki kalit so'zlar bo'yicha mos kelishi
    else if (
      item.keywords.includes(clean) ||
      item.keywords.includes(cyrillicQuery) ||
      item.name.toLowerCase().includes(clean) ||
      item.name.toLowerCase().includes(cyrillicQuery)
    ) {
      score = 20;
    }

    if (score > 0) {
      matched.push({ item, score });
    }
  }

  // Reytingi yuqorilarini oldinga chiqarish
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
    return raw ? JSON.parse(raw) : ['ТАШ-12', 'САМ-5', 'ГУЛ-2', 'FrКРШ-28', 'ФЕР-1'];
  } catch {
    return ['ТАШ-12', 'САМ-5', 'ГУЛ-2', 'FrКРШ-28', 'ФЕР-1'];
  }
}

export function addRecentPvz(pvzCode: string): void {
  if (typeof window === 'undefined' || !pvzCode) return;
  try {
    const clean = pvzCode.trim();
    if (!clean || clean === '—') return;
    const current = getRecentPvzList().filter(p => p.toLowerCase() !== clean.toLowerCase());
    const updated = [clean, ...current].slice(0, 6);
    localStorage.setItem(RECENT_PVZ_KEY, JSON.stringify(updated));
  } catch {}
}
