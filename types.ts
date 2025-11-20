export interface RefinedOutput {
  refined_prompt: string;
  notes: string;
}

export interface StageResult {
  stageId: number;
  stageName: string;
  agentName: string;
  input: string;
  output: RefinedOutput | string; // String for final stage, Object for others
  status: 'pending' | 'processing' | 'completed' | 'error';
  executionTime?: number;
}

export interface PipelineConfig {
  apiKey: string;
  model: string;
}

export type PipelineStage = 'idle' | 'running' | 'finished';