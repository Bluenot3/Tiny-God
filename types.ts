export enum LifeStage {
  NONE = 'None',
  PLANTS = 'Plants',
  INSECTS = 'Insects',
  ANIMALS = 'Animals',
  HUMANS = 'Humans'
}

export enum Biome {
  DEEP_OCEAN = 'Deep Ocean',
  OCEAN = 'Ocean',
  BEACH = 'Beach',
  SCORCHED = 'Scorched',
  BARE = 'Bare',
  TUNDRA = 'Tundra',
  SNOW = 'Snow',
  TEMPERATE_DESERT = 'Desert',
  SHRUBLAND = 'Shrubland',
  GRASSLAND = 'Grassland',
  TEMPERATE_DECIDUOUS_FOREST = 'Forest',
  TEMPERATE_RAIN_FOREST = 'Rainforest',
  SUBTROPICAL_DESERT = 'Red Desert',
  TROPICAL_RAIN_FOREST = 'Jungle',
  MOUNTAIN = 'Mountain'
}

export enum ActionType {
  RAIN = 'RAIN',
  SUN = 'SUN',
  CALM = 'CALM',
  STIR = 'STIR',
  BLESS = 'BLESS', // New: High cost, instant fertility
  SMITE = 'SMITE', // New: Clears tile, restores stability
  WAIT = 'WAIT'
}

export interface TileData {
  id: number;
  x: number;
  y: number;
  height: number; // 0-1
  moisture: number; // 0-100
  temperature: number; // 0-100 (New)
  fertility: number; // 0-100
  vegetation: number; // 0-100
  lifeStage: LifeStage;
  biome: Biome;
  stability: number; 
}

export interface GameState {
  year: number;
  tiles: TileData[];
  biodiversity: number;
  globalStability: number;
  humanPopulation: number; // New
  mana: number; // New
  maxMana: number; // New
  totalLife: number;
  currentAge: string;
  ageDescription: string;
  gameStatus: 'playing' | 'won' | 'lost';
  logs: string[];
}
