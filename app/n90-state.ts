export type N90View =
  | 'hero'
  | 'front'
  | 'side'
  | 'rear'
  | 'driver'
  | 'rear-seat'
  | 'top';
export type N90State = {
  mode: 'day' | 'night';
  paint: string;
  interior: 'mocha' | 'sand';
  section: 'body' | 'wheels' | 'interior' | 'space' | 'parts';
  view: N90View;
  lights: boolean;
  orbit: boolean;
  doors: string[];
  roof: boolean;
  lounge: boolean;
  explode: number;
  wheel: 'silver' | 'black';
};
export const n90Default: N90State = {
  mode: 'night',
  paint: '#397281',
  interior: 'mocha',
  section: 'body',
  view: 'hero',
  lights: true,
  orbit: true,
  doors: [],
  roof: false,
  lounge: false,
  explode: 0,
  wheel: 'silver',
};
export const n90Paints = [
  { name: '远山青', color: '#397281' },
  { name: '蝴蝶谷蓝', color: '#236fa5' },
  { name: '火山灰', color: '#555b60' },
  { name: '冷卡其', color: '#aaa68f' },
];
export const n90Doors = [
  { id: 'Door_LF', name: '左前门' },
  { id: 'Door_RF', name: '右前门' },
  { id: 'Door_LB', name: '左后门' },
  { id: 'Door_RB', name: '右后门' },
  { id: 'Tailgate', name: '尾门' },
];
export function readN90(search: string): N90State {
  const p = new URLSearchParams(search);
  const s = { ...n90Default, doors: [] as string[] };
  if (p.get('mode') === 'day' && p.get('configuration') === '1') s.mode = 'day';
  if (n90Paints.some((x) => x.color === p.get('color')))
    s.paint = p.get('color')!;
  if (p.get('interior') === 'sand') s.interior = 'sand';
  const views: N90View[] = [
    'hero',
    'front',
    'side',
    'rear',
    'driver',
    'rear-seat',
    'top',
  ];
  if (views.includes(p.get('view') as N90View))
    s.view = p.get('view') as N90View;
  if (['driver', 'rear-seat'].includes(s.view)) s.section = 'interior';
  s.orbit = p.get('orbit') !== 'false';
  s.roof = p.get('roof') === 'true';
  s.lounge = p.get('lounge') === 'true';
  s.lights = p.get('lights') !== 'false';
  s.wheel = p.get('wheel') === 'black' ? 'black' : 'silver';
  s.doors = (p.get('doors') || '')
    .split(',')
    .filter((id) => n90Doors.some((d) => d.id === id));
  const amount = Number(p.get('explode') || 0);
  s.explode = Number.isFinite(amount) ? Math.min(100, Math.max(0, amount)) : 0;
  const section = p.get('section');
  if (['body', 'wheels', 'interior', 'space', 'parts'].includes(section || ''))
    s.section = section as N90State['section'];
  return s;
}
export function n90Link(s: N90State): string {
  const u = new URL(window.location.href);
  u.search = '';
  for (const [k, v] of Object.entries({
    vehicle: 'n90',
    configuration: '1',
    mode: s.mode,
    color: s.paint,
    interior: s.interior,
    view: s.view,
    roof: String(s.roof),
    lounge: String(s.lounge),
    orbit: String(s.orbit),
    lights: String(s.lights),
    wheel: s.wheel,
    doors: s.doors.join(','),
    explode: String(s.explode),
    section: s.section,
  }))
    u.searchParams.set(k, v);
  return u.toString();
}
