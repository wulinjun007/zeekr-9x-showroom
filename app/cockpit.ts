import * as T from 'three';
import type { Settings } from './experience';
import { scenarioFrame } from './scenarios';

/** Original 512-square screen atlas: two instrument strips, central and passenger panels. */
export const screenRegions = {
  instrument: [0, 30, 512, 150],
  cluster: [0, 198, 512, 132],
  central: [14, 348, 240, 154],
  passenger: [258, 348, 246, 154],
} as const;
export function createCockpitScreens(original: T.Texture) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 3072;
  const c = canvas.getContext('2d')!;
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.flipY = original.flipY;
  texture.channel = original.channel;
  texture.wrapS = original.wrapS;
  texture.wrapT = original.wrapT;
  texture.matrixAutoUpdate = false;
  texture.matrix.copy(original.matrix);
  texture.anisotropy = 8;
  let stamp = '';
  function panel(
    region: readonly number[],
    draw: (w: number, h: number) => void,
  ) {
    c.save();
    c.scale(6, 6);
    c.beginPath();
    c.rect(...(region as [number, number, number, number]));
    c.clip();
    c.translate(region[0], region[1]);
    draw(region[2], region[3]);
    c.restore();
  }
  function label(
    value: string,
    x: number,
    y: number,
    size = 9,
    color = '#f3ebdf',
  ) {
    c.fillStyle = color;
    c.font = `${size}px sans-serif`;
    c.fillText(value, x, y);
  }
  function rounded(x: number, y: number, w: number, h: number, fill: string) {
    c.fillStyle = fill;
    c.beginPath();
    c.roundRect(x, y, w, h, 5);
    c.fill();
  }
  function map(w: number, h: number, p: number, park = false) {
    c.fillStyle = '#182126';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#374b4f';
    c.lineWidth = 8;
    for (let i = -1; i < 5; i++) {
      c.beginPath();
      c.moveTo(i * 65 - 30, 0);
      c.lineTo(i * 65 + 40, h);
      c.stroke();
    }
    c.lineWidth = 5;
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(0, i * 44 + ((p * 20) % 44));
      c.lineTo(w, i * 44 + ((p * 20) % 44) - 25);
      c.stroke();
    }
    c.strokeStyle = park ? '#e6be79' : '#75b9dc';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(w * 0.5, h);
    c.lineTo(w * 0.5, h * 0.55);
    c.quadraticCurveTo(w * 0.5, h * 0.38, w * 0.7, h * 0.35);
    c.lineTo(w * 0.82, h * 0.25);
    c.stroke();
    rounded(w * 0.5 - 7, h * 0.62, 14, 25, '#e3e6e1');
    c.fillStyle = '#668697';
    c.fillRect(w * 0.5 - 5, h * 0.62 + 4, 10, 8);
    if (park) {
      c.strokeStyle = '#82cfb2';
      c.lineWidth = 1.5;
      c.strokeRect(w * 0.7, h * 0.42, 22, 40);
      label('P', w * 0.7 + 6, h * 0.42 + 25, 14);
    }
  }
  function draw(s: Settings, p: number) {
    const f = scenarioFrame(s.hmi, p),
      demo = s.section === 'safety',
      fx = f.scenario.effect,
      app = demo
        ? [
            'route',
            'perception',
            'brake',
            'sensor',
            'takeover',
            'dms',
            'blindspot',
          ].includes(fx)
          ? 'navigation'
          : fx === 'park'
            ? 'parking'
            : fx === 'charge'
              ? 'energy'
              : ['music', 'rear', 'cinema', 'child'].includes(fx)
                ? 'media'
                : fx === 'climate' || fx === 'camp'
                  ? 'comfort'
                  : 'home'
        : s.cabinApp;
    const key = [
      app,
      demo ? s.hmi : 'cabin',
      Math.floor(p * 32),
      s.temperature,
      s.fan,
      s.volume,
      s.locale,
      s.climate,
      s.weather,
      s.seatStyle,
    ].join('/');
    if (key === stamp) return;
    stamp = key;
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.drawImage(
      original.image as CanvasImageSource,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    for (const region of [screenRegions.instrument, screenRegions.cluster])
      panel(region, (w, h) => {
        c.fillStyle = '#111b22';
        c.fillRect(0, 0, w, h);
        const grad = c.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#102f3b');
        grad.addColorStop(1, '#392b25');
        c.fillStyle = grad;
        c.fillRect(0, 0, w, h);
        label('9X / DESIGN STUDY', 18, 22, 9, '#94aaa9');
        label(demo ? String(f.speed) : '0', 35, h * 0.72, 55);
        label('km/h', 41, h * 0.88, 10);
        label(
          demo && f.speed ? (s.hmi === 'auto-parking' ? 'R' : 'D') : 'P',
          130,
          h * 0.62,
          24,
        );
        label(
          f.fault
            ? 'ASSIST UNAVAILABLE'
            : demo && f.alert
              ? 'ATTENTION'
              : 'DRIVER CONTROL',
          215,
          29,
          12,
          f.alert ? '#f2b477' : '#a9dbcd',
        );
        label(
          `SOC ${fx === 'charge' ? Math.round(35 + p * 43) : 78}%`,
          w - 90,
          h - 18,
          11,
        );
        c.strokeStyle = f.alert ? '#e9ab67' : '#7dc0b2';
        c.lineWidth = 2;
        for (const x of [235, 330]) {
          c.beginPath();
          c.moveTo(x, h - 10);
          c.lineTo(280 + (x - 280) * 0.35, 45);
          c.stroke();
        }
        if (!f.fault) rounded(275, 65, 15, 28, '#aecbc9');
        if (f.countdown !== null)
          label(`${f.countdown}s  TOI / DEMO`, 355, 65, 15, '#edb676');
      });
    panel(screenRegions.central, (w, h) => {
      c.fillStyle = '#161c23';
      c.fillRect(0, 0, w, h);
      if (app === 'navigation' || app === 'parking')
        map(w, h - 23, p, app === 'parking');
      else {
        const gradient = c.createLinearGradient(0, 0, w, h);
        gradient.addColorStop(0, '#685246');
        gradient.addColorStop(1, '#182a33');
        c.fillStyle = gradient;
        c.fillRect(0, 0, w, h);
        label('9X   /   PRIVATE LOUNGE', 10, 17, 8);
        if (app === 'comfort') {
          label(`${s.temperature}°`, 18, 65, 32);
          label(`FAN ${s.fan}   ·   ${s.climate.toUpperCase()}`, 15, 85, 9);
          for (let i = 0; i < 6; i++)
            rounded(
              135 + (i % 2) * 38,
              32 + Math.floor(i / 2) * 29,
              27,
              23,
              s.climate === 'heat' ? '#ad7652' : '#3e626a',
            );
          label('6 ZONE / CONCEPT', 120, 127, 7);
        } else if (app === 'energy') {
          label(`${Math.round(demo ? 35 + p * 43 : 78)}%`, 15, 65, 34);
          label(demo ? 'CHARGING / DEMO' : 'ENERGY OVERVIEW', 15, 86, 8);
          c.strokeStyle = '#99cbb0';
          c.lineWidth = 3;
          for (let i = 0; i < 3; i++) {
            c.beginPath();
            c.moveTo(125, 45 + i * 20);
            c.lineTo(205, 45 + i * 20);
            c.stroke();
          }
          rounded(125 + ((p * 70) % 70), 40, 8, 10, '#e8ddac');
        } else if (app === 'media') {
          rounded(14, 31, 68, 68, '#273d45');
          for (let i = 0; i < 14; i++) {
            c.fillStyle = '#c5ac87';
            c.fillRect(19 + i * 4, 65 - Math.sin(i * 0.8 + p * 6) * 14, 2, 25);
          }
          label('QUIET HORIZONS', 94, 54, 10);
          label('SOUND FIELD / DEMO', 94, 73, 7);
          label(`VOLUME ${s.volume}`, 94, 95, 9);
        } else {
          label('09:41', 15, 53, 28);
          label(
            s.locale === 'zh' ? '欢迎进入私享座舱' : 'WELCOME ABOARD',
            15,
            72,
            9,
          );
          for (let i = 0; i < 3; i++) {
            rounded(12 + i * 74, 85, 68, 43, '#101f2bb8');
            label(
              ['22° / COMFORT', '78% / ENERGY', 'MEDIA / DEMO'][i],
              17 + i * 74,
              110,
              7,
            );
          }
        }
      }
      rounded(5, h - 24, w - 10, 20, '#0d151de8');
      label(`${s.temperature}°  ‹    ${s.fan ? 'AUTO' : 'OFF'}`, 12, h - 10, 8);
      label('⌂    ◇    ♪    ⚙', 94, h - 9, 11);
      label(`${s.temperature}°`, w - 32, h - 10, 8);
      label(app.toUpperCase() + ' / CONCEPT', 10, 11, 7);
    });
    panel(screenRegions.passenger, (w, h) => {
      const g = c.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#76604f');
      g.addColorStop(1, '#142d39');
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
      label('PASSENGER / PRIVATE SPACE', 12, 20, 9);
      label(fx === 'child' ? 'FAMILY STORIES' : 'A MOMENT OF CALM', 13, 56, 15);
      label(
        fx === 'child'
          ? 'CONTENT LIMITS · DEMO'
          : 'INDEPENDENT DISPLAY / CONCEPT',
        13,
        74,
        7,
      );
      for (let i = 0; i < 3; i++) {
        rounded(12 + i * 76, 98, 69, 39, '#12232e99');
        label(['MUSIC', 'CINEMA', 'COMFORT'][i], 20 + i * 76, 121, 8);
      }
      label('22°C', w - 42, 20, 8);
    });
    texture.needsUpdate = true;
  }
  return {
    texture,
    draw,
    dispose() {
      texture.dispose();
    },
  };
}
