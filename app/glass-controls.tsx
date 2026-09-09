'use client';
import type { Settings } from './experience';
import {
  glassDefaults,
  glassPresets,
  glassText,
  glassTints,
  type GlassTint,
} from './glass';

export function GlassControls({
  s,
  update,
}: {
  s: Settings;
  update: (v: Partial<Settings>) => void;
}) {
  const t = (k: string) => glassText(s.locale, k);
  return (
    <section className="lab-block glass-controls" aria-label={t('title')}>
      <h3>{t('title')}</h3>
      <div className="variant-buttons">
        {Object.entries(glassPresets).map(([key, value]) => {
          const active = Object.entries(value).every(
            ([k, v]) => s[k as keyof Settings] === v,
          );
          return (
            <button
              key={key}
              className={active ? 'active' : ''}
              aria-pressed={active}
              onClick={() => update(value)}
            >
              {t(key)}
            </button>
          );
        })}
      </div>
      <div className="glass-tints" role="group" aria-label={t('tint')}>
        {(Object.keys(glassTints) as GlassTint[]).map((key) => (
          <button
            key={key}
            aria-pressed={s.glassTint === key}
            onClick={() => update({ glassTint: key })}
          >
            <i style={{ background: glassTints[key] ?? '#c8d2d6' }} />
            {t(key)}
          </button>
        ))}
      </div>
      {(['glassFront', 'glassRear', 'glassRoof'] as const).map((key) => (
        <label className="glass-range" key={key}>
          <span>
            {t(key)}
            <output>{s[key]} / 100</output>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={s[key]}
            aria-label={`${t(key)} · ${t('level')}`}
            onChange={(e) => update({ [key]: Number(e.target.value) })}
          />
        </label>
      ))}
      <button className="glass-reset" onClick={() => update(glassDefaults)}>
        {t('reset')}
      </button>
      <p className="fineprint">{t('note')}</p>
    </section>
  );
}
