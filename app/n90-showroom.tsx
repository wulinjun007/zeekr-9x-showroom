'use client';
import { useState, useEffect, useRef } from 'react';
import {
  ArrowUpRight,
  RotateCw,
  Sun,
  Moon,
  Lightbulb,
  Maximize,
  ChevronRight,
  X,
} from 'lucide-react';
import { VehicleSwitcher } from './vehicle-switcher';
import {
  n90Default,
  n90Paints,
  n90Doors,
  readN90,
  n90Link,
  type N90State,
  type N90View,
} from './n90-state';
import type { createN90Viewer } from './n90-viewer';
import { readQualityMode, type QualityMode } from './render-quality';
import './n90.css';
const tabs = [
  ['body', '车身'],
  ['wheels', '车轮'],
  ['interior', '内饰'],
  ['space', '空间'],
  ['parts', '分件'],
] as const;
export default function N90Showroom() {
  const [s, setS] = useState<N90State>(() =>
      typeof window === 'undefined' ? n90Default : readN90(location.search),
    ),
    [progress, setProgress] = useState(0),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(false),
    [quality, setQuality] = useState('balanced'),
    [qm, setQm] = useState<QualityMode>(() =>
      typeof window === 'undefined' ? 'auto' : readQualityMode(),
    ),
    [reference, setReference] = useState(false),
    [toast, setToast] = useState('');
  const host = useRef<HTMLDivElement>(null),
    viewer = useRef<Awaited<ReturnType<typeof createN90Viewer>> | null>(null),
    live = useRef(s);
  const update = (p: Partial<N90State>) => setS((v) => ({ ...v, ...p }));
  useEffect(() => {
    live.current = s;
    viewer.current?.apply(s);
  }, [s]);
  useEffect(() => {
    const initial = readN90(location.search);
    live.current = initial;
    document.title = '小米 N90 Max · Blender 校准预览';
    let cancelled = false;
    const mount = host.current!;
    import('./n90-viewer')
      .then(({ createN90Viewer }) =>
        createN90Viewer(
          mount,
          initial,
          setProgress,
          (id) =>
            setS((v) => ({
              ...v,
              doors: v.doors.includes(id)
                ? v.doors.filter((d) => d !== id)
                : [...v.doors, id],
            })),
          setQuality,
        ),
      )
      .then((v) => {
        if (cancelled) {
          v.dispose();
          return;
        }
        viewer.current = v;
        v.apply(live.current);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      viewer.current?.dispose();
      viewer.current = null;
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (reference) dialog.current?.showModal();
    else dialog.current?.close();
  }, [reference]);
  const view = (v: N90View) => update({ view: v, orbit: false });
  return (
    <main className={'n90-page ' + s.mode}>
      <div ref={host} className="n90-stage" />
      <header className="n90-header">
        <VehicleSwitcher current="n90" />
        <span className="n90-edition">EXPERIENCE ATELIER / 02</span>
        <button onClick={() => setReference(true)}>
          模型说明 <ArrowUpRight size={14} />
        </button>
      </header>
      <div className="n90-title">
        <p>独立建模 · 校准预览</p>
        <h1>
          N90 <em>Max</em>
        </h1>
        <span>自在展开，每一种生活。</span>
      </div>
      <div className="n90-lighting">
        {(['day', 'night'] as const).map((m) => (
          <button
            key={m}
            aria-pressed={s.mode === m}
            onClick={() => update({ mode: m })}
          >
            {m === 'day' ? <Sun size={15} /> : <Moon size={15} />}{' '}
            {m === 'day' ? '白天' : '夜晚'}
          </button>
        ))}
      </div>
      {!loaded && !error && (
        <div className="n90-loading">
          <span>N90</span>
          <p>正在载入分件模型 · {progress}%</p>
          <progress max="100" value={progress} />
        </div>
      )}
      {error && (
        <div className="n90-loading">
          <p>模型加载失败，请刷新重试。</p>
          <button onClick={() => location.reload()}>重新加载</button>
        </div>
      )}
      <aside className="n90-config">
        <div className="n90-config-heading">
          <h2>
            N90 Max <small>探索版参考</small>
          </h2>
          <span>BUILD 01</span>
        </div>
        <nav aria-label="小米车型配置">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              aria-pressed={s.section === id}
              onClick={() =>
                update({
                  section: id,
                  view:
                    id === 'interior'
                      ? 'driver'
                      : id === 'space'
                        ? 'rear-seat'
                        : id === 'parts'
                          ? 'hero'
                          : s.section === 'interior' || s.section === 'space'
                            ? 'hero'
                            : s.view,
                  orbit: false,
                  explode: id === 'parts' ? s.explode : 0,
                })
              }
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="n90-panel">
          {s.section === 'body' && (
            <>
              <p className="n90-kicker">车漆 + 光影</p>
              <h3>{n90Paints.find((p) => p.color === s.paint)?.name}</h3>
              <div className="n90-swatches">
                {n90Paints.map((p) => (
                  <button
                    key={p.color}
                    onClick={() => update({ paint: p.color })}
                    aria-label={p.name}
                    aria-pressed={s.paint === p.color}
                    style={{ background: p.color }}
                  />
                ))}
              </div>
              <p className="n90-note">
                色彩依据官网视觉参考调校，实车漆面仍以厂家样品为准。
              </p>
              <div className="n90-divider" />
              <h3>开合之间</h3>
              <div className="n90-door-grid">
                {n90Doors.map((d) => (
                  <button
                    key={d.id}
                    aria-pressed={s.doors.includes(d.id)}
                    onClick={() =>
                      update({
                        doors: s.doors.includes(d.id)
                          ? s.doors.filter((x) => x !== d.id)
                          : [...s.doors, d.id],
                      })
                    }
                  >
                    {d.name}
                    <span>{s.doors.includes(d.id) ? '关闭' : '打开'}</span>
                  </button>
                ))}
              </div>
              <button
                className="n90-action"
                aria-pressed={s.lights}
                onClick={() => update({ lights: !s.lights })}
              >
                <Lightbulb size={16} />
                {s.lights ? '关闭车灯' : '点亮车灯'}
              </button>
            </>
          )}
          {s.section === 'wheels' && (
            <>
              <p className="n90-kicker">精密线条 · 金属层次</p>
              <h3>分叉多辐轮毂</h3>
              <p className="n90-note">
                独立轮胎、轮圈、辐条与制动盘。当前几何为官网轮毂的建模研究版本。
              </p>
              <div className="n90-choice">
                {(['silver', 'black'] as const).map((v) => (
                  <button
                    key={v}
                    aria-pressed={s.wheel === v}
                    onClick={() =>
                      update({ wheel: v, view: 'side', orbit: false })
                    }
                  >
                    {v === 'silver' ? '切削银' : '深邃黑'}
                  </button>
                ))}
              </div>
            </>
          )}
          {s.section === 'interior' && (
            <>
              <p className="n90-kicker">温暖，有层次的触感</p>
              <h3>{s.interior === 'mocha' ? '摩卡棕' : '砂陶米'}</h3>
              <div className="n90-choice">
                {(['mocha', 'sand'] as const).map((v) => (
                  <button
                    key={v}
                    aria-pressed={s.interior === v}
                    onClick={() => update({ interior: v })}
                  >
                    <i
                      style={{
                        background: v === 'mocha' ? '#866044' : '#b9a48c',
                      }}
                    />
                    {v === 'mocha' ? '摩卡棕' : '砂陶米'}
                  </button>
                ))}
              </div>
              <div className="n90-divider" />
              <h3>走进座舱</h3>
              <div className="n90-choice">
                <button onClick={() => view('driver')}>主驾视角</button>
                <button onClick={() => view('rear-seat')}>后排视角</button>
              </div>
              <p className="n90-note">
                低光泽皮革、独立菱格缝线、木纹地板、氛围灯与中控行驶视图。座椅型面与细节仍在校准。
              </p>
            </>
          )}
          {s.section === 'space' && (
            <>
              <p className="n90-kicker">空间的另一种可能</p>
              <h3>从出行，到停留</h3>
              <button
                className="n90-feature"
                aria-pressed={s.roof}
                onClick={() =>
                  update({ roof: !s.roof, view: 'hero', orbit: false })
                }
              >
                <span>
                  升降顶舱<small>独立顶舱结构 · 开合示意</small>
                </span>
                <ChevronRight size={18} />
              </button>
              <button
                className="n90-feature"
                aria-pressed={s.lounge}
                onClick={() =>
                  update({
                    lounge: !s.lounge,
                    doors: ['Door_LF', 'Door_RF', 'Door_LB', 'Door_RB'],
                    view: 'top',
                    orbit: false,
                  })
                }
              >
                <span>
                  对坐会客<small>剖顶查看 · 前排旋转 · 桌板展开</small>
                </span>
                <ChevronRight size={18} />
              </button>
              <p className="n90-note">
                仅演示驻车空间变化。当前为机构概念动画，尚未校准真实行程与碰撞边界。
              </p>
            </>
          )}
          {s.section === 'parts' && (
            <>
              <p className="n90-kicker">从整体，到构成</p>
              <h3>分件探索</h3>
              <label className="n90-range">
                展开距离 <output>{s.explode}%</output>
                <input
                  type="range"
                  aria-label="分件展开距离"
                  min="0"
                  max="100"
                  value={s.explode}
                  onChange={(e) => update({ explode: Number(e.target.value) })}
                />
              </label>
              <button
                className="n90-action"
                onClick={() => update({ explode: 0 })}
              >
                恢复组装
              </button>
              <p className="n90-note">
                按建模组件展开，用于观察形体和材质，不代表真实工程零件结构。
              </p>
            </>
          )}
        </div>
        <footer>
          <label>
            显示质量
            <select
              aria-label="N90 显示质量"
              value={qm}
              onChange={(e) => {
                const v = e.target.value as QualityMode;
                setQm(v);
                viewer.current?.quality(v);
              }}
            >
              <option value="auto">自动适配</option>
              <option value="smooth">流畅</option>
              <option value="balanced">均衡</option>
              <option value="high">精细</option>
            </select>
          </label>
          <small>
            当前：
            {quality === 'high'
              ? '精细'
              : quality === 'smooth'
                ? '流畅'
                : '均衡'}
          </small>
          <button
            className="n90-share"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(n90Link(s));
                setToast('配置链接已复制');
              } catch {
                history.replaceState(null, '', n90Link(s));
                setToast('配置已写入地址栏，可复制网址分享');
              }
            }}
          >
            分享这份配置 <ArrowUpRight size={16} />
          </button>
        </footer>
      </aside>
      <div className="n90-cameras">
        {(
          [
            ['hero', '全景'],
            ['front', '前脸'],
            ['side', '侧面'],
            ['rear', '车尾'],
            ['driver', '主驾'],
            ['rear-seat', '后排'],
          ] as const
        ).map(([id, label]) => (
          <button
            disabled={!loaded}
            key={id}
            aria-pressed={s.view === id}
            onClick={() => view(id)}
          >
            {label}
          </button>
        ))}
        <button
          disabled={!loaded}
          aria-label="自动环绕"
          aria-pressed={s.orbit}
          onClick={() => update({ orbit: !s.orbit, view: 'hero' })}
        >
          <RotateCw size={15} />
        </button>
        <button
          aria-label="全屏"
          onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else void document.documentElement.requestFullscreen();
          }}
        >
          <Maximize size={15} />
        </button>
      </div>
      <p className="n90-bottom-note">拖动旋转 · 滚轮缩放 · 点击车门开合</p>
      {toast && <output className="n90-toast">{toast}</output>}
      <dialog
        ref={dialog}
        onClose={() => setReference(false)}
        className="n90-modal"
        aria-modal="true"
        aria-label="N90 模型说明"
      >
        <article>
          <button aria-label="关闭模型说明" onClick={() => setReference(false)}>
            <X />
          </button>
          <p className="n90-kicker">REFERENCE / BUILD 01</p>
          <h2>独立建模，逐项校准。</h2>
          <p>
            当前展示使用 Blender
            独立创建的分件模型。没有复制极氪几何，也没有下载或再发布小米官网的模型文件。
          </p>
          <p>
            目前尚未达到一比一视觉验收：车身曲面、灯组、轮毂和座舱细节仍有差异。升顶及座椅机构是交互示意，不能用于工程或安全结论。
          </p>
          <a
            href="https://www.xiaomiev.com/configurator/select?goodsId=900020450&itemId=500042050&ssuId=600147082&type=3d"
            target="_blank"
            rel="noreferrer"
          >
            打开小米官方配置器对照 ↗
          </a>
        </article>
      </dialog>
    </main>
  );
}
