export type AgentStatus = 'pending' | 'processing' | 'completed' | 'error' | 'skipped';
export type PipelineStatus = 'idle' | 'running' | 'finished' | 'error';
export type CriticVerdict = 'pass' | 'revise';

export interface AgentOutput {
  summary: string;
  artifact: string;
  nextAction: string;
  confidence: number;
}

export interface CriticOutput {
  verdict: CriticVerdict;
  score: number;
  findings: string[];
  revision: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  purpose: string;
  systemPrompt: string;
}

export interface AgentRun {
  id: string;
  agentId: string;
  agentName: string;
  role: string;
  status: AgentStatus;
  input: string;
  output?: AgentOutput | CriticOutput | string;
  startedAt?: number;
  executionTime?: number;
  error?: string;
  iteration: number;
}

export interface OrchestratorState {
  task: string;
  plan: string;
  workingContext: string;
  artifact: string;
  verdict?: CriticOutput;
  iteration: number;
  maxIterations: number;
}
