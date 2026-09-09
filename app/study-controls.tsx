'use client';
import { PassengerControls } from './passenger-controls';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import type { Settings } from './experience';
import { weatherTypes } from './lab-state';
import { roadTypes, partTypes, type PartType } from './study-state';
type Props = { s: Settings; update: (p: Partial<Settings>) => void };
const names: Record<string, [string, string]> = {
  'front-left': ['第一排左侧 · 驾驶位', 'Front left · driver'],
  'front-right': ['第一排右侧 · 副驾', 'Front right · passenger'],
  'second-left': ['第二排左侧', 'Second row · left'],
  'second-right': ['第二排右侧', 'Second row · right'],
  'third-left': ['第三排左侧', 'Third row · left'],
  'third-right': ['第三排右侧', 'Third row · right'],
  clear: ['晴朗', 'Clear'],
  overcast: ['阴天', 'Overcast'],
  rain: ['降雨', 'Rain'],
  storm: ['强降雨与阵风', 'Rainstorm'],
  snow: ['降雪', 'Snow'],
  blizzard: ['暴风雪', 'Blizzard'],
  fog: ['浓雾', 'Dense fog'],
  wind: ['侧风', 'Crosswind'],
  sand: ['沙尘', 'Dust storm'],
  heat: ['高温热浪', 'Heat haze'],
  hail: ['冰雹', 'Hail'],
  smooth: ['平整沥青', 'Smooth asphalt'],
  broken: ['破损沥青', 'Broken asphalt'],
  potholes: ['坑洼路面', 'Potholes'],
  cobble: ['石块铺路', 'Cobblestones'],
  washboard: ['搓板路', 'Washboard'],
  gravel: ['碎石路', 'Gravel'],
  mud: ['泥泞车辙', 'Muddy tracks'],
  ruts: ['交错车辙', 'Alternating ruts'],
  speedbumps: ['连续减速带', 'Speed bumps'],
  ice: ['冰面', 'Ice'],
  water: ['浅积水示意', 'Surface water study'],
  all: ['全部零件类别', 'All categories'],
  body: ['车身主体', 'Body'],
  closures: ['机盖／尾门／盖板', 'Hood, tailgate & covers'],
  'door-shell': ['车门外壳', 'Door shells'],
  'door-trim': ['门板内饰', 'Door trim'],
  glass: ['车窗玻璃', 'Glazing'],
  mirrors: ['后视镜', 'Mirrors'],
  seats: ['座椅表面', 'Seat surfaces'],
  cockpit: ['仪表与屏幕', 'Cockpit & displays'],
  roof: ['顶棚与遮阳', 'Headliner & shades'],
  tires: ['轮胎', 'Tires'],
  rims: ['轮毂', 'Rims'],
  brakes: ['制动件', 'Brakes'],
  lights: ['灯具', 'Lighting'],
  trim: ['装饰件', 'Decorative trim'],
};
export const studyName = (id: string, locale: string) =>
  names[id]?.[locale === 'zh' ? 0 : 1] ?? id;
function Pick({
  s,
  update,
  k,
  label,
  values,
}: {
  s: Settings;
  update: Props['update'];
  k: 'weather' | 'roadType';
  label: string;
  values: readonly string[];
}) {
  return (
    <div className="lab-choice">
      <span>{label}</span>
      <Select
        value={String(s[k])}
        onValueChange={(v) => v && update({ [k]: v })}
      >
        <SelectTrigger aria-label={label}>
          <SelectValue>{studyName(String(s[k]), s.locale)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {values.map((v) => (
            <SelectItem key={v} value={v}>
              {studyName(v, s.locale)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
function Range({
  label,
  value,
  min = 0,
  max = 100,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="study-range">
      <div className="slider-caption">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <Slider
        aria-label={label}
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
      />
    </div>
  );
}
export function SeatingControls({ s, update }: Props) {
  return <PassengerControls s={s} update={update} />;
}

export function EnvironmentControls({ s, update }: Props) {
  const zh = s.locale === 'zh';
  return (
    <div className="study-panel">
      <h3>{zh ? '天气 × 路面实验' : 'Weather × road study'}</h3>
      <Pick
        s={s}
        update={update}
        k="weather"
        label={zh ? '天气' : 'Weather'}
        values={weatherTypes}
      />
      <Range
        label={zh ? '天气强度' : 'Weather intensity'}
        value={s.weatherIntensity}
        min={20}
        onChange={(weatherIntensity) => update({ weatherIntensity })}
      />
      <div className="variant-buttons">
        {[
          {
            n: zh ? '雨夜坑洼' : 'Rain & potholes',
            weather: 'storm',
            roadType: 'potholes',
            mode: 'night',
          },
          {
            n: zh ? '冰雪路面' : 'Snow & ice',
            weather: 'blizzard',
            roadType: 'ice',
            mode: 'day',
          },
          {
            n: zh ? '沙尘搓板路' : 'Dust & washboard',
            weather: 'sand',
            roadType: 'washboard',
            mode: 'day',
          },
        ].map((p) => (
          <button
            key={p.weather}
            onClick={() =>
              update({
                weather: p.weather as Settings['weather'],
                roadType: p.roadType as Settings['roadType'],
                mode: p.mode as Settings['mode'],
                roadEnabled: true,
                roadPlaying: true,
                roadSpeed: 18,
                view: 'hero',
                section: 'exterior',
                playing: false,
              })
            }
          >
            {p.n}
          </button>
        ))}
      </div>
      <label className="lab-toggle">
        <span>{zh ? '启用路面演示' : 'Enable road study'}</span>
        <Switch
          checked={s.roadEnabled}
          aria-label={zh ? '启用路面演示' : 'Enable road study'}
          onCheckedChange={(roadEnabled) =>
            update({
              roadEnabled,
              roadPlaying: roadEnabled,
              playing: false,
              section: roadEnabled ? 'exterior' : s.section,
            })
          }
        />
      </label>
      <Pick
        s={s}
        update={update}
        k="roadType"
        label={zh ? '路面类型' : 'Surface'}
        values={roadTypes}
      />
      <Range
        label={zh ? '路面起伏强度' : 'Surface severity'}
        value={s.roadSeverity}
        onChange={(roadSeverity) => update({ roadSeverity })}
      />
      <Range
        label={zh ? '演示速度 · km/h' : 'Demo speed · km/h'}
        value={s.roadSpeed}
        max={40}
        onChange={(roadSpeed) => update({ roadSpeed })}
      />
      <div className="button-pair">
        <Button
          variant="outline"
          disabled={!s.roadEnabled}
          onClick={() => update({ roadPlaying: !s.roadPlaying })}
        >
          {s.roadPlaying
            ? zh
              ? '暂停路面'
              : 'Pause road'
            : zh
              ? '播放路面'
              : 'Play road'}
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            update({
              weather: 'clear',
              weatherIntensity: 60,
              roadType: 'smooth',
              roadEnabled: false,
              roadPlaying: false,
              roadSeverity: 60,
              mode: 'day',
            })
          }
        >
          {zh ? '恢复展厅' : 'Restore showroom'}
        </Button>
      </div>
      <p className="fineprint">
        {zh
          ? '轮胎接地点与车身姿态由程序化路面驱动；冰、水、泥和极端天气仅作视觉与风险场景展示，不提供附着力、制动距离、涉水或通过能力结论。'
          : 'Terrain drives wheel contact and body pose. Weather, ice, mud and water are visual studies, not grip, braking, wading or capability predictions.'}
      </p>
    </div>
  );
}
export function PartsControls({
  s,
  update,
  counts,
}: Props & { counts: Partial<Record<PartType, number>> }) {
  const zh = s.locale === 'zh';
  return (
    <div className="study-panel">
      <h3>{zh ? '按汽车零件类别拆解' : 'Parts by category'}</h3>
      <div className="part-categories">
        {partTypes.map((id) => (
          <button
            key={id}
            disabled={id !== 'all' && !counts[id]}
            aria-pressed={s.partFilter === id}
            className={s.partFilter === id ? 'active' : ''}
            onClick={() => update({ partFilter: id })}
          >
            {studyName(id, s.locale)}
            <small>
              {id === 'all'
                ? Object.values(counts).reduce((a, b) => a + (b ?? 0), 0)
                : (counts[id] ?? 0)}
            </small>
          </button>
        ))}
      </div>
      <label className="lab-toggle">
        <span>{zh ? '只显示选中类别' : 'Isolate category'}</span>
        <Switch
          checked={s.partIsolate}
          aria-label={zh ? '只显示选中类别' : 'Isolate category'}
          onCheckedChange={(partIsolate) => update({ partIsolate })}
        />
      </label>
      <div className="variant-buttons">
        {(['assemblies', 'meshes'] as const).map((id) => (
          <button
            key={id}
            aria-pressed={s.explodeMode === id}
            onClick={() => update({ explodeMode: id })}
          >
            {id === 'assemblies'
              ? zh
                ? '按装配方向展开'
                : 'Assembly directions'
              : zh
                ? '分件径向展开'
                : 'Radial mesh view'}
          </button>
        ))}
      </div>
      <div className="variant-buttons">
        {[100, 150, 200].map((value) => (
          <button
            key={value}
            aria-pressed={s.explode === value}
            onClick={() =>
              update({ explode: value, explodeMode: 'assemblies', doors: [] })
            }
          >
            {value === 100
              ? zh
                ? '展开'
                : 'Expand'
              : value === 150
                ? zh
                  ? '宽距'
                  : 'Wide'
                : zh
                  ? '最大展开'
                  : 'Maximum'}{' '}
            {value}%
          </button>
        ))}
      </div>
      <ChassisControls s={s} update={update} />
      <p className="fineprint">
        {zh
          ? '数字为模型渲染分件数，非工程零件数量。类别来自现有网格；未虚构缺失的发动机或电池内部零件。'
          : 'Counts refer to render meshes, not engineering parts. Categories use available geometry.'}
      </p>
    </div>
  );
}
export function ChassisControls({ s, update }: Props) {
  const zh = s.locale === 'zh';
  return (
    <>
      <Button
        variant="outline"
        onClick={() =>
          update({ view: 'underbody', orbit: false, transparent: false })
        }
      >
        {zh ? '从下方查看底盘' : 'View underside'}
      </Button>
      <label className="lab-toggle">
        <span>{zh ? '叠加底盘结构示意' : 'Concept chassis overlay'}</span>
        <Switch
          checked={s.chassisOverlay}
          aria-label={zh ? '叠加底盘结构示意' : 'Concept chassis overlay'}
          onCheckedChange={(chassisOverlay) =>
            update({ chassisOverlay, view: 'underbody', orbit: false })
          }
        />
      </label>
      {s.chassisOverlay && (
        <p className="fineprint">
          {zh
            ? '蓝色护板、横梁与弹簧为通用结构示意，非极氪 9X 工程底盘。'
            : 'Blue tray, crossmembers and springs are a generic layout study, not ZEEKR 9X engineering geometry.'}
        </p>
      )}
    </>
  );
}
