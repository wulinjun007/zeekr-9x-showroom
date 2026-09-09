import type { Locale } from './experience';

export const glassTints = {
  original: null,
  smoke: '#343b43',
  blue: '#487f9d',
  bronze: '#9b7650',
  green: '#537b6a',
} as const;
export type GlassTint = keyof typeof glassTints;
export type GlassSettings = {
  glassTint: GlassTint;
  glassFront: number;
  glassRear: number;
  glassRoof: number;
};
export const glassDefaults: GlassSettings = {
  glassTint: 'original',
  glassFront: 78,
  glassRear: 58,
  glassRoof: 78,
};
export const glassPresets = {
  clear: {
    glassTint: 'original',
    glassFront: 92,
    glassRear: 92,
    glassRoof: 88,
  },
  balanced: {
    glassTint: 'smoke',
    glassFront: 78,
    glassRear: 58,
    glassRoof: 60,
  },
  privacy: { glassTint: 'smoke', glassFront: 78, glassRear: 18, glassRoof: 30 },
  lounge: { glassTint: 'bronze', glassFront: 78, glassRear: 8, glassRoof: 12 },
} satisfies Record<string, GlassSettings>;
export function glassZone(
  name: string,
): 'glassFront' | 'glassRear' | 'glassRoof' | null {
  if (/^Glass_ROOF(?:_B)?$/.test(name)) return 'glassRoof';
  if (/^Glass_(?:Black|triangle)(?:_B)?$/.test(name)) return 'glassRear';
  if (/^Glass_Clear(?:_B)?$/.test(name)) return 'glassFront';
  return null; // Lamp covers and cabin displays are not privacy glazing.
}
export function readGlass(p: URLSearchParams): GlassSettings {
  const s = { ...glassDefaults };
  const tint = p.get('glassTint');
  if (tint && Object.hasOwn(glassTints, tint)) s.glassTint = tint as GlassTint;
  for (const k of ['glassFront', 'glassRear', 'glassRoof'] as const) {
    const v = p.get(k);
    if (v !== null && v.trim() && Number.isFinite(Number(v)))
      s[k] = Math.round(Math.max(0, Math.min(100, Number(v))));
  }
  return s;
}
export function glassCabinLight(s: GlassSettings) {
  // A lightweight artistic approximation, not a physical VLT calculation.
  return Math.max(
    0.55,
    Math.min(
      1.12,
      0.55 +
        (0.45 * (s.glassFront * 0.4 + s.glassRear * 0.3 + s.glassRoof * 0.3)) /
          72,
    ),
  );
}
const labels: Record<string, string[]> = {
  title: [
    '玻璃与隐私',
    'Glass & privacy',
    'Glas & Privatsphäre',
    'ガラスとプライバシー',
    'الزجاج والخصوصية',
  ],
  tint: ['玻璃色调', 'Glass tint', 'Glasfarbe', 'ガラス色', 'لون الزجاج'],
  original: ['原色', 'Original', 'Original', 'オリジナル', 'الأصلي'],
  smoke: ['烟灰', 'Smoke', 'Rauchgrau', 'スモーク', 'رمادي دخاني'],
  blue: ['冰蓝', 'Ice blue', 'Eisblau', 'アイスブルー', 'أزرق جليدي'],
  bronze: ['茶铜', 'Bronze', 'Bronze', 'ブロンズ', 'برونزي'],
  green: ['墨绿', 'Jade', 'Jadegrün', 'ジェード', 'أخضر داكن'],
  clear: [
    '全景通透',
    'Open & clear',
    'Klarer Rundumblick',
    'クリア',
    'رؤية واضحة',
  ],
  balanced: [
    '均衡遮光',
    'Balanced shade',
    'Ausgewogener Schutz',
    'バランス',
    'تظليل متوازن',
  ],
  privacy: [
    '后排隐私',
    'Rear privacy',
    'Privatsphäre hinten',
    '後席プライバシー',
    'خصوصية المقاعد الخلفية',
  ],
  lounge: [
    '私享座舱',
    'Private lounge',
    'Private Lounge',
    'プライベートラウンジ',
    'مقصورة خاصة',
  ],
  glassFront: [
    '前挡 / 前排车窗',
    'Windscreen / front windows',
    'Frontscheibe / vordere Fenster',
    '前面・前席ガラス',
    'الزجاج الأمامي والنوافذ الأمامية',
  ],
  glassRear: [
    '后排 / 后挡车窗',
    'Rear windows / rear screen',
    'Hintere Fenster / Heckscheibe',
    '後席・後面ガラス',
    'النوافذ والزجاج الخلفي',
  ],
  glassRoof: [
    '全景天幕',
    'Panoramic roof',
    'Panoramadach',
    'パノラマルーフ',
    'السقف البانورامي',
  ],
  level: [
    '视觉通透度',
    'Visual clarity',
    'Visuelle Durchsicht',
    '見た目の透明度',
    'الشفافية البصرية',
  ],
  reset: [
    '恢复默认玻璃',
    'Restore model glass',
    'Modellglas zurücksetzen',
    '元のガラスに戻す',
    'استعادة زجاج النموذج',
  ],
  note: [
    '0 为遮蔽，100 为通透。数值为视觉演示等级，并非实测透光率；隐私预设保留前挡通透。',
    '0 is opaque; 100 is clear. Visual levels, not measured light transmission. Privacy presets keep the windscreen clear.',
    '0 ist blickdicht, 100 klar. Visuelle Stufen, keine gemessene Lichtdurchlässigkeit. Datenschutzprofile halten die Frontscheibe klar.',
    '0は不透明、100は透明。実測透過率ではなく表示上の目安です。プライバシー設定でも前面の視界を保ちます。',
    '0 معتم و100 شفاف. مستويات بصرية وليست قياسًا لنفاذية الضوء. تحافظ إعدادات الخصوصية على وضوح الزجاج الأمامي.',
  ],
};
export function glassText(locale: Locale, key: string) {
  return labels[key]?.[['zh', 'en', 'de', 'ja', 'ar'].indexOf(locale)] ?? key;
}
