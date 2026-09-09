import {
  wrapDefaults,
  readWrap,
  writeWrap,
  type WrapSettings,
} from './wrap-library';
import {
  wheelStyles,
  wheelFinishes,
  wheelText,
  type WheelStyle,
  type WheelFinish,
} from './wheel-styles';
import { signaturePaints, paintName } from './paint-library';
import { glassDefaults, readGlass, type GlassSettings } from './glass';
import { getScenario } from './scenarios';
import { type LabSettings, labDefaults, readLab, writeLab } from './lab-state';
export type Locale = 'zh' | 'en' | 'de' | 'ja' | 'ar';
export type Mode = 'day' | 'night';
export type View =
  | 'hero'
  | 'front'
  | 'side'
  | 'rear'
  | 'driver'
  | 'passenger'
  | 'top'
  | 'second'
  | 'third'
  | 'second-left'
  | 'second-right'
  | 'third-left'
  | 'third-right'
  | 'seat-study'
  | 'underbody'
  | 'wheel-detail'
  | 'light-detail';
export type Section =
  | 'exterior'
  | 'interior'
  | 'structure'
  | 'story'
  | 'safety';
export type PartGroup =
  | 'body'
  | 'doors'
  | 'glass'
  | 'cabin'
  | 'wheels'
  | 'lights';
export type Settings = WrapSettings &
  LabSettings &
  GlassSettings & {
    locale: Locale;
    mode: Mode;
    view: View;
    section: Section;
    paint: string;
    orbit: boolean;
    lights: boolean;
    hazards: boolean;
    hud: boolean;
    ambient: string;
    explode: number;
    doors: string[];
    hidden: PartGroup[];
    selected: PartGroup | null;
    isolated: boolean;
    hotspots: boolean;
    transparent: boolean;
    radar: boolean;
    scenario: 'parking' | 'blindspot' | 'door' | 'sensor';
    playing: boolean;
    progress: number;
    wheelStyle: WheelStyle;
    wheelFinish: WheelFinish;
    tireStyle: 'road' | 'touring';
    seatStyle: 'blue' | 'ivory' | 'cognac';
    backrest: 'A' | 'B';
  };
export const defaults: Settings = {
  ...labDefaults,
  ...wrapDefaults,
  ...glassDefaults,
  locale: 'zh',
  mode: 'night',
  view: 'hero',
  section: 'exterior',
  paint: 'obsidian',
  orbit: false,
  lights: false,
  hazards: false,
  hud: false,
  ambient: '#e6ad77',
  explode: 0,
  doors: [],
  hidden: [],
  selected: null,
  isolated: false,
  hotspots: true,
  transparent: false,
  radar: true,
  scenario: 'parking',
  playing: false,
  progress: 0,
  wheelStyle: 'mirror',
  wheelFinish: 'diamond',
  tireStyle: 'road',
  seatStyle: 'blue',
  backrest: 'B',
};
export const paints = [
  { id: 'obsidian', hex: '#151a20' },
  { id: 'pearl', hex: '#e3e0d6' },
  { id: 'silver', hex: '#747b83' },
  { id: 'forest', hex: '#283e38' },
  { id: 'wine', hex: '#482d36' },
  ...signaturePaints.map(({ id, hex }) => ({ id, hex })),
];
export const groups: PartGroup[] = [
  'body',
  'doors',
  'glass',
  'cabin',
  'wheels',
  'lights',
];
export const locales = {
  zh: '简体中文',
  en: 'English',
  de: 'Deutsch',
  ja: '日本語',
  ar: 'العربية',
};
const rows: Record<string, string[]> = {
  'wheel-detail': [
    '轮组特写',
    'Wheel detail',
    'Raddetail',
    'ホイール詳細',
    'تفاصيل العجلات',
  ],
  'light-detail': [
    '灯组特写',
    'Light detail',
    'Leuchtendetail',
    'ライト詳細',
    'تفاصيل الإضاءة',
  ],
  wheelStyle: [
    '轮毂造型',
    'Wheel design',
    'Felgendesign',
    'ホイールデザイン',
    'تصميم العجلات',
  ],
  mirror: [
    '原版镜面',
    'Original mirror',
    'Original Spiegel',
    'オリジナルミラー',
    'مرآة أصلية',
  ],
  turbine: [
    '涡轮概念',
    'Turbine concept',
    'Turbinenkonzept',
    'タービンコンセプト',
    'تصور توربيني',
  ],
  sport: [
    '十辐概念',
    'Ten-spoke concept',
    'Zehnspeichenkonzept',
    '10スポークコンセプト',
    'تصور بعشر أذرع',
  ],
  tireStyle: [
    '轮胎表面',
    'Tire surface',
    'Reifenoberfläche',
    'タイヤ表面',
    'سطح الإطار',
  ],
  road: [
    '公路纹理',
    'Road texture',
    'Straßentextur',
    'ロードパターン',
    'نمط طرق',
  ],
  touring: [
    '旅行纹理',
    'Touring texture',
    'Touring-Textur',
    'ツーリングパターン',
    'نمط تجوال',
  ],
  variantNote: [
    '概念轮毂为原创展示造型；胎面为视觉纹理，不代表官方适配、性能或在售规格。',
    'The alternative wheels are original concept designs. Tire textures do not imply official fitment, performance or sale specifications.',
    'Die alternativen Felgen sind eigene Konzepte. Reifentexturen sind keine Zusage zu Freigabe, Leistung oder Verkaufsdaten.',
    '追加ホイールは独自コンセプト。タイヤ模様は公式適合や性能を示しません。',
    'العجلات البديلة تصاميم تصورية أصلية. نقوش الإطار لا تعني توافقاً أو أداءً أو مواصفات رسمية.',
  ],
  seatStyle: [
    '内饰与座椅材质',
    'Cabin & seat material',
    'Innenraum & Sitzmaterial',
    '内装とシート素材',
    'مواد المقصورة والمقاعد',
  ],
  blue: [
    '原版蓝白',
    'Original blue & white',
    'Original Blau-Weiß',
    'オリジナル青白',
    'أزرق وأبيض أصلي',
  ],
  ivory: [
    '暖米白',
    'Warm ivory',
    'Warmes Elfenbein',
    'ウォームアイボリー',
    'عاجي دافئ',
  ],
  cognac: [
    '温润棕',
    'Warm cognac',
    'Warmes Cognac',
    'ウォームコニャック',
    'بني دافئ',
  ],
  backrest: [
    '副驾靠背造型',
    'Passenger backrest',
    'Beifahrerrückenlehne',
    '助手席バックレスト',
    'مسند الراكب',
  ],
  backrestNote: [
    'A/B 为源模型中两种局部靠背几何，不改变整车座位数。材质配色为创意预览。',
    'A/B are two source-model backrest meshes, not different seating capacities. Material colours are creative previews.',
    'A/B sind zwei lokale Rückenlehnen aus dem Quellmodell, keine Änderung der Sitzanzahl. Materialfarben sind kreative Vorschauen.',
    'A/Bは元モデルの部分的な背もたれ形状で、座席数は変わりません。配色は創作プレビュー。',
    'A/B شكلان لمسند الظهر من المصدر، ولا يغيّران عدد المقاعد. ألوان المواد تصورية.',
  ],

  safety: [
    '驾驶场景',
    'Driving scenarios',
    'Fahrszenarien',
    '走行シナリオ',
    'سيناريوهات القيادة',
  ],
  safetyNote: [
    'HMI 交互概念 · 雷达范围与道路参与者为示意，不表示实车能力。',
    'HMI concept · Sensor coverage and road users are illustrative, not vehicle capability claims.',
    'HMI-Konzept · Sensorbereiche und Verkehrsteilnehmer sind illustrativ, keine Fahrzeugzusage.',
    'HMIコンセプト。検知範囲と交通参加者は模式表示で、実車性能を示しません。',
    'تصور HMI · نطاق المستشعرات ومستخدمو الطريق توضيحيون ولا يمثلون قدرات السيارة.',
  ],
  parking: [
    '泊车近障',
    'Parking obstacle',
    'Hindernis beim Parken',
    '駐車時の障害物',
    'عائق أثناء الركن',
  ],
  blindspot: [
    '变道盲区',
    'Blind spot',
    'Toter Winkel',
    '車線変更の死角',
    'النقطة العمياء',
  ],
  door: [
    '开门来车',
    'Approaching cyclist',
    'Radfahrer beim Aussteigen',
    '降車時の自転車',
    'دراجة تقترب عند فتح الباب',
  ],
  sensor: [
    '感知受限',
    'Sensor limitation',
    'Sensor eingeschränkt',
    '認識の制限',
    'قيود الاستشعار',
  ],
  transparent: [
    '透明车身',
    'Transparent body',
    'Transparente Karosserie',
    'ボディを透明化',
    'هيكل شفاف',
  ],
  radar: [
    '感知范围示意',
    'Sensor coverage concept',
    'Sensorbereich (Konzept)',
    '検知範囲の模式表示',
    'تصور نطاق الاستشعار',
  ],
  play: [
    '播放场景',
    'Play scenario',
    'Szenario starten',
    'シナリオ再生',
    'تشغيل السيناريو',
  ],
  pause: [
    '暂停场景',
    'Pause scenario',
    'Szenario pausieren',
    '一時停止',
    'إيقاف مؤقت',
  ],
  replay: ['重播场景', 'Replay', 'Wiederholen', '再生し直す', 'إعادة العرض'],
  monitor: [
    '观察周边环境',
    'Monitor surroundings',
    'Umgebung beobachten',
    '周辺環境を確認',
    'راقب المحيط',
  ],
  risk: [
    '发现潜在风险',
    'Potential risk detected',
    'Mögliches Risiko erkannt',
    '潜在リスクを検知',
    'تم رصد خطر محتمل',
  ],
  hold: [
    '保持停止，核对环境',
    'Remain stopped; check surroundings',
    'Angehalten bleiben; Umgebung prüfen',
    '停止を維持し周囲を確認',
    'ابق متوقفاً وتحقق من المحيط',
  ],
  resolved: [
    '场景结束，重新核对后再行动',
    'Scenario complete; reassess before acting',
    'Szenario beendet; vor dem Handeln erneut prüfen',
    'シナリオ終了。再確認してから行動',
    'انتهى السيناريو؛ أعد التقييم قبل التحرك',
  ],
  unavailable: [
    '感知不可信：相关辅助不可用',
    'Unreliable perception: related assistance unavailable',
    'Wahrnehmung unzuverlässig: Assistenz nicht verfügbar',
    '認識が不確実：関連支援は利用不可',
    'استشعار غير موثوق: المساعدة المرتبطة غير متاحة',
  ],
  driverControl: [
    '驾驶责任：驾驶员',
    'Driving responsibility: driver',
    'Fahrverantwortung: Fahrer',
    '運転責任：ドライバー',
    'مسؤولية القيادة: السائق',
  ],
  parkingAction: [
    '障碍进入路径 → 暂停优先 → 环境复核后重新开始。',
    'Obstacle enters path → Pause first → Reassess before restarting.',
    'Hindernis im Pfad → Zuerst pausieren → Vor Neustart prüfen.',
    '進路に障害物 → 停止を優先 → 再確認して再開。',
    'عائق في المسار ← توقف أولاً ← أعد التقييم قبل الاستئناف.',
  ],
  blindspotAction: [
    '侧后方目标接近 → 保留持续提醒 → 驾驶员观察，暂缓变道。',
    'Vehicle approaches from behind → Persistent warning → Observe and delay lane change.',
    'Fahrzeug nähert sich → Warnung bleibt → Beobachten und Spurwechsel verschieben.',
    '後側方から接近 → 警告を継続 → 確認し車線変更を見送る。',
    'مركبة تقترب من الخلف ← تحذير مستمر ← راقب وأجّل تغيير المسار.',
  ],
  doorAction: [
    '骑行者接近车门 → 提醒暂缓开门 → 风险离开后再次观察。',
    'Cyclist approaches door → Delay opening → Check again once the risk passes.',
    'Radfahrer nähert sich → Tür geschlossen halten → Danach erneut prüfen.',
    '自転車が接近 → ドアを開けず待つ → 通過後も再確認。',
    'دراجة تقترب ← أجّل فتح الباب ← تحقق مجدداً بعد زوال الخطر.',
  ],
  sensorAction: [
    '摄像头遮挡 → 撤下不可信覆盖 → 明确辅助不可用，不自动恢复。',
    'Camera obstructed → Remove unreliable coverage → Mark assistance unavailable; no automatic reactivation.',
    'Kamera verdeckt → Unzuverlässige Anzeige entfernen → Assistenz nicht verfügbar; kein automatischer Neustart.',
    'カメラ遮蔽 → 不確かな範囲表示を消去 → 支援利用不可。自動復帰しません。',
    'الكاميرا محجوبة ← إخفاء التغطية غير الموثوقة ← المساعدة غير متاحة دون إعادة تفعيل تلقائية.',
  ],
  knowledge: [
    '参考个人 HMI 知识库',
    'Based on the personal HMI pattern library',
    'Nach der persönlichen HMI-Musterbibliothek',
    '個人HMIパターンライブラリを参照',
    'استناداً إلى مكتبة أنماط HMI الشخصية',
  ],

  passenger: ['副驾近景', 'Passenger', 'Beifahrer', '助手席', 'الراكب الأمامي'],
  top: ['俯视全景', 'Top view', 'Draufsicht', '俯瞰', 'من الأعلى'],
  tagline: [
    '旗舰之境，亲自探索。',
    'A grand presence. Yours to explore.',
    'Größe erleben. Details entdecken.',
    '存在感を、その手で。',
    'حضور استثنائي. اكتشفه بنفسك.',
  ],
  study: [
    '独立交互设计作品',
    'Independent interactive design study',
    'Unabhängige interaktive Designstudie',
    '独立インタラクティブデザイン作品',
    'دراسة تصميم تفاعلية مستقلة',
  ],
  exterior: ['外观', 'Exterior', 'Exterieur', 'エクステリア', 'الخارج'],
  interior: ['车内空间', 'Cabin', 'Innenraum', '室内空間', 'المقصورة'],
  structure: ['部件探索', 'Structure', 'Bauteile', 'パーツ探索', 'الأجزاء'],
  story: ['体验导览', 'Guided tour', 'Rundgang', 'ガイドツアー', 'الجولة'],
  studio: ['影棚', 'Studio', 'Studio', 'スタジオ', 'الاستوديو'],
  day: ['白天', 'Daylight', 'Tageslicht', '昼間', 'النهار'],
  night: ['夜晚', 'Night', 'Nacht', '夜間', 'الليل'],
  paint: [
    '车漆设计',
    'Paint finish',
    'Lackierung',
    'ボディカラー',
    'طلاء الهيكل',
  ],
  obsidian: [
    '曜石黑',
    'Obsidian',
    'Obsidianschwarz',
    'オブシディアン',
    'أسود سبج',
  ],
  pearl: ['珍珠白', 'Pearl', 'Perlweiß', 'パール', 'أبيض لؤلؤي'],
  silver: [
    '流光银',
    'Liquid silver',
    'Fließendes Silber',
    'リキッドシルバー',
    'فضي',
  ],
  forest: ['深林绿', 'Forest', 'Waldgrün', 'フォレスト', 'أخضر غابة'],
  wine: ['暮光紫', 'Twilight', 'Abendrot', 'トワイライト', 'بنفسجي الشفق'],
  conceptPaint: [
    '创意配色预览，非官方选装清单',
    'Creative finishes, not an official options list',
    'Kreative Farben, keine offizielle Ausstattungsliste',
    '創作カラー。公式オプションではありません',
    'ألوان تصورية وليست قائمة خيارات رسمية',
  ],
  access: [
    '迎宾与灯光',
    'Access & lighting',
    'Einstieg & Licht',
    'ドアと照明',
    'الدخول والإضاءة',
  ],
  Door_LF: ['左前门', 'Front left', 'Vorne links', '左フロント', 'أمامي أيسر'],
  Door_RF: [
    '右前门',
    'Front right',
    'Vorne rechts',
    '右フロント',
    'أمامي أيمن',
  ],
  Door_LB: ['左后门', 'Rear left', 'Hinten links', '左リア', 'خلفي أيسر'],
  Door_RB: ['右后门', 'Rear right', 'Hinten rechts', '右リア', 'خلفي أيمن'],
  Trunk_up: [
    '上尾门',
    'Upper tailgate',
    'Obere Heckklappe',
    '上部テールゲート',
    'باب خلفي علوي',
  ],
  Hood: ['前舱盖', 'Hood', 'Motorhaube', 'ボンネット', 'غطاء المحرك'],
  lights: [
    '车灯',
    'Head & tail lights',
    'Front- & Rücklicht',
    'ヘッド・テールライト',
    'المصابيح',
  ],
  hazards: [
    '双闪',
    'Hazard lights',
    'Warnblinker',
    'ハザード',
    'إشارات التحذير',
  ],
  openAll: [
    '四门迎宾',
    'Open four doors',
    'Vier Türen öffnen',
    '4ドアを開く',
    'فتح الأبواب الأربعة',
  ],
  closeAll: [
    '关闭全部',
    'Close all',
    'Alles schließen',
    'すべて閉じる',
    'إغلاق الكل',
  ],
  hero: ['全景', 'Overview', 'Übersicht', '全景', 'نظرة عامة'],
  front: ['前脸', 'Front', 'Front', 'フロント', 'الأمام'],
  side: ['侧面', 'Side', 'Seite', 'サイド', 'الجانب'],
  rear: ['车尾', 'Rear', 'Heck', 'リア', 'الخلف'],
  driver: ['驾驶席', 'Driver', 'Fahrersitz', '運転席', 'مقعد السائق'],
  second: ['第二排', 'Second row', 'Zweite Reihe', '2列目', 'الصف الثاني'],
  third: ['第三排', 'Third row', 'Dritte Reihe', '3列目', 'الصف الثالث'],
  orbit: [
    '自动环绕',
    'Auto orbit',
    'Automatisch drehen',
    '自動回転',
    'دوران تلقائي',
  ],
  reset: [
    '重置体验',
    'Reset experience',
    'Zurücksetzen',
    'リセット',
    'إعادة الضبط',
  ],
  share: [
    '分享配置',
    'Share configuration',
    'Konfiguration teilen',
    '設定を共有',
    'مشاركة الإعدادات',
  ],
  capture: [
    '保存画面',
    'Save image',
    'Bild speichern',
    '画像を保存',
    'حفظ الصورة',
  ],
  fullscreen: ['全屏', 'Fullscreen', 'Vollbild', '全画面', 'ملء الشاشة'],
  exitFull: [
    '退出全屏',
    'Exit fullscreen',
    'Vollbild verlassen',
    '全画面を終了',
    'إنهاء ملء الشاشة',
  ],
  zoomIn: ['放大', 'Zoom in', 'Vergrößern', '拡大', 'تكبير'],
  zoomOut: ['缩小', 'Zoom out', 'Verkleinern', '縮小', 'تصغير'],
  hint: [
    '拖动旋转 · 滚轮缩放 · 点击热点探索',
    'Drag to orbit · Scroll to zoom · Tap a hotspot',
    'Ziehen zum Drehen · Scrollen zum Zoomen · Hotspot wählen',
    'ドラッグで回転 · スクロールでズーム · ホットスポットを選択',
    'اسحب للدوران · مرر للتكبير · اضغط نقاط التفاعل',
  ],
  cabinHint: [
    '拖动环顾座舱 · 点击热点 · 切换乘坐位置',
    'Drag to look around · Tap hotspots · Switch seats',
    'Ziehen zum Umschauen · Hotspots wählen · Sitz wechseln',
    'ドラッグで見回す · ホットスポットを選択 · 座席切替',
    'اسحب للنظر حولك · اضغط النقاط · بدّل المقاعد',
  ],
  space: [
    '探索三排空间',
    'Explore all three rows',
    'Drei Reihen entdecken',
    '3列の空間を探索',
    'استكشف الصفوف الثلاثة',
  ],
  ambient: [
    '氛围灯色彩',
    'Ambient lighting',
    'Ambientebeleuchtung',
    'アンビエントライト',
    'الإضاءة المحيطية',
  ],
  hud: [
    'HUD 概念演示',
    'HUD concept demo',
    'HUD-Konzeptdemo',
    'HUD コンセプト',
    'عرض HUD تصوري',
  ],
  hudNote: [
    '挡风玻璃导航投影演示；非实车系统复刻。',
    'Windshield navigation concept; not production vehicle software.',
    'Navigationsprojektion als Konzept, keine Fahrzeugsoftware.',
    'フロントガラス投影のコンセプト。実車ソフトではありません。',
    'تصور لعرض الملاحة على الزجاج، وليس نظام السيارة الفعلي.',
  ],
  hotspots: [
    '空间热点',
    'Spatial hotspots',
    'Raum-Hotspots',
    '空間ホットスポット',
    'نقاط تفاعل مكانية',
  ],
  body: [
    '车身与饰件',
    'Body & trim',
    'Karosserie & Zierleisten',
    'ボディとトリム',
    'الهيكل والزخارف',
  ],
  doors: [
    '车门与舱盖',
    'Doors & closures',
    'Türen & Klappen',
    'ドアとカバー',
    'الأبواب والأغطية',
  ],
  glass: [
    '玻璃与天幕',
    'Glass & roof',
    'Glas & Dach',
    'ガラスとルーフ',
    'الزجاج والسقف',
  ],
  cabin: [
    '座舱与座椅',
    'Cabin & seats',
    'Kabine & Sitze',
    'キャビンとシート',
    'المقصورة والمقاعد',
  ],
  wheels: [
    '轮组与制动',
    'Wheels & brakes',
    'Räder & Bremsen',
    'ホイールとブレーキ',
    'العجلات والمكابح',
  ],
  explode: [
    '爆炸拆解',
    'Exploded view',
    'Explosionsansicht',
    '分解表示',
    'العرض التفصيلي',
  ],
  explodeNote: [
    '按现有可视网格展开，用于造型与层级观察，不代表工程装配顺序。',
    'Separates existing visual meshes; not an engineering assembly sequence.',
    'Trennt vorhandene Darstellungsnetze, keine technische Montagereihenfolge.',
    '既存の表示メッシュを分離。工学的な組立順序ではありません。',
    'يفصل المجسمات المرئية الحالية، وليس تسلسل تجميع هندسياً.',
  ],
  assemble: [
    '整车复原',
    'Reassemble',
    'Zusammenbauen',
    '元に戻す',
    'إعادة التجميع',
  ],
  isolate: ['单独查看', 'Isolate', 'Isolieren', '単独表示', 'عرض منفرد'],
  showAll: ['显示全部', 'Show all', 'Alle zeigen', 'すべて表示', 'إظهار الكل'],
  hide: ['隐藏', 'Hide', 'Ausblenden', '非表示', 'إخفاء'],
  show: ['显示', 'Show', 'Einblenden', '表示', 'إظهار'],
  selected: ['已选择', 'Selected', 'Ausgewählt', '選択中', 'محدد'],
  parts: [
    '可视网格',
    'visual meshes',
    'Darstellungsnetze',
    '表示メッシュ',
    'مجسمات مرئية',
  ],
  tourTitle: [
    '由外而内，感受细节',
    'An invitation to look closer',
    'Details aus jeder Perspektive',
    '細部へと、誘う。',
    'دعوة لاكتشاف التفاصيل',
  ],
  tourIntro: [
    '四段体验，探索轮廓、光影、座舱与结构。',
    'Four chapters: silhouette, light, cabin and structure.',
    'Vier Kapitel: Silhouette, Licht, Innenraum und Struktur.',
    'シルエット、光、室内、構造の4章。',
    'أربعة فصول: الشكل والضوء والمقصورة والبنية.',
  ],
  chapter1: [
    '01 / 旗舰轮廓',
    '01 / A commanding silhouette',
    '01 / Markante Silhouette',
    '01 / 堂々たるシルエット',
    '01 / حضور مهيب',
  ],
  chapter2: [
    '02 / 入夜时分',
    '02 / After dark',
    '02 / Nach Einbruch der Nacht',
    '02 / 夜の表情',
    '02 / بعد الغروب',
  ],
  chapter3: [
    '03 / 私享座舱',
    '03 / Your private cabin',
    '03 / Ihre private Kabine',
    '03 / プライベートキャビン',
    '03 / مقصورتك الخاصة',
  ],
  chapter4: [
    '04 / 结构之美',
    '04 / Beneath the surface',
    '04 / Unter der Oberfläche',
    '04 / 構造の美しさ',
    '04 / تحت السطح',
  ],
  about: [
    '关于这个作品',
    'About this study',
    'Über diese Studie',
    'この作品について',
    'عن هذه الدراسة',
  ],
  aboutText: [
    '以极氪 9X 为载体的独立汽车交互设计作品。展示价值来自可操作的空间、个性化配置和部件叙事。非极氪官方网站，不提供购车或模型销售。',
    'An independent automotive interaction study featuring the ZEEKR 9X. Explore spatial interaction, personalisation and component storytelling. Not an official ZEEKR website; no vehicle or model sales.',
    'Unabhängige Interaktionsstudie zum ZEEKR 9X mit Raumerlebnis, Personalisierung und Bauteilerkundung. Keine offizielle ZEEKR-Website, kein Fahrzeug- oder Modellverkauf.',
    'ZEEKR 9Xを用いた独立した自動車インタラクション作品。空間操作、カスタマイズ、パーツ探索を体験できます。公式サイトではなく、車両やモデルの販売は行いません。',
    'دراسة تفاعل مستقلة باستخدام ZEEKR 9X لاستكشاف المساحة والتخصيص والأجزاء. ليس موقع ZEEKR الرسمي ولا يبيع سيارات أو نماذج.',
  ],
  source: [
    '来源与说明',
    'Source & credits',
    'Quelle & Hinweise',
    '出典と説明',
    'المصدر والتوضيحات',
  ],
  sourceText: [
    '基于已有 Blender 重建工程，几何来源为极氪官网配置器。项目所有者已确认公开展示／再发布授权；授权未独立核验。模型仍在外观校准中。',
    'Based on the existing Blender reconstruction of ZEEKR configurator geometry. The project owner confirmed display and republication rights; not independently verified. Visual calibration is ongoing.',
    'Basierend auf der Blender-Rekonstruktion der ZEEKR-Konfiguratorgeometrie. Der Projekteigner bestätigt Veröffentlichungsrechte; nicht unabhängig geprüft. Visuelle Kalibrierung läuft.',
    '既存のBlender再構築を使用し、形状はZEEKR公式コンフィギュレーター由来です。所有者が公開・再公開権限を確認。独立検証は未実施。外観調整中。',
    'مبني على إعادة بناء Blender لهندسة أداة ZEEKR. أكد مالك المشروع حقوق العرض وإعادة النشر دون تحقق مستقل. المعايرة البصرية مستمرة.',
  ],
  official: [
    '极氪官方车型页',
    'Official ZEEKR model page',
    'Offizielle ZEEKR-Modellseite',
    'ZEEKR公式モデルページ',
    'صفحة ZEEKR الرسمية',
  ],
  loading: [
    '正在准备你的 9X',
    'Preparing your 9X',
    'Ihr 9X wird vorbereitet',
    '9Xを準備しています',
    'جارٍ تجهيز 9X',
  ],
  loadingNote: [
    '首次加载约 8.3 MB · 后续由浏览器缓存',
    'First load ~8.3 MB · Cached for later visits',
    'Erster Download ca. 8,3 MB · Danach im Cache',
    '初回約8.3 MB · 以降はキャッシュを利用',
    'التحميل الأول نحو 8.3 MB · يُخزن لاحقاً',
  ],
  error: [
    '3D 加载暂时失败，请重试或查看模型图片。',
    '3D could not load. Retry or view the model image.',
    '3D konnte nicht laden. Erneut versuchen oder Modellbild ansehen.',
    '3Dを読み込めません。再試行またはモデル画像をご覧ください。',
    'تعذر تحميل العرض. أعد المحاولة أو اعرض صورة النموذج.',
  ],
  retry: ['重新加载', 'Retry', 'Erneut versuchen', '再試行', 'إعادة المحاولة'],
  copied: [
    '配置链接已复制',
    'Configuration link copied',
    'Link kopiert',
    '設定リンクをコピーしました',
    'تم نسخ رابط الإعدادات',
  ],
  copyFailed: [
    '请复制下方链接',
    'Copy the link below',
    'Link unten kopieren',
    '下のリンクをコピー',
    'انسخ الرابط أدناه',
  ],
  saveCard: [
    '下载体验卡',
    'Download experience card',
    'Erlebniskarte herunterladen',
    '体験カードをダウンロード',
    'تنزيل بطاقة التجربة',
  ],
  screen: [
    '座舱屏幕',
    'Cabin display',
    'Kabinenbildschirm',
    '室内ディスプレイ',
    'شاشة المقصورة',
  ],
  seat: [
    '六座布局',
    'Six-seat layout',
    'Sechssitziges Layout',
    '6シートレイアウト',
    'توزيع ستة مقاعد',
  ],
  seatNote: [
    '从不同乘坐位置环顾三排空间。座椅当前为合并网格，未添加虚构的独立折叠动画。',
    'Look around from each row. Seats are a combined mesh; individual folding is not simulated.',
    'Aus jeder Reihe umsehen. Sitze sind ein gemeinsames Netz; kein einzelnes Umklappen simuliert.',
    '各列から空間を見渡せます。シートは統合メッシュのため個別格納は再現していません。',
    'انظر من كل صف. المقاعد مجسم مدمج ولا توجد محاكاة طي منفردة.',
  ],
  screenNote: [
    '保留模型原有屏幕纹理。点击 HUD 按钮体验额外的导航投影概念。',
    'Original screen textures retained. Enable HUD for an additional navigation projection concept.',
    'Originale Bildschirmtexturen. HUD zeigt ein zusätzliches Navigationskonzept.',
    '元の画面テクスチャを保持。HUDでナビ投影コンセプトを体験。',
    'تم الاحتفاظ بنسيج الشاشة الأصلي. شغّل HUD لتجربة تصور الملاحة.',
  ],
  close: ['关闭', 'Close', 'Schließen', '閉じる', 'إغلاق'],
  quality: [
    '显示精度',
    'Display quality',
    'Darstellungsqualität',
    '表示品質',
    'جودة العرض',
  ],
  eco: ['流畅', 'Smooth', 'Flüssig', 'スムーズ', 'سلس'],
  high: ['精细', 'High', 'Hoch', '高精細', 'عالية'],
};
export function text(locale: Locale, key: string) {
  if ((wheelStyles as readonly string[]).includes(key))
    return wheelText(locale, key);
  return (
    rows[key]?.[['zh', 'en', 'de', 'ja', 'ar'].indexOf(locale)] ??
    paintName(locale, key) ??
    key
  );
}
export function readSettings(search = window.location.search): Settings {
  const p = new URLSearchParams(search),
    s = { ...defaults };
  for (const k of ['locale', 'mode', 'view', 'section', 'paint'] as const) {
    const v = k === 'mode' && p.get(k) === 'studio' ? 'day' : p.get(k);
    const allowed = {
      locale: Object.keys(locales),
      mode: ['day', 'night'],
      view: [
        'hero',
        'front',
        'side',
        'rear',
        'driver',
        'passenger',
        'top',
        'second',
        'third',
        'second-left',
        'second-right',
        'third-left',
        'third-right',
        'seat-study',
        'underbody',
        'wheel-detail',
        'light-detail',
      ],
      section: ['exterior', 'interior', 'structure', 'story', 'safety'],
      paint: paints.map((p) => p.id),
    };
    if (v && allowed[k].includes(v))
      (s as unknown as Record<string, unknown>)[k] = v;
  }
  for (const k of ['lights', 'hazards', 'hud', 'orbit', 'transparent'] as const)
    s[k] = p.get(k) === '1';
  s.progress = Math.max(0, Math.min(1, Number(p.get('progress')) || 0));
  s.explode = Math.max(0, Math.min(200, Number(p.get('explode')) || 0));
  s.doors = (p.get('doors') || '')
    .split(',')
    .filter((k) =>
      ['Door_LF', 'Door_RF', 'Door_LB', 'Door_RB', 'Hood', 'Trunk_up'].includes(
        k,
      ),
    );
  const ambient = p.get('ambient');
  if (ambient && /^#[0-9a-fA-F]{6}$/.test(ambient)) s.ambient = ambient;
  const sc = p.get('scenario');
  if (sc && ['parking', 'blindspot', 'door', 'sensor'].includes(sc))
    s.scenario = sc as Settings['scenario'];
  for (const [k, allowed] of Object.entries({
    wheelStyle: wheelStyles,
    wheelFinish: wheelFinishes,
    tireStyle: ['road', 'touring'],
    seatStyle: ['blue', 'ivory', 'cognac'],
    backrest: ['A', 'B'],
  })) {
    const val = p.get(k);
    if (val && (allowed as readonly string[]).includes(val))
      (s as unknown as Record<string, unknown>)[k] = val;
  }
  const selected = p.get('selected');
  if (selected && groups.includes(selected as PartGroup))
    s.selected = selected as PartGroup;
  s.hidden = (p.get('hidden') || '')
    .split(',')
    .filter((x) => groups.includes(x as PartGroup)) as PartGroup[];
  s.isolated = p.get('isolated') === '1' && !!s.selected;
  s.radar = p.get('radar') !== '0';
  s.hotspots = p.get('hotspots') !== '0';
  const lab = readLab(p);
  lab.hmi = getScenario(lab.hmi).id;
  return { ...s, ...lab, ...readGlass(p), ...readWrap(p) };
}
export function shareUrl(s: Settings) {
  const u = new URL(window.location.href);
  u.search = '';
  for (const k of ['locale', 'mode', 'view', 'section', 'paint'] as const)
    u.searchParams.set(k, s[k]);
  for (const k of ['lights', 'hazards', 'hud', 'orbit', 'transparent'] as const)
    if (s[k]) u.searchParams.set(k, '1');
  if (s.progress)
    u.searchParams.set(
      'progress',
      String(Math.max(0, Math.min(1, s.progress))),
    );
  if (s.explode) u.searchParams.set('explode', String(s.explode));
  if (s.doors.length) u.searchParams.set('doors', s.doors.join(','));
  u.searchParams.set('ambient', s.ambient);
  if (s.selected) u.searchParams.set('selected', s.selected);
  if (s.hidden.length) u.searchParams.set('hidden', s.hidden.join(','));
  if (s.isolated) u.searchParams.set('isolated', '1');
  u.searchParams.set('radar', s.radar ? '1' : '0');
  u.searchParams.set('hotspots', s.hotspots ? '1' : '0');
  u.searchParams.set('scenario', s.scenario);
  for (const k of [
    'wheelStyle',
    'wheelFinish',
    'tireStyle',
    'seatStyle',
    'backrest',
  ] as const)
    u.searchParams.set(k, s[k]);
  for (const k of [
    'glassTint',
    'glassFront',
    'glassRear',
    'glassRoof',
  ] as const)
    u.searchParams.set(k, String(s[k]));
  writeLab(u.searchParams, s);
  writeWrap(u.searchParams, s);
  return u.toString();
}
