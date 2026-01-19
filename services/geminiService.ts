
import { GoogleGenAI, Type } from "@google/genai";

// Exported to be used in App.tsx for file upload handling
export interface FileData {
  data: string;
  mimeType: string;
}

export const extractBudgetData = async (file?: FileData) => {
  // Initialize GoogleGenAI right before use to ensure most up-to-date configuration
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analiza este documento y extrae la estructura de costos de la obra. 
  Busca específicamente: 
  1. Nombre de la cuenta (ej. Movimiento de suelos)
  2. Detalle de la cuenta (ej. Excavación y nivelación)
  3. Costo de la cuenta (número con dos decimales).
  
  Instrucciones importantes:
  - Reconoce símbolos de moneda ($), puntos y comas.
  - El resultado final debe ser un número puro para el costo.
  - Devuelve exclusivamente un JSON array de objetos.`;

  const parts: any[] = [{ text: prompt }];
  if (file) {
    parts.push({ inlineData: file });
  }

  const response = await ai.models.generateContent({
    // Using gemini-3-pro-preview for complex document data extraction
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            detail: { type: Type.STRING },
            cost: { type: Type.NUMBER }
          },
          required: ["name", "detail", "cost"]
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};

export const extractSupplyData = async (file?: FileData) => {
  // Initialize GoogleGenAI right before use to ensure most up-to-date configuration
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Extrae la base de datos de insumos y materiales de este documento. 
  Busca:
  1. Código del insumo
  2. Detalle/Descripción del insumo (ej. Bolsa de cemento x 50kg)
  3. Unidad de medida (ej. Bolsa, kg, m3, Global)
  
  Devuelve exclusivamente un JSON array de objetos.`;

  const parts: any[] = [{ text: prompt }];
  if (file) {
    parts.push({ inlineData: file });
  }

  const response = await ai.models.generateContent({
    // Using gemini-3-pro-preview for complex document data extraction
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING },
            detail: { type: Type.STRING },
            unit: { type: Type.STRING }
          },
          required: ["code", "detail", "unit"]
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};
