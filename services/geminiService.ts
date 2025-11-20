import { GoogleGenAI, Type } from "@google/genai";
import { RefinedOutput } from '../types';

// Helper to delay between calls if needed
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const runPipelineStage = async (
  apiKey: string,
  systemInstruction: string,
  inputContent: string,
  isFinalStage: boolean = false
): Promise<RefinedOutput | string> => {
  
  const ai = new GoogleGenAI({ apiKey });
  
  const modelName = 'gemini-2.5-flash'; 

  const config: any = {
    systemInstruction: systemInstruction,
    temperature: 0.7,
  };

  if (!isFinalStage) {
    config.responseMimeType = "application/json";
    config.responseSchema = {
      type: Type.OBJECT,
      properties: {
        refined_prompt: { type: Type.STRING },
        notes: { type: Type.STRING },
      },
      required: ["refined_prompt", "notes"],
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: inputContent,
      config: config
    });

    const text = response.text;
    
    if (!text) throw new Error("Empty response from AI");

    if (isFinalStage) {
      return text;
    } else {
      // Parse JSON for intermediate stages
      return JSON.parse(text) as RefinedOutput;
    }

  } catch (error) {
    console.error("Pipeline Error:", error);
    throw error;
  }
};
