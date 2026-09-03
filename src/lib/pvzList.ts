export interface PvzItem {
  id: string;
  code: string;
  name: string;
  region: string;
  city: string;
  address?: string;
  keywords?: string;
}

export const POPULAR_PVZ_LIST: PvzItem[] = [
  // Toshkent shahri & viloyati (Tash, Tashkent, Toshkent, TAS)
  { id: 'pvz-tsh-01', code: 'TAS-01', name: 'ПВЗ Чиланзар (Квартал 7)', region: 'tashkent', city: 'Ташкент (Tashkent)', address: 'Чиланзар, 7-й квартал, д. 14', keywords: 'tashkent tash chil chilonzor 7' },
  { id: 'pvz-tsh-02', code: 'TAS-02', name: 'ПВЗ Юнусабад (Квартал 14)', region: 'tashkent', city: 'Ташкент (Tashkent)', address: 'Юнусабад, 14-й квартал, д. 22', keywords: 'tashkent tash yunus yunusobod 14' },
  { id: 'pvz-tsh-03', code: 'TAS-03', name: 'ПВЗ Мирзо Улугбек (Буюк Ипак Йули)', region: 'tashkent', city: 'Ташкент (Tashkent)', address: 'ул. Буюк Ипак Йули, 56, м. Максим Горький', keywords: 'tashkent tash mirzo ulugbek buyuk ipak yuli gorkiy' },
  { id: 'pvz-tsh-04', code: 'TAS-04', name: 'ПВЗ Сергели (Спутник-6)', region: 'tashkent', city: 'Ташкент (Tashkent)', address: 'Сергели, Спутник-6, Массив Сергели-4', keywords: 'tashkent tash sergeli sputnik 6 4' },
  { id: 'pvz-tsh-05', code: 'TAS-05', name: 'ПВЗ Яшнабад (Кадышева / Авиасозлар)', region: 'tashkent', city: 'Ташкент (Tashkent)', address: 'ул. Авиасозлар, базар Кадышева', keywords: 'tashkent tash yashnobod yashnabad kadisheva aviasozlar' },
  { id: 'pvz-tsh-06', code: 'TAS-06', name: 'ПВЗ Шайхантахур (Ц-13 / Навои)', region: 'tashkent', city: 'Ташкент (Tashkent)', address: 'Ц-13, пр. Навои, д. 18', keywords: 'tashkent tash shayxontohur shayhantahur c13 navoiy' },
  { id: 'pvz-tsh-07', code: 'TAS-07', name: 'ПВЗ Алмазар (Каракамыш 2/4)', region: 'tashkent', city: 'Ташкент (Tashkent)', address: 'Каракамыш 2/4, д. 8', keywords: 'tashkent tash olmazor almazar qoraqamish karakamish 2/4' },
  { id: 'pvz-tsh-08', code: 'TAS-08', name: 'ПВЗ Яккасарай (Шота Руставели / Глинка)', region: 'tashkent', city: 'Ташкент (Tashkent)', address: 'ул. Шота Руставели, 45', keywords: 'tashkent tash yakkasaroy yakkasaray shota rustaveli glinka' },
  { id: 'pvz-tsh-09', code: 'TAS-09', name: 'ПВЗ Учтепа (Фархадский / 26-квартал)', region: 'tashkent', city: 'Ташкент (Tashkent)', address: 'ул. Фархадская, 12, 26-й квартал', keywords: 'tashkent tash uchtepa farhad farhod 26' },
  { id: 'pvz-tsh-10', code: 'TAS-10', name: 'ПВЗ Мирабад (Куйлюк-1 / Саракулька)', region: 'tashkent', city: 'Ташкент (Tashkent)', address: 'Массив Куйлюк-1, ул. Саракульская', keywords: 'tashkent tash mirobod mirabad kuyluk sarakulka' },
  { id: 'pvz-tsh-11', code: 'TAS-11', name: 'ПВЗ Янгихаёт (Хумо / 1-бекат)', region: 'tashkent', city: 'Ташкент (Tashkent)', address: 'Янгихаёт, 1-я станция метро', keywords: 'tashkent tash yangihayot yangihoyot humo' },
  { id: 'pvz-tsh-12', code: 'TAS-12', name: 'ПВЗ Чиланзар (Новза / Бунёдкор)', region: 'tashkent', city: 'Ташкент (Tashkent)', address: 'пр. Бунёдкор, м. Новза', keywords: 'tashkent tash chil novza bunyodkor' },
  { id: 'pvz-tsh-13', code: 'TAS-13', name: 'ПВЗ Чирчик (Марказий)', region: 'tashkent', city: 'Чирчик (Chirchiq)', address: 'ул. Навои, 34', keywords: 'tashkent chirchiq chirchik' },
  { id: 'pvz-tsh-14', code: 'TAS-14', name: 'ПВЗ Алмалык (Металлург)', region: 'tashkent', city: 'Алмалык (Olmaliq)', address: 'ул. Металлургов, 12', keywords: 'tashkent olmaliq almalyk metallurg' },
  { id: 'pvz-tsh-15', code: 'TAS-15', name: 'ПВЗ Ангрен (50-летия)', region: 'tashkent', city: 'Ангрен (Angren)', address: 'ул. 50-летия Узбекистана', keywords: 'tashkent angren' },

  // Samarqand
  { id: 'pvz-sam-01', code: 'SAM-01', name: 'ПВЗ Самарканд (Рудаки / Вокзал)', region: 'samarkand', city: 'Самарканд (Samarkand)', address: 'ул. Рудаки, 88, ж/д вокзал', keywords: 'sam samarkand samarqand rudaki vokzal' },
  { id: 'pvz-sam-02', code: 'SAM-02', name: 'ПВЗ Самарканд (Сартепа / Микрорайон)', region: 'samarkand', city: 'Самарканд (Samarkand)', address: 'Микрорайон Сартепа, д. 45', keywords: 'sam samarkand samarqand sartepa mikrorayon' },
  { id: 'pvz-sam-03', code: 'SAM-03', name: 'ПВЗ Самарканд (Гагарин / Университет)', region: 'samarkand', city: 'Самарканд (Samarkand)', address: 'ул. Гагарина, 32', keywords: 'sam samarkand samarqand gagarin universitet' },
  { id: 'pvz-sam-04', code: 'SAM-04', name: 'ПВЗ Самарканд (Дагбитская / Регистан)', region: 'samarkand', city: 'Самарканд (Samarkand)', address: 'ул. Дагбитская, 15', keywords: 'sam samarkand samarqand registan dagbitskaya' },

  // Farg'ona vodiysi (Fergana, Andijan, Namangan, Kokand, Margilan)
  { id: 'pvz-fer-01', code: 'FER-01', name: 'ПВЗ Фергана (Аль-Фергани)', region: 'fergana', city: 'Фергана (Fergana)', address: 'ул. Аль-Фергани, 15', keywords: 'fer fergana fargona fergana al-fergani markaz' },
  { id: 'pvz-fer-02', code: 'FER-02', name: 'ПВЗ Коканд (Туркестанская)', region: 'fergana', city: 'Коканд (Qoʻqon)', address: 'ул. Туркестанская, 40, Чархий', keywords: 'fer qoqon kokand charxiy turkestan' },
  { id: 'pvz-fer-03', code: 'FER-03', name: 'ПВЗ Маргилан (Б. Маргилоний)', region: 'fergana', city: 'Маргилан (Margʻilon)', address: 'ул. Б. Маргилоний, 28', keywords: 'fer margilon margilan' },
  { id: 'pvz-and-01', code: 'AND-01', name: 'ПВЗ Андижан (Бобур Шох / Марказ)', region: 'andijan', city: 'Андижан (Andijon)', address: 'пр. Бобура, 72', keywords: 'and andijan andijon bobur shoh markaz' },
  { id: 'pvz-and-02', code: 'AND-02', name: 'ПВЗ Андижан (Эски Шахар / Навои)', region: 'andijan', city: 'Андижан (Andijon)', address: 'ул. Навои, базар Эски Шахар', keywords: 'and andijan andijon eski shahar navoiy' },
  { id: 'pvz-nam-01', code: 'NAM-01', name: 'ПВЗ Наманган (А. Темур)', region: 'namangan', city: 'Наманган (Namangan)', address: 'ул. А. Темура, 19', keywords: 'nam namangan temur markaz' },
  { id: 'pvz-nam-02', code: 'NAM-02', name: 'ПВЗ Наманган (Сардоба)', region: 'namangan', city: 'Наманган (Namangan)', address: 'ул. Сардоба, 5', keywords: 'nam namangan sardoba' },

  // Buxoro & Navoiy
  { id: 'pvz-bux-01', code: 'BUX-01', name: 'ПВЗ Бухара (Горпарк / Каримов)', region: 'bukhara', city: 'Бухара (Buxoro)', address: 'ул. И. Каримова, 5', keywords: 'bux buxoro bukhara gorpark karimov' },
  { id: 'pvz-bux-02', code: 'BUX-02', name: 'ПВЗ Бухара (Шарк / 5-микрорайон)', region: 'bukhara', city: 'Бухара (Buxoro)', address: 'Массив Шарк-1, д. 20', keywords: 'bux buxoro bukhara sharq 5 mikrorayon' },
  { id: 'pvz-nav-01', code: 'NAV-01', name: 'ПВЗ Навои (Галаба Шох)', region: 'navoiy', city: 'Навои (Navoiy)', address: 'ул. Галаба Шох, 14', keywords: 'nav navoiy navoi galaba' },

  // Boshqa viloyatlar (Qarshi, Termiz, Urganch, Nukus, Jizzax, Guliston)
  { id: 'pvz-qar-01', code: 'QAR-01', name: 'ПВЗ Карши (Мустакиллик)', region: 'regions', city: 'Карши (Qarshi)', address: 'ул. Мустакиллик, 10', keywords: 'qar qarshi karshi mustaqillik nasaf' },
  { id: 'pvz-ter-01', code: 'TER-01', name: 'ПВЗ Термез (Ат-Термизий)', region: 'regions', city: 'Термез (Termiz)', address: 'ул. Ат-Термизий, 44', keywords: 'ter termiz termez surxondaryo' },
  { id: 'pvz-urg-01', code: 'URG-01', name: 'ПВЗ Ургенч (Аль-Хорезми)', region: 'regions', city: 'Ургенч (Urganch)', address: 'ул. Аль-Хорезми, 77', keywords: 'urg urganch urgench xorazm' },
  { id: 'pvz-nuk-01', code: 'NUK-01', name: 'ПВЗ Нукус (Досназаров)', region: 'regions', city: 'Нукус (Nukus)', address: 'ул. Досназарова, 12', keywords: 'nuk nukus qoraqalpogiston karakalpakstan' },
  { id: 'pvz-jiz-01', code: 'JIZ-01', name: 'ПВЗ Джизак (Ш. Рашидов)', region: 'regions', city: 'Джизак (Jizzax)', address: 'ул. Ш. Рашидова, 18', keywords: 'jiz jizzax jizzakh rashidov' },
  { id: 'pvz-gul-01', code: 'GUL-01', name: 'ПВЗ Гулистан (Узбекистанская)', region: 'regions', city: 'Гулистан (Guliston)', address: 'ул. Узбекистанская, 3', keywords: 'gul guliston gulistan sirdaryo' },
];

const RECENT_PVZ_KEY = 'vp_recent_pvz_list';

export function getRecentPvzList(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_PVZ_KEY);
    return raw ? JSON.parse(raw) : ['TAS-01 (Чиланзар)', 'TAS-02 (Юнусабад)', 'SAM-01 (Самарканд)'];
  } catch {
    return [];
  }
}

export function addRecentPvz(pvzName: string): void {
  if (typeof window === 'undefined' || !pvzName) return;
  try {
    const list = getRecentPvzList().filter(item => item !== pvzName);
    const updated = [pvzName, ...list].slice(0, 8);
    localStorage.setItem(RECENT_PVZ_KEY, JSON.stringify(updated));
  } catch {}
}
