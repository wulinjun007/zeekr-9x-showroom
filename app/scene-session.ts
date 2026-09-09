import {
  defaults,
  readSettings,
  shareUrl,
  type Settings,
  type Locale,
} from './experience';
const storageKey = 'zeekr9x-scene-v1';
export function resetScene(s: Settings): Settings {
  return {
    ...s,
    mode: defaults.mode,
    view: 'hero',
    section: 'exterior',
    weather: 'clear',
    orbit: false,
    playing: false,
    progress: 0,
    roadEnabled: false,
    roadPlaying: false,
    doors: [],
    hidden: [],
    selected: null,
    isolated: false,
    transparent: false,
    explode: 0,
    partFilter: 'all',
    partIsolate: false,
    chassisOverlay: false,
    hazards: false,
    hud: false,
    climate: 'off',
    occupant: false,
    hotspots: true,
  };
}
export function saveScene(s: Settings): boolean {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ version: 1, search: new URL(shareUrl(s)).search }),
    );
    return true;
  } catch {
    return false;
  }
}
export function restoreScene(): Settings | null {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (
      data?.version !== 1 ||
      typeof data.search !== 'string' ||
      data.search.length > 16000
    )
      return null;
    return {
      ...readSettings(data.search),
      orbit: false,
      playing: false,
      roadPlaying: false,
    };
  } catch {
    return null;
  }
}
const copy: Record<string, string[]> = {
  replay: [
    '回放入场',
    'Replay arrival',
    'Ankunft wiederholen',
    '入場を再生',
    'إعادة الدخول',
  ],
  resetScene: [
    '重置场景 · 保留配置',
    'Reset scene · keep configuration',
    'Szene zurücksetzen · Konfiguration behalten',
    '設定を保ちシーンをリセット',
    'إعادة المشهد مع حفظ التكوين',
  ],
  save: [
    '保存方案',
    'Save setup',
    'Konfiguration speichern',
    '構成を保存',
    'حفظ الإعداد',
  ],
  restore: [
    '恢复方案',
    'Restore setup',
    'Konfiguration laden',
    '構成を復元',
    'استعادة الإعداد',
  ],
  saved: [
    '方案已保存在此浏览器',
    'Setup saved in this browser',
    'In diesem Browser gespeichert',
    'このブラウザに保存しました',
    'تم الحفظ في هذا المتصفح',
  ],
  restored: [
    '已恢复方案 · 动画暂停',
    'Setup restored · playback paused',
    'Geladen · Wiedergabe pausiert',
    '復元しました・再生は一時停止',
    'تمت الاستعادة مع إيقاف التشغيل',
  ],
  missing: [
    '此浏览器暂无可恢复的方案',
    'No saved setup in this browser',
    'Keine gespeicherte Konfiguration',
    '保存済みの構成がありません',
    'لا توجد إعدادات محفوظة',
  ],
  failed: [
    '浏览器未允许保存，请使用分享链接',
    'Storage unavailable. Use a share link.',
    'Speichern nicht verfügbar. Teilen-Link verwenden.',
    '保存できません。共有リンクをご利用ください',
    'التخزين غير متاح. استخدم رابط المشاركة',
  ],
};
export function sessionText(locale: Locale, key: string) {
  return copy[key]?.[['zh', 'en', 'de', 'ja', 'ar'].indexOf(locale)] ?? key;
}
