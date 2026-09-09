import type { Locale } from './experience';
export const paintFinishes = [
  'signature',
  'gloss',
  'metallic',
  'pearl',
  'satin',
  'matte',
  'iridescent',
] as const;
export type PaintFinish = (typeof paintFinishes)[number];
type Profile = {
  roughness: number;
  metalness: number;
  clearcoat: number;
  coatRoughness: number;
  iridescence: number;
  flakes: number;
};
export const finishProfiles: Record<
  Exclude<PaintFinish, 'signature'>,
  Profile
> = {
  gloss: {
    roughness: 0.23,
    metalness: 0.72,
    clearcoat: 1,
    coatRoughness: 0.075,
    iridescence: 0,
    flakes: 0,
  },
  metallic: {
    roughness: 0.26,
    metalness: 0.78,
    clearcoat: 1,
    coatRoughness: 0.09,
    iridescence: 0,
    flakes: 0.00022,
  },
  pearl: {
    roughness: 0.24,
    metalness: 0.38,
    clearcoat: 1,
    coatRoughness: 0.08,
    iridescence: 0.2,
    flakes: 0.0001,
  },
  satin: {
    roughness: 0.48,
    metalness: 0.52,
    clearcoat: 0.35,
    coatRoughness: 0.38,
    iridescence: 0,
    flakes: 0.0001,
  },
  matte: {
    roughness: 0.72,
    metalness: 0.2,
    clearcoat: 0.08,
    coatRoughness: 0.65,
    iridescence: 0,
    flakes: 0.00006,
  },
  iridescent: {
    roughness: 0.22,
    metalness: 0.66,
    clearcoat: 1,
    coatRoughness: 0.07,
    iridescence: 1,
    flakes: 0.00012,
  },
};
export const signaturePaints = [
  {
    id: 'rr-celestial',
    brand: 'Rolls-Royce',
    name: 'Celestial',
    zh: '星穹晶闪黑',
    hex: '#1a202e',
    finish: 'metallic',
    flakes: 0.0005,
    source:
      'https://www.rolls-roycemotorcars.com/en_US/inspiring-greatness/objects/celestial-craftsmanship.html',
  },
  {
    id: 'bentley-anthracite',
    brand: 'Bentley',
    name: 'Satin Anthracite',
    zh: '无烟煤柔缎灰',
    hex: '#4b5053',
    finish: 'satin',
    source:
      'https://www.bentleymotors.com/uk/en/models/mulliner/boodles-collection.html',
  },
  {
    id: 'porsche-chromaflair',
    brand: 'Porsche',
    name: 'ChromaFlair study',
    zh: '流彩青金',
    hex: '#436a48',
    finish: 'iridescent',
    source:
      'https://www.porsche.com/stories/innovation/a-porsche-innovation-powered-by-your-imagination/',
  },
  {
    id: 'ferrari-magma',
    brand: 'Ferrari',
    name: 'Rosso Magma',
    zh: '熔岩深红',
    hex: '#a51321',
    finish: 'pearl',
    source:
      'https://www.ferrari.com/content/dam/ferrari-fcom/old/pdf/2020_11_03_-_ferrari_q3_2020_results_press_release.pdf',
  },
  {
    id: 'lambo-mantis',
    brand: 'Lamborghini',
    name: 'Verde Mantis',
    zh: '螳螂珠光绿',
    hex: '#65b42c',
    finish: 'pearl',
    source: 'https://www.lamborghini.com/en-en/history/urus-pearl-capsule',
  },
  {
    id: 'mclaren-papaya',
    brand: 'McLaren',
    name: 'Volcanic Papaya',
    zh: '火山木瓜橙',
    hex: '#ed641c',
    finish: 'metallic',
    source: 'https://www.mclaren.com/cars/us_en',
  },
  {
    id: 'aston-aluminite',
    brand: 'Aston Martin',
    name: 'Aluminite Silver',
    zh: '液态铝银',
    hex: '#a2adb6',
    finish: 'metallic',
    source:
      'https://media.astonmartin.com/aston-martin-vantage-aluminite-silver-spain-photography/?lang=eng',
  },
  {
    id: 'bmw-frozen',
    brand: 'BMW',
    name: 'Frozen Pure Grey',
    zh: '冰霜纯灰',
    hex: '#888b8c',
    finish: 'matte',
    source: 'https://individual.bmw-m.com/en-IE/G99-81GV-C5A',
  },
  {
    id: 'mercedes-magno',
    brand: 'Mercedes-Benz',
    name: 'Graphite Grey Magno',
    zh: '石墨磁性灰',
    hex: '#555b62',
    finish: 'satin',
    source:
      'https://media.mercedes-benz.com/article/24c2477b-5e72-42c8-983b-0c4870b05a84',
  },
  {
    id: 'lexus-structural',
    brand: 'Lexus',
    name: 'Structural Blue',
    zh: '结构光蓝',
    hex: '#0846ab',
    finish: 'pearl',
    source:
      'https://newsroom.lexus.eu/natures-brillance-captured---new-lexus-structural-blue/',
  },
] as const;
export function paintName(locale: Locale, id: string) {
  const p = signaturePaints.find((p) => p.id === id);
  return p ? (locale === 'zh' ? p.zh : p.name) : undefined;
}
export function paintSelection(id: string) {
  return {
    paint: id,
    finish: signaturePaints.some((p) => p.id === id)
      ? ('signature' as const)
      : ('gloss' as const),
  };
}
export function paintProfile(
  id: string,
  finish: PaintFinish,
  wet = false,
): Profile {
  const signature = signaturePaints.find((p) => p.id === id);
  const effective =
    finish === 'signature' ? (signature?.finish ?? 'metallic') : finish;
  const p = { ...finishProfiles[effective] };
  if (finish === 'signature' && signature && 'flakes' in signature)
    p.flakes = signature.flakes;
  if (wet) {
    p.clearcoat = 1;
    p.coatRoughness = 0.055;
  }
  return p;
}
const labels: Record<string, string[]> = {
  title: [
    '全球车漆灵感 · 10 款',
    'Global paint inspirations · 10',
    'Globale Lackinspiration · 10',
    '世界の塗装インスピレーション · 10',
    'إلهام الطلاء العالمي · 10',
  ],
  note: [
    '参考十个高端品牌的代表性漆面，非排名。颜色与材质为创意模拟，非官方色号、配方或极氪选装。',
    'Inspired by ten premium brands, not a ranking. Artistic color and finish studies, not official color codes, formulas or ZEEKR options.',
    'Zehn Premiummarken, keine Rangliste. Kreative Simulation, keine offiziellen Farbcodes, Rezepturen oder ZEEKR-Optionen.',
    '高級10ブランドからの着想。ランキングではなく、公式色・配合・ZEEKRオプションの再現ではありません。',
    'مستوحى من عشر علامات فاخرة، دون ترتيب. محاكاة إبداعية وليست ألوانًا أو تركيبات رسمية أو خيارات زيكر.',
  ],
  source: [
    '官方参考 ↗',
    'Official reference ↗',
    'Offizielle Referenz ↗',
    '公式参考 ↗',
    'المرجع الرسمي ↗',
  ],
  signature: [
    '参考漆效',
    'Signature study',
    'Referenzeffekt',
    '参考の質感',
    'تأثير مرجعي',
  ],
  hint: [
    '旋转车身、切换日夜，观察反射与流彩变化。',
    'Rotate and switch day/night to compare reflections and color travel.',
    'Drehen und Tag/Nacht wechseln, um Reflexe und Farbspiel zu sehen.',
    '回転と昼夜切替で反射や色変化を確認できます。',
    'دوّر السيارة وبدّل النهار والليل لمقارنة الانعكاسات وتغير اللون.',
  ],
};
export function paintText(locale: Locale, key: string) {
  return labels[key]?.[['zh', 'en', 'de', 'ja', 'ar'].indexOf(locale)] ?? key;
}
