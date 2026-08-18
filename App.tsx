import React, { useMemo, useState } from 'react';
import { Activity, Check, CircleHelp, KeyRound, LayoutDashboard, Play, RotateCcw, Settings2, ShieldCheck, Terminal } from 'lucide-react';
import { AGENTS, DEFAULT_MODEL, MAX_ITERATIONS } from './constants';
import { TemplateViewer } from './components/TemplateViewer';
import { StageCard } from './components/StageCard';
import { AgentRun, AgentOutput, CriticOutput, PipelineStatus } from './types';
import { runCriticAgent, runFinalizer, runStructuredAgent } from './services/geminiService';

const envKey = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY || '';

function buildRun(agentId: string, iteration: number): AgentRun {
  const agent = AGENTS.find((item) => item.id === agentId)!;
  return {
    id: `${agentId}-${iteration}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    agentId,
    agentName: agent.name,
    role: agent.role,
    status: 'pending',
    input: '',
    iteration
  };
}

const App: React.FC = () => {
  const [tab, setTab] = useState<'run' | 'agents'>('run');
  const [task, setTask] = useState('Design a production-ready architecture for a multi-tenant SaaS checkout system. Explain the data flow, security boundaries, and failure handling.');
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('orkestrator_gemini_key') || envKey);
  const [status, setStatus] = useState<PipelineStatus>('idle');
  const [runs, setRuns] = useState<AgentRun[]>(() => AGENTS.map((agent) => buildRun(agent.id, 1)));
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const selectedRun = runs.find((run) => run.id === selectedRunId) || runs[runs.length - 1];
  const completed = runs.filter((run) => run.status === 'completed').length;
  const progress = runs.length ? Math.round((completed / runs.length) * 100) : 0;

  const updateRun = (runId: string, patch: Partial<AgentRun>) => {
    setRuns((current) => current.map((run) => run.id === runId ? { ...run, ...patch } : run));
  };

  const persistKey = (value: string) => {
    setApiKey(value);
    if (value) sessionStorage.setItem('orkestrator_gemini_key', value);
    else sessionStorage.removeItem('orkestrator_gemini_key');
  };

  const execute = async () => {
    if (!task.trim()) return setError('Give the orchestrator a task first.');
    if (!apiKey.trim()) return setError('Add a Gemini API key in the settings panel.');

    setError('');
    setStatus('running');
    const freshRuns = AGENTS.map((agent) => buildRun(agent.id, 1));
    setRuns(freshRuns);
    setSelectedRunId(freshRuns[0].id);

    try {
      const planner = freshRuns[0];
      updateRun(planner.id, { status: 'processing', input: task, startedAt: Date.now() });
      const plan = await runStructuredAgent(apiKey, AGENTS[0].systemPrompt, `USER TASK:\n${task}`);
      updateRun(planner.id, { status: 'completed', output: plan, executionTime: Date.now() - (planner.startedAt || Date.now()) });

      const contextRun = freshRuns[1];
      updateRun(contextRun.id, { status: 'processing', input: `${task}\n\nPLAN:\n${plan.artifact}`, startedAt: Date.now() });
      const context = await runStructuredAgent(apiKey, AGENTS[1].systemPrompt, contextRun.input);
      updateRun(contextRun.id, { status: 'completed', output: context, executionTime: Date.now() - (contextRun.startedAt || Date.now()) });

      let artifactInput = `${task}\n\nPLAN:\n${plan.artifact}\n\nCONTEXT:\n${context.artifact}`;
      let latestArtifact = '';
      let verdict: CriticOutput | undefined;

      for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration += 1) {
        const analystRun = iteration === 1 ? freshRuns[2] : buildRun('analyst', iteration);
        if (iteration > 1) setRuns((current) => [...current, analystRun]);
        updateRun(analystRun.id, { status: 'processing', input: artifactInput, startedAt: Date.now() });
        const analyst = await runStructuredAgent(apiKey, AGENTS[2].systemPrompt, artifactInput);
        latestArtifact = analyst.artifact;
        updateRun(analystRun.id, { status: 'completed', output: analyst, executionTime: Date.now() - (analystRun.startedAt || Date.now()) });
        setSelectedRunId(analystRun.id);

        const criticRun = iteration === 1 ? freshRuns[3] : buildRun('critic', iteration);
        if (iteration > 1) setRuns((current) => [...current, criticRun]);
        const criticInput = `${task}\n\nPLAN:\n${plan.artifact}\n\nCONTEXT:\n${context.artifact}\n\nCURRENT ARTIFACT:\n${latestArtifact}`;
        updateRun(criticRun.id, { status: 'processing', input: criticInput, startedAt: Date.now() });
        verdict = await runCriticAgent(apiKey, AGENTS[3].systemPrompt, criticInput);
        updateRun(criticRun.id, { status: 'completed', output: verdict, executionTime: Date.now() - (criticRun.startedAt || Date.now()) });
        setSelectedRunId(criticRun.id);

        if (verdict.verdict === 'pass' || iteration === MAX_ITERATIONS) break;
        artifactInput = `${artifactInput}\n\nCURRENT ARTIFACT:\n${latestArtifact}\n\nCRITIC REVISION:\n${verdict.revision}`;
      }

      const finalRun = freshRuns[4];
      const finalInput = `${task}\n\nVERIFIED ARTIFACT:\n${latestArtifact}\n\nQUALITY GATE:\n${verdict?.verdict || 'not available'} — ${verdict?.score ?? 0}/100`;
      updateRun(finalRun.id, { status: 'processing', input: finalInput, startedAt: Date.now() });
      const finalAnswer = await runFinalizer(apiKey, AGENTS[4].systemPrompt, finalInput);
      updateRun(finalRun.id, { status: 'completed', output: finalAnswer, executionTime: Date.now() - (finalRun.startedAt || Date.now()) });
      setSelectedRunId(finalRun.id);
      setStatus('finished');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'The pipeline failed unexpectedly.';
      setError(message);
      setStatus('error');
      setRuns((current) => current.map((run) => run.status === 'processing' ? { ...run, status: 'error', error: message } : run));
    }
  };

  const reset = () => {
    const fresh = AGENTS.map((agent) => buildRun(agent.id, 1));
    setRuns(fresh);
    setSelectedRunId(fresh[0].id);
    setStatus('idle');
    setError('');
  };

  const selectedOutput = useMemo(() => selectedRun?.output, [selectedRun]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><Terminal size={18} /></div>
          <div><strong>Orkestrator</strong><span>agent control room / v2</span></div>
        </div>
        <nav className="nav-tabs">
          <button className={tab === 'run' ? 'nav-tab active' : 'nav-tab'} onClick={() => setTab('run')}><LayoutDashboard size={16} /> Run</button>
          <button className={tab === 'agents' ? 'nav-tab active' : 'nav-tab'} onClick={() => setTab('agents')}><Settings2 size={16} /> Agents</button>
        </nav>
        <div className="topbar-status"><span className={`dot dot-${status}`} /> {status}</div>
      </header>

      <main className="workspace">
        {tab === 'agents' ? <TemplateViewer /> : (
          <>
            <section className="intro-row">
              <div>
                <p className="eyebrow">Orchestration, not prompt chaining</p>
                <h1>Give the task to the system. Let the roles negotiate the work.</h1>
                <p className="lead">Planner → Context Builder → Analyst → Critic → Finalizer. The critic can send the artifact back for one controlled revision pass.</p>
              </div>
              <div className="run-meta"><span>model</span><strong>{DEFAULT_MODEL}</strong><span>revision budget</span><strong>{MAX_ITERATIONS}</strong></div>
            </section>

            <section className="control-grid">
              <aside className="control-panel">
                <div className="panel-label">Task</div>
                <textarea value={task} onChange={(event) => setTask(event.target.value)} disabled={status === 'running'} />
                <div className="key-row">
                  <KeyRound size={16} />
                  <input type="password" value={apiKey} onChange={(event) => persistKey(event.target.value)} placeholder="Gemini API key" />
                </div>
                <p className="security-note"><ShieldCheck size={14} /> Stored only in this browser session. For production, move model calls behind your backend.</p>
                <div className="button-row">
                  <button className="primary-button" onClick={execute} disabled={status === 'running'}><Play size={16} /> {status === 'running' ? 'Running' : 'Run orchestrator'}</button>
                  <button className="secondary-button" onClick={reset} disabled={status === 'running'}><RotateCcw size={16} /></button>
                </div>
                {error && <div className="error-box">{error}</div>}
              </aside>

              <section className="pipeline-panel">
                <div className="panel-header"><div><span className="eyebrow">Execution trace</span><h2>{completed}/{runs.length} agents completed</h2></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div>
                <div className="agent-list">
                  {runs.map((run) => <StageCard key={run.id} run={run} isActive={selectedRun?.id === run.id} onClick={() => setSelectedRunId(run.id)} />)}
                </div>
              </section>

              <section className="detail-panel">
                <div className="detail-head">
                  <div><span className="eyebrow">Selected run</span><h2>{selectedRun?.agentName || 'Waiting'}</h2><p>{selectedRun?.role}</p></div>
                  <Activity size={18} />
                </div>
                <div className="detail-body">
                  {!selectedRun && <div className="empty-state"><CircleHelp size={32} /><p>Run the orchestrator to inspect agent state.</p></div>}
                  {selectedRun && <>
                    <div className="state-line"><span>Status</span><strong>{selectedRun.status}</strong><span>Iteration</span><strong>{selectedRun.iteration}</strong></div>
                    {selectedRun.input && <div className="trace-block"><label>Input</label><pre>{selectedRun.input}</pre></div>}
                    {selectedOutput && typeof selectedOutput === 'string' && <div className="final-output"><label>Final answer</label><div>{selectedOutput}</div></div>}
                    {selectedOutput && typeof selectedOutput !== 'string' && 'verdict' in selectedOutput && <div className="critic-output"><div className={`verdict verdict-${selectedOutput.verdict}`}>{selectedOutput.verdict}</div><strong>Quality score: {selectedOutput.score}/100</strong><ul>{selectedOutput.findings.map((finding) => <li key={finding}>{finding}</li>)}</ul><p>{selectedOutput.revision}</p></div>}
                    {selectedOutput && typeof selectedOutput !== 'string' && 'artifact' in selectedOutput && <><div className="trace-block"><label>Summary</label><p>{selectedOutput.summary}</p></div><div className="trace-block"><label>Artifact</label><pre>{selectedOutput.artifact}</pre></div><div className="state-line"><span>Confidence</span><strong>{Math.round(selectedOutput.confidence * 100)}%</strong><span>Next action</span><strong>{selectedOutput.nextAction}</strong></div></>}
                    {selectedRun.error && <div className="error-box">{selectedRun.error}</div>}
                  </>}
                </div>
              </section>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
