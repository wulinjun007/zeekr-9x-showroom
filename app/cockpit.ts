import * as T from 'three';
import type { Settings } from './experience';
import { scenarioFrame } from './scenarios';
import { drawDrivingDisplay } from './driving-display';

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
  function draw(s: Settings, p: number, roadTravel = 0) {
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
    const moving = s.roadEnabled && s.roadPlaying;
    const speed = demo ? f.speed : moving ? s.roadSpeed : 0;
    const alert = demo && f.alert;
    const fault = demo && f.fault;
    const phase = demo
      ? Math.floor(p * 64) / 64
      : moving
        ? Math.floor(roadTravel * 2) / 16
        : 0;
    const zh = s.locale === 'zh';
    const key = [
      app,
      demo ? s.hmi : 'cabin',
      phase,
      speed,
      demo ? f.phase : 0,
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
        c.save();
        c.translate(178, 8);
        drawDrivingDisplay(c, 215, h - 14, { phase, alert, fault });
        c.restore();
        label(
          zh ? '行驶视图 · 模拟' : 'DRIVING · SIMULATION',
          20,
          22,
          10,
          '#a6bacb',
        );
        label(String(speed), 25, h * 0.72, 57, '#f0f6fa');
        label('km/h', 29, h - 12, 11, '#93a5b5');
        label(
          speed ? (s.hmi === 'auto-parking' && demo ? 'R' : 'D') : 'P',
          126,
          h * 0.65,
          25,
        );
        label(
          `${demo && fx === 'charge' ? Math.round(35 + p * 43) : 78}%`,
          422,
          h - 18,
          18,
          '#bae4d7',
        );
        label(zh ? '电量' : 'BATTERY', 422, h - 42, 9, '#9bb0bd');
        if (alert || fault) {
          rounded(202, 8, 190, 25, '#492c21');
          label(
            fault
              ? zh
                ? '感知受限 · 请自主驾驶'
                : 'ASSIST UNAVAILABLE'
              : f.countdown !== null
                ? `${zh ? '请接管' : 'TAKE OVER'}  ${f.countdown}s`
                : zh
                  ? '注意前方风险'
                  : 'HAZARD AHEAD',
            212,
            25,
            11,
            '#ffbe85',
          );
        }
      });
    panel(screenRegions.central, (w, h) => {
      c.fillStyle = '#161c23';
      c.fillRect(0, 0, w, h);
      if (app === 'navigation' || app === 'parking') {
        drawDrivingDisplay(c, w, h - 23, {
          phase,
          alert,
          fault,
          parking: app === 'parking',
        });
        rounded(7, 23, 76, 98, '#111d2be8');
        label(String(speed), 14, 62, 32, '#f3f8fc');
        label(
          `km/h   ${speed ? (app === 'parking' ? 'R' : 'D') : 'P'}`,
          15,
          76,
          8,
          '#a2b5c5',
        );
        label(
          app === 'parking'
            ? zh
              ? '泊车辅助'
              : 'PARKING'
            : zh
              ? '车道引导'
              : 'LANE VIEW',
          15,
          95,
          9,
          '#87d8ef',
        );
        label(
          demo
            ? zh
              ? '场景演示'
              : 'SIMULATION'
            : moving
              ? zh
                ? '行驶模拟'
                : 'DRIVE PREVIEW'
              : zh
                ? '驻车预览'
                : 'PARKED PREVIEW',
          15,
          110,
          7,
          '#a5b7c8',
        );
        rounded(91, 7, 140, 20, alert || fault ? '#533526' : '#172636e8');
        label(
          fault
            ? zh
              ? '感知受限 · 请自主驾驶'
              : 'ASSIST UNAVAILABLE'
            : alert
              ? f.countdown !== null
                ? `${zh ? '请接管' : 'TAKE OVER'} · ${f.countdown}s`
                : zh
                  ? '注意前方风险'
                  : 'HAZARD AHEAD'
              : zh
                ? '↑  保持车道 · 关注路况'
                : '↑  LANE GUIDANCE',
          98,
          20,
          8,
          alert || fault ? '#ffbf8a' : '#d6eaf3',
        );
      } else {
        const gradient = c.createLinearGradient(0, 0, w, h);
        gradient.addColorStop(0, '#685246');
        gradient.addColorStop(1, '#182a33');
        c.fillStyle = gradient;
        c.fillRect(0, 0, w, h);
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
      label(
        app === 'navigation' || app === 'parking'
          ? '9X  /  DRIVE'
          : app.toUpperCase() + ' / CONCEPT',
        10,
        13,
        7,
      );
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
