import React from 'react';
import { AlertCircle, CheckCircle2, Circle, Loader2, MinusCircle } from 'lucide-react';
import { AgentRun } from '../types';

interface StageCardProps {
  run: AgentRun;
  isActive: boolean;
  onClick: () => void;
}

export const StageCard: React.FC<StageCardProps> = ({ run, isActive, onClick }) => {
  const icon = {
    completed: <CheckCircle2 size={18} />,
    processing: <Loader2 size={18} className="spin" />,
    error: <AlertCircle size={18} />,
    skipped: <MinusCircle size={18} />,
    pending: <Circle size={18} />
  }[run.status];

  return (
    <button className={`agent-card ${isActive ? 'agent-card-active' : ''}`} onClick={onClick} type="button">
      <span className={`status-icon status-${run.status}`}>{icon}</span>
      <span className="agent-card-copy">
        <strong>{run.agentName}</strong>
        <small>{run.role}</small>
      </span>
      <span className="agent-card-time">
        {run.executionTime ? `${(run.executionTime / 1000).toFixed(1)}s` : `#${run.iteration}`}
      </span>
    </button>
  );
};
