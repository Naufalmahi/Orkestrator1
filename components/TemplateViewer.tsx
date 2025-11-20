import React from 'react';
import { Copy, Check } from 'lucide-react';
import { INITIAL_STAGES } from '../constants';

export const TemplateViewer: React.FC = () => {
  const [copiedId, setCopiedId] = React.useState<number | null>(null);

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-2">Orchestrator Templates</h2>
        <p className="text-slate-400 mb-6">
          These are the meta-prompts used by the Laravel backend to drive each stage of the pipeline. 
          Copy these to your `.env` or database configuration.
        </p>

        <div className="grid gap-6">
          {INITIAL_STAGES.map((stage) => (
            <div key={stage.id} className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-1 rounded uppercase">
                    Stage {stage.id}
                  </span>
                  <span className="text-slate-200 font-medium">{stage.name}</span>
                </div>
                <button
                  onClick={() => handleCopy(stage.template, stage.id)}
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
                >
                  {copiedId === stage.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Template</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                  {stage.template.trim()}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
