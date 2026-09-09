import type { Locale } from './experience';
export const wheelStyles = [
  'mirror',
  'turbine',
  'sport',
  'split',
  'mesh',
  'aero',
  'forged',
] as const;
export type WheelStyle = (typeof wheelStyles)[number];
export const wheelFinishes = ['diamond', 'graphite', 'bronze'] as const;
export type WheelFinish = (typeof wheelFinishes)[number];
const names: Record<string, string[]> = {
  mirror: [
    '原版镜面',
    'Original mirror',
    'Originalspiegel',
    'オリジナルミラー',
    'المرآة الأصلية',
  ],
  turbine: [
    '旋流涡轮',
    'Swept turbine',
    'Turbinenwirbel',
    'タービン',
    'توربيني',
  ],
  sport: [
    '轻盈十辐',
    'Slender ten-spoke',
    'Zehnspeichen',
    '10スポーク',
    'عشرة أذرع',
  ],
  split: ['分叉 Y 辐', 'Split Y-spoke', 'Y-Speichen', 'Yスポーク', 'أذرع Y'],
  mesh: ['交织网辐', 'Woven mesh', 'Kreuzspeichen', 'メッシュ', 'شبكي متداخل'],
  aero: [
    '低风阻盘面',
    'Aero disc study',
    'Aero-Scheibe',
    'エアロディスク',
    'قرص انسيابي تصوري',
  ],
  forged: [
    '六辐内凹',
    'Concave six-spoke',
    'Konkave Sechsspeichen',
    'コンケーブ6スポーク',
    'ستة أذرع مقعرة',
  ],
  title: [
    '轮毂设计工坊',
    'Wheel design atelier',
    'Felgendesign-Atelier',
    'ホイールデザイン',
    'تصميم العجلات',
  ],
  diamond: [
    '亮银切削',
    'Diamond silver',
    'Glanzsilber',
    '切削シルバー',
    'فضي مصقول',
  ],
  graphite: ['石墨黑', 'Graphite', 'Graphit', 'グラファイト', 'جرافيت'],
  bronze: [
    '缎面古铜',
    'Satin bronze',
    'Satinbronze',
    'サテンブロンズ',
    'برونزي ساتان',
  ],
  finish: [
    '轮毂表面',
    'Wheel finish',
    'Felgenoberfläche',
    'ホイール仕上げ',
    'تشطيب العجلات',
  ],
  note: [
    '六款原创概念造型，保持现有轮胎尺寸。非官方选装；“低风阻”为造型方向，未经空气动力学验证。',
    'Six original concept designs retain the current tire envelope. Not official options; aero describes the design intent, not tested performance.',
    'Sechs Konzeptdesigns bei gleicher Reifengröße. Keine offiziellen Optionen; Aero bezeichnet das Design, keine geprüfte Leistung.',
    'タイヤ寸法を保つ6種類の独自コンセプト。公式オプションではなく、エアロは形状の方向性で空力性能の実測ではありません。',
    'ستة تصاميم تصورية أصلية تحتفظ بأبعاد الإطارات. ليست خيارات رسمية؛ الانسيابية اتجاه تصميمي وليست أداءً مختبرًا.',
  ],
  originalNote: [
    '原版保留原有表面；选择概念轮毂后可更换金属效果。',
    'Original wheel retains its finish. Select a concept wheel to change the metal.',
    'Originaloberfläche bleibt erhalten. Metall für Konzeptfelgen wählen.',
    'オリジナルの仕上げは保持。コンセプトを選ぶと金属を変更できます。',
    'يحتفظ الأصل بتشطيبه. اختر تصميمًا تصوريًا لتغيير المعدن.',
  ],
};
export function wheelText(locale: Locale, key: string) {
  return names[key]?.[['zh', 'en', 'de', 'ja', 'ar'].indexOf(locale)] ?? key;
}
export type WheelPoint = [number, number];
function bar(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  width: number,
): WheelPoint[] {
  const len = Math.hypot(bx - ax, by - ay),
    dx = ((-(by - ay) / len) * width) / 2,
    dy = (((bx - ax) / len) * width) / 2;
  return [
    [ax + dx, ay + dy],
    [bx + dx, by + dy],
    [bx - dx, by - dy],
    [ax - dx, ay - dy],
  ];
}
/** One canonical outline drives both thumbnails and real 3D spokes. Units: metres. */
export function wheelPolygons(
  style: Exclude<WheelStyle, 'mirror'>,
): WheelPoint[][] {
  let count = 10,
    shapes: WheelPoint[][];
  switch (style) {
    case 'turbine':
      count = 9;
      shapes = [
        [
          [0.052, -0.008],
          [0.13, -0.01],
          [0.266, 0.017],
          [0.259, 0.06],
          [0.16, 0.036],
          [0.065, 0.024],
        ],
      ];
      break;
    case 'split':
      count = 5;
      shapes = [
        bar(0.047, 0, 0.14, 0, 0.024),
        bar(0.125, 0, 0.257, 0.063, 0.019),
        bar(0.125, 0, 0.257, -0.063, 0.019),
      ];
      break;
    case 'mesh':
      count = 10;
      shapes = [
        bar(0.052, 0, 0.11, 0, 0.014),
        bar(0.1, 0, 0.253, 0.074, 0.013),
        bar(0.1, 0, 0.253, -0.074, 0.013),
      ];
      break;
    case 'aero':
      count = 6;
      shapes = [
        [
          [0.05, -0.025],
          [0.23, -0.13],
          [0.267, -0.055],
          [0.25, 0.085],
          [0.092, 0.033],
          [0.05, 0.023],
        ],
      ];
      break;
    case 'forged':
      count = 6;
      shapes = [
        [
          [0.045, -0.017],
          [0.12, -0.027],
          [0.264, -0.024],
          [0.264, 0.024],
          [0.12, 0.027],
          [0.045, 0.017],
        ],
      ];
      break;
    default:
      shapes = [
        [
          [0.05, -0.009],
          [0.267, -0.013],
          [0.267, 0.013],
          [0.05, 0.009],
        ],
      ];
  }
  return Array.from({ length: count }, (_, i) => {
    const angle = (i * Math.PI * 2) / count;
    return shapes.map((points) =>
      points.map(
        ([x, y]) =>
          [
            x * Math.cos(angle) - y * Math.sin(angle),
            x * Math.sin(angle) + y * Math.cos(angle),
          ] as WheelPoint,
      ),
    );
  }).flat();
}
