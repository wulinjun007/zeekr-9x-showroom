import type { Settings } from './experience';
export type Journey =
  | 'before'
  | 'entry'
  | 'driving'
  | 'parking'
  | 'parked'
  | 'exit';
export type Effect =
  | 'welcome'
  | 'charge'
  | 'route'
  | 'perception'
  | 'takeover'
  | 'dms'
  | 'brake'
  | 'blindspot'
  | 'door'
  | 'sensor'
  | 'park'
  | 'music'
  | 'climate'
  | 'call'
  | 'rear'
  | 'child'
  | 'cinema'
  | 'camp'
  | 'ota'
  | 'wash'
  | 'offroad'
  | 'impact'
  | 'exit';
type Bilingual = [string, string];
export type Scenario = {
  id: string;
  family: 'aHMI' | 'iHMI';
  journey: Journey;
  title: Bilingual;
  trigger: Bilingual;
  steps: [Bilingual, Bilingual, Bilingual, Bilingual];
  effect: Effect;
  speed: number;
  view: Settings['view'];
};
const bi = (zh: string, en: string): Bilingual => [zh, en];
const make = (
  id: string,
  family: Scenario['family'],
  journey: Journey,
  title: Bilingual,
  trigger: Bilingual,
  effect: Effect,
  speed: number,
  steps: Scenario['steps'],
  view: Settings['view'] = 'hero',
): Scenario => ({
  id,
  family,
  journey,
  title,
  trigger,
  effect,
  speed,
  steps,
  view,
});
export const scenarios: Scenario[] = [
  make(
    'welcome',
    'aHMI',
    'before',
    bi('接近 · 迎宾灯语', 'Approach · Welcome'),
    bi('模拟钥匙接近，车辆驻车', 'Simulated key approach; vehicle parked'),
    'welcome',
    0,
    [
      bi('车辆锁闭', 'Vehicle locked'),
      bi('迎宾灯渐亮', 'Welcome lights fade in'),
      bi('四门开启展示', 'Door opening demonstration'),
      bi('驻车等待上车', 'Parked; ready to enter'),
    ],
  ),
  make(
    'startup',
    'aHMI',
    'entry',
    bi('上电 · 仪表自检', 'Power on · Self-check'),
    bi('模拟上车与电源请求', 'Simulated entry and power request'),
    'welcome',
    0,
    [
      bi('待机 / P 挡', 'Standby / P'),
      bi('仪表图标自检', 'Instrument lamp check'),
      bi('电量 78% · 胎压示例正常', 'SOC 78% · Sample pressures normal'),
      bi('READY · 驾驶员控制', 'READY · Driver in control'),
    ],
    'driver',
  ),
  make(
    'charge',
    'aHMI',
    'parked',
    bi('充电 · 能量流', 'Charging · Energy flow'),
    bi('驻车后模拟连接充电桩', 'Simulated charger connection while parked'),
    'charge',
    0,
    [
      bi('插枪前检查', 'Pre-connection check'),
      bi('模拟连接确认', 'Simulated connection verified'),
      bi('能量流入 · 电量递增', 'Energy flowing · SOC rising'),
      bi(
        '示例充电结束 · 断开前确认',
        'Sample session ended · Check before unplugging',
      ),
    ],
  ),
  make(
    'navigation',
    'aHMI',
    'driving',
    bi('车道导航 · 路口分叉', 'Lane navigation · Junction'),
    bi('路线前方出现分叉', 'Upcoming route split'),
    'route',
    48,
    [
      bi('沿当前车道行驶', 'Follow current lane'),
      bi('300 m 后右侧分叉', 'Right fork in 300 m'),
      bi('HUD 高亮建议路径', 'HUD highlights suggested path'),
      bi('进入下一路段', 'Next route segment'),
    ],
    'driver',
  ),
  make(
    'adas',
    'aHMI',
    'driving',
    bi('ACC / LCC · 感知视图', 'ACC / LCC · Perception'),
    bi('演示驾驶员主动开启辅助', 'Demonstrate driver-initiated assistance'),
    'perception',
    68,
    [
      bi('辅助待机 · 驾驶员控制', 'Assistance standby · Driver control'),
      bi('演示开启 · 保持监督', 'Demo activation · Supervision required'),
      bi('车辆／车道识别示意', 'Vehicle and lane perception concept'),
      bi('辅助退出 · 驾驶员控制', 'Assistance off · Driver control'),
    ],
  ),
  make(
    'takeover',
    'aHMI',
    'driving',
    bi('L3 概念 · 接管请求', 'L3 concept · Takeover request'),
    bi('模拟运行条件即将不满足', 'Simulated approach to operational limits'),
    'takeover',
    70,
    [
      bi('限定场景自动化示意', 'Bounded automation concept'),
      bi('请求接管 · 倒计时示意', 'Takeover requested · Illustrative timer'),
      bi(
        '持续提示 · 不以点击确认接管',
        'Persistent alert · Click is not takeover',
      ),
      bi(
        '未验证驾驶员接管 · 场景结束',
        'Driver takeover unverified · Demo ended',
      ),
    ],
    'driver',
  ),
  make(
    'fatigue',
    'aHMI',
    'driving',
    bi('长途 · DMS 疲劳提醒', 'Long trip · DMS fatigue'),
    bi(
      '注入模拟疲劳事件，不读取摄像头',
      'Inject fatigue event; no camera access',
    ),
    'dms',
    60,
    [
      bi('驾驶员状态演示', 'Driver status simulation'),
      bi('检测到模拟疲劳事件', 'Simulated fatigue event detected'),
      bi('建议安全停车休息', 'Suggest stopping safely to rest'),
      bi('提示保留 · 未确认恢复', 'Alert retained · Recovery unverified'),
    ],
    'driver',
  ),
  make(
    'collision',
    'aHMI',
    'driving',
    bi('前向预警 · 紧急制动', 'Forward warning · Braking'),
    bi('前方车辆进入冲突路径', 'Leading vehicle enters conflict path'),
    'brake',
    45,
    [
      bi('前方目标跟踪', 'Track leading target'),
      bi('风险接近 · 前向预警', 'Closing risk · Forward warning'),
      bi('示意制动 · 速度下降', 'Illustrative braking · Speed reduces'),
      bi('场景停车 · 驾驶员复核', 'Scenario stopped · Driver reassessment'),
    ],
  ),
  make(
    'blindspot',
    'aHMI',
    'driving',
    bi('盲区 · 变道提醒', 'Blind spot · Lane change'),
    bi('侧后方车辆接近', 'Vehicle approaching from rear quarter'),
    'blindspot',
    50,
    [
      bi('观察邻车道', 'Monitor adjacent lane'),
      bi('侧后方目标接近', 'Rear-quarter target approaching'),
      bi('持续提醒 · 暂缓变道', 'Persistent warning · Delay lane change'),
      bi('目标离开 · 再次观察', 'Target leaves · Check again'),
    ],
  ),
  make(
    'door',
    'aHMI',
    'exit',
    bi('开门 · 骑行者预警', 'Door opening · Cyclist'),
    bi('停车后侧方骑行者接近', 'Cyclist approaches parked car'),
    'door',
    0,
    [
      bi('车辆驻车 · 车门关闭', 'Parked · Doors closed'),
      bi('骑行者接近', 'Cyclist approaching'),
      bi('车门警示 · 暂缓开门', 'Door alert · Delay opening'),
      bi('目标通过 · 人工观察后开门', 'Target passes · Observe before opening'),
    ],
  ),
  make(
    'sensor',
    'aHMI',
    'driving',
    bi('雨雾遮挡 · 系统降级', 'Obstruction · Degradation'),
    bi(
      '注入感知失效；清除陈旧目标',
      'Inject sensor fault; remove stale objects',
    ),
    'sensor',
    35,
    [
      bi('感知示意正常', 'Perception initially available'),
      bi('模拟遮挡 · 撤下感知图形', 'Obstruction · Remove perception graphics'),
      bi(
        '相关辅助不可用 · 驾驶员负责',
        'Related assistance unavailable · Driver responsible',
      ),
      bi(
        '保持不可用 · 不自动重新开启',
        'Remain unavailable · No auto-reactivation',
      ),
    ],
    'driver',
  ),
  make(
    'parking',
    'aHMI',
    'parking',
    bi('泊车 · 障碍暂停', 'Parking · Obstacle pause'),
    bi('行人进入规划泊车区域', 'Pedestrian enters planned parking area'),
    'park',
    5,
    [
      bi(
        '识别车位 · 透明底盘示意',
        'Space identified · Chassis transparency concept',
      ),
      bi('行人进入路径', 'Pedestrian enters path'),
      bi('立即暂停演示车辆', 'Demo vehicle pauses'),
      bi('退出本轮 · 重新复核环境', 'End attempt · Reassess environment'),
    ],
  ),
  make(
    'auto-parking',
    'aHMI',
    'parking',
    bi('自动泊车 · 路径执行', 'Auto parking · Path execution'),
    bi(
      '模拟选择车位并播放；不连接实车',
      'Simulated space selection and playback; no vehicle connection',
    ),
    'park',
    5,
    [
      bi('识别示例车位', 'Identify sample parking bay'),
      bi('展示入位路径', 'Preview parking path'),
      bi('低速入位动画', 'Low-speed parking motion'),
      bi('入位结束 · 驾驶员复核', 'Parked · Driver reassessment'),
    ],
    'top',
  ),
  make(
    'offroad',
    'aHMI',
    'driving',
    bi('越野 · 坡度与底盘', 'Terrain · Pitch & chassis'),
    bi('进入示例缓坡路段', 'Enter illustrative mild slope'),
    'offroad',
    12,
    [
      bi('低速进入路段', 'Low-speed approach'),
      bi('坡度可视化', 'Visualise road inclination'),
      bi('显示航向／胎压示意', 'Show illustrative heading and tyre pressure'),
      bi('离开坡段 · 车身回正', 'Leave slope · Body levels'),
    ],
  ),
  make(
    'impact',
    'aHMI',
    'parked',
    bi('侧碰 · 防护结构说明', 'Side impact · Protection study'),
    bi(
      '展示冲突方向与乘员舱，不做物理碰撞求解',
      'Show conflict direction and cabin; no crash physics',
    ),
    'impact',
    0,
    [
      bi('观察乘员舱', 'Inspect passenger cell'),
      bi('标记侧向冲突方向', 'Mark lateral conflict direction'),
      bi('高亮乘员保护区域', 'Highlight passenger protection region'),
      bi(
        '查看官方测试说明 · 无评分推断',
        'Read official test context · No rating inferred',
      ),
    ],
  ),
  make(
    'music',
    'iHMI',
    'parked',
    bi('音乐 · 分区声场', 'Music · Sound zones'),
    bi(
      '驻车进入娱乐；声场动画不播放版权音乐',
      'Parked entertainment; no copyrighted music played',
    ),
    'music',
    0,
    [
      bi('媒体待机', 'Media standby'),
      bi('选择沉浸声场', 'Select immersive sound field'),
      bi('扬声器声场脉冲', 'Speaker field pulses'),
      bi('恢复待机', 'Return to standby'),
    ],
    'second',
  ),
  make(
    'comfort',
    'iHMI',
    'parked',
    bi('舒适 · 通风加热按摩', 'Comfort · Seat climate'),
    bi('驻车体验座椅功能反馈', 'Parked seat-comfort feedback'),
    'climate',
    0,
    [
      bi('座椅功能关闭', 'Seat functions off'),
      bi('通风气流示意', 'Ventilation airflow'),
      bi('暖色加热／按摩反馈', 'Warm heating / massage feedback'),
      bi('功能关闭 · 回到初始状态', 'Functions off · Initial state'),
    ],
    'second',
  ),
  make(
    'call',
    'iHMI',
    'parked',
    bi('通讯 · 日程服务', 'Communication · Schedule'),
    bi(
      '使用虚构示例来电和日程，无真实账号',
      'Fictional caller and schedule; no real account',
    ),
    'call',
    0,
    [
      bi('示例日程 · 14:30 出发', 'Sample schedule · Depart 14:30'),
      bi('模拟来电提示', 'Simulated incoming call'),
      bi('通话界面 · 不接入真实通信', 'Call interface · No real connection'),
      bi('示例通话结束', 'Sample call ended'),
    ],
    'driver',
  ),
  make(
    'rear',
    'iHMI',
    'parked',
    bi('后排 · 独立屏幕', 'Rear seat · Independent display'),
    bi('驻车展开后排屏幕', 'Deploy rear display while parked'),
    'rear',
    0,
    [
      bi('后排屏幕收起', 'Rear display stowed'),
      bi('屏幕展开', 'Display deploying'),
      bi('后排独立内容示意', 'Independent rear content concept'),
      bi('退出播放 · 屏幕收回', 'Playback ends · Display stowed'),
    ],
    'third',
  ),
  make(
    'child',
    'iHMI',
    'parked',
    bi('亲子 · 乘客分区', 'Family · Passenger zones'),
    bi(
      '以示例儿童档案展示后排限制',
      'Illustrative child profile and rear limits',
    ),
    'child',
    0,
    [
      bi('载入示例家庭偏好', 'Load sample family preferences'),
      bi('后排儿童内容界面', 'Rear child-content interface'),
      bi('后排空调锁定示意', 'Rear climate lock concept'),
      bi(
        '保存示例偏好 · 无身份识别',
        'Save sample preferences · No identification',
      ),
    ],
    'third',
  ),
  make(
    'cinema',
    'iHMI',
    'parked',
    bi('驻车影院 · 灯光联动', 'Parked cinema · Lighting'),
    bi(
      '仅驻车；屏幕展开并降低阅读灯',
      'Parked only; display deploys and reading lights dim',
    ),
    'cinema',
    0,
    [
      bi('确认 P 挡示意', 'Confirm illustrative P state'),
      bi('遮阳关闭 · 屏幕展开', 'Shades close · Display deploys'),
      bi('影院氛围 · 动态抽象画面', 'Cinema ambience · Abstract motion art'),
      bi('恢复照明 · 屏幕收回', 'Restore lights · Display stowed'),
    ],
    'third',
  ),
  make(
    'camp',
    'iHMI',
    'parked',
    bi('露营 · 静谧空间', 'Camping · Quiet space'),
    bi(
      '车辆静止，演示舒适能耗信息',
      'Vehicle stationary; illustrative comfort energy',
    ),
    'camp',
    0,
    [
      bi('驻车 · 环境照明', 'Parked · Ambient light'),
      bi('暖光与新风示意', 'Warm lighting and fresh-air concept'),
      bi('示例舱温 22°C · 电量提示', 'Sample cabin 22°C · SOC reminder'),
      bi('退出模式 · 恢复常规照明', 'Exit mode · Restore lighting'),
    ],
    'second',
  ),
  make(
    'ota',
    'iHMI',
    'parked',
    bi('OTA · 更新旅程', 'OTA · Update journey'),
    bi('纯界面模拟，不下载或安装软件', 'UI simulation; no software installed'),
    'ota',
    0,
    [
      bi('示例更新可用', 'Sample update available'),
      bi('驻车条件检查', 'Check parked conditions'),
      bi('示例进度 · 禁止开始驾驶', 'Simulated progress · Driving unavailable'),
      bi('示例完成 · 查看更新摘要', 'Sample complete · Review summary'),
    ],
    'driver',
  ),
  make(
    'wash',
    'iHMI',
    'parked',
    bi('洗车 · 车辆检查', 'Car wash · Vehicle check'),
    bi('驻车检查门窗，演示清洁准备', 'Parked closure checks for cleaning'),
    'wash',
    0,
    [
      bi('洗车前检查', 'Pre-wash check'),
      bi('关闭车门与遮阳示意', 'Close doors and shade concept'),
      bi('外部传感提示静默示意', 'External notification mute concept'),
      bi('退出洗车 · 恢复显示', 'Exit wash · Restore display'),
    ],
  ),
  make(
    'exit',
    'aHMI',
    'exit',
    bi('下车 · 离车提醒', 'Exit · Departure reminder'),
    bi('结束旅程后展示座舱检查提示', 'End journey; show cabin-check prompt'),
    'exit',
    0,
    [
      bi('停车 · 切换 P 挡', 'Park · Select P'),
      bi('检查后排与随身物品', 'Check rear seats and belongings'),
      bi('关门 · 保存示例偏好', 'Close doors · Save sample preferences'),
      bi('离车灯语 · 屏幕待机', 'Farewell lights · Displays standby'),
    ],
  ),
];
export const getScenario = (id: string) =>
  scenarios.find((x) => x.id === id) ?? scenarios[1];
export const local = (pair: Bilingual, locale: string) =>
  pair[locale === 'zh' ? 0 : 1];
export function scenarioFrame(id: string, progress: number) {
  const s = getScenario(id),
    p = Math.max(0, Math.min(1, progress)),
    phase = Math.min(3, Math.floor(p * 4));
  const fault = s.effect === 'sensor' && phase >= 1;
  const persistent = ['takeover', 'dms', 'sensor'].includes(s.effect);
  const alert =
    s.id !== 'auto-parking' &&
    phase >= 1 &&
    (phase < 3 || persistent) &&
    [
      'takeover',
      'dms',
      'brake',
      'blindspot',
      'door',
      'sensor',
      'park',
      'impact',
    ].includes(s.effect);
  let speed = s.speed;
  if (s.effect === 'brake')
    speed = s.speed * (1 - Math.max(0, Math.min(1, (p - 0.3) / 0.4)));
  if (s.effect === 'park')
    speed =
      s.id === 'auto-parking'
        ? phase === 2
          ? 5
          : 0
        : phase >= 1
          ? 0
          : s.speed;
  return {
    scenario: s,
    p,
    phase,
    fault,
    alert,
    speed: Math.round(speed),
    step: s.steps[phase],
    active: phase === 1 || phase === 2,
    ended: phase === 3,
    coverage:
      !fault &&
      [
        'route',
        'perception',
        'brake',
        'blindspot',
        'door',
        'park',
        'takeover',
      ].includes(s.effect),
    countdown:
      s.effect === 'takeover' && phase >= 1 && phase < 3
        ? Math.ceil((0.75 - p) * 16)
        : null,
  };
}
export function scenarioPreset(id: string): Partial<Settings> {
  const sc = getScenario(id);
  return {
    hmi: sc.id,
    section: 'safety',
    view: sc.view,
    playing: false,
    progress: 0,
    orbit: false,
    explode: 0,
    hidden: [],
    isolated: false,
    selected: null,
    doors: [],
    transparent: ['park', 'impact'].includes(sc.effect),
    occupant: false,
    radar: true,
    hud: sc.family === 'aHMI',
    rearScreen: false,
    shade: 0,
    climate: 'off',
    weather: sc.effect === 'sensor' ? 'fog' : 'clear',
    mode: ['cinema', 'camp', 'music'].includes(sc.effect) ? 'night' : 'day',
    lights: sc.family === 'aHMI',
    hazards: false,
  };
}

// Integrate the illustrative speed profile so road and wheel motion stop with the HUD.
export function scenarioDistance(id: string, progress: number) {
  const s = getScenario(id),
    p = Math.max(0, Math.min(1, progress));
  if (id === 'auto-parking') {
    let distance = 0,
      prev = parkingPose(id, 0.5);
    const end = Math.min(0.75, Math.max(0.5, p));
    for (let i = 1; i <= 24; i++) {
      const next = parkingPose(id, 0.5 + ((end - 0.5) * i) / 24);
      distance += Math.hypot(next.x - prev.x, next.z - prev.z);
      prev = next;
    }
    return -distance;
  }
  let elapsed = p;
  if (s.effect === 'park') elapsed = Math.min(p, 0.25);
  if (s.effect === 'brake') {
    if (p <= 0.3) elapsed = p;
    else {
      const q = Math.min(0.4, p - 0.3);
      elapsed = 0.3 + q - (q * q) / 0.8;
    }
  }
  return (elapsed * s.speed * 16) / 3.6;
}

export function parkingPose(id: string, progress: number) {
  if (id !== 'auto-parking') return { x: 0, z: 0, yaw: 0, t: 0 };
  const a = Math.max(0, Math.min(1, (progress - 0.5) / 0.25)),
    t = a * a * (3 - 2 * a);
  const x = 2.7 * (1 - t) * t * t + 3 * t * t * t,
    z = 6.3 * (1 - t) * (1 - t) * t + 9 * (1 - t) * t * t + 3 * t * t * t;
  const dx = 3 * (1.8 * (1 - t) * t + 2.1 * t * t),
    dz = 3 * (2.1 * (1 - t) * (1 - t) + 1.8 * (1 - t) * t);
  return { x, z, yaw: Math.atan2(dx, dz), t };
}
