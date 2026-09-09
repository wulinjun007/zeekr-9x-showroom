'use client';
import {
  Check,
  ChevronRight,
  CircleDot,
  Lightbulb,
  DoorOpen,
  Play,
} from 'lucide-react';
import { paints, text, type Locale, type Settings } from './experience';
import { cmfLabel } from './cmf-controls';
import { labText } from './lab-state';

const copy = {
  zh: {
    configure: '更多选配',
    close: '收起选配',
    explore: '探索更多细节',
    finish: '漆面',
    wheel: '轮毂',
    cabin: '内饰配色',
    material: '座椅触感',
    custom: '个性化演绎',
    scene: '选择场景，亲自体验',
    tour: '光影 · 空间 · 结构',
    controls: '体验控制',
    detail: '查看细节',
  },
  en: {
    configure: 'Customise',
    close: 'Close controls',
    explore: 'Explore the details',
    finish: 'Paint finish',
    wheel: 'Wheels',
    cabin: 'Interior colour',
    material: 'Upholstery',
    custom: 'Personalised study',
    scene: 'Choose a scene. Explore it.',
    tour: 'Light · Space · Structure',
    controls: 'Experience controls',
    detail: 'Explore details',
  },
  de: {
    configure: 'Konfigurieren',
    close: 'Schließen',
    explore: 'Details entdecken',
    finish: 'Lackierung',
    wheel: 'Felgen',
    cabin: 'Innenraumfarbe',
    material: 'Polsterung',
    custom: 'Individuelle Designstudie',
    scene: 'Szene wählen und erleben',
    tour: 'Licht · Raum · Struktur',
    controls: 'Bedienung',
    detail: 'Details ansehen',
  },
  ja: {
    configure: 'カスタマイズ',
    close: '閉じる',
    explore: 'ディテールを見る',
    finish: '塗装',
    wheel: 'ホイール',
    cabin: 'インテリアカラー',
    material: 'シート素材',
    custom: 'パーソナルデザイン',
    scene: 'シーンを選んで体験',
    tour: '光・空間・構造',
    controls: '体験コントロール',
    detail: '詳細を見る',
  },
  ar: {
    configure: 'تخصيص',
    close: 'إغلاق',
    explore: 'استكشف التفاصيل',
    finish: 'الطلاء',
    wheel: 'العجلات',
    cabin: 'لون المقصورة',
    material: 'تنجيد المقاعد',
    custom: 'دراسة تصميم مخصصة',
    scene: 'اختر مشهداً واستكشفه',
    tour: 'ضوء · مساحة · هيكل',
    controls: 'أدوات التجربة',
    detail: 'عرض التفاصيل',
  },
};
export const showroomText = (locale: Locale, key: keyof typeof copy.en) =>
  copy[locale][key];

/** Reuses the same scene state; changing configuration never remounts the canvas. */
export function ShowroomDock({
  s,
  update,
  open,
  tour,
}: {
  s: Settings;
  update: (patch: Partial<Settings>) => void;
  open: () => void;
  tour: (i: number) => void;
}) {
  const tr = (key: string) => {
    const v = text(s.locale, key);
    if (v !== key) return v;
    const lab = labText(s.locale, key);
    return lab === key ? cmfLabel(s.locale, key) : lab;
  };
  const ui = (key: keyof typeof copy.en) => showroomText(s.locale, key);
  return (
    <div className="showroom-dock">
      {s.section === 'exterior' ? (
        <>
          <div
            className="dock-group dock-paints"
            role="group"
            aria-label={tr('paint')}
          >
            <div className="dock-options">
              {paints.map((p) => (
                <button
                  key={p.id}
                  className={
                    'dock-swatch ' + (s.paint === p.id ? 'selected' : '')
                  }
                  style={{ backgroundColor: p.hex }}
                  aria-label={tr(p.id)}
                  aria-pressed={s.paint === p.id}
                  onClick={() => update({ paint: p.id })}
                />
              ))}
            </div>
            <span className="dock-caption">{tr(s.paint)}</span>
          </div>
          <div className="dock-group" role="group" aria-label={ui('wheel')}>
            <div className="dock-options">
              {(['mirror', 'turbine', 'sport'] as const).map((v, i) => (
                <button
                  key={v}
                  className={
                    'dock-wheel ' + (s.wheelStyle === v ? 'selected' : '')
                  }
                  aria-label={tr(v)}
                  aria-pressed={s.wheelStyle === v}
                  onClick={() =>
                    update({
                      wheelStyle: v,
                      view: 'wheel-detail',
                      orbit: false,
                    })
                  }
                >
                  <CircleDot size={23} strokeWidth={i === 1 ? 2 : 1} />
                  <span>{tr(v)}</span>
                </button>
              ))}
            </div>
            <span className="dock-caption">
              {ui('wheel')} · {tr(s.wheelStyle)}
            </span>
          </div>
          <div
            className="dock-group dock-finish"
            role="group"
            aria-label={ui('finish')}
          >
            <div className="dock-options">
              {(['gloss', 'satin'] as const).map((v) => (
                <button
                  key={v}
                  className={'dock-text ' + (s.finish === v ? 'selected' : '')}
                  aria-pressed={s.finish === v}
                  onClick={() => update({ finish: v })}
                >
                  {tr(v)}
                </button>
              ))}
            </div>
            <span className="dock-caption">
              {ui('finish')} · {ui('custom')}
            </span>
          </div>
        </>
      ) : s.section === 'interior' ? (
        <>
          <div className="dock-group" role="group" aria-label={ui('cabin')}>
            <div className="dock-options">
              {(['blue', 'ivory', 'cognac'] as const).map((v, i) => (
                <button
                  key={v}
                  style={{
                    backgroundColor: ['#273747', '#d4c9b7', '#916041'][i],
                  }}
                  className={
                    'dock-swatch ' + (s.seatStyle === v ? 'selected' : '')
                  }
                  aria-label={tr(v)}
                  aria-pressed={s.seatStyle === v}
                  onClick={() => update({ seatStyle: v })}
                />
              ))}
            </div>
            <span className="dock-caption">{tr(s.seatStyle)}</span>
          </div>
          <div className="dock-group" role="group" aria-label={ui('material')}>
            <div className="dock-options">
              {(['original', 'leather', 'fabric', 'suede'] as const).map(
                (v) => (
                  <button
                    key={v}
                    className={
                      'dock-text ' + (s.seatMaterial === v ? 'selected' : '')
                    }
                    aria-pressed={s.seatMaterial === v}
                    onClick={() => update({ seatMaterial: v })}
                  >
                    {tr(v)}
                  </button>
                ),
              )}
            </div>
            <span className="dock-caption">{ui('material')}</span>
          </div>
          <div
            className="dock-group dock-ambient"
            role="group"
            aria-label={tr('ambient')}
          >
            <div className="dock-options">
              {['#e6ad77', '#f1d8ae', '#80c5e7', '#b9a2df'].map((c) => (
                <button
                  key={c}
                  style={{ backgroundColor: c }}
                  className={
                    'dock-swatch small ' + (s.ambient === c ? 'selected' : '')
                  }
                  aria-label={`${tr('ambient')} ${c}`}
                  aria-pressed={s.ambient === c}
                  onClick={() => update({ ambient: c })}
                >
                  {s.ambient === c && <Check size={12} />}
                </button>
              ))}
            </div>
            <span className="dock-caption">{tr('ambient')}</span>
          </div>
        </>
      ) : s.section === 'story' ? (
        <div className="dock-chapters">
          {[1, 2, 3, 4].map((i) => (
            <button key={i} onClick={() => tour(i)}>
              <Play size={13} />
              <span>{tr('chapter' + i)}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="dock-summary">
            <span>
              {s.section === 'structure' ? tr('explode') : tr('safety')}
            </span>
            <strong>
              {s.section === 'structure' ? `${s.explode}%` : ui('scene')}
            </strong>
          </div>
          {s.section === 'structure' && (
            <div className="dock-options">
              {[0, 65, 140, 200].map((v) => (
                <button
                  className={'dock-text ' + (s.explode === v ? 'selected' : '')}
                  key={v}
                  onClick={() => update({ explode: v })}
                  aria-pressed={s.explode === v}
                >
                  {v}%
                </button>
              ))}
            </div>
          )}
          <button className="dock-open" onClick={open}>
            {ui('explore')}
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}

export function QuickAccess({
  s,
  update,
}: {
  s: Settings;
  update: (patch: Partial<Settings>) => void;
}) {
  return (
    <div className="quick-access">
      <button
        aria-label={text(s.locale, 'lights')}
        aria-pressed={s.lights}
        onClick={() => update({ lights: !s.lights })}
      >
        <Lightbulb size={19} />
      </button>
      <button
        aria-label={text(s.locale, s.doors.length ? 'closeAll' : 'openAll')}
        aria-pressed={s.doors.length > 0}
        onClick={() =>
          update({
            doors: s.doors.length
              ? []
              : ['Door_LF', 'Door_RF', 'Door_LB', 'Door_RB'],
          })
        }
      >
        <DoorOpen size={19} />
      </button>
    </div>
  );
}
