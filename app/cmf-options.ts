import type { LabSettings } from './lab-state';
export const cmfOptions = {
  seatMaterial: ['original', 'leather', 'fabric', 'suede', 'pu'],
  doorMaterial: ['original', 'leather', 'suede', 'pu'],
  dashMaterial: ['original', 'soft', 'abs'],
  roofMaterial: ['original', 'fabric', 'suede'],
  carpetMaterial: ['original', 'fabric', 'rubber'],
  trimMaterial: ['original', 'wood', 'aluminium', 'carbon'],
} as const;
export type CmfKey = keyof typeof cmfOptions;
export type Zone = 'seat' | 'door' | 'dash' | 'roof' | 'carpet' | 'trim';
export const cmfReset = Object.fromEntries(
  Object.keys(cmfOptions).map((k) => [k, 'original']),
) as Pick<LabSettings, CmfKey>;
export const cmfRecipes: Record<string, Partial<LabSettings>> = {
  warm: {
    seatMaterial: 'leather',
    doorMaterial: 'leather',
    dashMaterial: 'soft',
    roofMaterial: 'suede',
    carpetMaterial: 'fabric',
    trimMaterial: 'wood',
  },
  nordic: {
    seatMaterial: 'fabric',
    doorMaterial: 'pu',
    dashMaterial: 'soft',
    roofMaterial: 'fabric',
    carpetMaterial: 'fabric',
    trimMaterial: 'wood',
  },
  sport: {
    seatMaterial: 'suede',
    doorMaterial: 'suede',
    dashMaterial: 'abs',
    roofMaterial: 'suede',
    carpetMaterial: 'rubber',
    trimMaterial: 'carbon',
  },
};
export const cmfAssets: Record<string, string> = {
  leather: 'leather_white',
  fabric: 'fabric_pattern_07',
  suede: 'scuba_suede',
  wood: 'wood_table_001',
};
