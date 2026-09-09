'use client';
import type { Settings } from './experience';
import {
  signaturePaints,
  paintName,
  paintSelection,
  paintText,
} from './paint-library';
import { labText } from './lab-state';
export function PaintControls({
  s,
  update,
}: {
  s: Settings;
  update: (v: Partial<Settings>) => void;
}) {
  const t = (k: string) => paintText(s.locale, k);
  return (
    <section className="lab-block paint-library" aria-label={t('title')}>
      <h3>{t('title')}</h3>
      <p className="fineprint">{t('hint')}</p>
      <div className="paint-cards">
        {signaturePaints.map((p) => (
          <div
            key={p.id}
            className={'paint-card ' + (s.paint === p.id ? 'active' : '')}
          >
            <button
              aria-pressed={s.paint === p.id}
              onClick={() => update(paintSelection(p.id))}
            >
              <i
                style={{
                  background: `linear-gradient(140deg, #ffffff88, ${p.hex} 40%, ${p.hex} 70%, #00000077)`,
                }}
              />
              <strong>{p.brand}</strong>
              <span>{paintName(s.locale, p.id)}</span>
              <small>{labText(s.locale, p.finish)}</small>
            </button>
            <a href={p.source} target="_blank" rel="noreferrer">
              {t('source')}
            </a>
          </div>
        ))}
      </div>
      <p className="fineprint">{t('note')}</p>
    </section>
  );
}
