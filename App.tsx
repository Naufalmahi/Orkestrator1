import React, { useState, useRef, useEffect } from 'react';
import { INITIAL_STAGES } from './constants';
import { StageResult, RefinedOutput, PipelineStage } from './types';
import { runPipelineStage } from './services/geminiService';
import { StageCard } from './components/StageCard';
import { TemplateViewer } from './components/TemplateViewer';
import { Play, RefreshCw, Terminal, Code2, Layout, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'templates'>('pipeline');
  const [prompt, setPrompt] = useState("Explain quantum computing to a 5 year old using a cookie analogy.");
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStage>('idle');
  const [results, setResults] = useState<StageResult[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<number>(1);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  
  // We assume API key is in env for demo purposes or user can be prompted.
  // Ideally, in a real app, we use the modal.
  const apiKey = process.env.API_KEY || "";

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
     // Initialize empty results
     resetPipeline();
  }, []);

  const resetPipeline = () => {
    setResults(INITIAL_STAGES.map(s => ({
      stageId: s.id,
      stageName: s.name,
      agentName: s.agent,
      input: '',
      output: '',
      status: 'pending'
    })));
    setPipelineStatus('idle');
    setSelectedStageId(1);
  };

  const handleRunPipeline = async () => {
    if (!prompt.trim()) return;
    if (!apiKey) {
      alert("API Key is missing. Please check process.env.API_KEY");
      return;
    }

    setPipelineStatus('running');
    
    // Reset statuses to pending
    setResults(prev => prev.map(r => ({ ...r, status: 'pending', output: '', input: '' })));

    let currentInput = prompt;
    const newResults: StageResult[] = INITIAL_STAGES.map(s => ({
        stageId: s.id,
        stageName: s.name,
        agentName: s.agent,
        input: '',
        output: '',
        status: 'pending'
    }));

    try {
      for (let i = 0; i < INITIAL_STAGES.length; i++) {
        const stageConfig = INITIAL_STAGES[i];
        const startTime = Date.now();

        // Update UI to show processing
        newResults[i].status = 'processing';
        newResults[i].input = currentInput;
        setResults([...newResults]);
        setSelectedStageId(stageConfig.id);

        const isFinal = stageConfig.id === 4;
        
        // Call Service
        const output = await runPipelineStage(
          apiKey,
          stageConfig.template,
          currentInput,
          isFinal
        );

        const endTime = Date.now();
        
        // Update Result
        newResults[i].status = 'completed';
        newResults[i].output = output;
        newResults[i].executionTime = endTime - startTime;
        setResults([...newResults]);

        // Prepare input for next stage
        if (!isFinal) {
          const typedOutput = output as RefinedOutput;
          currentInput = typedOutput.refined_prompt;
        }

        // Small delay for visual effect
        await new Promise(r => setTimeout(r, 800));
      }
      setPipelineStatus('finished');
    } catch (error) {
      console.error(error);
      setPipelineStatus('idle');
      // Set current running stage to error
      const errorIndex = newResults.findIndex(r => r.status === 'processing');
      if (errorIndex !== -1) {
        newResults[errorIndex].status = 'error';
        setResults([...newResults]);
      }
    }
  };

  // Render helper for output content
  const renderStageOutput = (result: StageResult) => {
    if (result.status === 'pending') {
      return (
        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
          <Terminal className="w-12 h-12 mb-4" />
          <p>Waiting for input...</p>
        </div>
      );
    }

    if (result.status === 'processing') {
      return (
        <div className="h-full flex flex-col items-center justify-center text-blue-400">
          <RefreshCw className="w-12 h-12 mb-4 animate-spin" />
          <p>Agent is thinking...</p>
        </div>
      );
    }

    if (result.status === 'error') {
      return (
        <div className="h-full flex flex-col items-center justify-center text-red-400">
          <p>An error occurred during generation.</p>
        </div>
      );
    }

    const isFinal = result.stageId === 4;
    
    if (isFinal) {
        return (
            <div className="space-y-4">
                <div className="bg-slate-900 p-4 rounded-lg border border-emerald-500/20">
                    <h4 className="text-emerald-400 font-mono text-xs uppercase mb-2">Final Answer</h4>
                    <div className="prose prose-invert prose-sm max-w-none">
                        <p className="whitespace-pre-wrap leading-relaxed text-slate-200">{result.output as string}</p>
                    </div>
                </div>
            </div>
        )
    }

    const typedOutput = result.output as RefinedOutput;

    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Prompt Comparison */}
        <div className="grid grid-cols-1 gap-4">
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <h4 className="text-slate-500 font-mono text-xs uppercase mb-2">Input Prompt</h4>
                <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed font-mono opacity-70">
                    {result.input}
                </p>
            </div>

            <div className="flex justify-center">
                <div className="bg-slate-800 p-2 rounded-full border border-slate-700">
                    <RefreshCw className="w-4 h-4 text-blue-400" />
                </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-lg border border-blue-500/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <h4 className="text-blue-400 font-mono text-xs uppercase mb-2">Refined Prompt</h4>
                <p className="text-slate-100 text-sm whitespace-pre-wrap leading-relaxed font-mono">
                    {typedOutput.refined_prompt}
                </p>
            </div>
        </div>

        {/* Agent Notes */}
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <h4 className="text-orange-400 font-mono text-xs uppercase mb-2 flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Agent Reasoning
            </h4>
            <p className="text-slate-300 text-sm italic">
                "{typedOutput.notes}"
            </p>
        </div>
      </div>
    );
  };

  const activeResult = results.find(r => r.stageId === selectedStageId);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Terminal className="text-white w-5 h-5" />
            </div>
            <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Nexus Orchestrator</h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Multi-Layer AI Pipeline</p>
            </div>
        </div>
        
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button 
                onClick={() => setActiveTab('pipeline')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'pipeline' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
                <Layout className="w-4 h-4 inline-block mr-2" />
                Pipeline
            </button>
            <button 
                onClick={() => setActiveTab('templates')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'templates' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
                <Code2 className="w-4 h-4 inline-block mr-2" />
                Templates
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto max-w-6xl p-6">
        
        {activeTab === 'pipeline' ? (
            <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
                
                {/* Left Column: Pipeline Status */}
                <div className="col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2">
                    
                    {/* Input Section */}
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-700 shadow-xl">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                            Raw User Prompt
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none placeholder:text-slate-600 transition-all"
                            placeholder="Enter your complex query here..."
                            disabled={pipelineStatus === 'running'}
                        />
                        <button
                            onClick={handleRunPipeline}
                            disabled={pipelineStatus === 'running' || !prompt.trim()}
                            className={`w-full mt-4 py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg
                                ${pipelineStatus === 'running' 
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25'
                                }
                            `}
                        >
                            {pipelineStatus === 'running' ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Processing Pipeline...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 fill-current" />
                                    Start Pipeline
                                </>
                            )}
                        </button>
                    </div>

                    {/* Stages List */}
                    <div className="flex-1 overflow-y-auto">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 pl-1">Pipeline Stages</h3>
                        <div className="space-y-1 pb-10">
                            {results.map((result) => (
                                <StageCard
                                    key={result.stageId}
                                    result={result}
                                    isActive={selectedStageId === result.stageId}
                                    onClick={() => setSelectedStageId(result.stageId)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Stage Details */}
                <div className="col-span-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full">
                    {/* Detail Header */}
                    <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6">
                        <div>
                            <h2 className="text-white font-semibold">
                                {activeResult?.stageName || 'Select a Stage'}
                            </h2>
                            <p className="text-xs text-slate-500">{activeResult?.agentName}</p>
                        </div>
                        <div className="flex gap-2">
                             {activeResult?.status === 'completed' && (
                                <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                                    Completed
                                </span>
                             )}
                        </div>
                    </div>

                    {/* Detail Body */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50 custom-scrollbar">
                        {activeResult ? renderStageOutput(activeResult) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600">
                                <Settings className="w-16 h-16 mb-4 opacity-20" />
                                <p>Select a pipeline stage to view details</p>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>
        ) : (
            <TemplateViewer />
        )}
      </main>
    </div>
  );
};

export default App;