import React from 'react';
import { ActionType } from '../types';
import { MANA_COSTS } from '../constants';

interface ControlsProps {
    onAction: (action: ActionType) => void;
    disabled: boolean;
    currentMana: number;
}

const Controls: React.FC<ControlsProps> = ({ onAction, disabled, currentMana }) => {
    
    const renderButton = (action: ActionType, label: string, colorClass: string, icon: string) => {
        const cost = MANA_COSTS[action];
        const canAfford = currentMana >= cost;
        const isDisabled = disabled || !canAfford;

        return (
            <button 
                onClick={() => onAction(action)}
                disabled={isDisabled}
                className={`
                    relative group flex flex-col items-center justify-center p-2 md:p-3 rounded-xl 
                    border-b-4 transition-all transform active:scale-95 shadow-xl
                    ${isDisabled ? 'opacity-50 grayscale cursor-not-allowed border-stone-800 bg-stone-700' : `${colorClass} hover:brightness-110`}
                `}
            >
                <div className="text-2xl mb-1">{icon}</div>
                <div className="font-bold text-xs md:text-sm text-white uppercase tracking-wider">{label}</div>
                <div className={`text-[10px] font-mono mt-1 ${isDisabled ? 'text-red-300' : 'text-white/80'}`}>
                    {cost > 0 ? `${cost} MP` : 'FREE'}
                </div>
            </button>
        );
    };

    return (
        <div className="flex gap-2 md:gap-4 w-full justify-center perspective-500">
            {renderButton(ActionType.RAIN, 'Rain', 'bg-blue-600 border-blue-800', '🌧️')}
            {renderButton(ActionType.SUN, 'Sun', 'bg-amber-500 border-amber-700', '☀️')}
            {renderButton(ActionType.CALM, 'Calm', 'bg-emerald-600 border-emerald-800', '🍃')}
            {renderButton(ActionType.STIR, 'Stir', 'bg-slate-500 border-slate-700', '🌪️')}
            {renderButton(ActionType.BLESS, 'Bless', 'bg-purple-600 border-purple-800', '✨')}
            {renderButton(ActionType.SMITE, 'Smite', 'bg-red-700 border-red-900', '⚡')}
            {renderButton(ActionType.WAIT, 'Wait', 'bg-stone-500 border-stone-700', '⏳')}
        </div>
    );
};

export default Controls;
