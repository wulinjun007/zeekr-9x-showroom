import * as T from 'three';
import type { Settings } from './experience';
import { passengerList } from './cabin-access';
import { seatPositions, type SeatPosition } from './study-state';
/** Hip landmarks calibrated against source GLB seat cushion ray samples, in metres. */
export function robotHip(seat: SeatPosition, offset = 0) {
  return new T.Vector3(
    (seat.endsWith('left') ? -1 : 1) * (seat.startsWith('third') ? 0.31 : 0.43),
    seat.startsWith('second') ? 0.94 : 0.91,
    (seat.startsWith('front')
      ? -0.23
      : seat.startsWith('second')
        ? 0.67
        : 1.55) +
      T.MathUtils.clamp(offset, -3, 3) / 100,
  );
}
export function createRobotPassengers(parent: T.Group) {
  const root = new T.Group();
  root.name = 'Independent_white_robot_passengers';
  parent.add(root);
  const white = new T.MeshStandardMaterial({
    color: '#eaedef',
    roughness: 0.8,
    metalness: 0,
  });
  const jointMat = new T.MeshStandardMaterial({
    color: '#8b969b',
    roughness: 0.8,
    metalness: 0,
  });
  const beltMat = new T.MeshStandardMaterial({
    color: '#535e65',
    roughness: 0.95,
  });
  const robots = new Map<SeatPosition, T.Group>();
  let key = '';
  function sphere(g: T.Group, p: T.Vector3, r: number, mat = white) {
    const m = new T.Mesh(new T.SphereGeometry(r, 12, 8), mat);
    m.position.copy(p);
    g.add(m);
    return m;
  }
  function limb(
    g: T.Group,
    a: T.Vector3,
    b: T.Vector3,
    r: number,
    mat = white,
  ) {
    const m = new T.Mesh(
      new T.CapsuleGeometry(r, Math.max(0.001, a.distanceTo(b) - 2 * r), 3, 8),
      mat,
    );
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      b.clone().sub(a).normalize(),
    );
    g.add(m);
  }
  function update(s: Settings, inside: boolean) {
    const list = passengerList(s);
    root.visible = list.length > 0 && s.section !== 'structure';
    const next = JSON.stringify([list, s.seatbelt]);
    if (next !== key) {
      key = next;
      root.traverse((o) => {
        if ((o as T.Mesh).isMesh) (o as T.Mesh).geometry.dispose();
      });
      root.clear();
      robots.clear();
      for (const person of list) {
        const g = new T.Group();
        g.name = 'robot_' + person.seat;
        g.userData = { ...person, independent: true };
        root.add(g);
        robots.set(person.seat, g);
        const hip = robotHip(person.seat, person.offset),
          k = person.height / 170;
        g.position.copy(hip);
        const v = (x: number, y: number, z: number) =>
          new T.Vector3(x * k, y * k, z * k);
        limb(g, v(0, 0, 0), v(0, 0.32, 0.025), 0.115 * k);
        sphere(g, v(0, 0.39, 0.018), 0.045 * k, jointMat);
        const head = sphere(g, v(0, 0.51, 0.015), 0.084 * k);
        head.scale.set(1, 1.18, 0.94);
        const visor = new T.Mesh(
          new T.BoxGeometry(0.107 * k, 0.018 * k, 0.01),
          jointMat,
        );
        visor.position.copy(v(0, 0.53, -0.065));
        g.add(visor);
        for (const side of [-1, 1]) {
          const third = person.seat.startsWith('third'),
            floor = third ? 0.665 : 0.57;
          const knee = new T.Vector3(
              side * 0.1 * k,
              -0.015 * k,
              third
                ? -0.36
                : person.seat.startsWith('second')
                  ? 0.33 - hip.z
                  : -Math.max(0.4, 0.34 * k),
            ),
            ankle = new T.Vector3(
              side * 0.1 * k,
              floor - hip.y,
              third
                ? 1.125 - hip.z
                : person.seat.startsWith('second')
                  ? 0.29 - hip.z
                  : -Math.max(0.5, 0.43 * k),
            );
          limb(g, v(side * 0.1, 0, 0), knee, 0.061 * k);
          sphere(g, knee, 0.042 * k, jointMat);
          limb(g, knee, ankle, 0.028 * k);
          const foot = new T.Mesh(
            new T.BoxGeometry(0.082 * k, 0.045, 0.17 * k),
            white,
          );
          foot.position.set(ankle.x, floor - 0.025 - hip.y, ankle.z - 0.025);
          g.add(foot);
          const shoulder = v(side * 0.145, 0.3, 0.018),
            elbow = v(side * 0.15, 0.16, -0.08),
            wrist = v(side * 0.1, 0.14, -0.15);
          sphere(g, shoulder, 0.05 * k, jointMat);
          limb(g, shoulder, elbow, 0.035 * k);
          sphere(g, elbow, 0.032 * k, jointMat);
          limb(g, elbow, wrist, 0.03 * k);
          sphere(g, wrist, 0.035 * k);
        }
        if (s.seatbelt) {
          const side = person.seat.endsWith('left') ? -1 : 1;
          const curve = new T.CatmullRomCurve3([
            v(side * 0.14, 0.32, -0.09),
            v(0.02, 0.16, -0.123),
            v(-side * 0.13, 0.015, -0.09),
          ]);
          const belt = new T.Mesh(
            new T.TubeGeometry(curve, 12, 0.01, 4, false),
            beltMat,
          );
          belt.name = 'robot_seatbelt';
          g.add(belt);
        }
      }
    }
    // Hide only the robot occupying the active first-person camera, never draw through walls.
    const cameraSeat =
      s.view === 'driver'
        ? 'front-left'
        : s.view === 'passenger'
          ? 'front-right'
          : seatPositions.includes(s.view as SeatPosition)
            ? s.view
            : null;
    for (const [seat, g] of robots)
      g.visible = !(inside && seat === cameraSeat);
  }
  return { root, update };
}
