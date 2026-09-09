'use client';
import { useRef, useState } from 'react';
import type { Settings } from './experience';
import {
  ipReferences,
  wrapDefaults,
  wrapPatterns,
  wrapPlacements,
  wrapText,
} from './wrap-library';
export function WrapControls({
  s,
  update,
}: {
  s: Settings;
  update: (p: Partial<Settings>) => void;
}) {
  const t = (k: string) => wrapText(s.locale, k);
  const [error, setError] = useState('');
  const request = useRef(0);
  async function upload(file: File | undefined) {
    const token = ++request.current;
    setError('');
    if (!file) return;
    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      setError(t('error'));
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      if (token !== request.current) {
        bitmap.close();
        return;
      }
      const factor = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(bitmap.width * factor));
      c.height = Math.max(1, Math.round(bitmap.height * factor));
      c.getContext('2d')!.drawImage(bitmap, 0, 0, c.width, c.height);
      bitmap.close();
      update({
        wrapImage: c.toDataURL('image/png'),
        wrapTheme: 'custom',
        view: s.wrapPlacement === 'hood' ? 'top' : 'side',
        orbit: false,
      });
    } catch {
      if (token === request.current) setError(t('error'));
    }
  }
  function choose(id: string) {
    update({
      wrapTheme: id,
      view: s.wrapPlacement === 'hood' ? 'top' : 'side',
      orbit: false,
    });
  }
  return (
    <section className="lab-block wrap-studio" aria-label={t('title')}>
      <h3>{t('title')}</h3>
      <p className="fineprint">{t('hint')}</p>
      <div className="variant-buttons">
        {['none', 'atelier', ...(s.wrapImage ? ['custom'] : [])].map((id) => (
          <button
            key={id}
            aria-pressed={s.wrapTheme === id}
            onClick={() => choose(id)}
          >
            {t(id)}
          </button>
        ))}
      </div>
      <label className="wrap-upload">
        {t('upload')}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </label>
      <p className="fineprint">{t('local')}</p>
      {error && <p role="alert">{error}</p>}
      {s.wrapImage && (
        <div className="wrap-upload-preview">
          <img src={s.wrapImage} alt={t('custom')} />
          <button
            onClick={() => {
              request.current++;
              update({
                wrapImage: '',
                wrapTheme: s.wrapTheme === 'custom' ? 'none' : s.wrapTheme,
              });
            }}
          >
            {t('remove')}
          </button>
        </div>
      )}
      <h4>{t('patterns')}</h4>
      <div className="variant-buttons">
        {wrapPatterns.map((v) => (
          <button
            key={v}
            disabled={s.wrapTheme === 'custom'}
            aria-pressed={s.wrapPattern === v}
            onClick={() =>
              update({
                wrapPattern: v,
                wrapTheme: s.wrapTheme === 'none' ? 'atelier' : s.wrapTheme,
              })
            }
          >
            {t(v)}
          </button>
        ))}
      </div>
      <div className="variant-buttons">
        {wrapPlacements.map((v) => (
          <button
            key={v}
            aria-pressed={s.wrapPlacement === v}
            onClick={() =>
              update({
                wrapPlacement: v,
                view: v === 'hood' ? 'top' : 'side',
                orbit: false,
              })
            }
          >
            {t(v)}
          </button>
        ))}
      </div>
      {(
        [
          ['wrapScale', 'scale', 40, 160],
          ['wrapOffset', 'offset', -100, 100],
          ['wrapHeight', 'height', -50, 50],
          ['wrapOpacity', 'opacity', 0, 100],
        ] as const
      ).map(([k, label, min, max]) => (
        <label className="wrap-slider" key={k}>
          <span>
            {t(label)} <output>{s[k]}</output>
          </span>
          <input
            aria-label={t(label)}
            type="range"
            min={min}
            max={max}
            value={s[k]}
            onChange={(e) => update({ [k]: Number(e.target.value) })}
          />
        </label>
      ))}
      <button
        className="wrap-reset"
        onClick={() =>
          update({
            wrapScale: wrapDefaults.wrapScale,
            wrapOffset: 0,
            wrapHeight: 0,
            wrapOpacity: 100,
          })
        }
      >
        {t('reset')}
      </button>
      <details>
        <summary>{t('library')}</summary>
        <p className="fineprint">{t('note')}</p>
        <div className="wrap-ip-grid">
          {ipReferences.map((p) => (
            <article key={p.id}>
              <button
                aria-pressed={s.wrapTheme === p.id}
                onClick={() => choose(p.id)}
              >
                <i
                  style={{
                    background: `linear-gradient(135deg, ${p.primary} 0 55%, ${p.secondary} 55%)`,
                  }}
                />
                <strong>{s.locale === 'zh' ? p.zh : p.en}</strong>
                <small>{p.brand}</small>
                <span>{t('palette')}</span>
              </button>
              <a href={p.source} target="_blank" rel="noreferrer">
                {t('reference')}
              </a>
            </article>
          ))}
        </div>
      </details>
    </section>
  );
}
