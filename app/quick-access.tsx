'use client';
import { useState } from 'react';
import {
  Lightbulb,
  DoorOpen,
  ArrowUpFromLine,
  PanelTopOpen,
  Users,
  Move,
  ScanEye,
  X,
} from 'lucide-react';
import { text, type Settings, type View } from './experience';
import { accessText, windowKeys, seatViews } from './cabin-access';
import { seatPositions } from './study-state';
import { PassengerControls } from './passenger-controls';
export function QuickAccess({
  s,
  update,
}: {
  s: Settings;
  update: (p: Partial<Settings>) => void;
}) {
  const [panel, setPanel] = useState<'windows' | 'people' | 'view' | null>(
      null,
    ),
    t = (k: string) => accessText(s.locale, k),
    tr = (k: string) => text(s.locale, k);
  const toggle = (id: string, view: View) =>
    update({
      doors: s.doors.includes(id)
        ? s.doors.filter((x) => x !== id)
        : [...s.doors, id],
      view,
      orbit: false,
    });
  const items = [
    {
      id: 'lights',
      label: tr('lights'),
      icon: Lightbulb,
      pressed: s.lights,
      click: () =>
        update({ lights: !s.lights, view: 'light-detail', orbit: false }),
    },
    {
      id: 'Hood',
      label: tr('Hood'),
      icon: ArrowUpFromLine,
      pressed: s.doors.includes('Hood'),
      click: () => toggle('Hood', 'front'),
    },
    {
      id: 'Trunk_up',
      label: tr('Trunk_up'),
      icon: PanelTopOpen,
      pressed: s.doors.includes('Trunk_up'),
      click: () => toggle('Trunk_up', 'rear'),
    },
    {
      id: 'doors',
      label: tr(s.doors.length ? 'closeAll' : 'openAll'),
      icon: DoorOpen,
      pressed: s.doors.length > 0,
      click: () =>
        update({
          doors: s.doors.length
            ? []
            : ['Door_LF', 'Door_RF', 'Door_LB', 'Door_RB'],
          view: 'hero',
          orbit: false,
        }),
    },
  ];
  return (
    <div className="exterior-access">
      <div className="quick-access" role="toolbar" aria-label={t('quick')}>
        {items.map((v) => (
          <button
            key={v.id}
            title={v.label}
            aria-label={v.label}
            aria-pressed={v.pressed}
            onClick={v.click}
          >
            <v.icon size={17} />
            <span>{v.label}</span>
          </button>
        ))}
        {(['windows', 'people', 'view'] as const).map((id) => {
          const Icon =
            id === 'people' ? Users : id === 'view' ? ScanEye : PanelTopOpen;
          return (
            <button
              key={id}
              title={t(id)}
              aria-label={t(id)}
              aria-expanded={panel === id}
              onClick={() => setPanel(panel === id ? null : id)}
            >
              <Icon size={17} />
              <span>{t(id)}</span>
            </button>
          );
        })}
        <button
          title={t('pan')}
          aria-label={t('pan')}
          aria-pressed={s.panView}
          onClick={() => update({ panView: !s.panView, orbit: false })}
        >
          <Move size={17} />
          <span>{t('pan')}</span>
        </button>
      </div>
      {panel && (
        <section className="access-panel" aria-label={t(panel)}>
          <header>
            <strong>{t(panel)}</strong>
            <button
              aria-label={
                s.locale === 'zh' ? '关闭便捷面板' : 'Close quick panel'
              }
              onClick={() => setPanel(null)}
            >
              <X size={17} />
            </button>
          </header>
          {panel === 'people' ? (
            <PassengerControls s={s} update={update} />
          ) : panel === 'windows' ? (
            <>
              <div className="access-actions">
                {[0, 50, 100].map((n) => (
                  <button
                    key={n}
                    onClick={() =>
                      update({
                        windowLF: n,
                        windowRF: n,
                        windowLB: n,
                        windowRB: n,
                      })
                    }
                  >
                    {t('all')} {n}%
                  </button>
                ))}
              </div>
              {windowKeys.map((key, i) => (
                <label className="access-range" key={key}>
                  {t(seatPositions[i])}
                  <output>{s[key]}%</output>
                  <input
                    type="range"
                    aria-label={t(seatPositions[i]) + ' ' + t('windows')}
                    min="0"
                    max="100"
                    value={s[key]}
                    onChange={(e) => update({ [key]: Number(e.target.value) })}
                  />
                </label>
              ))}
            </>
          ) : (
            <div className="access-view-grid">
              {(
                [
                  'hero',
                  'front',
                  'side',
                  'rear',
                  'light-detail',
                  'wheel-detail',
                  'underbody',
                ] as View[]
              ).map((view) => (
                <button
                  key={view}
                  onClick={() => {
                    update({ view, orbit: false, panView: false });
                    setPanel(null);
                  }}
                >
                  {tr(view)}
                </button>
              ))}
              {seatPositions.map((seat) => (
                <button
                  key={seat}
                  onClick={() => {
                    update({
                      view: seatViews[seat],
                      section: 'interior',
                      seatPosition: seat,
                      orbit: false,
                      panView: false,
                    });
                    setPanel(null);
                  }}
                >
                  {t(seat)}
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
