import type { Settings } from './experience';

export function continuousScene(
  s: Settings,
  opening: boolean,
  cameraMoving: boolean,
  orbit: boolean,
) {
  return (
    opening ||
    cameraMoving ||
    orbit ||
    s.section === 'safety' ||
    (s.roadEnabled &&
      s.roadPlaying &&
      s.view !== 'underbody' &&
      s.section !== 'structure') ||
    s.hazards ||
    !['clear', 'overcast', 'fog'].includes(s.weather) ||
    s.climate !== 'off'
  );
}
