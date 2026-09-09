'use client';
// A full navigation releases the current vehicle's WebGL context before loading another.
/* oxlint-disable next/no-html-link-for-pages */
export function VehicleSwitcher({ current }: { current: 'zeekr' | 'n90' }) {
  return (
    <details className="vehicle-switcher">
      <summary aria-label="切换车型">
        {current === 'zeekr' ? 'ZEEKR 9X' : 'N90 Max'}{' '}
        <span aria-hidden="true">⌄</span>
      </summary>
      <div className="vehicle-menu">
        <a
          href="/?vehicle=zeekr"
          aria-current={current === 'zeekr' ? 'page' : undefined}
        >
          ZEEKR 9X <small>完整交互展厅</small>
        </a>
        <a
          href="/?vehicle=n90"
          aria-current={current === 'n90' ? 'page' : undefined}
        >
          小米 N90 Max <small>Blender 建模 · 校准预览</small>
        </a>
      </div>
    </details>
  );
}
