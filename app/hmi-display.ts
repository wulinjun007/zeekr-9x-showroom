import type { Settings, Locale } from './experience';
import { scenarioFrame } from './scenarios';
export function hmiDisplay(s: Settings) {
  const f = scenarioFrame(s.hmi, s.progress);
  const urgent =
    f.alert && ['brake', 'takeover', 'impact'].includes(f.scenario.effect);
  return {
    ...f,
    gear: f.speed > 0 ? (s.hmi === 'auto-parking' ? 'R' : 'D') : 'P',
    tone: urgent ? 'critical' : f.alert ? 'warning' : 'normal',
    lane: f.speed > 0 || f.coverage,
    energy: f.scenario.effect === 'charge' ? Math.round(35 + f.p * 43) : 78,
    signal: f.fault
      ? 'unavailable'
      : f.alert
        ? 'attention'
        : f.coverage
          ? 'sensing'
          : f.speed
            ? 'driving'
            : 'parked',
  };
}
const copy: Record<string, string[]> = {
  concept: [
    'HMI 交互演示',
    'HMI concept',
    'HMI-Konzept',
    'HMIコンセプト',
    'تصور HMI',
  ],
  attention: [
    '请注意周围环境',
    'Check your surroundings',
    'Umgebung beachten',
    '周囲を確認',
    'انتبه للمحيط',
  ],
  unavailable: [
    '感知受限',
    'Perception limited',
    'Erfassung eingeschränkt',
    '認識に制限あり',
    'الإدراك محدود',
  ],
  sensing: [
    '环境感知',
    'Perception',
    'Umfelderfassung',
    '周辺認識',
    'إدراك المحيط',
  ],
  driving: ['行驶中', 'Driving', 'Fahrt', '走行中', 'قيد القيادة'],
  parked: ['已驻车', 'Parked', 'Geparkt', '駐車中', 'متوقف'],
  battery: ['电量', 'Battery', 'Batterie', 'バッテリー', 'البطارية'],
  cabin: ['座舱', 'Cabin', 'Innenraum', '車内', 'المقصورة'],
  belt: [
    '安全带已系',
    'Belt fastened',
    'Angeschnallt',
    'ベルト着用',
    'الحزام مربوط',
  ],
  unbelt: [
    '安全带未系',
    'Belt unfastened',
    'Nicht angeschnallt',
    'ベルト未着用',
    'الحزام غير مربوط',
  ],
  doors: [
    '车门已关闭',
    'Doors closed',
    'Türen geschlossen',
    'ドア閉',
    'الأبواب مغلقة',
  ],
  open: ['车门已打开', 'Door open', 'Tür geöffnet', 'ドア開', 'الباب مفتوح'],
  takeover: [
    '立即接管',
    'Take over now',
    'Jetzt übernehmen',
    '今すぐ引き継ぐ',
    'تولَّ القيادة الآن',
  ],
};
export function hmiText(locale: Locale, key: string) {
  return copy[key]?.[['zh', 'en', 'de', 'ja', 'ar'].indexOf(locale)] ?? key;
}
