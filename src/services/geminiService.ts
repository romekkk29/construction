
import { GoogleGenAI, Type } from "@google/genai";

// Exported to be used in App.tsx for file upload handling
export interface FileData {
  data: string;
  mimeType: string;
}

export const extractBudgetData = async (file?: FileData | string) => {
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
  const prompt2 = `Actúa como un experto en presupuestos de construcción y auditoría de costos. 
  Analiza la información proporcionada (ya sea un PDF o datos de una planilla Excel) y extrae TODA la estructura de costos.
  
  REGLAS DE EXTRACCIÓN:
  1. Identifica "accountNumber": Códigos de cuenta o índices (ej: 1.1, 01.A, etc).
  2. Identifica "name": Nombre del rubro o cuenta principal.
  3. Identifica "detail": Especificaciones técnicas o descripción del item.
  4. Identifica "cost": El monto total presupuestado. Limpia símbolos de moneda y separadores de miles.
  5. Identifica "incidence": Porcentaje de incidencia (%) de la cuenta. Si no está, calcúlalo como (costo_item / costo_total) * 100.
  
  RESTRICCIONES:
  - Solo devuelve un JSON array. No incluyas explicaciones.
  - Asegúrate de no duplicar items si hay subtotales y totales. Prioriza los items de menor nivel (las cuentas reales de gasto).
  
  Devuelve exclusivamente un JSON array de objetos con este esquema:
  [{"accountNumber": string, "name": string, "detail": string, "cost": number, "incidence": number}]`;
  const parts: any[] = [{ text: prompt }];
  if (file) {
    parts.push({ inlineData: file });
  }

  const response = await ai.models.generateContent({
    // Using gemini-3-pro-preview for complex document data extraction
    model: 'gemini-3-flash-preview',
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
  console.log(response)
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
  
  Ejemplo de unidades de medida: 
  Detalle: cemento minetti x 50 kg -> Bolsa
  Detalle: cal x 20 kg -> Bolsa
  Detalle: arena x 6 -> m3
  Detalle: ripio x 6 -> m3
  Detalle: estabilizado x 6 -> m3
  Detalle: arena x batea  -> m3
  Detalle: ripio x batea -> m3
  Detalle: hierro 8 mm -> barra
  10 hierro 10 mm -> barra
  
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
