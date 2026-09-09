'use client';
import {
  qualityModes,
  qualityLabel,
  type QualityMode,
  type QualityStatus,
} from './render-quality';
import {
  resetScene,
  saveScene,
  restoreScene,
  sessionText,
} from './scene-session';
import { entranceCopy, showcaseCopy } from './entrance';
import { ShowroomDock, QuickAccess, showroomText } from './showroom-dock';
import { GlassControls } from './glass-controls';
import { PartsControls, ChassisControls } from './study-controls';
import type { PartType } from './study-state';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Globe2,
  Layers3,
  Lightbulb,
  Maximize,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Share2,
  Camera,
  MoveUpRight,
  CarFront,
  Armchair,
  ScanLine,
  X,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  defaults,
  text,
  locales,
  paints,
  groups,
  readSettings,
  shareUrl,
  type Settings,
  type Locale,
  type Section,
  type PartGroup,
  type View,
} from './experience';
import {
  MaterialControls,
  CabinControls,
  HmiControls,
  HmiOverlay,
} from './lab-controls';
import { labText } from './lab-state';
import { scenarioPreset } from './scenarios';
import type { Viewer } from './viewer';
import { HotspotLayer, type HotspotHandle } from './hotspot-layer';
const sectionIcons = {
  exterior: CarFront,
  interior: Armchair,
  structure: Layers3,
  safety: ScanLine,
  story: MoveUpRight,
};
const fourDoors = ['Door_LF', 'Door_RF', 'Door_LB', 'Door_RB'];
const Toggle = ({
  id,
  locale,
  active,
  onClick,
}: {
  id: string;
  locale: Locale;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    className={'toggle-row ' + (active ? 'is-on' : '')}
    onClick={onClick}
    aria-pressed={active}
  >
    <span>{text(locale, id)}</span>
    <span className="toggle-track">
      <i />
    </span>
  </button>
);

export default function Home() {
  const [s, setS] = useState<Settings>(defaults),
    [ready, setReady] = useState(false),
    [loaded, setLoaded] = useState(false),
    [entering, setEntering] = useState(false),
    [tourChapter, setTourChapter] = useState(-1),
    [progress, setProgress] = useState(0),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0),
    [count, setCount] = useState(0),
    [partCounts, setPartCounts] = useState<Partial<Record<PartType, number>>>(
      {},
    ),
    [dialog, setDialog] = useState(''),
    [toast, setToast] = useState(''),
    [link, setLink] = useState(''),
    [full, setFull] = useState(false),
    [quality, setQuality] = useState<QualityStatus>({
      mode: 'auto',
      tier: 'balanced',
    }),
    [drawer, setDrawer] = useState(false);
  const hotspotLayer = useRef<HotspotHandle>(null);
  const host = useRef<HTMLDivElement>(null),
    viewer = useRef<Viewer | null>(null),
    stateRef = useRef(s),
    root = useRef<HTMLElement>(null),
    reduced = useRef(false);
  useEffect(() => {
    stateRef.current = s;
  }, [s]);
  const tr = (key: string) => {
    const v = text(s.locale, key);
    return v === key ? labText(s.locale, key) : v;
  };
  const update = (patch: Partial<Settings>) =>
    setS((v) => ({ ...v, ...patch }));
  const pick = useCallback((id: string) => {
    setS((v) => {
      if (id.startsWith('part:'))
        return { ...v, partFilter: id.slice(5) as PartType };
      if (v.section === 'structure' && groups.includes(id as PartGroup))
        return { ...v, selected: id as PartGroup };
      if (fourDoors.includes(id))
        return {
          ...v,
          doors: v.doors.includes(id)
            ? v.doors.filter((d) => d !== id)
            : [...v.doors, id],
        };
      if (id === 'screen')
        return { ...v, rearScreen: !v.rearScreen, view: 'third' };
      if (id === 'seat')
        return { ...v, climate: v.climate === 'off' ? 'massage' : 'off' };
      if (id === 'readingLights')
        return { ...v, readingLights: !v.readingLights };
      if (id === 'lights') return { ...v, lights: !v.lights };
      if (id === 'driver')
        return {
          ...v,
          section: 'interior',
          view: 'driver',
          explode: 0,
          orbit: false,
        };
      if (id === 'ambient')
        return {
          ...v,
          ambient: v.ambient === '#e6ad77' ? '#80c5e7' : '#e6ad77',
        };
      return v;
    });
  }, []);
  useEffect(() => {
    const value = readSettings();
    reduced.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduced.current) value.orbit = false;
    // Synchronise initial state from the external URL after hydration.
    // eslint-disable-next-line react/react-compiler
    setS(value);
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || !host.current) return;
    const mount = host.current;
    let cancelled = false;
    setError(false);
    setLoaded(false);
    setEntering(false);
    setTourChapter(-1);
    import('./viewer')
      .then(({ createViewer }) =>
        createViewer(
          host.current!,
          stateRef.current,
          setProgress,
          (value) => hotspotLayer.current?.update(value),
          pick,
          (n, parts) => {
            setCount(n);
            setPartCounts(parts);
          },
          (p) =>
            setS((v) => ({ ...v, progress: p, playing: p < 1 && v.playing })),
          {
            reducedMotion: reduced.current,
            onQuality: (value) => {
              if (!cancelled) setQuality(value);
            },
            onChange: (active) => {
              if (!cancelled) {
                setEntering(active);
                if (!active) setTourChapter(-1);
              }
            },
            onChapter: (chapter) => {
              if (!cancelled) setTourChapter(chapter);
            },
            onExplore: (value) => {
              if (!cancelled) setS(value);
            },
          },
        ),
      )
      .then((v) => {
        if (cancelled) {
          v.dispose();
          return;
        }
        viewer.current = v;
        v.apply(stateRef.current);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      viewer.current?.dispose();
      viewer.current = null;
      mount.replaceChildren();
    };
  }, [ready, retry, pick]);
  useEffect(() => {
    viewer.current?.apply(s);
    document.documentElement.lang = s.locale;
    document.documentElement.dir = s.locale === 'ar' ? 'rtl' : 'ltr';
  }, [s]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    const change = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', change);
    return () => document.removeEventListener('fullscreenchange', change);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (entering) {
        if (e.key === 'Escape') viewer.current?.skipEntrance();
        return;
      }
      if (e.key === 'Escape') setDrawer(false);
      if (
        (e.target as HTMLElement).closest(
          'input,button,select,textarea,[role=slider],[role=dialog]',
        )
      )
        return;
      if (e.key.toLowerCase() === 'l')
        setS((v) => ({ ...v, lights: !v.lights }));
      if (e.key === 'Escape')
        setS((v) => ({ ...v, isolated: false, selected: null }));
      const views: View[] = [
        'hero',
        'front',
        'side',
        'rear',
        'driver',
        'second',
      ];
      const i = Number(e.key) - 1;
      if (i >= 0 && i < 6)
        setS((v) => ({
          ...v,
          view: views[i],
          section: i >= 4 ? 'interior' : 'exterior',
          orbit: false,
        }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [entering]);
  const section = (sec: Section) => {
    setDrawer(sec === 'structure' || sec === 'safety');
    update({
      section: sec,
      view: sec === 'interior' ? 'passenger' : 'hero',
      explode: 0,
      hidden: [],
      selected: null,
      isolated: false,
      orbit: false,
      playing: false,
      progress: 0,
      ...(sec === 'safety' ? scenarioPreset(s.hmi) : {}),
      ...(sec !== 'safety' ? { transparent: false } : {}),
    });
  };
  const changeView = (v: View) => update({ view: v, orbit: false });
  const toggleDoor = (d: string) =>
    update({
      doors: s.doors.includes(d)
        ? s.doors.filter((x) => x !== d)
        : [...s.doors, d],
    });
  const toastMessage = (k: string) => setToast(tr(k));
  const share = async () => {
    const u = shareUrl(s);
    try {
      await navigator.clipboard.writeText(u);
      toastMessage('copied');
    } catch {
      setLink(u);
      setDialog('share');
    }
  };
  const download = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };
  const capture = () => {
    if (viewer.current)
      download(viewer.current.capture(), 'ZEEKR-9X-experience.png');
  };
  const card = () => {
    const data = `ZEEKR 9X / INTERACTIVE DESIGN STUDY\n\n${tr('paint')}: ${tr(s.paint)}\n${tr('day')} / ${tr('night')}: ${tr(s.mode)}\n${tr('hero')}: ${tr(s.view)}\n\n${shareUrl(s)}\n\n${tr('study')}\n${tr('sourceText')}`;
    const u = URL.createObjectURL(
      new Blob([data], { type: 'text/plain;charset=utf-8' }),
    );
    download(u, 'ZEEKR-9X-experience.txt');
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch {
      setToast(tr('error'));
    }
  };
  const tour = (i: number) => {
    if (i === 1)
      update({
        ...defaults,
        locale: s.locale,
        section: 'story',
        paint: 'silver',
        orbit: !reduced.current,
      });
    if (i === 2)
      update({
        ...defaults,
        locale: s.locale,
        section: 'story',
        view: 'rear',
        mode: 'night',
        lights: true,
      });
    if (i === 3)
      update({
        ...defaults,
        locale: s.locale,
        section: 'interior',
        view: 'second',
        hud: false,
      });
    if (i === 4)
      update({
        ...defaults,
        locale: s.locale,
        section: 'structure',
        explode: 65,
        selected: 'doors',
      });
  };
  const interior = [
    'driver',
    'passenger',
    'second',
    'third',
    'second-left',
    'second-right',
    'third-left',
    'third-right',
  ].includes(s.view);
  return (
    <main
      ref={root}
      className={
        'experience showroom ' +
        (drawer ? 'has-drawer ' : '') +
        (entering ? 'is-entering ' : '') +
        (tourChapter >= 0 ? 'is-showcasing ' : '') +
        (s.mode === 'night' || interior ? 'is-dark' : '') +
        ' ' +
        (s.locale === 'ar' ? 'rtl' : '')
      }
    >
      <header className="site-header" inert={entering && tourChapter < 0}>
        {/* A full-page reset intentionally discards the transient 3D session. */}
        {/* eslint-disable-next-line next/no-html-link-for-pages */}
        <a className="wordmark" href="/" aria-label="ZEEKR 9X experience">
          ZEEKR<span>9X</span>
        </a>
        <nav
          className="section-nav showroom-nav"
          aria-label="Experience sections"
        >
          {(
            [
              'exterior',
              'interior',
              'structure',
              'safety',
              'story',
            ] as Section[]
          ).map((sec) => {
            const Icon = sectionIcons[sec];
            return (
              <button
                key={sec}
                onClick={() => section(sec)}
                className={s.section === sec ? 'active' : ''}
                aria-current={s.section === sec ? 'page' : undefined}
              >
                <Icon size={18} />
                <span>{tr(sec)}</span>
              </button>
            );
          })}
        </nav>
        <div className="header-actions">
          <Select
            value={s.locale}
            onValueChange={(v) => v && update({ locale: v as Locale })}
          >
            <SelectTrigger aria-label="Language / 语言" className="language">
              <Globe2 size={14} />
              <SelectValue>{locales[s.locale]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(locales).map(([value, name]) => (
                <SelectItem key={value} value={value}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            className="configure-top"
            onClick={() => setDrawer(!drawer)}
            aria-expanded={drawer}
            aria-controls="experience-controls"
          >
            {showroomText(s.locale, drawer ? 'close' : 'configure')}
          </button>
          <Button variant="ghost" className="share-top" onClick={share}>
            <Share2 size={15} />
            {tr('share')}
          </Button>
        </div>
      </header>
      <div className="scene-layout" inert={entering && tourChapter < 0}>
        <div className="stage" data-scene={s.mode}>
          <div className="viewer-host" ref={host} />
          {!interior && s.section !== 'safety' && (
            <div className="model-title">
              <p>ZEEKR 9X / EXPLORER</p>
              <h1>ZEEKR 9X</h1>
              <h2>{tr('tagline')}</h2>
            </div>
          )}
          {s.section === 'exterior' && <QuickAccess s={s} update={update} />}
          <fieldset
            className="scene-tabs"
            aria-label={`${tr('day')} / ${tr('night')}`}
          >
            {(['day', 'night'] as const).map((m) => (
              <button
                key={m}
                onClick={() => update({ mode: m })}
                aria-pressed={s.mode === m}
                className={s.mode === m ? 'active' : ''}
              >
                {tr(m)}
              </button>
            ))}
          </fieldset>
          <div className="tools">
            <button
              aria-label={tr('zoomIn')}
              onClick={() => viewer.current?.zoom(0.85)}
              disabled={!loaded}
            >
              <Plus />
            </button>
            <button
              aria-label={tr('zoomOut')}
              onClick={() => viewer.current?.zoom(1.15)}
              disabled={!loaded}
            >
              <Minus />
            </button>
            <i />
            <button
              aria-label={tr('capture')}
              onClick={capture}
              disabled={!loaded}
            >
              <Camera />
            </button>
            <button
              aria-label={tr(full ? 'exitFull' : 'fullscreen')}
              onClick={fullscreen}
            >
              <Maximize />
            </button>
            <button
              aria-label={sessionText(s.locale, 'resetScene')}
              title={sessionText(s.locale, 'resetScene')}
              onClick={() => update(resetScene(s))}
            >
              <RotateCcw />
            </button>
          </div>
          <HotspotLayer
            ref={hotspotLayer}
            loaded={loaded}
            locale={s.locale}
            onPick={pick}
          />
          {!loaded && !error && (
            <div className="loading">
              <div className="loading-word">9X</div>
              <h3>{tr('loading')}</h3>
              <div className="load-line">
                <i style={{ width: `${progress}%` }} />
              </div>
              <small>
                {progress}% · {tr('loadingNote')}
              </small>
            </div>
          )}
          {error && (
            <div className="load-error">
              {/* Model fallback is a local static reference; no image service required. */}
              {/* eslint-disable-next-line next/no-img-element */}
              <img
                src="/model-reference.png"
                alt="ZEEKR 9X Blender model reference"
              />
              <p>{tr('error')}</p>
              <Button onClick={() => setRetry((v) => v + 1)}>
                {tr('retry')}
              </Button>
            </div>
          )}
          {s.section === 'safety' && <HmiOverlay s={s} />}
          <div className="stage-bottom">
            <div className="view-presets" aria-label={tr('hero')}>
              {(s.section === 'safety'
                ? ['hero', 'top', 'front', 'rear', 'driver', 'second', 'third']
                : interior
                  ? ['driver', 'passenger', 'second', 'third']
                  : ['hero', 'front', 'side', 'rear']
              ).map((v) => (
                <button
                  className={s.view === v ? 'active' : ''}
                  key={v}
                  onClick={() => changeView(v as View)}
                >
                  {tr(v)}
                </button>
              ))}
              {!interior && s.section !== 'safety' && (
                <button
                  className={'orbit ' + (s.orbit ? 'active' : '')}
                  onClick={() => update({ orbit: !s.orbit })}
                  aria-pressed={s.orbit}
                  aria-label={tr('orbit')}
                >
                  {s.orbit ? <Pause size={13} /> : <Play size={13} />}
                  <span>{tr('orbit')}</span>
                </button>
              )}
            </div>
            <p>{tr(interior ? 'cabinHint' : 'hint')}</p>
          </div>
          <ShowroomDock
            s={s}
            update={update}
            open={() => setDrawer(true)}
            tour={tour}
          />
          <button
            className="mobile-controls"
            onClick={() => setDrawer(!drawer)}
            aria-expanded={drawer}
          >
            <Layers3 size={16} />
            {tr(s.section)}
          </button>
        </div>
        <aside
          id="experience-controls"
          className="control-panel"
          style={{ display: drawer ? undefined : 'none' }}
        >
          <div className="drawer-heading">
            <div>
              <small>{showroomText(s.locale, 'controls')}</small>
              <h2>{tr(s.section)}</h2>
            </div>
            <button
              aria-label={showroomText(s.locale, 'close')}
              onClick={() => setDrawer(false)}
            >
              <X size={19} />
            </button>
          </div>
          <div className="panel-content">
            {['exterior', 'interior'].includes(s.section) && (
              <GlassControls s={s} update={update} />
            )}
            {s.section === 'exterior' && (
              <>
                <div className="panel-heading">
                  <span>01 / PERSONALISE</span>
                  <h2>{tr('paint')}</h2>
                </div>
                <div className="swatches">
                  {paints.map((p) => (
                    <button
                      key={p.id}
                      className={s.paint === p.id ? 'chosen' : ''}
                      style={{ background: p.hex }}
                      aria-label={tr(p.id)}
                      aria-pressed={s.paint === p.id}
                      onClick={() => update({ paint: p.id })}
                    >
                      {s.paint === p.id && <Check size={16} />}
                    </button>
                  ))}
                </div>
                <div className="selection-caption">
                  <b>{tr(s.paint)}</b>
                  <span>METALLIC</span>
                </div>
                <p className="fineprint">{tr('conceptPaint')}</p>
                <MaterialControls s={s} update={update} />
                <div className="divider" />
                <div className="variant-buttons detail-presets">
                  {(['wheel-detail', 'light-detail', 'hero'] as View[]).map(
                    (v) => (
                      <button
                        key={v}
                        className={s.view === v ? 'active' : ''}
                        onClick={() => changeView(v)}
                      >
                        {tr(v)}
                      </button>
                    ),
                  )}
                </div>
                <h3>{tr('wheelStyle')}</h3>
                <div className="variant-buttons">
                  {(['mirror', 'turbine', 'sport'] as const).map((v) => (
                    <button
                      key={v}
                      className={s.wheelStyle === v ? 'active' : ''}
                      onClick={() =>
                        update({
                          wheelStyle: v,
                          view: 'wheel-detail',
                          orbit: false,
                        })
                      }
                    >
                      {tr(v)}
                    </button>
                  ))}
                </div>
                <h3>{tr('tireStyle')}</h3>
                <div className="variant-buttons">
                  {(['road', 'touring'] as const).map((v) => (
                    <button
                      key={v}
                      className={s.tireStyle === v ? 'active' : ''}
                      onClick={() =>
                        update({
                          tireStyle: v,
                          view: 'wheel-detail',
                          orbit: false,
                        })
                      }
                    >
                      {tr(v)}
                    </button>
                  ))}
                </div>
                <p className="fineprint">{tr('variantNote')}</p>
                <div className="divider" />
                <h3>{tr('access')}</h3>
                <div className="door-grid">
                  {[...fourDoors, 'Trunk_up', 'Hood'].map((d) => (
                    <button
                      className={s.doors.includes(d) ? 'active' : ''}
                      key={d}
                      aria-pressed={s.doors.includes(d)}
                      onClick={() => toggleDoor(d)}
                    >
                      <span className="door-glyph">↗</span>
                      {tr(d)}
                    </button>
                  ))}
                </div>
                <button
                  className="text-action"
                  onClick={() =>
                    update({ doors: s.doors.length ? [] : fourDoors })
                  }
                >
                  {tr(s.doors.length ? 'closeAll' : 'openAll')}
                  <ChevronRight size={14} />
                </button>
                <div className="divider" />
                <Toggle
                  locale={s.locale}
                  id="lights"
                  active={s.lights}
                  onClick={() => update({ lights: !s.lights })}
                />
                <Toggle
                  locale={s.locale}
                  id="hazards"
                  active={s.hazards}
                  onClick={() => update({ hazards: !s.hazards })}
                />
              </>
            )}
            {s.section === 'exterior' && (
              <ChassisControls s={s} update={update} />
            )}
            {s.section === 'interior' && (
              <>
                <div className="panel-heading">
                  <span>02 / PRIVATE LOUNGE</span>
                  <h2>{tr('space')}</h2>
                </div>
                <p className="intro">{tr('cabinHint')}</p>
                <CabinControls s={s} update={update} />
                <div className="seat-map">
                  {(['driver', 'second', 'third'] as View[]).map((v, i) => (
                    <button
                      key={v}
                      className={s.view === v ? 'active' : ''}
                      onClick={() => changeView(v)}
                    >
                      <Armchair size={22} />
                      <Armchair size={22} />
                      <span>
                        0{i + 1} / {tr(v)}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="divider" />
                <h3>{tr('seatStyle')}</h3>
                <div className="variant-buttons">
                  {(['blue', 'ivory', 'cognac'] as const).map((v) => (
                    <button
                      key={v}
                      className={s.seatStyle === v ? 'active' : ''}
                      onClick={() => update({ seatStyle: v })}
                    >
                      {tr(v)}
                    </button>
                  ))}
                </div>
                <h3>{tr('backrest')}</h3>
                <div className="variant-buttons">
                  {(['A', 'B'] as const).map((v) => (
                    <button
                      key={v}
                      className={s.backrest === v ? 'active' : ''}
                      onClick={() => update({ backrest: v })}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <p className="fineprint">{tr('backrestNote')}</p>
                <div className="divider" />
                <h3>{tr('ambient')}</h3>
                <div className="swatches ambient-swatches">
                  {['#e6ad77', '#f1d8ae', '#80c5e7', '#b9a2df'].map((c) => (
                    <button
                      aria-label={c}
                      key={c}
                      className={s.ambient === c ? 'chosen' : ''}
                      style={{ background: c }}
                      onClick={() => update({ ambient: c })}
                    >
                      {s.ambient === c && <Check size={15} />}
                    </button>
                  ))}
                </div>
                <Toggle
                  locale={s.locale}
                  id="hud"
                  active={s.hud}
                  onClick={() => update({ hud: !s.hud, view: 'driver' })}
                />
                <p className="fineprint">{tr('hudNote')}</p>
                <Toggle
                  locale={s.locale}
                  id="hotspots"
                  active={s.hotspots}
                  onClick={() => update({ hotspots: !s.hotspots })}
                />
              </>
            )}
            {s.section === 'structure' && (
              <>
                <div className="panel-heading">
                  <span>03 / INSIDE THE DESIGN</span>
                  <h2>{tr('structure')}</h2>
                </div>
                <p className="intro">
                  {count} {tr('parts')}
                </p>
                <PartsControls s={s} update={update} counts={partCounts} />
                <div className="group-list">
                  {groups.map((g, i) => (
                    <div className={s.selected === g ? 'active' : ''} key={g}>
                      <button
                        onClick={() =>
                          update({ selected: s.selected === g ? null : g })
                        }
                      >
                        <small>0{i + 1}</small>
                        {tr(g)}
                      </button>
                      <button
                        aria-label={
                          tr(s.hidden.includes(g) ? 'show' : 'hide') +
                          ' ' +
                          tr(g)
                        }
                        onClick={() =>
                          update({
                            hidden: s.hidden.includes(g)
                              ? s.hidden.filter((x) => x !== g)
                              : [...s.hidden, g],
                          })
                        }
                      >
                        {s.hidden.includes(g) ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="button-pair">
                  <Button
                    variant="outline"
                    disabled={!s.selected}
                    onClick={() => update({ isolated: !s.isolated })}
                    aria-pressed={s.isolated}
                  >
                    {tr('isolate')}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      update({ isolated: false, hidden: [], selected: null })
                    }
                  >
                    {tr('showAll')}
                  </Button>
                </div>
                <div className="divider" />
                <div className="slider-caption">
                  <h3>{tr('explode')}</h3>
                  <span>{s.explode}%</span>
                </div>
                <Slider
                  aria-label={tr('explode')}
                  value={[s.explode]}
                  min={0}
                  max={200}
                  step={1}
                  onValueChange={(v) =>
                    update({ explode: Array.isArray(v) ? v[0] : v })
                  }
                />
                <p className="fineprint">{tr('explodeNote')}</p>
                <button
                  className="text-action"
                  onClick={() => update({ explode: 0, doors: [] })}
                >
                  {tr('assemble')}
                  <RotateCcw size={14} />
                </button>
              </>
            )}
            {s.section === 'safety' && <HmiControls s={s} update={update} />}
            {s.section === 'story' && (
              <>
                <div className="panel-heading">
                  <span>05 / AN INVITATION</span>
                  <h2>{tr('tourTitle')}</h2>
                </div>
                <p className="intro">{tr('tourIntro')}</p>
                <Button
                  className="wide-button"
                  disabled={!loaded || reduced.current}
                  onClick={() => viewer.current?.replayEntrance()}
                >
                  <Play size={16} />
                  {sessionText(s.locale, 'replay')}
                </Button>
                <div className="tour-list">
                  {[1, 2, 3, 4].map((i) => (
                    <button key={i} onClick={() => tour(i)}>
                      <span>{tr('chapter' + i)}</span>
                      <ArrowUpRight size={18} />
                    </button>
                  ))}
                </div>
                <div className="divider" />
                <h3>{tr('about')}</h3>
                <p className="intro">{tr('aboutText')}</p>
                <Button className="wide-button" onClick={card}>
                  {tr('saveCard')}
                  <ArrowUpRight size={16} />
                </Button>
              </>
            )}
          </div>
          <div className="session-actions">
            <button
              disabled={!loaded}
              onClick={() => update({ ...defaults, locale: s.locale })}
            >
              {tr('reset')}
            </button>
            <button
              disabled={!loaded}
              onClick={() =>
                setToast(
                  sessionText(s.locale, saveScene(s) ? 'saved' : 'failed'),
                )
              }
            >
              {sessionText(s.locale, 'save')}
            </button>
            <button
              disabled={!loaded}
              onClick={() => {
                const saved = restoreScene();
                if (saved) update(saved);
                setToast(sessionText(s.locale, saved ? 'restored' : 'missing'));
              }}
            >
              {sessionText(s.locale, 'restore')}
            </button>
            <button
              disabled={!loaded || reduced.current}
              onClick={() => viewer.current?.replayEntrance()}
            >
              {sessionText(s.locale, 'replay')}
            </button>
          </div>
          <footer className="panel-footer">
            <button onClick={() => setDialog('about')}>
              <Info size={13} />
              {tr('source')}
            </button>
            <label className="quality-control">
              <span>{qualityLabel(s.locale, 'quality')}</span>
              <select
                value={quality.mode}
                disabled={!loaded}
                aria-label={qualityLabel(s.locale, 'quality')}
                onChange={(e) =>
                  viewer.current?.quality(e.target.value as QualityMode)
                }
              >
                {qualityModes.map((mode) => (
                  <option value={mode} key={mode}>
                    {qualityLabel(s.locale, mode)}
                  </option>
                ))}
              </select>
              {quality.mode === 'auto' && (
                <small>
                  {qualityLabel(s.locale, 'active')} ·{' '}
                  {qualityLabel(s.locale, quality.tier)}
                </small>
              )}
            </label>
          </footer>
        </aside>
      </div>
      <footer className="site-footer" inert={entering && tourChapter < 0}>
        <span>9X — INTERACTIVE DESIGN STUDY</span>
        <button onClick={card}>
          {tr('saveCard')}
          <ArrowUpRight size={12} />
        </button>
        <button onClick={() => setDialog('about')}>
          {tr('study')} · {tr('source')}
        </button>
      </footer>
      {toast && (
        <output className="toast">
          <Check size={15} />
          {toast}
        </output>
      )}
      <Dialog open={!!dialog} onOpenChange={(v) => !v && setDialog('')}>
        <DialogContent className="info-dialog" showCloseButton={false}>
          <div className="dialog-head">
            <DialogTitle>
              {tr(
                dialog === 'about'
                  ? 'source'
                  : dialog === 'share'
                    ? 'share'
                    : dialog,
              )}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              aria-label={tr('close')}
              onClick={() => setDialog('')}
            >
              <X size={18} />
            </Button>
          </div>
          <DialogDescription>
            {tr(
              dialog === 'about'
                ? 'sourceText'
                : dialog === 'share'
                  ? 'copyFailed'
                  : dialog + 'Note',
            )}
          </DialogDescription>
          {dialog === 'about' && (
            <>
              <p>{tr('aboutText')}</p>
              <a href="/credits.txt" target="_blank" rel="noreferrer">
                Credits / License ↗
              </a>
              <a
                href="https://www.zeekrlife.com/zeekr9x?modelInfoId=10&modelYearCode=GMY_9X_01"
                target="_blank"
                rel="noreferrer"
              >
                {tr('official')} ↗
              </a>
              <p className="fineprint">
                Interaction references:{' '}
                <a
                  href="https://model-x-studio.vercel.app/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Model X Studio
                </a>{' '}
                ·{' '}
                <a
                  href="https://jiaxiantao.github.io/3d-car-viewing/"
                  target="_blank"
                  rel="noreferrer"
                >
                  3D Car Viewing
                </a>{' '}
                ·{' '}
                <a
                  href="https://cdn.weshape3d.com/publish/vmallhall/index.html?SN=5008010045301"
                  target="_blank"
                  rel="noreferrer"
                >
                  HIMA 3D
                </a>
              </p>
            </>
          )}
          {dialog === 'share' && (
            <input
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
              aria-label={tr('share')}
            />
          )}
        </DialogContent>
      </Dialog>
      {loaded && entering && (
        <div
          className={
            'entrance-overlay' + (tourChapter >= 0 ? ' is-touring' : '')
          }
          aria-label={entranceCopy[s.locale].note}
        >
          <button
            className="entrance-skip"
            onClick={() => viewer.current?.skipEntrance()}
          >
            {tourChapter >= 0
              ? showcaseCopy[s.locale].skip
              : entranceCopy[s.locale].skip}{' '}
            <ChevronRight size={16} />
          </button>
          <div className="entrance-caption" aria-live="polite">
            <span>ZEEKR 9X / EXPERIENCE ATELIER</span>
            <h2>
              {tourChapter >= 0
                ? showcaseCopy[s.locale].chapters[tourChapter]
                : entranceCopy[s.locale].title}
            </h2>
            <p>
              {tourChapter >= 0
                ? showcaseCopy[s.locale].hint
                : entranceCopy[s.locale].note}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
