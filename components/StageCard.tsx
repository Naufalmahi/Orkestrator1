import React from 'react';
import { CheckCircle2, Circle, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { StageResult } from '../types';

interface StageCardProps {
  result: StageResult;
  isActive: boolean;
  onClick: () => void;
}

export const StageCard: React.FC<StageCardProps> = ({ result, isActive, onClick }) => {
  const getIcon = () => {
    switch (result.status) {
      case 'completed': return <CheckCircle2 className="w-6 h-6 text-emerald-400" />;
      case 'processing': return <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />;
      case 'error': return <AlertCircle className="w-6 h-6 text-red-400" />;
      default: return <Circle className="w-6 h-6 text-slate-600" />;
    }
  };

  const getStatusColor = () => {
    if (isActive) return 'border-blue-500 bg-slate-800/80 shadow-lg shadow-blue-500/10';
    if (result.status === 'completed') return 'border-emerald-500/30 bg-slate-800/50';
    if (result.status === 'error') return 'border-red-500/30 bg-red-900/10';
    return 'border-slate-700 bg-slate-800/30 opacity-60';
  };

  return (
    <div 
      onClick={onClick}
      className={`relative p-4 mb-4 border rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] ${getStatusColor()}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <h3 className="font-semibold text-slate-100 text-sm tracking-wide uppercase">
              Stage {result.stageId}: {result.stageName}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              {result.agentName}
            </p>
          </div>
        </div>
        
        {result.executionTime && (
          <span className="text-xs font-mono text-slate-500">
            {(result.executionTime / 1000).toFixed(1)}s
          </span>
        )}
      </div>

      {/* Progress Line Connector */}
      {result.stageId < 4 && (
        <div className="absolute left-[27px] -bottom-6 w-0.5 h-4 bg-slate-700 -z-10" />
      )}
    </div>
  );
};
