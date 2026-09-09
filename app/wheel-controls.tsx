'use client';
import type { Settings } from './experience';
import {
  wheelStyles,
  wheelFinishes,
  wheelText,
  wheelPolygons,
  type WheelStyle,
} from './wheel-styles';
export function WheelGlyph({ style }: { style: WheelStyle }) {
  return (
    <svg viewBox="0 0 64 64" width="44" height="44" aria-hidden="true">
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="#171c22"
        stroke="#85939b"
        strokeWidth="1.5"
      />
      <circle
        cx="32"
        cy="32"
        r="27"
        fill={style === 'mirror' ? '#78858e' : '#222b33'}
        stroke="#c8d0d4"
      />
      {style !== 'mirror' &&
        wheelPolygons(style).map((p, i) => (
          <polygon
            key={i}
            points={p
              .map(
                ([x, y]) =>
                  `${(32 + x * 98).toFixed(3)},${(32 + y * 98).toFixed(3)}`,
              )
              .join(' ')}
            fill="#b8c2c9"
          />
        ))}
      <circle cx="32" cy="32" r="5" fill="#a8b4bc" stroke="#242c34" />
    </svg>
  );
}
export function WheelControls({
  s,
  update,
}: {
  s: Settings;
  update: (p: Partial<Settings>) => void;
}) {
  const t = (k: string) => wheelText(s.locale, k);
  return (
    <section className="lab-block wheel-workshop" aria-label={t('title')}>
      <h3>{t('title')}</h3>
      <div className="wheel-cards">
        {wheelStyles.map((v) => (
          <button
            key={v}
            aria-pressed={s.wheelStyle === v}
            onClick={() =>
              update({ wheelStyle: v, view: 'wheel-detail', orbit: false })
            }
          >
            <WheelGlyph style={v} />
            <span>{t(v)}</span>
          </button>
        ))}
      </div>
      <h4>{t('finish')}</h4>
      <div className="variant-buttons">
        {wheelFinishes.map((v) => (
          <button
            key={v}
            disabled={s.wheelStyle === 'mirror'}
            aria-pressed={s.wheelFinish === v}
            onClick={() => update({ wheelFinish: v })}
          >
            {t(v)}
          </button>
        ))}
      </div>
      <p className="fineprint">
        {t(s.wheelStyle === 'mirror' ? 'originalNote' : 'note')}
      </p>
    </section>
  );
}
