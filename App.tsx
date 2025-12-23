import React, { useState, useEffect, useCallback } from 'react';
import Tile from './components/Tile';
import Controls from './components/Controls';
import { GameState, ActionType, LifeStage } from './types';
import { generateMap, processTurn, getTurnLog } from './services/simService';
import { getAgeDescription, shouldTriggerAI } from './services/geminiService';
import { GRID_SIZE, WIN_YEARS, MAX_MANA_BASE } from './constants';

const INITIAL_STATE: GameState = {
    year: 0,
    tiles: generateMap(),
    biodiversity: 0,
    globalStability: 100,
    humanPopulation: 0,
    mana: MAX_MANA_BASE,
    maxMana: MAX_MANA_BASE,
    totalLife: 0,
    currentAge: "The Primordial Soup",
    ageDescription: "The world is formless and void.",
    gameStatus: 'playing',
    logs: ["Welcome, Creator. Seed life."]
};

export default function App() {
    const [gameState, setGameState] = useState<GameState>(() => {
        const saved = localStorage.getItem('tiny_god_save_v2'); // New save key for new version
        return saved ? JSON.parse(saved) : INITIAL_STATE;
    });

    const [isThinking, setIsThinking] = useState(false);
    const [lastAction, setLastAction] = useState<ActionType | null>(null);

    useEffect(() => {
        localStorage.setItem('tiny_god_save_v2', JSON.stringify(gameState));
    }, [gameState]);

    const handleAction = useCallback(async (action: ActionType) => {
        if (gameState.gameStatus !== 'playing') return;

        setLastAction(action);
        const newState = processTurn(gameState, action);
        
        // Log Logic
        const log = getTurnLog(action, gameState, newState);
        const newLogs = [log, ...gameState.logs].slice(0, 6);

        // AI Logic
        let aiData = { 
            age_name: newState.currentAge, 
            description: newState.ageDescription, 
            modifier: '' 
        };

        if (shouldTriggerAI(gameState, newState)) {
            setIsThinking(true);
            try {
                const response = await getAgeDescription(newState);
                aiData = response;
                newLogs.unshift(`The Cosmos Shifts: "${response.modifier}"`);
            } catch (e) {
                console.error("AI skip", e);
            } finally {
                setIsThinking(false);
            }
        }

        setGameState({
            ...newState,
            logs: newLogs,
            currentAge: aiData.age_name,
            ageDescription: aiData.description
        });
        
        // Clear animation trigger after short delay
        setTimeout(() => setLastAction(null), 500);

    }, [gameState]);

    const resetGame = () => {
        localStorage.removeItem('tiny_god_save_v2');
        setGameState(INITIAL_STATE);
    };

    // Calculate grid columns
    const gridStyle = {
        gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`
    };

    // Atmospheric Overlay based on last action
    let weatherClass = "opacity-0";
    if (lastAction === ActionType.RAIN) weatherClass = "opacity-30 bg-blue-500 animate-pulse";
    if (lastAction === ActionType.SUN) weatherClass = "opacity-20 bg-yellow-400 mix-blend-overlay";
    if (lastAction === ActionType.SMITE) weatherClass = "opacity-40 bg-red-600 mix-blend-multiply";
    if (lastAction === ActionType.BLESS) weatherClass = "opacity-30 bg-purple-400 mix-blend-screen";

    return (
        <div className="min-h-screen bg-stone-950 text-amber-50 font-serif flex flex-col items-center p-2 md:p-6 overflow-x-hidden selection:bg-amber-900 selection:text-white">
            
            {/* Top Bar: Title & Age */}
            <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-6 border-b-2 border-stone-800 pb-4 gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                        👁️
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200 tracking-widest uppercase" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>
                            Tiny God
                        </h1>
                        <p className="text-stone-500 text-xs tracking-[0.2em] uppercase">Sovereign of the Isle</p>
                    </div>
                </div>
                
                <div className="text-center md:text-right bg-stone-900/50 p-3 rounded-lg border border-stone-800">
                    <div className="text-xl text-amber-100 font-bold">{gameState.currentAge}</div>
                    <div className="text-sm text-stone-400 italic">{isThinking ? "The stars are aligning..." : gameState.ageDescription}</div>
                </div>
            </header>

            <main className="flex flex-col xl:flex-row gap-8 w-full max-w-6xl items-start relative z-10">
                
                {/* LEFT: Game Board */}
                <div className="flex-1 w-full xl:max-w-2xl mx-auto">
                    <div className="relative p-2 md:p-6 bg-stone-900 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-stone-800">
                        {/* Map Container with Tilt */}
                        <div 
                            className="aspect-square w-full rounded-lg bg-stone-950/50 overflow-hidden relative"
                            style={{ 
                                perspective: '1200px', 
                                transformStyle: 'preserve-3d'
                            }}
                        >
                             <div 
                                className="grid gap-0 w-full h-full transition-transform duration-1000 ease-in-out" 
                                style={{
                                    ...gridStyle,
                                    transform: 'rotateX(25deg) scale(0.9)', // The 2.5D Tilt
                                }}
                             >
                                {gameState.tiles.map(tile => (
                                    <Tile key={tile.id} data={tile} />
                                ))}
                            </div>

                             {/* Weather Overlay */}
                             <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${weatherClass}`} />
                        </div>

                        {/* Game Over Overlay */}
                        {gameState.gameStatus !== 'playing' && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-stone-900/80 rounded-xl">
                                <div className="text-center p-8 border-4 border-amber-600 bg-stone-950 rounded-lg shadow-2xl max-w-md mx-4">
                                    <h2 className="text-4xl font-bold mb-4 text-amber-500 uppercase tracking-widest">
                                        {gameState.gameStatus === 'won' ? 'Ascension' : 'Oblivion'}
                                    </h2>
                                    <p className="mb-6 text-stone-300 leading-relaxed">
                                        {gameState.gameStatus === 'won' 
                                            ? `After ${gameState.year} years, the civilization is self-sustaining. You may rest.` 
                                            : "The delicate thread of life has snapped. The void reclaims all."}
                                    </p>
                                    <button 
                                        onClick={resetGame} 
                                        className="px-8 py-3 bg-amber-700 text-white rounded font-bold hover:bg-amber-600 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] uppercase tracking-wider"
                                    >
                                        Recreate World
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Dashboard */}
                <div className="w-full xl:w-96 flex flex-col gap-6">
                    
                    {/* Mana & Stats */}
                    <div className="bg-stone-900 p-6 rounded-xl border border-stone-800 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
                        
                        {/* Mana Bar */}
                        <div className="mb-6">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-purple-300 mb-2">
                                <span>Divine Power (Mana)</span>
                                <span>{Math.floor(gameState.mana)} / {gameState.maxMana}</span>
                            </div>
                            <div className="h-4 bg-stone-950 rounded-full border border-stone-700 overflow-hidden relative shadow-inner">
                                <div 
                                    className="h-full bg-gradient-to-r from-purple-800 to-purple-500 transition-all duration-500"
                                    style={{ width: `${(gameState.mana / gameState.maxMana) * 100}%` }}
                                >
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAQUlEQVQYV2NkYGAwYcAAjEh8kDgDTA5ZkIGBAWM1I4qCBN0Il0RQwMCATxE2RRAJBCkmw4SBhTE04DIIZ8K0AgA1yRABN770EwAAAABJRU5ErkJggg==')] opacity-30" />
                                </div>
                            </div>
                            <div className="text-[10px] text-stone-500 mt-1 text-center">
                                Regeneration: +{5 + gameState.humanPopulation + (gameState.biodiversity > 50 ? 5 : 0)} / turn
                            </div>
                        </div>

                        {/* Year Display */}
                        <div className="flex justify-between items-baseline mb-6 border-b border-stone-800 pb-4">
                            <span className="text-stone-400 text-sm uppercase tracking-widest">Epoch</span>
                            <span className="text-4xl font-mono text-white" style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)'}}>{gameState.year}</span>
                        </div>

                        {/* Detailed Metrics */}
                        <div className="space-y-4">
                            <MetricBar 
                                label="Biodiversity" 
                                value={gameState.biodiversity} 
                                color="bg-emerald-500" 
                                bg="bg-emerald-950" 
                            />
                            <MetricBar 
                                label="Planetary Stability" 
                                value={gameState.globalStability} 
                                color="bg-blue-500" 
                                bg="bg-blue-950" 
                                warning={gameState.globalStability < 40}
                            />
                            
                            <div className="grid grid-cols-3 gap-2 mt-6">
                                <StatBox icon="🐞" value={gameState.tiles.filter(t => t.lifeStage === LifeStage.INSECTS).length} label="Fauna" />
                                <StatBox icon="🦌" value={gameState.tiles.filter(t => t.lifeStage === LifeStage.ANIMALS).length} label="Beasts" />
                                <StatBox icon="🛖" value={gameState.humanPopulation} label="Villages" highlight />
                            </div>
                        </div>
                    </div>

                    {/* Log Feed */}
                    <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-xl overflow-hidden flex-1 min-h-[200px] flex flex-col">
                        <div className="bg-stone-950 p-2 text-center text-xs font-bold text-stone-500 uppercase tracking-widest border-b border-stone-800">
                            Chronicles
                        </div>
                        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                            <ul className="space-y-3">
                                {gameState.logs.map((log, i) => (
                                    <li key={i} className={`text-sm leading-snug border-l-2 pl-3 py-1 ${i === 0 ? 'border-amber-500 text-amber-100 bg-amber-900/10' : 'border-stone-700 text-stone-500'}`}>
                                        {log}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Controls */}
            <footer className="w-full max-w-6xl mt-6 sticky bottom-6 z-40">
                <div className="bg-stone-900/90 backdrop-blur-md p-3 rounded-2xl border border-stone-700 shadow-2xl">
                    <Controls 
                        onAction={handleAction} 
                        disabled={gameState.gameStatus !== 'playing' || isThinking} 
                        currentMana={gameState.mana}
                    />
                </div>
                 {gameState.gameStatus === 'playing' && (
                     <div className="mt-2 text-center">
                        <button onClick={resetGame} className="text-[10px] uppercase tracking-widest text-stone-600 hover:text-red-500 transition-colors">
                            Reset Timeline
                        </button>
                    </div>
                )}
            </footer>
        </div>
    );
}

// Subcomponents for cleaner App.tsx
const MetricBar = ({ label, value, color, bg, warning = false }: { label: string, value: number, color: string, bg: string, warning?: boolean }) => (
    <div>
        <div className="flex justify-between text-xs font-medium mb-1 text-stone-300">
            <span>{label}</span>
            <span className={warning ? 'text-red-400 animate-pulse' : ''}>{value}%</span>
        </div>
        <div className={`h-2 ${bg} rounded-full overflow-hidden`}>
            <div 
                className={`h-full ${color} transition-all duration-700`} 
                style={{ width: `${value}%` }}
            />
        </div>
    </div>
);

const StatBox = ({ icon, value, label, highlight = false }: { icon: string, value: number, label: string, highlight?: boolean }) => (
    <div className={`text-center p-2 rounded border ${highlight ? 'bg-amber-900/20 border-amber-800' : 'bg-stone-950 border-stone-800'}`}>
        <div className="text-xl mb-1">{icon}</div>
        <div className={`font-bold text-lg leading-none ${highlight ? 'text-amber-400' : 'text-stone-300'}`}>{value}</div>
        <div className="text-[9px] text-stone-500 uppercase mt-1">{label}</div>
    </div>
);
