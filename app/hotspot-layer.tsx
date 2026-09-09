'use client';
import { memo, useImperativeHandle, useState, type Ref } from 'react';
import { Armchair, Lightbulb, Plus } from 'lucide-react';
import { text, type Locale } from './experience';
import { labText } from './lab-state';
import type { Hotspot } from './viewer';
export type HotspotHandle = { update: (value: Hotspot[]) => void };

// Camera coordinates only update this small layer, never the controls/entire page.
export const HotspotLayer = memo(function HotspotLayer({
  ref,
  loaded,
  locale,
  onPick,
}: {
  ref: Ref<HotspotHandle>;
  loaded: boolean;
  locale: Locale;
  onPick: (id: string) => void;
}) {
  const label = (id: string) => {
    const v = text(locale, id);
    return v === id ? labText(locale, id) : v;
  };
  const [points, setPoints] = useState<Hotspot[]>([]);
  useImperativeHandle(
    ref,
    () => ({
      update(value) {
        const visible = value
          .filter((p) => p.visible)
          .map((p) => ({ ...p, x: Math.round(p.x), y: Math.round(p.y) }));
        setPoints((old) =>
          old.length === visible.length &&
          old.every(
            (p, i) =>
              p.id === visible[i].id &&
              p.x === visible[i].x &&
              p.y === visible[i].y,
          )
            ? old
            : visible,
        );
      },
    }),
    [],
  );
  return (
    <div className="hotspot-layer">
      {loaded &&
        points.map((h) => (
          <button
            key={h.id}
            className="hotspot"
            style={{
              left: 0,
              top: 0,
              transform: `translate3d(${h.x}px, ${h.y}px, 0) translate(-50%, -50%)`,
            }}
            onPointerDown={(event) => {
              // Keep release/click on this button while its door anchor moves.
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onClick={() => onPick(h.id)}
            aria-label={label(h.id)}
          >
            <span>
              {h.id === 'driver' ? (
                <Armchair size={15} />
              ) : h.id === 'lights' ? (
                <Lightbulb size={15} />
              ) : (
                <Plus size={15} />
              )}
            </span>
            <b>{label(h.id)}</b>
          </button>
        ))}
    </div>
  );
});
