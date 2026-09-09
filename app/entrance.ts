import type { Settings, Locale } from './experience';

export const heroCameraPosition = [-5.2, 2.1, -6.3];
/** Preserve horizontal framing on portrait phones without moving the orbit centre. */
export function exteriorFov(aspect: number) {
  return (
    (2 *
      Math.atan(
        Math.tan((19 * Math.PI) / 180) *
          Math.max(1, 1.25 / Math.max(0.2, aspect)),
      ) *
      180) /
    Math.PI
  );
}
export const entranceDuration = 4.4;
export const entranceCameraPosition = [-12, 2.7, -4] as const;
// Eleven full wheel revolutions let the stationary wheel pose join without a snap.
export const entranceDistance = 11 * Math.PI * 2 * 0.409;
export function entrancePose(seconds: number) {
  const t = Math.min(1, Math.max(0, seconds / 3.8));
  const remaining = (1 - t) ** 3;
  return {
    z: entranceDistance * remaining,
    travel: -entranceDistance * (1 - remaining),
    cameraMix: 1 - remaining,
    done: seconds >= entranceDuration,
  };
}

/** The opening is transient; never write its settings into the URL or user state. */
export function entranceSettings(s: Settings): Settings {
  return {
    ...s,
    section: 'exterior',
    view: 'hero',
    mode: s.mode,
    weather: 'clear',
    orbit: false,
    playing: false,
    roadEnabled: false,
    roadPlaying: false,
    doors: [],
    hidden: [],
    selected: null,
    isolated: false,
    transparent: false,
    partFilter: 'all',
    partIsolate: false,
    explode: 0,
    chassisOverlay: false,
    occupant: false,
    lights: s.mode === 'night',
    hazards: false,
    hud: false,
    hotspots: false,
  };
}

export const entranceCopy: Record<
  Locale,
  { title: string; note: string; skip: string }
> = {
  zh: { title: '从容，入场。', note: '即将进入你的 9X 体验', skip: '跳过开场' },
  en: {
    title: 'Arrive with presence.',
    note: 'Your 9X experience awaits',
    skip: 'Skip intro',
  },
  de: {
    title: 'Souverän ankommen.',
    note: 'Ihr 9X Erlebnis beginnt',
    skip: 'Intro überspringen',
  },
  ja: {
    title: 'ゆとりある登場。',
    note: 'あなたの 9X 体験へ',
    skip: 'イントロをスキップ',
  },
  ar: {
    title: 'حضور يليق بك.',
    note: 'تجربة 9X الخاصة بك على وشك البدء',
    skip: 'تخطي المقدمة',
  },
};

export const showcaseDuration = 24;
export function showcasePose(seconds: number) {
  const t = Math.max(0, Math.min(1, seconds / showcaseDuration));
  // Ease into and out of one full circuit, joining the arrival hero camera.
  const q = t * t * (3 - 2 * t);
  const radius = Math.hypot(heroCameraPosition[0], heroCameraPosition[2]);
  const angle =
    Math.atan2(heroCameraPosition[0], heroCameraPosition[2]) - q * Math.PI * 2;
  return {
    position: [
      Math.sin(angle) * radius,
      heroCameraPosition[1] - 0.2 * Math.sin(Math.PI * t) ** 2,
      Math.cos(angle) * radius,
    ] as [number, number, number],
    chapter: Math.min(3, Math.floor(q * 4)),
    done: t === 1,
  };
}
export const showcaseCopy: Record<
  Locale,
  { chapters: string[]; hint: string; skip: string }
> = {
  zh: {
    chapters: [
      '前脸细节与光影',
      '侧面线条与轮组',
      '尾部造型与灯组',
      '车身比例与姿态',
    ],
    hint: '自动环绕 · 拖动即可自由查看',
    skip: '结束导览',
  },
  en: {
    chapters: [
      'Front details & reflections',
      'Side profile & wheels',
      'Rear design & lighting',
      'Proportions & stance',
    ],
    hint: 'Auto tour · Drag to explore',
    skip: 'End tour',
  },
  de: {
    chapters: [
      'Frontdetails & Reflexionen',
      'Seitenlinie & Räder',
      'Heckdesign & Leuchten',
      'Proportionen & Haltung',
    ],
    hint: 'Automatische Tour · Ziehen zum Erkunden',
    skip: 'Tour beenden',
  },
  ja: {
    chapters: [
      'フロントのディテールと光',
      'サイドラインとホイール',
      'リアデザインとライト',
      'プロポーションと姿勢',
    ],
    hint: '自動周回 · ドラッグで自由に見る',
    skip: 'ツアーを終了',
  },
  ar: {
    chapters: [
      'تفاصيل المقدمة وانعكاسات الضوء',
      'الخطوط الجانبية والعجلات',
      'التصميم الخلفي والإضاءة',
      'أبعاد الهيكل وحضوره',
    ],
    hint: 'جولة تلقائية · اسحب للاستكشاف',
    skip: 'إنهاء الجولة',
  },
};
