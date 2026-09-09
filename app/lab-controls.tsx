import { ScenarioAudioControls } from './scenario-audio-controls';
import { paintFinishes } from './paint-library';
('use client');
import { SeatingControls, EnvironmentControls } from './study-controls';
import { hmiDisplay, hmiText } from './hmi-display';
import { useEffect, useRef, useState } from 'react';
import { X, PanelTop } from 'lucide-react';
import { CmfControls } from './cmf-controls';
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
import { text } from './experience';
import { labText } from './lab-state';
import {
  scenarios,
  scenarioFrame,
  scenarioPreset,
  getScenario,
  local,
  type Journey,
} from './scenarios';
import officialVideos from './official-videos.json';
type Props = { s: Settings; update: (p: Partial<Settings>) => void };
function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="lab-toggle">
      <span>{label}</span>
      <Switch checked={value} onCheckedChange={onChange} aria-label={label} />
    </label>
  );
}
function Choice({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: { id: string; name: string }[];
  onChange: (s: string) => void;
}) {
  return (
    <div className="lab-choice">
      <span>{label}</span>
      <Select value={value} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger aria-label={label}>
          <SelectValue>
            {items.find((x) => x.id === value)?.name ?? value}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {items.map((x) => (
            <SelectItem key={x.id} value={x.id}>
              {x.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export function MaterialControls({ s, update }: Props) {
  const t = (k: string) => labText(s.locale, k);
  return (
    <div className="lab-block">
      <h3>{t('material')}</h3>
      <div className="variant-buttons">
        {paintFinishes.map((x) => (
          <button
            key={x}
            aria-pressed={s.finish === x}
            className={s.finish === x ? 'active' : ''}
            onClick={() => update({ finish: x })}
          >
            {t(x)}
          </button>
        ))}
      </div>
      <div className="variant-buttons">
        {(['softbox', 'strip'] as const).map((x) => (
          <button
            key={x}
            aria-pressed={s.lightRig === x}
            className={s.lightRig === x ? 'active' : ''}
            onClick={() => update({ lightRig: x })}
          >
            {t(x)}
          </button>
        ))}
      </div>
      <WeatherControls s={s} update={update} />
    </div>
  );
}
export function WeatherControls({ s, update }: Props) {
  return <EnvironmentControls s={s} update={update} />;
}
export function CabinControls({ s, update }: Props) {
  const t = (k: string) => labText(s.locale, k);
  return (
    <div className="lab-block">
      <CmfControls s={s} update={update} />
      <h3>{t('detail')}</h3>
      <Choice
        label={s.locale === 'zh' ? '车机应用' : 'Cockpit application'}
        value={s.cabinApp}
        items={[
          'home',
          'navigation',
          'media',
          'comfort',
          'energy',
          'parking',
        ].map((id, i) => ({
          id,
          name:
            s.locale === 'zh'
              ? [
                  '座舱首页',
                  '导航道路',
                  '音乐声场',
                  '空调舒适',
                  '能量管理',
                  '泊车视图',
                ][i]
              : ['Home', 'Navigation', 'Media', 'Comfort', 'Energy', 'Parking'][
                  i
                ],
        }))}
        onChange={(v) =>
          update({ cabinApp: v as Settings['cabinApp'], view: 'passenger' })
        }
      />
      {(
        [
          [
            'temperature',
            18,
            28,
            s.locale === 'zh' ? '空调温度' : 'Temperature',
            '°C',
          ],
          ['fan', 0, 5, s.locale === 'zh' ? '风量' : 'Fan', ''],
          [
            'volume',
            0,
            100,
            s.locale === 'zh' ? '媒体音量示意' : 'Media level concept',
            '%',
          ],
          [
            'ambientPower',
            0,
            100,
            s.locale === 'zh' ? '氛围灯亮度' : 'Ambient intensity',
            '%',
          ],
        ] as const
      ).map(([key, min, max, label, unit]) => (
        <div className="cockpit-control" key={key}>
          <div className="slider-caption">
            <h3>{label}</h3>
            <span>
              {s[key]}
              {unit}
            </span>
          </div>
          <Slider
            aria-label={label}
            min={min}
            max={max}
            step={1}
            value={[s[key]]}
            onValueChange={(v) =>
              update({
                [key]: Array.isArray(v) ? v[0] : v,
                ...(key === 'temperature' || key === 'fan'
                  ? { cabinApp: 'comfort' as const }
                  : key === 'volume'
                    ? { cabinApp: 'media' as const }
                    : {}),
              })
            }
          />
        </div>
      ))}

      <Toggle
        label={t('readingLights')}
        value={s.readingLights}
        onChange={(v) => update({ readingLights: v })}
      />
      <Toggle
        label={t('rearScreen')}
        value={s.rearScreen}
        onChange={(v) => update({ rearScreen: v, view: 'third' })}
      />
      <div className="slider-caption">
        <h3>{t('shade')}</h3>
        <span>{s.shade}%</span>
      </div>
      <Slider
        value={[s.shade]}
        min={0}
        max={100}
        aria-label={t('shade')}
        onValueChange={(v) => update({ shade: Array.isArray(v) ? v[0] : v })}
      />
      <Choice
        label={t('climate')}
        value={s.climate}
        items={['off', 'vent', 'heat', 'massage'].map((x) => ({
          id: x,
          name: t(x),
        }))}
        onChange={(v) =>
          update({ climate: v as Settings['climate'], view: 'second' })
        }
      />
      <div className="divider" />
      <SeatingControls s={s} update={update} />
      <EnvironmentControls s={s} update={update} />
      <p className="fineprint">{t('spaceNote')}</p>
      <p className="fineprint">
        {s.locale === 'zh'
          ? '新增顶棚、阅读灯、饰条与屏幕机构为参考官方视频的造型补充；座椅主网格尚未完成独立旋转／躺倒绑定。'
          : 'Roof trim, reading lamps and screen mechanism are video-informed design additions. Individual seat rotation / recline rigging remains incomplete.'}
      </p>
      <VideoReferences s={s} />
    </div>
  );
}
export function HmiControls({ s, update }: Props) {
  const [family, setFamily] = useState<'aHMI' | 'iHMI'>(
      () => getScenario(s.hmi).family,
    ),
    [journey, setJourney] = useState<Journey | 'all'>('all'),
    [audioNote, setAudioNote] = useState('');
  const t = (k: string) => labText(s.locale, k),
    f = scenarioFrame(s.hmi, s.progress),
    filtered = scenarios.filter(
      (x) =>
        x.family === family && (journey === 'all' || journey === x.journey),
    );
  function narrate() {
    if (!('speechSynthesis' in window)) {
      setAudioNote(
        s.locale === 'zh'
          ? '当前浏览器不支持语音朗读。'
          : 'Speech synthesis is unavailable.',
      );
      return;
    }
    const utterance = new SpeechSynthesisUtterance(local(f.step, s.locale));
    utterance.lang = s.locale === 'zh' ? 'zh-CN' : 'en-US';
    utterance.rate = 0.95;
    utterance.volume = 0.65;
    utterance.onerror = () =>
      setAudioNote(
        s.locale === 'zh'
          ? '当前语音服务未能完成朗读。'
          : 'Speech service could not complete the request.',
      );
    window.speechSynthesis.speak(utterance);
  }
  function haptic() {
    const ok =
      typeof navigator.vibrate === 'function' &&
      navigator.vibrate([40, 60, 40]);
    setAudioNote(
      s.locale === 'zh'
        ? ok
          ? '已请求设备短震动；不代表实车方向盘反馈。'
          : '此设备不支持网页震动，保留视觉与声音反馈。'
        : ok
          ? 'Device vibration requested; not vehicle steering feedback.'
          : 'Web vibration unavailable; visual and audio feedback remain.',
    );
  }
  return (
    <>
      <div className="panel-heading">
        <span>04 / SCENARIO THEATRE</span>
        <h2>{t('library')}</h2>
      </div>
      <p className="fineprint">{t('concept')}</p>
      <div className="variant-buttons">
        {(['aHMI', 'iHMI'] as const).map((x) => (
          <button
            key={x}
            className={family === x ? 'active' : ''}
            onClick={() => {
              setFamily(x);
              setJourney('all');
              update(scenarioPreset(scenarios.find((c) => c.family === x)!.id));
            }}
          >
            {x} /{' '}
            {x === 'aHMI'
              ? s.locale === 'zh'
                ? '驾驶安全'
                : 'Driving'
              : s.locale === 'zh'
                ? '座舱体验'
                : 'Cabin'}
          </button>
        ))}
      </div>
      <Choice
        label={t('all')}
        value={journey}
        items={[
          'all',
          'before',
          'entry',
          'driving',
          'parking',
          'parked',
          'exit',
        ].map((x) => ({ id: x, name: t(x) }))}
        onChange={(v) => {
          setJourney(v as Journey | 'all');
          const first = scenarios.find(
            (x) => x.family === family && (v === 'all' || x.journey === v),
          );
          if (first) update(scenarioPreset(first.id));
        }}
      />
      {filtered.length ? (
        <Choice
          label={`${filtered.length} / SCENARIOS`}
          value={filtered.some((x) => x.id === s.hmi) ? s.hmi : ''}
          items={filtered.map((x) => ({
            id: x.id,
            name: local(x.title, s.locale),
          }))}
          onChange={(id) => update(scenarioPreset(id))}
        />
      ) : (
        <p className="fineprint">
          {s.locale === 'zh'
            ? '此分类下没有该旅程的场景。'
            : 'No scenarios in this category and journey.'}
        </p>
      )}
      <div className="scenario-card">
        <small>
          {f.scenario.family} / {t(f.scenario.journey)}
        </small>
        <h3>{local(f.scenario.title, s.locale)}</h3>
        <p>{local(f.scenario.trigger, s.locale)}</p>
        <ol>
          {f.scenario.steps.map((step, i) => (
            <li key={i} className={i === f.phase ? 'current' : ''}>
              <button
                onClick={() =>
                  update({ progress: i * 0.25 + 0.001, playing: false })
                }
              >
                <b>0{i + 1}</b>
                {local(step, s.locale)}
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div className="button-pair">
        <Button
          onClick={() =>
            update({
              playing: !s.playing,
              ...(s.progress === 1 ? { progress: 0 } : {}),
            })
          }
        >
          {t(s.playing ? 'pause' : 'start')}
        </Button>
        <Button
          variant="ghost"
          onClick={() => update({ playing: false, progress: 0 })}
        >
          {t('reset')}
        </Button>
      </div>
      <Slider
        value={[Math.round(s.progress * 100)]}
        min={0}
        max={100}
        step={1}
        aria-label={t('timeline')}
        onValueChange={(v) =>
          update({
            progress: (Array.isArray(v) ? v[0] : v) / 100,
            playing: false,
          })
        }
      />
      <div className="timeline-labels">
        <span>00</span>
        <span>16 s / DEMO</span>
      </div>
      <ScenarioAudioControls s={s} />
      <WeatherControls s={s} update={update} />
      <Toggle
        label={text(s.locale, 'transparent')}
        value={s.transparent}
        onChange={(v) => update({ transparent: v })}
      />
      <Toggle
        label={text(s.locale, 'radar')}
        value={s.radar}
        onChange={(v) => update({ radar: v })}
      />
      <div className="button-pair">
        <Button variant="ghost" onClick={narrate}>
          {s.locale === 'zh' ? '朗读当前提示' : 'Read current prompt'}
        </Button>
        <Button variant="ghost" onClick={haptic}>
          {s.locale === 'zh' ? '体验设备震动' : 'Try device vibration'}
        </Button>
      </div>
      {audioNote && <output className="fineprint">{audioNote}</output>}
      <p className="fineprint">
        {s.locale === 'zh'
          ? '场景数值、感知扇区、倒计时与制动曲线用于讲解交互；不是车辆实测参数。行车态仅展示精简信息，娱乐与设置放在驻车态。'
          : 'Values, coverage sectors, timers and braking curves illustrate interaction; they are not measured vehicle performance. Driving views minimise information; entertainment and setup are parked-only.'}
      </p>
      <p className="pattern-refs">
        HMI-031 · 035 · 037 · 039 · 054 · 073 · 074
      </p>
      {f.scenario.effect === 'impact' && (
        <>
          <p className="fineprint">
            {s.locale === 'zh'
              ? '保护框仅标识乘员区域，不包含材料强度、受力、变形或伤害计算。本作品没有核验极氪 9X 的独立碰撞评级。'
              : 'The protection frame identifies the cabin only; it does not calculate strength, force, deformation or injury. No independent 9X crash rating has been verified for this study.'}
          </p>
          <a
            className="text-action"
            href="https://www.zeekrgroup.com/news/202509291"
            target="_blank"
            rel="noreferrer"
          >
            {s.locale === 'zh'
              ? '官方发布与测试说明'
              : 'Official launch and test context'}{' '}
            ↗
          </a>
        </>
      )}
    </>
  );
}
export function HmiOverlay({ s }: Pick<Props, 's'>) {
  const [expanded, setExpanded] = useState(true);
  const toggleButton = useRef<HTMLButtonElement>(null);
  const interacted = useRef(false);
  useEffect(() => {
    if (interacted.current) toggleButton.current?.focus();
  }, [expanded]);
  const toggle = () => {
    interacted.current = true;
    setExpanded((v) => !v);
  };
  const f = hmiDisplay(s),
    t = (key: string) => hmiText(s.locale, key);
  if (!expanded)
    return (
      <button
        ref={toggleButton}
        type="button"
        className="hmi-instrument cluster hmi-collapsed"
        onClick={toggle}
        aria-label={t('show')}
        aria-expanded={false}
      >
        <PanelTop size={16} aria-hidden="true" />
        {t('show')}
      </button>
    );
  return (
    <div
      className={'hmi-instrument cluster ' + f.tone}
      aria-label={t('concept')}
    >
      <div className="cluster-status">
        <span>
          <i />
          {t(f.signal)}
        </span>
        <div className="cluster-window-actions">
          <small>{t('concept')}</small>
          <button
            ref={toggleButton}
            type="button"
            className="cluster-close"
            onClick={toggle}
            aria-label={t('close')}
            title={t('close')}
            aria-expanded={true}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="cluster-main">
        <div className="cluster-speed">
          <strong>{f.speed || f.gear}</strong>
          <span>{f.speed ? `km/h · ${f.gear}` : '0 km/h'}</span>
        </div>
        <svg className="cluster-road" viewBox="0 0 130 110" aria-hidden="true">
          {f.lane && (
            <g
              fill="none"
              stroke={f.fault ? '#667176' : '#70beb5'}
              strokeWidth="2"
            >
              <path d="M19 108 Q38 65 49 0" />
              <path d="M111 108 Q92 65 81 0" />
              <path d="M65 4 L65 42" strokeDasharray="7 8" opacity=".3" />
            </g>
          )}
          {f.coverage && (
            <g fill="none" stroke="currentColor" opacity=".35">
              <path d="M37 47 Q65 25 93 47" />
              <path d="M43 39 Q65 16 87 39" />
            </g>
          )}
          <g fill="#aebdc4" stroke="#d8e0e2" strokeWidth="1.2">
            <path d="M54 47 Q65 41 76 47 L80 89 Q65 98 50 89 Z" />
            <path d="M56 54 L74 54 L76 64 L54 64 Z" fill="#1a2931" />
            <path d="M55 82 L75 82 L74 88 L56 88 Z" fill="#1a2931" />
          </g>
          {s.doors.includes('Door_LF') && (
            <path d="M50 63 L37 71" stroke="#f3ba72" strokeWidth="3" />
          )}
          {s.doors.includes('Door_RF') && (
            <path d="M80 63 L93 71" stroke="#f3ba72" strokeWidth="3" />
          )}
          {s.doors.includes('Door_LB') && (
            <path d="M50 77 L37 85" stroke="#f3ba72" strokeWidth="3" />
          )}
          {s.doors.includes('Door_RB') && (
            <path d="M80 77 L93 85" stroke="#f3ba72" strokeWidth="3" />
          )}
          {f.alert && (
            <path
              d="M43 29 Q65 12 87 29"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
            />
          )}
        </svg>
        <div className="cluster-guidance">
          <small>{local(f.scenario.title, s.locale)}</small>
          <output>
            {f.countdown !== null ? t('takeover') : local(f.step, s.locale)}
          </output>
          {f.countdown !== null ? (
            <div className="cluster-countdown">
              <b>{f.countdown}</b>
              <span>s · {local(f.step, s.locale)}</span>
            </div>
          ) : (
            <div className="cluster-phase">
              {f.scenario.steps.map((_, i) => (
                <i key={i} className={i <= f.phase ? 'complete' : ''} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="cluster-footer">
        <span>
          <i className="cluster-battery">
            <i style={{ width: `${f.energy}%` }} />
          </i>
          {f.energy}%
        </span>
        <span>
          {t('cabin')} {s.temperature}°C
        </span>
        <span className={s.doors.length ? 'caution' : ''}>
          {t(s.doors.length ? 'open' : 'doors')}
        </span>
        {s.occupant && (
          <span className={!s.seatbelt ? 'caution' : ''}>
            {t(s.seatbelt ? 'belt' : 'unbelt')}
          </span>
        )}
      </div>
      <div className="instrument-progress">
        <i style={{ width: `${f.p * 100}%` }} />
      </div>
    </div>
  );
}
export function VideoReferences({ s }: Pick<Props, 's'>) {
  const [video, setVideo] = useState<number | null>(null);
  const t = (k: string) => labText(s.locale, k);
  return (
    <details className="video-references">
      <summary>{t('evidence')}</summary>
      <p className="fineprint">
        {s.locale === 'zh'
          ? '极氪官方公开页面视频，仅作细节参考；由原站播放。'
          : 'Public ZEEKR reference videos, served from their original source.'}
      </p>
      <div className="video-links">
        {officialVideos.map((v, i) => (
          <button
            key={v.url}
            onClick={() => setVideo(i)}
            className={video === i ? 'active' : ''}
          >
            {s.locale === 'zh' ? v.title : v.en} ↗
          </button>
        ))}
      </div>
      {video !== null && (
        <>
          {/* Original third-party clip has no supplied caption track. Visual descriptions are provided separately; no transcript is fabricated. */}
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            key={video}
            controls
            playsInline
            preload="metadata"
            src={officialVideos[video].url}
          >
            <track
              kind="descriptions"
              src={`/references/video-${video}.vtt`}
              srcLang="zh"
              label="画面说明 / Visual description"
            />
          </video>
          <a href={officialVideos[video].url} target="_blank" rel="noreferrer">
            {s.locale === 'zh' ? '原站视频链接' : 'Original video link'} ↗
          </a>
        </>
      )}
    </details>
  );
}
