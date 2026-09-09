/** Bound simulation time, including RAF timestamps earlier than initialization. */
export function animationStep(seconds: number): number {
  return Number.isFinite(seconds) ? Math.max(0, Math.min(0.05, seconds)) : 0;
}
