export const seatPositions = [
  'front-left',
  'front-right',
  'second-left',
  'second-right',
  'third-left',
  'third-right',
] as const;
export type SeatPosition = (typeof seatPositions)[number];
export const roadTypes = [
  'smooth',
  'broken',
  'potholes',
  'cobble',
  'washboard',
  'gravel',
  'mud',
  'ruts',
  'speedbumps',
  'ice',
  'water',
] as const;
export type RoadType = (typeof roadTypes)[number];
export const partTypes = [
  'all',
  'body',
  'closures',
  'door-shell',
  'door-trim',
  'glass',
  'mirrors',
  'seats',
  'cockpit',
  'roof',
  'tires',
  'rims',
  'brakes',
  'lights',
  'trim',
] as const;
export type PartType = (typeof partTypes)[number];
export function seatPosition(id: SeatPosition): [number, number, number] {
  return [
    id.endsWith('left') ? -0.43 : 0.43,
    id.startsWith('third') ? 0.6 : 0.58,
    id.startsWith('front') ? 0.13 : id.startsWith('second') ? 0.98 : 1.95,
  ];
}
export function roadHeight(
  road: RoadType,
  x: number,
  z: number,
  severity: number,
) {
  const a = severity / 100,
    period = (v: number, n: number) => ((v % n) + n) % n;
  switch (road) {
    case 'broken':
      return a * (0.038 * Math.sin(z * 3.8) + 0.019 * Math.sin(x * 8 + z * 8));
    case 'potholes': {
      const d = period(z + 8, 12) - 6;
      return -0.115 * a * Math.exp(-((x - 0.7) ** 2 / 0.3 + (d * d) / 0.6));
    }
    case 'cobble':
      return a * 0.025 * (0.5 + 0.5 * Math.cos(z * 19)) * Math.cos(x * 14) ** 2;
    case 'washboard':
      return a * 0.032 * Math.sin(z * 11);
    case 'gravel':
      return (
        a *
        (0.017 * Math.sin(z * 21 + x * 31) + 0.012 * Math.cos(z * 33 - x * 19))
      );
    case 'mud':
      return (
        -0.045 *
          a *
          (Math.exp(-((x - 0.84) ** 2) / 0.05) +
            Math.exp(-((x + 0.84) ** 2) / 0.05)) +
        0.008 * a * Math.sin(z * 4)
      );
    case 'ruts':
      return (
        a *
        0.085 *
        Math.sin(z * 2.6) *
        (Math.exp(-((x - 0.84) ** 2) / 0.1) -
          Math.exp(-((x + 0.84) ** 2) / 0.1))
      );
    case 'speedbumps': {
      const d = period(z + 5, 10) - 5;
      return 0.095 * a * Math.exp((-d * d) / 0.15);
    }
    case 'water':
      return 0;
    default:
      return 0;
  }
}
export function ridePose(road: RoadType, distance: number, severity: number) {
  const wheels = [
    [-0.84, -1.66],
    [0.84, -1.66],
    [-0.84, 1.54],
    [0.84, 1.54],
  ].map(([x, z]) => roadHeight(road, x, z - distance, severity));
  return {
    wheels,
    heave: wheels.reduce((a, b) => a + b, 0) / 4,
    pitch: Math.atan2((wheels[2] + wheels[3] - wheels[0] - wheels[1]) / 2, 3.2),
    roll: Math.atan2((wheels[1] + wheels[3] - wheels[0] - wheels[2]) / 2, 1.68),
  };
}
export function partCategory(
  path: string,
  materials: string,
  zone?: string,
): PartType {
  if (/luntai/i.test(materials)) return 'tires';
  if (/Caliper|brake_disc|Brake/i.test(path + ' ' + materials)) return 'brakes';
  if (/Rims_|lungu/i.test(path + ' ' + materials)) return 'rims';
  if (/Tire_/i.test(path)) return 'tires';
  if (/Glass/.test(materials)) return 'glass';
  if (/Mirror|Mirro/i.test(path)) return 'mirrors';
  if (/lamp|DLP|DRL|Light_|starlit/i.test(path + ' ' + materials))
    return 'lights';
  if (/Door_/.test(path))
    return /INT|WG/.test(path) && /INT/.test(materials)
      ? 'door-trim'
      : 'door-shell';
  if (/Hood|Trunk|Chargecover/.test(path)) return 'closures';
  if (/fangxiangpan/.test(path)) return 'cockpit';
  if (zone === 'seat' || /seat|Seat/.test(path)) return 'seats';
  if (zone === 'roof' || /ROOF|sunshade/.test(path)) return 'roof';
  if (zone === 'dash' || /screen|fangxiangpan/.test(path)) return 'cockpit';

  if (/Chrome|Molding|Grille/.test(materials) || zone === 'trim') return 'trim';
  return 'body';
}
export function partOffset(
  id: PartType,
  c: { x: number; y: number; z: number },
): [number, number, number] {
  const side = Math.sign(c.x) || 1,
    front = Math.sign(c.z) || 1;
  switch (id) {
    case 'tires':
      return [side * 1.8, 0.1, 0];
    case 'rims':
      return [side * 1.2, 0.1, 0];
    case 'brakes':
      return [side * 0.6, 0.1, 0];
    case 'door-shell':
      return [side * 1.3, 0.1, 0];
    case 'door-trim':
      return [side * 0.65, 0.15, 0];
    case 'glass':
      return [side * 0.2, 1.5, 0];
    case 'roof':
      return [0, 1.8, 0];
    case 'seats':
      return [side * 0.7, 0.85, c.z * 0.3];
    case 'cockpit':
      return [0, 0.75, -0.6];
    case 'lights':
      return [side * 0.25, 0.3, front * 0.9];
    case 'closures':
      return [0, 0.8, front * 0.65];
    case 'mirrors':
      return [side * 1.4, 0.35, 0];
    case 'trim':
      return [side * 0.65, 0.4, front * 0.3];
    default:
      return [0, 0.35, 0];
  }
}
