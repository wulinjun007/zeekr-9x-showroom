/** Arrival history is local to this browser; it is not part of a shared car setup. */
export const entranceSeenKey = 'zeekr9x-entrance-seen-v1';
export function shouldAutoplayEntrance(): boolean {
  try {
    return localStorage.getItem(entranceSeenKey) !== '1';
  } catch {
    // If history cannot be read, keep the experience user-initiated.
    return false;
  }
}
export function rememberEntrance(): void {
  try {
    localStorage.setItem(entranceSeenKey, '1');
  } catch {
    // Browsing and the manual replay remain available without storage permission.
  }
}
