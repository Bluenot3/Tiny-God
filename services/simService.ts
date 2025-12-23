import { GameState, TileData, LifeStage, ActionType, Biome } from '../types';
import { 
  GRID_SIZE, ACTION_EFFECTS, MOISTURE_FOR_GROWTH, FERTILITY_FOR_GROWTH, 
  VEG_FOR_INSECTS, STABILITY_FOR_ANIMALS, MANA_COSTS, MAX_MANA_BASE,
  ANIMAL_DENSITY_FOR_HUMANS, STABILITY_FOR_HUMANS, WIN_YEARS
} from '../constants';

class RNG {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}
const rng = new RNG(Date.now());

// Determine Biome based on Whittaker's diagram approx
const getBiome = (height: number, temp: number, moisture: number): Biome => {
  if (height < 0.2) return Biome.DEEP_OCEAN;
  if (height < 0.3) return Biome.OCEAN;
  if (height < 0.35) return Biome.BEACH;
  if (height > 0.85) {
    if (temp < 10) return Biome.SNOW;
    return Biome.MOUNTAIN;
  }

  if (temp < 10) return Biome.TUNDRA;
  if (temp < 30) {
     if (moisture < 20) return Biome.TEMPERATE_DESERT;
     if (moisture < 50) return Biome.GRASSLAND;
     return Biome.TEMPERATE_DECIDUOUS_FOREST;
  }
  // Hot
  if (moisture < 20) return Biome.SUBTROPICAL_DESERT;
  if (moisture < 60) return Biome.SHRUBLAND;
  return Biome.TROPICAL_RAIN_FOREST;
};

export const generateMap = (): TileData[] => {
  const tiles: TileData[] = [];
  const center = Math.floor(GRID_SIZE / 2);
  const maxDist = Math.sqrt(center * center + center * center);

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const normalizedDist = dist / maxDist;

      // Perlin-ish noise for variety
      let height = (1 - normalizedDist) * 1.2;
      height += (rng.next() - 0.5) * 0.4;
      height = Math.max(0, Math.min(1, height));

      tiles.push({
        id: y * GRID_SIZE + x,
        x,
        y,
        height,
        moisture: 30 + rng.next() * 20,
        temperature: 50 + (rng.next() * 20) - (height * 30), // Higher is colder
        fertility: height > 0.2 ? 50 : 0,
        vegetation: 0,
        lifeStage: LifeStage.NONE,
        stability: 80,
        biome: Biome.OCEAN // Init
      });
    }
  }
  return tiles;
};

const getNeighbors = (tiles: TileData[], index: number): TileData[] => {
  const neighbors: TileData[] = [];
  const x = index % GRID_SIZE;
  const y = Math.floor(index / GRID_SIZE);
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]; // 8-way for better simulation
  
  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
      neighbors.push(tiles[ny * GRID_SIZE + nx]);
    }
  }
  return neighbors;
};

export const processTurn = (currentState: GameState, action: ActionType): GameState => {
  const cost = MANA_COSTS[action];
  if (currentState.mana < cost && currentState.year > 0) {
    return currentState; // Not enough mana (UI should prevent this, but safe-guard)
  }

  const nextTiles = currentState.tiles.map(t => ({ ...t }));
  const effects = ACTION_EFFECTS[action];

  let totalVegetation = 0;
  let totalInsects = 0;
  let totalAnimals = 0;
  let totalHumans = 0;

  // 1. Apply Global Action & Natural Physics
  nextTiles.forEach(tile => {
    // Water Logic
    if (tile.height < 0.3) {
        tile.moisture = 100;
        tile.lifeStage = LifeStage.NONE;
        tile.vegetation = 0;
        tile.biome = tile.height < 0.2 ? Biome.DEEP_OCEAN : Biome.OCEAN;
        return;
    }

    // Apply Action Effects
    tile.moisture = Math.max(0, Math.min(100, tile.moisture + effects.moisture));
    tile.stability = Math.max(0, Math.min(100, tile.stability + effects.stability));
    tile.fertility = Math.max(0, Math.min(100, tile.fertility + effects.fertility));
    tile.temperature = Math.max(0, Math.min(100, tile.temperature + effects.temp));

    if (action === ActionType.SMITE) {
      tile.lifeStage = LifeStage.NONE; // Nuke logic
    }

    // Biome Logic (Updates dynamically)
    tile.biome = getBiome(tile.height, tile.temperature, tile.moisture);

    // Natural Decay / Cycle
    tile.moisture = Math.max(0, tile.moisture - 1);
    
    // Temperature normalization (returns to base)
    const baseTemp = 50 - (tile.height * 30);
    if (tile.temperature > baseTemp) tile.temperature -= 1;
    if (tile.temperature < baseTemp) tile.temperature += 1;
  });

  // 2. Life Simulation (Cellular Automata)
  const calculatedTiles = nextTiles.map(t => ({...t}));

  calculatedTiles.forEach((tile, idx) => {
    if (tile.height < 0.3) return;

    const neighbors = getNeighbors(nextTiles, idx);
    const neighborVeg = neighbors.reduce((acc, n) => acc + n.vegetation, 0) / neighbors.length;
    const neighborInsects = neighbors.filter(n => n.lifeStage === LifeStage.INSECTS).length;
    const neighborAnimals = neighbors.filter(n => n.lifeStage === LifeStage.ANIMALS).length;
    const neighborHumans = neighbors.filter(n => n.lifeStage === LifeStage.HUMANS).length;

    // Vegetation Spreading
    if (neighborVeg > 20 && tile.moisture > MOISTURE_FOR_GROWTH && tile.fertility > FERTILITY_FOR_GROWTH) {
        tile.vegetation = Math.min(100, tile.vegetation + 4);
    }
    // Specific Action Boosts
    if (action === ActionType.SUN && tile.moisture > 30) tile.vegetation += 5;
    if (action === ActionType.RAIN) tile.vegetation += 2;

    // Life Stage Logic
    // Step 0: Regression (Starvation)
    if (tile.lifeStage === LifeStage.PLANTS && tile.vegetation < 10) tile.lifeStage = LifeStage.NONE;
    if (tile.lifeStage === LifeStage.INSECTS && tile.vegetation < 20) tile.lifeStage = LifeStage.PLANTS;
    if (tile.lifeStage === LifeStage.ANIMALS && tile.vegetation < 10) {
      tile.lifeStage = LifeStage.NONE; // Died
      tile.fertility += 10;
    }

    // Step 1: Plants
    if (tile.lifeStage === LifeStage.NONE && tile.vegetation > 20 && tile.fertility > 10) {
        tile.lifeStage = LifeStage.PLANTS;
    }

    // Step 2: Insects
    if (tile.lifeStage === LifeStage.PLANTS && tile.vegetation > VEG_FOR_INSECTS) {
        if (rng.next() > 0.6 || neighborInsects > 0) {
             tile.lifeStage = LifeStage.INSECTS;
        }
    }

    // Step 3: Animals
    if (tile.lifeStage === LifeStage.INSECTS && tile.stability > STABILITY_FOR_ANIMALS) {
         // Need food (veg) and prey (insects)
         if (neighborInsects >= 1 && rng.next() > 0.7) {
             tile.lifeStage = LifeStage.ANIMALS;
         }
    }

    // Step 4: Humans (The new layer)
    // Humans appear where Animals are dense and stability is high
    if (tile.lifeStage === LifeStage.ANIMALS && tile.stability > STABILITY_FOR_HUMANS) {
        if (neighborAnimals >= ANIMAL_DENSITY_FOR_HUMANS || neighborHumans >= 1) {
            if (rng.next() > 0.8) {
                tile.lifeStage = LifeStage.HUMANS;
                tile.stability += 10; // Initial boost
            }
        }
    }

    // Human Logic
    if (tile.lifeStage === LifeStage.HUMANS) {
        tile.vegetation = Math.max(0, tile.vegetation - 5); // Consume resources
        tile.stability -= 3; // Humans cause instability (pollution/conflict)
        if (tile.stability < 20) {
            tile.lifeStage = LifeStage.NONE; // Civilization collapse
            tile.fertility = 0; // Scorched earth
        }
        // Humans hunt animals nearby (simulate by reducing neighbor veg/life)
        if (neighborAnimals > 0) {
             tile.fertility += 2; // Food waste/compost
        }
    } else if (tile.lifeStage === LifeStage.ANIMALS) {
        tile.vegetation -= 8;
        tile.fertility += 3;
    } else if (tile.lifeStage === LifeStage.INSECTS) {
        tile.vegetation -= 2;
        tile.fertility += 1;
    }

    // Stats
    totalVegetation += tile.vegetation;
    if (tile.lifeStage === LifeStage.INSECTS) totalInsects++;
    if (tile.lifeStage === LifeStage.ANIMALS) totalAnimals++;
    if (tile.lifeStage === LifeStage.HUMANS) totalHumans++;
  });

  // 3. Global Stats
  const totalLandTiles = calculatedTiles.filter(t => t.height >= 0.3).length;
  const avgStability = calculatedTiles.reduce((acc, t) => acc + t.stability, 0) / (GRID_SIZE * GRID_SIZE);
  
  let biodiversity = 0;
  if (totalLandTiles > 0) {
      const plantRatio = (totalVegetation / totalLandTiles) / 100;
      const insectRatio = totalInsects / totalLandTiles;
      const animalRatio = totalAnimals / totalLandTiles;
      const humanRatio = totalHumans / totalLandTiles;
      
      // Humans are high risk high reward
      biodiversity = (plantRatio * 10) + (insectRatio * 50) + (animalRatio * 150) + (humanRatio * 300);
      biodiversity = Math.min(100, Math.max(0, biodiversity));
  }

  // Mana Regen
  // Base 5 + 1 per human + bonus for high biodiversity
  const manaRegen = 5 + totalHumans + (biodiversity > 50 ? 5 : 0);
  const maxMana = MAX_MANA_BASE + (totalHumans * 2);
  const newMana = Math.min(maxMana, currentState.mana - cost + manaRegen);

  // Win/Loss
  let status: 'playing' | 'won' | 'lost' = 'playing';
  const newYear = currentState.year + 1;

  if (biodiversity <= 0 && newYear > 10) status = 'lost';
  else if (avgStability < 10 && newYear > 10) status = 'lost';
  else if (newYear >= WIN_YEARS && biodiversity > 60) status = 'won';

  return {
    ...currentState,
    year: newYear,
    tiles: calculatedTiles,
    biodiversity: Math.floor(biodiversity),
    globalStability: Math.floor(avgStability),
    humanPopulation: totalHumans,
    totalLife: totalInsects + totalAnimals + totalHumans,
    gameStatus: status,
    mana: newMana,
    maxMana
  };
};

export const getTurnLog = (action: ActionType, oldState: GameState, newState: GameState): string => {
    let msg = `Year ${newState.year}: `;
    
    // Action Log
    switch (action) {
        case ActionType.RAIN: msg += "Rain falls."; break;
        case ActionType.SUN: msg += "Sun shines."; break;
        case ActionType.BLESS: msg += "DIVINE BLESSING!"; break;
        case ActionType.SMITE: msg += "DIVINE WRATH!"; break;
        case ActionType.CALM: msg += "Winds calm."; break;
        case ActionType.STIR: msg += "Winds stir."; break;
        case ActionType.WAIT: msg += "Time passes."; break;
    }

    // Event Log
    if (newState.humanPopulation > oldState.humanPopulation && oldState.humanPopulation === 0) {
        return `Year ${newState.year}: THE FIRST VILLAGE! Humans have awoken.`;
    }
    if (newState.humanPopulation < oldState.humanPopulation && newState.humanPopulation === 0 && oldState.humanPopulation > 0) {
        return `Year ${newState.year}: CIVILIZATION COLLAPSED. Silence returns.`;
    }
    if (newState.globalStability < 30 && oldState.globalStability >= 30) {
        return `Year ${newState.year}: WARNING! The island is destabilizing.`;
    }

    return msg;
};