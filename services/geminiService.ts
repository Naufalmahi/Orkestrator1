import { GoogleGenAI, Type } from '@google/genai';
import { AgentOutput, CriticOutput } from '../types';

const MODEL = 'gemini-2.5-flash';

function getText(response: { text?: string }): string {
  const text = response.text?.trim();
  if (!text) throw new Error('The model returned an empty response.');
  return text;
}

export async function runStructuredAgent(
  apiKey: string,
  systemInstruction: string,
  input: string
): Promise<AgentOutput> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: input,
    config: {
      systemInstruction,
      temperature: 0.35,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          artifact: { type: Type.STRING },
          nextAction: { type: Type.STRING },
          confidence: { type: Type.NUMBER }
        },
        required: ['summary', 'artifact', 'nextAction', 'confidence']
      }
    }
  });

  const parsed = JSON.parse(getText(response)) as AgentOutput;
  return {
    ...parsed,
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0))
  };
}

export async function runCriticAgent(
  apiKey: string,
  systemInstruction: string,
  input: string
): Promise<CriticOutput> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: input,
    config: {
      systemInstruction,
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          verdict: { type: Type.STRING, enum: ['pass', 'revise'] },
          score: { type: Type.NUMBER },
          findings: { type: Type.ARRAY, items: { type: Type.STRING } },
          revision: { type: Type.STRING }
        },
        required: ['verdict', 'score', 'findings', 'revision']
      }
    }
  });

  const parsed = JSON.parse(getText(response)) as CriticOutput;
  return {
    verdict: parsed.verdict === 'pass' ? 'pass' : 'revise',
    score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
    findings: Array.isArray(parsed.findings) ? parsed.findings : [],
    revision: parsed.revision || 'Revise the artifact against the original requirements.'
  };
}

export async function runFinalizer(
  apiKey: string,
  systemInstruction: string,
  input: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: input,
    config: {
      systemInstruction,
      temperature: 0.45
    }
  });
  return getText(response);
}

export { MODEL };
