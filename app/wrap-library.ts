import type { Locale } from './experience';
export const wrapPatterns = ['ribbon', 'contour', 'pixel', 'duotone'] as const;
export const wrapPlacements = ['sides', 'hood', 'all'] as const;
export type WrapSettings = {
  wrapTheme: string;
  wrapPattern: (typeof wrapPatterns)[number];
  wrapPlacement: (typeof wrapPlacements)[number];
  wrapScale: number;
  wrapOffset: number;
  wrapHeight: number;
  wrapOpacity: number;
  /** In-memory local raster only; never serialized to a shared URL. */
  wrapImage: string;
};
export const wrapDefaults: WrapSettings = {
  wrapTheme: 'none',
  wrapPattern: 'ribbon',
  wrapPlacement: 'sides',
  wrapScale: 100,
  wrapOffset: 0,
  wrapHeight: 0,
  wrapOpacity: 100,
  wrapImage: '',
};
export const ipReferences = [
  [
    'pikachu',
    '皮卡丘',
    'Pikachu',
    '#f4ca38',
    '#292e36',
    'Pokémon',
    'https://www.pokemon.com/us/pokedex/pikachu',
  ],
  [
    'mickey',
    '米奇',
    'Mickey Mouse',
    '#cb3939',
    '#f5e4b9',
    'Disney',
    'https://mickey.disney.com/mickey',
  ],
  [
    'stitch',
    '史迪奇',
    'Stitch',
    '#549ccc',
    '#af80ba',
    'Disney',
    'https://video.disney.com/stitch',
  ],
  [
    'elsa',
    '艾莎',
    'Elsa',
    '#91d5dd',
    '#f1f5f5',
    'Disney',
    'https://movies.disney.com/frozen/',
  ],
  [
    'spider-man',
    '蜘蛛侠',
    'Spider-Man',
    '#c23e42',
    '#344c86',
    'Marvel',
    'https://www.marvel.com/characters/spider-man-peter-parker/',
  ],
  [
    'batman',
    '蝙蝠侠',
    'Batman',
    '#424950',
    '#c9a94c',
    'DC',
    'https://www.dc.com/characters/batman',
  ],
  [
    'harry',
    '哈利·波特',
    'Harry Potter',
    '#793e43',
    '#c6aa64',
    'Wizarding World',
    'https://www.harrypotter.com/fact-file/characters-and-pets/harry-potter',
  ],
  [
    'minions',
    '小黄人',
    'Minions',
    '#efcb4d',
    '#5b81a6',
    'Illumination',
    'https://www.illumination.com/movie/despicable-me/',
  ],
  [
    'mario',
    '马力欧',
    'Mario',
    '#d5443e',
    '#4264a0',
    'Nintendo',
    'https://mario.nintendo.com/characters/',
  ],
  [
    'sonic',
    '索尼克',
    'Sonic',
    '#356dc5',
    '#eeebe2',
    'SEGA',
    'https://asia.sega.com/SonicTheHedgehog/en/',
  ],
  [
    'hello-kitty',
    '凯蒂猫',
    'Hello Kitty',
    '#e6a3b6',
    '#f3ece5',
    'Sanrio',
    'https://corporate.sanrio.co.jp/en/news/20260628_03.html',
  ],
  [
    'kuromi',
    '酷洛米',
    'Kuromi',
    '#8a74a9',
    '#343039',
    'Sanrio',
    'https://corporate.sanrio.co.jp/en/news/20260628_03.html',
  ],
  [
    'cinnamoroll',
    '大耳狗',
    'Cinnamoroll',
    '#a3cedf',
    '#f5f3ed',
    'Sanrio',
    'https://corporate.sanrio.co.jp/en/news/20260628_03.html',
  ],
  [
    'pompompurin',
    '布丁狗',
    'Pompompurin',
    '#dfc277',
    '#886748',
    'Sanrio',
    'https://corporate.sanrio.co.jp/en/news/20260628_03.html',
  ],
  [
    'snoopy',
    '史努比',
    'Snoopy',
    '#e5e1d6',
    '#41474b',
    'Peanuts',
    'https://www.peanuts.com/about/snoopy',
  ],
  [
    'doraemon',
    '哆啦A梦',
    'Doraemon',
    '#499ec7',
    '#f2e6d2',
    'Doraemon',
    'https://www.dora-world.com/',
  ],
  [
    'luffy',
    '路飞',
    'Luffy',
    '#c94c3f',
    '#d9bd75',
    'ONE PIECE',
    'https://one-piece.com/character/luffy/index.html',
  ],
  [
    'goku',
    '孙悟空',
    'Goku',
    '#dd873c',
    '#3e5f93',
    'Dragon Ball',
    'https://en.dragon-ball-official.com/news/01_313.html',
  ],
  [
    'totoro',
    '龙猫',
    'Totoro',
    '#929b8b',
    '#ddd9bc',
    'Studio Ghibli',
    'https://www.ghibli.jp/works/',
  ],
  [
    'labubu',
    '拉布布',
    'LABUBU',
    '#b7a28d',
    '#d9c0a4',
    'THE MONSTERS',
    'https://www.popmart.com/us/collection/11/the-monsters?categoryIDs=73&collectionId=11&page=1&sortWay=1',
  ],
].map(([id, zh, en, primary, secondary, brand, source]) => ({
  id,
  zh,
  en,
  primary,
  secondary,
  brand,
  source,
  rights: 'reference-only' as const,
}));
export function wrapPalette(id: string) {
  const p = ipReferences.find((p) => p.id === id);
  return p ? [p.primary, p.secondary] : ['#c5b698', '#eeeae1'];
}
export function readWrap(p: URLSearchParams): WrapSettings {
  const s = { ...wrapDefaults };
  const id = p.get('wrapTheme');
  if (id && ['none', 'atelier', ...ipReferences.map((p) => p.id)].includes(id))
    s.wrapTheme = id;
  for (const [key, allowed] of [
    ['wrapPattern', wrapPatterns],
    ['wrapPlacement', wrapPlacements],
  ] as const) {
    const v = p.get(key);
    if (v && (allowed as readonly string[]).includes(v))
      (s as unknown as Record<string, unknown>)[key] = v;
  }
  for (const [k, min, max] of [
    ['wrapScale', 40, 160],
    ['wrapOffset', -100, 100],
    ['wrapHeight', -50, 50],
    ['wrapOpacity', 0, 100],
  ] as const) {
    const v = p.get(k);
    if (v !== null && v.trim() !== '' && Number.isFinite(Number(v)))
      s[k] = Math.max(min, Math.min(max, Number(v)));
  }
  return s;
}
export function writeWrap(p: URLSearchParams, s: WrapSettings) {
  for (const k of [
    'wrapTheme',
    'wrapPattern',
    'wrapPlacement',
    'wrapScale',
    'wrapOffset',
    'wrapHeight',
    'wrapOpacity',
  ] as const)
    p.set(
      k,
      k === 'wrapTheme' && s.wrapTheme === 'custom' ? 'none' : String(s[k]),
    );
}
const words: Record<string, string[]> = {
  title: [
    '车身贴膜工坊',
    'Body wrap studio',
    'Folien-Studio',
    'ボディラップ工房',
    'استوديو تغليف الهيكل',
  ],
  hint: [
    '贴膜覆盖车漆，保留车身光影。选择图形或上传自己的角色图片。',
    'Layer a graphic over your paint, or upload your own character artwork.',
    'Grafik über dem Lack oder eigenes Motiv hochladen.',
    '塗装に模様を重ねるか、自分の画像を追加。',
    'أضف رسماً فوق الطلاء أو ارفع صورة شخصيتك.',
  ],
  none: ['无贴膜', 'No wrap', 'Keine Folie', 'なし', 'بدون تغليف'],
  atelier: [
    '香槟设计款',
    'Atelier champagne',
    'Atelier Champagner',
    'シャンパン',
    'شامبانيا',
  ],
  custom: [
    '我的角色图片',
    'My artwork',
    'Eigenes Motiv',
    '自分の画像',
    'صورتي',
  ],
  upload: [
    '上传角色图片',
    'Upload artwork',
    'Motiv hochladen',
    '画像を追加',
    'رفع صورة',
  ],
  local: [
    'PNG / WebP / JPG，最大 8 MB。仅在本次浏览器预览，不会上传；角色图不包含在保存或分享链接中。',
    'PNG / WebP / JPG, up to 8 MB. Local session preview only; artwork is not uploaded, saved or included in shared links.',
    'PNG / WebP / JPG bis 8 MB. Nur lokale Vorschau; Bilder werden nicht hochgeladen, gespeichert oder geteilt.',
    'PNG / WebP / JPG、8 MBまで。今回のブラウザ内のみ。画像は送信・保存・共有されません。',
    'PNG / WebP / JPG حتى 8 MB. معاينة محلية فقط؛ الصورة لا تُرفع أو تُحفظ أو تُشارك.',
  ],
  error: [
    '图片无法读取，请选择不超过 8 MB 的 PNG、WebP 或 JPG。',
    'Cannot read image. Choose a PNG, WebP or JPG up to 8 MB.',
    'Bild nicht lesbar. PNG, WebP oder JPG bis 8 MB wählen.',
    '8 MB以下のPNG、WebP、JPGを選んでください。',
    'تعذرت قراءة الصورة. اختر PNG أو WebP أو JPG حتى 8 MB.',
  ],
  patterns: [
    '图形布局',
    'Graphic layout',
    'Grafiklayout',
    'レイアウト',
    'تخطيط الرسم',
  ],
  ribbon: [
    '流动飘带',
    'Flowing ribbon',
    'Fließendes Band',
    'リボン',
    'شريط انسيابي',
  ],
  contour: ['等高线', 'Contours', 'Konturen', '等高線', 'خطوط كنتورية'],
  pixel: ['像素渐变', 'Pixel fade', 'Pixel-Verlauf', 'ピクセル', 'تدرج بكسل'],
  duotone: [
    '双色斜切',
    'Diagonal duotone',
    'Zweifarbige Diagonale',
    '斜めツートーン',
    'لونان قطريان',
  ],
  sides: ['车身两侧', 'Both sides', 'Beide Seiten', '両側面', 'الجانبان'],
  hood: ['引擎盖', 'Hood', 'Motorhaube', 'ボンネット', 'غطاء المحرك'],
  all: [
    '两侧＋引擎盖',
    'Sides + hood',
    'Seiten + Haube',
    '側面＋ボンネット',
    'الجانبان والغطاء',
  ],
  scale: ['图案大小', 'Size', 'Größe', 'サイズ', 'الحجم'],
  offset: [
    '前后位置',
    'Fore / aft',
    'Vorne / hinten',
    '前後位置',
    'الموقع الطولي',
  ],
  height: ['上下位置', 'Height', 'Höhe', '上下位置', 'الارتفاع'],
  opacity: ['贴膜不透明度', 'Opacity', 'Deckkraft', '不透明度', 'العتامة'],
  reset: [
    '复原贴膜位置',
    'Reset placement',
    'Position zurücksetzen',
    '位置をリセット',
    'إعادة الموضع',
  ],
  library: [
    '20 个 IP · 配色参考',
    '20 IP colour references',
    '20 IP-Farbreferenzen',
    '20 IPの配色参考',
    '٢٠ مرجعاً لونياً',
  ],
  reference: [
    '官方角色参考 ↗',
    'Official reference ↗',
    'Offizielle Referenz ↗',
    '公式参考 ↗',
    'مرجع رسمي ↗',
  ],
  palette: [
    '仅配色 · 无角色图',
    'Palette only · no character image',
    'Nur Palette · kein Charakterbild',
    '配色のみ・キャラクター画像なし',
    'ألوان فقط · بلا صورة شخصية',
  ],
  note: [
    '此处为精选参考，不是全球热度排名。卡片仅应用配色；尚未接入角色贴图，也未确认对应 IP 商业授权。可上传你有权使用的角色图片进行预览。',
    'Curated references, not a global ranking. Cards apply colours only: no character artwork or confirmed IP commercial licence is included. Upload artwork you have rights to use.',
    'Auswahl, keine Weltrangliste. Karten übernehmen nur Farben; keine Charakterbilder oder bestätigten IP-Lizenzen. Eigene berechtigte Motive hochladen.',
    '世界ランキングではなく選定参考です。配色のみで、キャラクター画像や商用IPライセンスは含みません。利用権のある画像を追加できます。',
    'مراجع مختارة وليست ترتيباً عالمياً. البطاقات تطبق الألوان فقط؛ لا صور شخصيات أو ترخيص تجاري مؤكد. ارفع صورة يحق لك استخدامها.',
  ],
  remove: [
    '移除图片',
    'Remove artwork',
    'Bild entfernen',
    '画像を削除',
    'إزالة الصورة',
  ],
};
export function wrapText(locale: Locale, key: string) {
  return words[key]?.[['zh', 'en', 'de', 'ja', 'ar'].indexOf(locale)] ?? key;
}
