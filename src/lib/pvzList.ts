import officialPvzs from './officialPvzList.json';
import rawSheetPvzs from './sheetPvzCache.json';

export interface PvzItem {
  code: string; // e.g., 'ТАШ-12', 'FrККД-8', 'ipNEW-211016'
  name: string; // e.g., 'ПВЗ Ташкент №12'
  city: string; // e.g., 'Ташкент'
  region?: string;
  address?: string;
  keywords: string;
}

// Shaharlar va viloyatlar lug'ati (Prefiks -> Shahar & Viloyat)
const CITY_DICT: Record<string, { ru: string; uz: string; region: string }> = {
  'ТАШ': { ru: 'Ташкент', uz: 'Toshkent', region: 'tashkent' },
  'СМК': { ru: 'Самарканд', uz: 'Samarqand', region: 'samarkand' },
  'САМ': { ru: 'Самарканд', uz: 'Samarqand', region: 'samarkand' },
  'ФЕР': { ru: 'Фергана', uz: 'Fargʻona', region: 'fergana' },
  'АНД': { ru: 'Андижан', uz: 'Andijon', region: 'fergana' },
  'НАМ': { ru: 'Наманган', uz: 'Namangan', region: 'fergana' },
  'БХР': { ru: 'Бухара', uz: 'Buxoro', region: 'bukhara' },
  'БУХ': { ru: 'Бухара', uz: 'Buxoro', region: 'bukhara' },
  'КРШ': { ru: 'Карши', uz: 'Qarshi', region: 'regions' },
  'ГУЛ': { ru: 'Гулистан', uz: 'Guliston', region: 'regions' },
  'НУК': { ru: 'Нукус', uz: 'Nukus', region: 'regions' },
  'УРГ': { ru: 'Ургенч', uz: 'Urganch', region: 'regions' },
  'ТЕР': { ru: 'Термез', uz: 'Termiz', region: 'regions' },
  'ДЗК': { ru: 'Джизак', uz: 'Jizzax', region: 'regions' },
  'ЖИЗ': { ru: 'Джизак', uz: 'Jizzax', region: 'regions' },
  'НАВ': { ru: 'Навои', uz: 'Navoiy', region: 'bukhara' },
  'ЧИР': { ru: 'Чирчик', uz: 'Chirchiq', region: 'tashkent' },
  'ККД': { ru: 'Коканд', uz: 'Qoʻqon', region: 'fergana' },
  'КОК': { ru: 'Коканд', uz: 'Qoʻqon', region: 'fergana' },
  'МРГ': { ru: 'Маргилан', uz: 'Margʻilon', region: 'fergana' },
  'МАР': { ru: 'Маргилан', uz: 'Margʻilon', region: 'fergana' },
  'АЛМ': { ru: 'Алмалык', uz: 'Olmaliq', region: 'tashkent' },
  'АНГ': { ru: 'Ангрен', uz: 'Angren', region: 'tashkent' },
  'ДЕН': { ru: 'Денов', uz: 'Denov', region: 'regions' },
  'ЗАР': { ru: 'Зарафшан', uz: 'Zarafshon', region: 'bukhara' },
  'ШАХ': { ru: 'Шахрисабз', uz: 'Shahrisabz', region: 'regions' },
  'КАТ': { ru: 'Каттакурган', uz: 'Kattaqoʻrgʻon', region: 'samarkand' },
  'КТГ': { ru: 'Каттакурган', uz: 'Kattaqoʻrgʻon', region: 'samarkand' },
  'АСА': { ru: 'Асака', uz: 'Asaka', region: 'fergana' },
  'ХИВ': { ru: 'Хива', uz: 'Xiva', region: 'regions' },
  'ГИЖ': { ru: 'Гиждуван', uz: 'Gʻijduvon', region: 'bukhara' },
  'ЯНГ': { ru: 'Янгиюль', uz: 'Yangiyoʻl', region: 'tashkent' },
  'БЕК': { ru: 'Бекабад', uz: 'Bekobod', region: 'tashkent' },
  'ЧУС': { ru: 'Чуст', uz: 'Chust', region: 'fergana' },
  'УРГТ': { ru: 'Ургут', uz: 'Urgut', region: 'samarkand' },
  'БЕР': { ru: 'Беруни', uz: 'Beruniy', region: 'regions' },
  'ШРЗ': { ru: 'Шерабад', uz: 'Sherobod', region: 'regions' },
  'ЯКК': { ru: 'Яккабаг', uz: 'Yakkabogʻ', region: 'regions' },
  'КРМ': { ru: 'Кармана', uz: 'Karmana', region: 'bukhara' },
  'ПРК': { ru: 'Паркент', uz: 'Parkent', region: 'tashkent' },
  'ЧИН': { ru: 'Чиназ', uz: 'Chinoz', region: 'tashkent' },
  'КУВ': { ru: 'Кува', uz: 'Quva', region: 'fergana' },
  'ГЛА': { ru: 'Галаасия', uz: 'Galaosiyo', region: 'bukhara' },
  'ГЛН': { ru: 'Галаасия', uz: 'Galaosiyo', region: 'bukhara' },
  'ЗГН': { ru: 'Зангиата', uz: 'Zangiota', region: 'tashkent' },
  'ЖНД': { ru: 'Жондор', uz: 'Jondor', region: 'bukhara' },
  'КШК': { ru: 'Кошкупыр', uz: 'Qoʻshkoʻpir', region: 'regions' },
  'МУБ': { ru: 'Мубарек', uz: 'Muborak', region: 'regions' },
  'МНТ': { ru: 'Мингбулак', uz: 'Mingbuloq', region: 'fergana' },
  'МНГ': { ru: 'Мингбулак', uz: 'Mingbuloq', region: 'fergana' },
  'БУТ': { ru: 'Бустон', uz: 'Boʻston', region: 'regions' },
  'САР': { ru: 'Сариасия', uz: 'Sariosiyo', region: 'regions' },
  'ХАВ': { ru: 'Хаваст', uz: 'Xovos', region: 'regions' },
  'БЕШ': { ru: 'Бешарык', uz: 'Beshariq', region: 'fergana' },
  'ХНК': { ru: 'Ханка', uz: 'Xonqa', region: 'regions' },
  'ЯМР': { ru: 'Янгимаргилан', uz: 'Yangimargʻilon', region: 'fergana' },
  'ТТЗ': { ru: 'ТТЗ', uz: 'TTZ', region: 'tashkent' },
  'ГАЗ': { ru: 'Газалкент', uz: 'Gazalkent', region: 'tashkent' },
  'ШХР': { ru: 'Шахрихан', uz: 'Shahrixon', region: 'fergana' },
  'САЛ': { ru: 'Салар', uz: 'Salar', region: 'tashkent' },
  'ХЛД': { ru: 'Хонобод', uz: 'Xonobod', region: 'fergana' },
  'НАЗ': { ru: 'Назарбек', uz: 'Nazarbek', region: 'tashkent' },
  'МУС': { ru: 'Мустакиллик', uz: 'Mustaqillik', region: 'tashkent' },
  'ГУЗ': { ru: 'Гузар', uz: 'Gʻuzor', region: 'regions' },
  'ПШБ': { ru: 'Пахтачи', uz: 'Paxtachi', region: 'samarkand' },
  'ЖУМ': { ru: 'Жума', uz: 'Juma', region: 'samarkand' },
  'КТБ': { ru: 'Китаб', uz: 'Kitob', region: 'regions' },
  'КЗШ': { ru: 'Кизилтепа', uz: 'Qiziltepa', region: 'bukhara' },
  'ЯГБ': { ru: 'Янгибозор', uz: 'Yangibozor', region: 'regions' },
};

// Lotin -> Kirill o'girish
export function toCyrillic(text: string): string {
  let t = (text || '').toLowerCase();
  const aliases: [string, string][] = [
    ['tashkent', 'таш'], ['toshkent', 'таш'],
    ['samarkand', 'смк'], ['samarqand', 'смк'],
    ['fergana', 'фер'], ['fargona', 'фер'], ['fargʻona', 'фер'],
    ['andijan', 'анд'], ['andijon', 'анд'],
    ['namangan', 'нам'],
    ['bukhara', 'бхр'], ['buxoro', 'бхр'],
    ['kokand', 'ккд'], ['qoqon', 'ккд'], ['qoʻqon', 'ккд'],
    ['margilan', 'мрг'], ['margilon', 'мрг'], ['margʻilon', 'мрг'],
    ['jizzakh', 'дзк'], ['jizzax', 'дзк'],
    ['navoi', 'нав'], ['navoiy', 'нав'],
    ['qarshi', 'крш'], ['karshi', 'крш'],
    ['bux', 'бхр'], ['sam', 'смк'], ['jiz', 'дзк'], ['kok', 'ккд'], ['mar', 'мрг'],
  ];
  for (const [lat, cyr] of aliases) {
    t = t.replaceAll(lat, cyr);
  }

  const mapping: [string, string][] = [
    ['sh', 'ш'], ['ch', 'ч'], ['ya', 'я'], ['yu', 'ю'], ['yo', 'ё'], ['ye', 'е'], ['ts', 'ц'],
    ['kh', 'х'], ["o'", 'о'], ["g'", 'г'], ['oʻ', 'о'], ['gʻ', 'г'],
    ['a', 'а'], ['b', 'б'], ['d', 'д'], ['e', 'е'], ['f', 'ф'], ['g', 'г'], ['h', 'х'],
    ['i', 'и'], ['j', 'ж'], ['k', 'к'], ['l', 'л'], ['m', 'м'], ['n', 'н'], ['o', 'о'],
    ['p', 'п'], ['q', 'к'], ['r', 'р'], ['s', 'с'], ['t', 'т'], ['u', 'у'], ['v', 'в'],
    ['w', 'в'], ['x', 'х'], ['y', 'й'], ['z', 'з']
  ];
  for (const [lat, cyr] of mapping) {
    t = t.replaceAll(lat, cyr);
  }
  return t;
}

// Kirill -> Lotin o'girish
export function toLatin(text: string): string {
  let t = (text || '').toLowerCase();
  const mapping: [string, string][] = [
    ['ш', 'sh'], ['ч', 'ch'], ['я', 'ya'], ['ю', 'yu'], ['ё', 'yo'], ['ж', 'j'], ['ц', 'ts'],
    ['а', 'a'], ['б', 'b'], ['в', 'v'], ['г', 'g'], ['д', 'd'], ['е', 'e'], ['з', 'z'],
    ['и', 'i'], ['й', 'y'], ['к', 'k'], ['л', 'l'], ['м', 'm'], ['н', 'n'], ['о', 'o'],
    ['п', 'p'], ['р', 'r'], ['с', 's'], ['т', 't'], ['у', 'u'], ['ф', 'f'], ['х', 'x'],
    ['ы', 'i'], ['э', 'e'], ['қ', 'q'], ['ғ', 'g'], ['ҳ', 'h']
  ];
  for (const [cyr, lat] of mapping) {
    t = t.replaceAll(cyr, lat);
  }
  return t;
}

export function normalizeChars(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]/g, '');
}

interface IndexedPvzItem extends PvzItem {
  norm: string;
  normCyr: string;
  normLat: string;
  num: string;
  isFr: boolean;
  isOfficial: boolean;
}

// To'liq ma'lumotlar bazasini qurish
function buildComprehensiveDatabase(): { publicList: PvzItem[]; indexedList: IndexedPvzItem[] } {
  const mergedMap = new Map<string, { code: string; isOfficial: boolean }>();

  // 1. Rasmiy kompaniya ro'yxatidagi barcha 2464 ta PVZ
  for (const raw of (officialPvzs as string[])) {
    const code = raw.trim();
    if (!code || code === '—' || code.toUpperCase() === 'BEZ PVZ') continue;
    const cleanKey = normalizeChars(code);
    if (!mergedMap.has(cleanKey)) {
      mergedMap.set(cleanKey, { code, isOfficial: true });
    }
  }

  // 2. Google Sheets tarixidagi qo'shimcha PVZ lar
  for (const raw of (rawSheetPvzs as string[])) {
    const code = raw.trim();
    if (!code || code === '—' || code.toUpperCase() === 'BEZ PVZ') continue;
    const cleanKey = normalizeChars(code);
    if (!mergedMap.has(cleanKey)) {
      mergedMap.set(cleanKey, { code, isOfficial: false });
    }
  }

  const publicList: PvzItem[] = [];
  const indexedList: IndexedPvzItem[] = [];

  for (const { code, isOfficial } of Array.from(mergedMap.values())) {
    const isFr = code.startsWith('Fr') || code.startsWith('FR') || code.startsWith('фр') || code.startsWith('Фр');
    const cleanPrefixCode = isFr ? code.slice(2) : code;
    const prefix = cleanPrefixCode.split('-')[0].toUpperCase();
    const numMatch = cleanPrefixCode.match(/\d+/);
    const num = numMatch ? numMatch[0] : '';

    let name = `ПВЗ ${code}`;
    let city = 'ПВЗ';
    let region = 'all';

    if (CITY_DICT[prefix]) {
      const cityInfo = CITY_DICT[prefix];
      city = isFr ? `${cityInfo.ru} (Fr)` : cityInfo.ru;
      region = cityInfo.region;
      name = `ПВЗ ${isFr ? 'Fr ' : ''}${cityInfo.ru}${num ? ` №${num}` : ''}`;
    } else if (code.startsWith('ipNEW')) {
      city = 'ipNEW';
      region = 'all';
      name = `ПВЗ ${code}`;
    } else if (isFr) {
      city = 'Франшиза';
      region = 'regions';
      name = `ПВЗ ${code}`;
    }

    const norm = normalizeChars(code);
    const normCyr = normalizeChars(toCyrillic(code));
    const normLat = normalizeChars(toLatin(code));
    const keywords = `${code} ${norm} ${normCyr} ${normLat} ${city} ${name}`.toLowerCase();

    const item: PvzItem = {
      code,
      name,
      city,
      region,
      keywords,
    };

    publicList.push(item);
    indexedList.push({
      ...item,
      norm,
      normCyr,
      normLat,
      num,
      isFr,
      isOfficial,
    });
  }

  return { publicList, indexedList };
}

const { publicList: BUILT_PUBLIC, indexedList: INDEXED_DB } = buildComprehensiveDatabase();

export const ALL_PVZ_DATABASE: PvzItem[] = BUILT_PUBLIC;
export const POPULAR_PVZ_LIST: PvzItem[] = BUILT_PUBLIC;

// 🔍 ULTRA-MOSLASHUVCHAN SMART PVZ QIDIRUVI (2460+ ta PVZ bo'yicha)
export function searchPvz(query: string, limit = 25): PvzItem[] {
  const raw = (query || '').trim();
  if (!raw) {
    // Agar qidiruv bo'sh bo'lsa, eng mashhur asosiy shahar PVZ larni chiqaramiz
    return ALL_PVZ_DATABASE.slice(0, limit);
  }

  const qClean = normalizeChars(raw);
  const qCyr = normalizeChars(toCyrillic(raw));
  const qLat = normalizeChars(toLatin(raw));
  const isNum = /^\d+$/.test(raw);

  const scored: { item: PvzItem; score: number }[] = [];

  for (const item of INDEXED_DB) {
    let score = 0;
    const code = item.code;

    // 1. To'liq 100% tenglik (original kod yoki transliteratsiyada)
    if (item.norm === qClean || item.normCyr === qCyr || item.normLat === qLat) {
      score = 25000;
    }
    // 2. Katta-kichik harflarsiz aniq kod
    else if (code.toLowerCase() === raw.toLowerCase()) {
      score = 22000;
    }
    // 3. Faqat raqam kiritilganda (masalan '14' -> ТАШ-14, СМК-14)
    else if (isNum && item.num === raw) {
      const frPenalty = item.isFr ? 200 : 0;
      score = 18000 - frPenalty - code.length;
    }
    // 4. Boshlanishi mos kelishi (masalan 'таш' -> 'ТАШ-1', 'ТАШ-2', 'tash-14' -> 'ТАШ-14')
    else if (item.norm.startsWith(qClean) || item.normCyr.startsWith(qCyr) || item.normLat.startsWith(qLat)) {
      const frPenalty = item.isFr ? 500 : 0;
      score = 12000 - frPenalty - code.length;
    }
    // 5. Kod yoki kalit so'z ichida uchrashi
    else if (item.norm.includes(qClean) || item.normCyr.includes(qCyr) || item.normLat.includes(qLat)) {
      score = 6000 - code.length;
    }
    // 6. Shahar yoki nom ichida qidiruv
    else if (item.keywords.includes(qClean) || item.keywords.includes(qCyr)) {
      score = 3000;
    }

    if (score > 0) {
      // Rasmiy bazadagi PVZ larga qo'shimcha prioritet
      if (item.isOfficial) score += 100;
      scored.push({ item, score });
    }
  }

  // Saralash: Eng yuqori ball bo'yicha, keyin esa tabiiy raqamli tartib bo'yicha (natural sort)
  return scored
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.item.code.localeCompare(b.item.code, undefined, { numeric: true, sensitivity: 'base' });
    })
    .slice(0, limit)
    .map((m) => m.item);
}

// 🕒 Oxirgi tanlangan PVZ lar xotirasi (LocalStorage)
const RECENT_PVZ_KEY = 'vp_recent_pvz_list';

export function getRecentPvzList(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_PVZ_KEY);
    return raw ? JSON.parse(raw) : ['ТАШ-1', 'ТАШ-12', 'СМК-1', 'ККД-1', 'ФЕР-1'];
  } catch {
    return ['ТАШ-1', 'ТАШ-12', 'СМК-1', 'ККД-1', 'ФЕР-1'];
  }
}

export function addRecentPvz(pvzCode: string): void {
  if (typeof window === 'undefined' || !pvzCode) return;
  try {
    const clean = pvzCode.trim();
    if (!clean || clean === '—') return;
    const current = getRecentPvzList().filter((p) => p.toLowerCase() !== clean.toLowerCase());
    const updated = [clean, ...current].slice(0, 8);
    localStorage.setItem(RECENT_PVZ_KEY, JSON.stringify(updated));
  } catch {}
}
