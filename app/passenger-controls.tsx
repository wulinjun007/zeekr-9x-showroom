'use client';
import { useState } from 'react';
import type { Settings } from './experience';
import { seatPositions, type SeatPosition } from './study-state';
import {
  accessText,
  passengerList,
  newPassenger,
  seatViews,
} from './cabin-access';
export function PassengerControls({
  s,
  update,
}: {
  s: Settings;
  update: (p: Partial<Settings>) => void;
}) {
  const [active, setActive] = useState<SeatPosition>(s.seatPosition);
  const people = passengerList(s),
    person = people.find((p) => p.seat === active),
    t = (key: string) => accessText(s.locale, key);
  const save = (list: typeof people) =>
    update({ passengers: list, occupant: list.length > 0 });
  const edit = (patch: Partial<NonNullable<typeof person>>) => {
    save(people.map((p) => (p.seat === active ? { ...p, ...patch } : p)));
    if (patch.height !== undefined) update({ height: patch.height });
  };
  return (
    <div className="passenger-controls">
      <label>
        {t('count')}
        <select
          aria-label={t('count')}
          value={people.length}
          onChange={(e) => {
            const n = Number(e.target.value),
              next = people.slice(0, n);
            for (const seat of seatPositions)
              if (next.length < n && !next.some((p) => p.seat === seat))
                next.push(newPassenger(seat));
            save(next);
          }}
        >
          {[0, 1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <div className="passenger-seat-map">
        {seatPositions.map((seat) => (
          <button
            key={seat}
            aria-pressed={active === seat}
            onClick={() => {
              setActive(seat);
              update({
                seatPosition: seat,
                height: people.find((p) => p.seat === seat)?.height ?? s.height,
              });
            }}
          >
            <span>{t(seat)}</span>
            <small>
              {people.find((p) => p.seat === seat)?.name ||
                (people.some((p) => p.seat === seat) ? '●' : '—')}
            </small>
          </button>
        ))}
      </div>
      {person ? (
        <>
          <label>
            {t('moveSeat')}
            <select
              aria-label={t('moveSeat')}
              value={active}
              onChange={(e) => {
                const target = e.target.value as SeatPosition;
                save(
                  people.map((p) =>
                    p.seat === active
                      ? { ...p, seat: target }
                      : p.seat === target
                        ? { ...p, seat: active }
                        : p,
                  ),
                );
                setActive(target);
                update({ seatPosition: target });
              }}
            >
              {seatPositions.map((seat) => (
                <option key={seat} value={seat}>
                  {t(seat)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('name')}
            <input
              aria-label={t('name')}
              maxLength={24}
              value={person.name}
              placeholder={t(active)}
              onChange={(e) => edit({ name: e.target.value })}
            />
          </label>
          <label>
            {t('height')}
            <output>{person.height}</output>
            <input
              aria-label={t('height')}
              type="range"
              min="150"
              max="195"
              value={person.height}
              onChange={(e) => edit({ height: Number(e.target.value) })}
            />
          </label>
          <label>
            {t('offset')}
            <output>{person.offset}</output>
            <input
              aria-label={t('offset')}
              type="range"
              min="-3"
              max="3"
              value={person.offset}
              onChange={(e) => edit({ offset: Number(e.target.value) })}
            />
          </label>
          <button
            className="access-action"
            onClick={() => save(people.filter((p) => p.seat !== active))}
          >
            {t('remove')}
          </button>
        </>
      ) : (
        <button
          className="access-action"
          onClick={() => save([...people, newPassenger(active)])}
        >
          {t('add')}
        </button>
      )}
      <div className="access-actions">
        <button
          onClick={() =>
            update({
              view: seatViews[active],
              section: 'interior',
              seatPosition: active,
              height: person?.height ?? s.height,
              orbit: false,
              panView: false,
            })
          }
        >
          {t('preview')}
        </button>
        <button
          aria-pressed={s.transparent}
          onClick={() =>
            update({
              transparent: !s.transparent,
              view: 'side',
              section: 'exterior',
              orbit: false,
            })
          }
        >
          {t('cutaway')}
        </button>
      </div>
      <label>
        <span>{s.locale === 'zh' ? '系好安全带' : 'Seatbelts'}</span>
        <input
          type="checkbox"
          checked={s.seatbelt}
          onChange={(e) => update({ seatbelt: e.target.checked })}
        />
      </label>
      <p>{t('note')}</p>
    </div>
  );
}
