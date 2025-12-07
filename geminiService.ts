
import { GoogleGenAI } from "@google/genai";
import { KPIStats, SaleRecord, Promoter } from '../types';

const getClient = () => {
  // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
  // The build process (Vite) replaces process.env.API_KEY with the actual key string.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key is missing. AI features will not work.");
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

export const generatePerformanceInsight = async (
  stats: KPIStats[],
  promoters: Promoter[],
  sales: SaleRecord[]
): Promise<string> => {
  try {
    const ai = getClient();
    
    // Prepare data context
    const context = JSON.stringify({
      promoters,
      stats: stats.map(s => ({
        name: promoters.find(p => p.id === s.promoterId)?.name,
        ...s
      })),
      recentSalesCount: sales.length
    });

    const prompt = `
      As a Sales Operations Analyst for an amusement park, analyze the following daily performance data.
      Data: ${context}

      Please provide a brief, professional summary (max 3 paragraphs) including:
      1. Top performing promoter and their key strength.
      2. Which floor/location seems to have the lowest traction.
      3. A strategic recommendation for the Team Lead to improve sales tomorrow.
      
      Keep the tone encouraging but analytical.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI Insight service is currently unavailable. Please check API Key configuration.";
  }
};
