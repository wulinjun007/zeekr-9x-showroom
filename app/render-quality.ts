import type { Locale } from './experience';
export type QualityTier = 'smooth' | 'balanced' | 'high';
export type QualityMode = 'auto' | QualityTier;
export type QualityStatus = { mode: QualityMode; tier: QualityTier };
export const qualityModes: QualityMode[] = [
  'auto',
  'smooth',
  'balanced',
  'high',
];
export const qualityProfiles = {
  smooth: { ratio: 1, pixels: 900_000, shadow: 1024 },
  balanced: { ratio: 1.25, pixels: 1_500_000, shadow: 1024 },
  high: { ratio: 1.75, pixels: 2_800_000, shadow: 2048 },
} as const;
const key = 'zeekr9x-quality-v1';
export function readQualityMode(): QualityMode {
  try {
    const value = localStorage.getItem(key);
    return qualityModes.includes(value as QualityMode)
      ? (value as QualityMode)
      : 'auto';
  } catch {
    return 'auto';
  }
}
export function saveQualityMode(mode: QualityMode) {
  try {
    localStorage.setItem(key, mode);
  } catch {
    /* Private mode still supports this session. */
  }
}
export function qualityRatio(
  w: number,
  h: number,
  dpr: number,
  tier: QualityTier,
) {
  const p = qualityProfiles[tier];
  return Math.min(
    Math.max(0.5, dpr || 1),
    p.ratio,
    Math.sqrt(p.pixels / (Math.max(1, w) * Math.max(1, h))),
  );
}
/** Frame timings decide sustained quality, not the advertised computer model. */
export class AdaptiveQuality {
  mode: QualityMode;
  tier: QualityTier;
  private since: number;
  private frames: number[] = [];
  private work: number[] = [];
  private slow = 0;
  private fast = 0;
  private windowStart = 0;
  constructor(mode: QualityMode, now: number, constrained = false) {
    this.mode = mode;
    this.tier = mode === 'auto' ? (constrained ? 'smooth' : 'balanced') : mode;
    this.since = now;
  }
  setMode(mode: QualityMode, now: number) {
    this.mode = mode;
    if (mode !== 'auto') this.tier = mode;
    this.reset(now);
    return { mode: this.mode, tier: this.tier };
  }
  reset(now: number) {
    this.since = now;
    this.windowStart = 0;
    this.frames = [];
    this.work = [];
    this.slow = this.fast = 0;
  }
  sample(interval: number, work: number, now: number): QualityTier | null {
    if (
      this.mode !== 'auto' ||
      now - this.since < 5000 ||
      interval <= 0 ||
      interval > 1000
    )
      return null;
    if (!this.windowStart) this.windowStart = now;
    this.frames.push(Math.min(interval, 250));
    this.work.push(work);
    if (now - this.windowStart < 2000 || this.frames.length < 30) return null;
    const average = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
    const cpu = this.work.reduce((a, b) => a + b, 0) / this.work.length;
    this.slow = average > 27 || cpu > 16 ? this.slow + 1 : 0;
    this.fast = average < 18.5 && cpu < 7 ? this.fast + 1 : 0;
    this.frames = [];
    this.work = [];
    this.windowStart = now;
    const tiers: QualityTier[] = ['smooth', 'balanced', 'high'];
    const index = tiers.indexOf(this.tier);
    const next =
      this.slow >= 2 && index > 0
        ? index - 1
        : this.fast >= 6 && index < 2
          ? index + 1
          : index;
    if (next === index) return null;
    this.tier = tiers[next];
    this.reset(now);
    return this.tier;
  }
}
const labels: Record<string, string[]> = {
  auto: ['自动适配', 'Auto', 'Automatisch', '自動', 'تلقائي'],
  smooth: ['流畅', 'Smooth', 'Flüssig', 'スムーズ', 'سلس'],
  balanced: ['均衡', 'Balanced', 'Ausgewogen', 'バランス', 'متوازن'],
  high: ['精细', 'High', 'Hoch', '高精細', 'تفصيلي'],
  quality: [
    '显示画质',
    'Display quality',
    'Darstellungsqualität',
    '画質',
    'جودة العرض',
  ],
  active: ['当前', 'Active', 'Aktuell', '現在', 'الحالي'],
};
export function qualityLabel(locale: Locale, id: string) {
  return (
    labels[id]?.[['zh', 'en', 'de', 'ja', 'ar'].indexOf(locale)] ??
    labels[id]?.[1] ??
    id
  );
}
