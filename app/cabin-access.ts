import type { Settings, View, Locale } from './experience';
import { seatPositions, type SeatPosition } from './study-state';
export type Passenger = {
  seat: SeatPosition;
  name: string;
  height: number;
  offset: number;
};
export type CabinAccessSettings = {
  passengers: Passenger[];
  windowLF: number;
  windowRF: number;
  windowLB: number;
  windowRB: number;
  panView: boolean;
};
export const cabinAccessDefaults: CabinAccessSettings = {
  passengers: [],
  windowLF: 0,
  windowRF: 0,
  windowLB: 0,
  windowRB: 0,
  panView: false,
};
export const windowKeys = [
  'windowLF',
  'windowRF',
  'windowLB',
  'windowRB',
] as const;
export const seatViews: Record<SeatPosition, View> = {
  'front-left': 'driver',
  'front-right': 'passenger',
  'second-left': 'second-left',
  'second-right': 'second-right',
  'third-left': 'third-left',
  'third-right': 'third-right',
};
export function newPassenger(seat: SeatPosition): Passenger {
  return { seat, name: '', height: 170, offset: 0 };
}
export function passengerList(
  s: Pick<Settings, 'occupant' | 'passengers' | 'seatPosition' | 'height'>,
): Passenger[] {
  if (!s.occupant) return [];
  return s.passengers.length
    ? s.passengers
    : [{ ...newPassenger(s.seatPosition), height: s.height }];
}
export function readCabinAccess(p: URLSearchParams): CabinAccessSettings {
  const s: CabinAccessSettings = { ...cabinAccessDefaults, passengers: [] };
  for (const key of windowKeys) {
    const v = Number(p.get(key));
    if (Number.isFinite(v)) s[key] = Math.round(Math.max(0, Math.min(100, v)));
  }
  try {
    const data = JSON.parse((p.get('passengers') || '[]').slice(0, 2400));
    if (Array.isArray(data))
      for (const v of data.slice(0, 6)) {
        if (
          !v ||
          !seatPositions.includes(v.seat) ||
          s.passengers.some((x) => x.seat === v.seat)
        )
          continue;
        s.passengers.push({
          seat: v.seat,
          name: typeof v.name === 'string' ? v.name.slice(0, 24) : '',
          height: Math.max(150, Math.min(195, Number(v.height) || 170)),
          offset: Math.max(-3, Math.min(3, Number(v.offset) || 0)),
        });
      }
  } catch {
    /* An invalid shared configuration falls back to an empty cabin. */
  }
  s.panView = p.get('panView') === '1';
  return s;
}
export function writeCabinAccess(p: URLSearchParams, s: CabinAccessSettings) {
  for (const key of windowKeys) p.set(key, String(s[key]));
  p.set('panView', s.panView ? '1' : '0');
  p.set('passengers', JSON.stringify(s.passengers));
}
const words: Record<string, string[]> = {
  moveSeat: [
    '更换座位',
    'Move to seat',
    'Sitz wechseln',
    '座席を変更',
    'تغيير المقعد',
  ],
  quick: [
    '便捷车控',
    'Quick controls',
    'Schnellsteuerung',
    'クイック操作',
    'تحكم سريع',
  ],
  windows: [
    '车窗开度',
    'Window opening',
    'Fensteröffnung',
    '窓の開度',
    'فتح النوافذ',
  ],
  people: [
    '乘员与座位',
    'Passengers & seats',
    'Passagiere & Sitze',
    '乗員と座席',
    'الركاب والمقاعد',
  ],
  pan: [
    '平移视图',
    'Pan view',
    'Ansicht verschieben',
    '視点を移動',
    'تحريك العرض',
  ],
  reset: [
    '视角复位',
    'Reset view',
    'Ansicht zurücksetzen',
    '視点リセット',
    'إعادة العرض',
  ],
  view: [
    '切换视角',
    'Change viewpoint',
    'Ansicht wählen',
    '視点切替',
    'تغيير المنظور',
  ],
  count: [
    '乘员人数',
    'Passenger count',
    'Passagierzahl',
    '乗員数',
    'عدد الركاب',
  ],
  name: ['乘员称呼', 'Passenger name', 'Name', '呼び名', 'اسم الراكب'],
  height: [
    '身高（cm）',
    'Height (cm)',
    'Größe (cm)',
    '身長 (cm)',
    'الطول (سم)',
  ],
  offset: [
    '前后微调（cm）',
    'Fore / aft (cm)',
    'Längsversatz (cm)',
    '前後調整 (cm)',
    'ضبط أمامي وخلفي (سم)',
  ],
  preview: [
    '查看此座位',
    'View this seat',
    'Diesen Sitz ansehen',
    'この座席を見る',
    'عرض هذا المقعد',
  ],
  remove: [
    '移除此乘员',
    'Remove passenger',
    'Passagier entfernen',
    '乗員を削除',
    'إزالة الراكب',
  ],
  add: [
    '添加白模乘员',
    'Add white robot',
    'Roboter hinzufügen',
    '白いロボットを追加',
    'إضافة روبوت أبيض',
  ],
  cutaway: [
    '透视查看乘员',
    'Reveal passengers',
    'Passagiere freilegen',
    '乗員を透視表示',
    'إظهار الركاب',
  ],
  note: [
    '机器人为独立乘坐示意，可移除；非人体工学认证。',
    'Independent removable robots; seating illustration, not ergonomic certification.',
    'Separate, entfernbare Roboter; keine ergonomische Zertifizierung.',
    'ロボットは独立した着座イメージです。人間工学の認証ではありません。',
    'روبوتات مستقلة قابلة للإزالة؛ توضيح جلوس وليس اعتمادًا هندسيًا.',
  ],
  all: ['全部车窗', 'All windows', 'Alle Fenster', 'すべての窓', 'كل النوافذ'],
  'front-left': ['驾驶位', 'Driver', 'Fahrer', '運転席', 'السائق'],
  'front-right': [
    '副驾驶',
    'Passenger',
    'Beifahrer',
    '助手席',
    'الراكب الأمامي',
  ],
  'second-left': [
    '二排左',
    'Row 2 left',
    'Reihe 2 links',
    '2列目左',
    'الصف 2 يسار',
  ],
  'second-right': [
    '二排右',
    'Row 2 right',
    'Reihe 2 rechts',
    '2列目右',
    'الصف 2 يمين',
  ],
  'third-left': [
    '三排左',
    'Row 3 left',
    'Reihe 3 links',
    '3列目左',
    'الصف 3 يسار',
  ],
  'third-right': [
    '三排右',
    'Row 3 right',
    'Reihe 3 rechts',
    '3列目右',
    'الصف 3 يمين',
  ],
};
export function accessText(locale: Locale, key: string) {
  return words[key]?.[['zh', 'en', 'de', 'ja', 'ar'].indexOf(locale)] ?? key;
}
