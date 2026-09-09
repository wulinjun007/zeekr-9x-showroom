import { paintFinishes, type PaintFinish } from './paint-library';
import {
  seatPositions,
  roadTypes,
  partTypes,
  type SeatPosition,
  type RoadType,
  type PartType,
} from './study-state';
import { cmfOptions } from './cmf-options';
export const weatherTypes = [
  'clear',
  'overcast',
  'rain',
  'storm',
  'snow',
  'blizzard',
  'fog',
  'wind',
  'sand',
  'heat',
  'hail',
] as const;
export type Weather = (typeof weatherTypes)[number];
export type LabSettings = {
  seatPosition: SeatPosition;
  seatbelt: boolean;
  weatherIntensity: number;
  roadType: RoadType;
  roadEnabled: boolean;
  roadPlaying: boolean;
  roadSpeed: number;
  roadSeverity: number;
  chassisOverlay: boolean;
  partFilter: PartType;
  partIsolate: boolean;
  explodeMode: 'assemblies' | 'meshes';

  seatMaterial: (typeof cmfOptions.seatMaterial)[number];
  doorMaterial: (typeof cmfOptions.doorMaterial)[number];
  dashMaterial: (typeof cmfOptions.dashMaterial)[number];
  roofMaterial: (typeof cmfOptions.roofMaterial)[number];
  carpetMaterial: (typeof cmfOptions.carpetMaterial)[number];
  trimMaterial: (typeof cmfOptions.trimMaterial)[number];

  cabinApp: 'home' | 'navigation' | 'media' | 'comfort' | 'energy' | 'parking';
  temperature: number;
  fan: number;
  volume: number;
  ambientPower: number;

  weather: Weather;
  finish: PaintFinish;
  lightRig: 'softbox' | 'strip';
  readingLights: boolean;
  rearScreen: boolean;
  shade: number;
  climate: 'off' | 'vent' | 'heat' | 'massage';
  occupant: boolean;
  height: number;
  occupantRow: 'driver' | 'second' | 'third';
  hmi: string;
};
export const labDefaults: LabSettings = {
  seatPosition: 'second-left',
  seatbelt: true,
  weatherIntensity: 60,
  roadType: 'smooth',
  roadEnabled: false,
  roadPlaying: false,
  roadSpeed: 18,
  roadSeverity: 60,
  chassisOverlay: false,
  partFilter: 'all',
  partIsolate: false,
  explodeMode: 'assemblies',

  seatMaterial: 'original',
  doorMaterial: 'original',
  dashMaterial: 'original',
  roofMaterial: 'original',
  carpetMaterial: 'original',
  trimMaterial: 'original',

  cabinApp: 'home',
  temperature: 22,
  fan: 2,
  volume: 35,
  ambientPower: 60,
  weather: 'clear',
  finish: 'gloss',
  lightRig: 'softbox',
  readingLights: true,
  rearScreen: false,
  shade: 0,
  climate: 'off',
  occupant: false,
  height: 170,
  occupantRow: 'second',
  hmi: 'startup',
};
export const labEnums = {
  seatPosition: seatPositions,
  roadType: roadTypes,
  partFilter: partTypes,
  explodeMode: ['assemblies', 'meshes'],

  ...cmfOptions,
  cabinApp: ['home', 'navigation', 'media', 'comfort', 'energy', 'parking'],
  weather: weatherTypes,
  finish: paintFinishes,
  lightRig: ['softbox', 'strip'],
  climate: ['off', 'vent', 'heat', 'massage'],
  occupantRow: ['driver', 'second', 'third'],
} as const;
export function readLab(p: URLSearchParams): LabSettings {
  const s = { ...labDefaults };
  for (const [key, values] of Object.entries(labEnums)) {
    const v = p.get(key);
    if (v && (values as readonly string[]).includes(v))
      (s as unknown as Record<string, unknown>)[key] = v;
  }
  for (const k of [
    'readingLights',
    'rearScreen',
    'occupant',
    'seatbelt',
    'roadEnabled',
    'roadPlaying',
    'chassisOverlay',
    'partIsolate',
  ] as const) {
    if (p.has(k)) s[k] = p.get(k) === '1';
  }
  for (const [k, min, max] of [
    ['height', 150, 195],
    ['weatherIntensity', 20, 100],
    ['roadSpeed', 0, 40],
    ['roadSeverity', 0, 100],
    ['shade', 0, 100],
    ['temperature', 18, 28],
    ['fan', 0, 5],
    ['volume', 0, 100],
    ['ambientPower', 0, 100],
  ] as const) {
    const v = Number(p.get(k));
    if (p.has(k) && Number.isFinite(v)) s[k] = Math.min(max, Math.max(min, v));
  }
  if (!p.has('seatPosition') && p.has('occupantRow'))
    s.seatPosition =
      s.occupantRow === 'driver'
        ? 'front-left'
        : s.occupantRow === 'third'
          ? 'third-left'
          : 'second-left';
  const id = p.get('hmi');
  if (id && /^[a-z-]{1,30}$/.test(id)) s.hmi = id;
  return s;
}
export function writeLab(p: URLSearchParams, s: LabSettings) {
  for (const k of Object.keys(labEnums) as (keyof typeof labEnums)[])
    p.set(k, s[k]);
  for (const k of [
    'readingLights',
    'rearScreen',
    'occupant',
    'seatbelt',
    'roadEnabled',
    'roadPlaying',
    'chassisOverlay',
    'partIsolate',
  ] as const)
    p.set(k, s[k] ? '1' : '0');
  for (const k of [
    'height',
    'weatherIntensity',
    'roadSpeed',
    'roadSeverity',
    'shade',
    'hmi',
    'temperature',
    'fan',
    'volume',
    'ambientPower',
  ] as const)
    p.set(k, String(s[k]));
}
export const labWords: Record<string, string[]> = {
  material: [
    '材质与光影',
    'Materials & light',
    'Material & Licht',
    '質感と光',
    'المواد والإضاءة',
  ],
  gloss: ['清漆高光', 'Clearcoat', 'Klarlack', 'クリアコート', 'طلاء لامع'],
  satin: ['柔缎质感', 'Satin', 'Seidenmatt', 'サテン', 'ساتان'],
  signature: [
    '参考漆效',
    'Signature study',
    'Referenzeffekt',
    '参考の質感',
    'تأثير مرجعي',
  ],
  metallic: ['细粒金属', 'Metallic', 'Metallic', 'メタリック', 'معدني'],
  pearl: ['珠光层次', 'Pearlescent', 'Perlmutt', 'パール', 'لؤلؤي'],
  matte: ['冰霜哑光', 'Frozen matte', 'Matt', 'マット', 'مطفي'],
  iridescent: ['流彩变色', 'Color-shift', 'Farbwechsel', '偏光', 'متغير اللون'],
  softbox: ['大幅柔光', 'Softbox', 'Softbox', 'ソフト光', 'ضوء ناعم'],
  strip: [
    '长条轮廓光',
    'Strip light',
    'Streifenlicht',
    'ライン光',
    'إضاءة خطية',
  ],
  weather: ['天气环境', 'Weather', 'Wetter', '天候', 'الطقس'],
  clear: ['晴朗', 'Clear', 'Klar', '晴れ', 'صافٍ'],
  rain: ['雨天', 'Rain', 'Regen', '雨', 'مطر'],
  snow: ['飘雪', 'Snow', 'Schnee', '雪', 'ثلج'],
  fog: ['浓雾', 'Fog', 'Nebel', '霧', 'ضباب'],
  wind: ['侧风', 'Crosswind', 'Seitenwind', '横風', 'رياح جانبية'],
  detail: [
    '座舱细节',
    'Cabin details',
    'Kabinen-Details',
    '室内の細部',
    'تفاصيل المقصورة',
  ],
  readingLights: [
    '阅读灯',
    'Reading lights',
    'Leselicht',
    '読書灯',
    'مصابيح القراءة',
  ],
  rearScreen: [
    '后排屏幕展开',
    'Deploy rear display',
    'Fond-Display öffnen',
    '後席画面を展開',
    'فتح الشاشة الخلفية',
  ],
  shade: [
    '天幕遮阳',
    'Roof shade',
    'Sonnenschutz',
    'サンシェード',
    'ستارة السقف',
  ],
  climate: [
    '座椅舒适演示',
    'Seat comfort',
    'Sitzkomfort',
    'シート快適機能',
    'راحة المقاعد',
  ],
  off: ['关闭', 'Off', 'Aus', 'オフ', 'إيقاف'],
  vent: ['通风', 'Ventilation', 'Belüftung', '送風', 'تهوية'],
  heat: ['加热', 'Heating', 'Heizung', 'ヒーター', 'تدفئة'],
  massage: ['按摩', 'Massage', 'Massage', 'マッサージ', 'تدليك'],
  occupant: [
    '显示乘坐人偶',
    'Seated avatar',
    'Sitzende Figur',
    '着座アバター',
    'مجسم الراكب',
  ],
  height: ['身高', 'Height', 'Körpergröße', '身長', 'الطول'],
  spaceStudy: [
    '乘坐空间对比',
    'Seating study',
    'Sitzraumvergleich',
    '着座空間の比較',
    'مقارنة مساحة الجلوس',
  ],
  spaceNote: [
    '按比例的姿态示意，非实测头部／腿部余量。',
    'Proportional pose study; no measured headroom or legroom.',
    'Proportionale Pose; keine gemessene Kopf- oder Beinfreiheit.',
    '比率による姿勢例。実測の頭上・脚元寸法ではありません。',
    'وضعية تناسبية وليست قياساً لمساحة الرأس أو الأرجل.',
  ],
  library: [
    'HMI 场景剧场',
    'HMI scenario theatre',
    'HMI-Szenarien',
    'HMIシナリオ',
    'سيناريوهات HMI',
  ],
  all: ['全部旅程', 'All journeys', 'Alle Fahrphasen', '全行程', 'كل الرحلات'],
  before: ['上车前', 'Before entry', 'Vor Einstieg', '乗車前', 'قبل الركوب'],
  entry: ['上车识别', 'Entry', 'Einstieg', '乗車', 'الركوب'],
  driving: ['行车中', 'Driving', 'Fahrt', '走行中', 'القيادة'],
  parking: ['低速泊车', 'Parking', 'Parken', '駐車', 'الركن'],
  parked: ['驻车静止', 'Parked', 'Stillstand', '停車中', 'التوقف'],
  exit: ['下车离车', 'Exit', 'Ausstieg', '降車', 'المغادرة'],
  start: ['播放演示', 'Play demo', 'Demo starten', 'デモ再生', 'تشغيل العرض'],
  pause: ['暂停', 'Pause', 'Pause', '一時停止', 'إيقاف مؤقت'],
  reset: ['重播', 'Replay', 'Wiederholen', '再生し直す', 'إعادة'],
  sound: [
    '试听提示音',
    'Preview alert tone',
    'Hinweiston testen',
    '通知音を試聴',
    'معاينة التنبيه',
  ],
  concept: [
    '交互概念演示 · 非实车功能承诺',
    'Interaction concept · Not a production feature claim',
    'Interaktionskonzept · Keine Serienfunktionszusage',
    '操作コンセプト・実車機能の保証ではありません',
    'تصور تفاعلي وليس ضماناً لوظائف السيارة',
  ],
  evidence: [
    '官方视频参考',
    'Official video references',
    'Offizielle Referenzvideos',
    '公式参考動画',
    'مقاطع رسمية مرجعية',
  ],
  timeline: [
    '演示时间线',
    'Demo timeline',
    'Demo-Zeitleiste',
    'デモ時間軸',
    'خط العرض الزمني',
  ],
};
export function labText(locale: string, key: string) {
  return labWords[key]?.[['zh', 'en', 'de', 'ja', 'ar'].indexOf(locale)] ?? key;
}
