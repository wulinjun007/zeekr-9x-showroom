/** Resolution-independent artwork for the physical cockpit screen atlas. */
export function drawDrivingDisplay(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: { phase: number; alert: boolean; fault: boolean; parking?: boolean },
) {
  c.save();
  c.scale(w / 240, h / 130);
  const polygon = (points: number[][], color: string | CanvasGradient) => {
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fillStyle = color;
    c.fill();
  };
  const line = (points: number[][], color: string, width: number) => {
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke();
  };
  const g = c.createLinearGradient(0, 0, 0, 130);
  g.addColorStop(0, '#111b27');
  g.addColorStop(0.45, '#253544');
  g.addColorStop(1, '#101923');
  c.fillStyle = g;
  c.fillRect(0, 0, 240, 130);
  const horizon = 29,
    center = 151;
  // Converging road geometry gives traffic a readable depth hierarchy.
  const project = (lane: number, z: number) => [
    center + lane * (3 + z * 34),
    horizon + z * z * 112,
  ];
  polygon(
    [project(-2.1, 0), project(2.1, 0), project(2.1, 1), project(-2.1, 1)],
    '#2c3946',
  );
  for (const edge of [-1.65, 1.65])
    line([project(edge, 0), project(edge, 1)], '#71808b', 0.65);
  const accent = state.alert ? '#ffac65' : '#68cfee';
  if (!state.fault) {
    polygon(
      [
        project(-0.33, 0.1),
        project(0.33, 0.1),
        project(0.48, 1),
        project(-0.48, 1),
      ],
      state.alert ? '#8d583643' : '#3688b448',
    );
    for (const edge of [-0.5, 0.5])
      line([project(edge, 0.06), project(edge, 1)], accent, 0.9);
    for (let i = 0; i < 3; i++) {
      const z = 0.25 + i * 0.16;
      line(
        [project(-0.14, z + 0.045), project(0, z), project(0.14, z + 0.045)],
        '#92ddf2',
        0.9,
      );
    }
  }
  for (const edge of [-1.5, -0.5, 0.5, 1.5]) {
    for (let i = 0; i < 9; i++) {
      const z = (i / 9 + state.phase * 0.32) % 1;
      line(
        [project(edge, z), project(edge, Math.min(1, z + 0.04))],
        '#bbc6cd',
        0.65,
      );
    }
  }
  function car(x: number, y: number, size: number, ego = false) {
    c.save();
    c.translate(x, y);
    c.scale(size, size);
    c.fillStyle = '#00000050';
    c.beginPath();
    c.ellipse(0, 2, 18, 5, 0, 0, Math.PI * 2);
    c.fill();
    // Tires, body shoulders, panoramic glass, lamps and bright metal trim.
    polygon(
      [
        [-16, -8],
        [-12, -8],
        [-12, 2],
        [-16, 2],
      ],
      '#070b10',
    );
    polygon(
      [
        [12, -8],
        [16, -8],
        [16, 2],
        [12, 2],
      ],
      '#070b10',
    );
    const body = c.createLinearGradient(-16, -30, 18, 0);
    body.addColorStop(0, ego ? '#eef1ee' : '#96a9ba');
    body.addColorStop(0.5, ego ? '#b8c5cb' : '#637b8e');
    body.addColorStop(1, ego ? '#71899b' : '#3e5166');
    polygon(
      [
        [-16, 0],
        [-17, -15],
        [-12, -31],
        [10, -32],
        [16, -19],
        [17, 0],
      ],
      body,
    );
    polygon(
      [
        [-12, -29],
        [9, -30],
        [12, -20],
        [-14, -19],
      ],
      '#273e51',
    );
    polygon(
      [
        [-11, -28],
        [8, -29],
        [9, -27],
        [-12, -25],
      ],
      '#668291',
    );
    line(
      [
        [-15, -16],
        [15, -17],
      ],
      '#f0f5f4',
      0.6,
    );
    line(
      [
        [-15, -13],
        [-10, -12],
        [10, -12],
        [15, -14],
      ],
      ego ? '#ff565b' : '#ed8b83',
      1.2,
    );
    polygon(
      [
        [-12, -4],
        [12, -4],
        [10, 0],
        [-10, 0],
      ],
      '#233644',
    );
    polygon(
      [
        [-5, -8],
        [5, -8],
        [5, -5],
        [-5, -5],
      ],
      '#d7e0df',
    );
    c.fillStyle = '#d9e4e6';
    c.fillRect(-19, -20, 4, 2);
    c.fillRect(15, -20, 4, 2);
    if (ego) {
      c.fillStyle = '#e4eeee';
      c.font = '2.6px sans-serif';
      c.fillText('Z E E K R', -7, -14);
    }
    c.restore();
  }
  if (!state.fault) {
    car(
      ...(project(-0.99, 0.46 + Math.sin(state.phase * 6) * 0.02) as [
        number,
        number,
      ]),
      0.31,
    );
    car(
      ...(project(1.02, 0.62 - Math.sin(state.phase * 5) * 0.03) as [
        number,
        number,
      ]),
      0.44,
    );
    car(...(project(0, 0.4) as [number, number]), 0.25);
  }
  car(center, 114, 0.91, true);
  if (state.parking) {
    line(
      [
        [185, 78],
        [222, 89],
        [209, 122],
        [176, 106],
        [185, 78],
      ],
      '#72ddbc',
      1.2,
    );
    c.fillStyle = '#b9f9e0';
    c.font = '10px sans-serif';
    c.fillText('P', 196, 105);
  }
  c.restore();
}
