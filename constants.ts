import { Biome } from "./types";

export const GRID_SIZE = 15;
export const WIN_YEARS = 100; // Extended gameplay
export const MAX_MANA_BASE = 100;

// Thresholds
export const MOISTURE_FOR_GROWTH = 30;
export const FERTILITY_FOR_GROWTH = 20;
export const VEG_FOR_INSECTS = 40;
export const INSECTS_FOR_ANIMALS = 30;
export const STABILITY_FOR_ANIMALS = 50;
export const ANIMAL_DENSITY_FOR_HUMANS = 2; // Neighbors needed
export const STABILITY_FOR_HUMANS = 70;

export const MANA_COSTS = {
  RAIN: 20,
  SUN: 20,
  CALM: 15,
  STIR: 15,
  BLESS: 50,
  SMITE: 40,
  WAIT: 0
};

// Action Effects
export const ACTION_EFFECTS = {
  RAIN: { moisture: 30, fertility: -2, stability: -2, vegetation: 5, temp: -5 },
  SUN: { moisture: -20, vegetation: 15, stability: 5, fertility: 0, temp: 10 },
  CALM: { moisture: -5, stability: 25, fertility: 5, vegetation: 2, temp: 0 },
  STIR: { moisture: 0, stability: -20, fertility: 15, vegetation: 0, temp: -2 },
  BLESS: { moisture: 10, stability: 10, fertility: 50, vegetation: 20, temp: 0 },
  SMITE: { moisture: -10, stability: 30, fertility: -20, vegetation: -100, temp: 20 }, // Clears life
  WAIT: { moisture: -2, stability: 2, fertility: 1, vegetation: 1, temp: 0 }
};

// Biome Colors & Visuals
export const BIOME_CONFIG: Record<Biome, { color: string, icon: string, textColor: string }> = {
  [Biome.DEEP_OCEAN]: { color: '#1e3a8a', icon: '', textColor: '#60a5fa' }, // blue-900
  [Biome.OCEAN]: { color: '#3b82f6', icon: '🌊', textColor: '#bfdbfe' }, // blue-500
  [Biome.BEACH]: { color: '#fde68a', icon: '', textColor: '#92400e' }, // amber-200
  [Biome.SCORCHED]: { color: '#451a03', icon: '🌋', textColor: '#fca5a5' },
  [Biome.BARE]: { color: '#78716c', icon: '', textColor: '#d6d3d1' },
  [Biome.TUNDRA]: { color: '#e7e5e4', icon: '❄️', textColor: '#57534e' },
  [Biome.SNOW]: { color: '#ffffff', icon: '🏔️', textColor: '#1c1917' },
  [Biome.TEMPERATE_DESERT]: { color: '#d6d3d1', icon: '🌵', textColor: '#57534e' },
  [Biome.SHRUBLAND]: { color: '#a3e635', icon: '🌾', textColor: '#365314' },
  [Biome.GRASSLAND]: { color: '#4ade80', icon: '🌿', textColor: '#14532d' },
  [Biome.TEMPERATE_DECIDUOUS_FOREST]: { color: '#16a34a', icon: '🌲', textColor: '#dcfce7' },
  [Biome.TEMPERATE_RAIN_FOREST]: { color: '#15803d', icon: '🌲', textColor: '#dcfce7' },
  [Biome.SUBTROPICAL_DESERT]: { color: '#f59e0b', icon: '🏜️', textColor: '#78350f' },
  [Biome.TROPICAL_RAIN_FOREST]: { color: '#065f46', icon: '🌴', textColor: '#ecfdf5' },
  [Biome.MOUNTAIN]: { color: '#57534e', icon: '⛰️', textColor: '#e7e5e4' },
};
