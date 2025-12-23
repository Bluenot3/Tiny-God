import React from 'react';
import { TileData, LifeStage } from '../types';
import { BIOME_CONFIG } from '../constants';

interface TileProps {
    data: TileData;
}

const Tile: React.FC<TileProps> = ({ data }) => {
    const config = BIOME_CONFIG[data.biome];

    // CSS for pseudo-3D elevation
    // We lift the tile up based on height
    const elevation = Math.max(0, (data.height - 0.2) * 20); // pixels
    
    const tileStyle: React.CSSProperties = {
        backgroundColor: config.color,
        transform: `translateY(-${elevation}px)`,
        zIndex: Math.floor(data.height * 100),
        boxShadow: elevation > 0 
            ? `0 ${elevation}px 0 rgba(0,0,0,0.3), 0 ${elevation+2}px 4px rgba(0,0,0,0.4)` // The "side" of the block + shadow
            : 'none',
        transition: 'all 0.4s ease-out'
    };

    // Life Icons
    let icon = config.icon; // Default biome icon
    if (data.lifeStage === LifeStage.INSECTS) icon = '🐞';
    if (data.lifeStage === LifeStage.ANIMALS) icon = '🦌';
    if (data.lifeStage === LifeStage.HUMANS) icon = '🛖'; // Village

    // Vegetation Density Overlay
    const vegOpacity = data.vegetation / 200; // Subtle
    
    return (
        <div className="relative w-full pb-[100%]" style={{ zIndex: Math.floor(data.height * 100) }}>
            <div 
                className="absolute inset-0 rounded-sm overflow-hidden group hover:brightness-110 cursor-pointer"
                style={tileStyle}
                title={`${data.biome} | Life: ${data.lifeStage} | Stab: ${Math.floor(data.stability)}`}
            >
                {/* Texture/Noise could go here */}
                
                {/* Vegetation Darkening */}
                {data.vegetation > 10 && (
                    <div className="absolute inset-0 bg-green-900 pointer-events-none mix-blend-multiply" style={{ opacity: vegOpacity }} />
                )}

                {/* Main Icon */}
                <div className="absolute inset-0 flex items-center justify-center text-sm md:text-xl select-none animate-fade-in drop-shadow-md">
                    {icon}
                </div>

                {/* Status Indicators (Mini dots) */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-[1px] p-[1px]">
                     {data.lifeStage === LifeStage.HUMANS && data.stability < 40 && (
                         <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title="Unstable!" />
                     )}
                </div>
            </div>
            
            {/* Water Reflection / Depth specific tweaks can be added here if needed */}
        </div>
    );
};

export default React.memo(Tile);
