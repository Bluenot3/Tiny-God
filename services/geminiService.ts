import { GoogleGenAI, Type } from "@google/genai";
import { GameState } from "../types";

// Helper to determine if we should trigger AI based on state change magnitude
export const shouldTriggerAI = (oldState: GameState, newState: GameState): boolean => {
    // Trigger on major biodiversity milestones
    const oldBioTier = Math.floor(oldState.biodiversity / 20);
    const newBioTier = Math.floor(newState.biodiversity / 20);
    return oldBioTier !== newBioTier || newState.gameStatus !== 'playing';
};

export interface AIResponse {
    age_name: string;
    description: string;
    modifier: string;
}

const FALLBACK_RESPONSES: Record<string, AIResponse> = {
    start: { age_name: "Age of Silence", description: "The island is barren. Waiting for a spark.", modifier: "Potential" },
    growth: { age_name: "Age of Green", description: "First sprouts are taking hold.", modifier: "Growth" },
    collapse: { age_name: "The Great Wither", description: "Balance has been lost. Dust returns.", modifier: "Desolation" },
    thriving: { age_name: "Golden Era", description: "The ecosystem is in perfect harmony.", modifier: "Abundance" }
};

export const getAgeDescription = async (gameState: GameState): Promise<AIResponse> => {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
        if (gameState.gameStatus === 'lost') return FALLBACK_RESPONSES.collapse;
        if (gameState.biodiversity > 60) return FALLBACK_RESPONSES.thriving;
        if (gameState.biodiversity > 20) return FALLBACK_RESPONSES.growth;
        return FALLBACK_RESPONSES.start;
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        const prompt = `
        You are the narrator of a god-sim game. 
        Analyze this island state:
        Year: ${gameState.year}
        Biodiversity: ${gameState.biodiversity}/100
        Stability: ${gameState.globalStability}/100
        Life Count: ${gameState.totalLife}
        Status: ${gameState.gameStatus}

        Return a JSON object with:
        - "age_name": Short, mythic name for this era (e.g. "The Green Awakening", "The Drought").
        - "description": One cryptic but helpful sentence about the state of the island.
        - "modifier": One word describing the current vibe (e.g. "Hope", "Chaos").
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        age_name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        modifier: { type: Type.STRING }
                    },
                    required: ['age_name', 'description', 'modifier']
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response text");
        return JSON.parse(text) as AIResponse;

    } catch (e) {
        console.error("AI Generation failed", e);
        if (gameState.gameStatus === 'lost') return FALLBACK_RESPONSES.collapse;
        return FALLBACK_RESPONSES.start;
    }
};
