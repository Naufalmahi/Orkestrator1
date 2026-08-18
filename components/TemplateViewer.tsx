import React from 'react';
import { Check, Copy } from 'lucide-react';
import { AGENTS } from '../constants';

export const TemplateViewer: React.FC = () => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1600);
  };

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Agent registry</p>
          <h2>Roles that make the pipeline work</h2>
        </div>
        <p>Each role has one job. The orchestrator decides when to call it and what state to pass forward.</p>
      </div>
      <div className="template-grid">
        {AGENTS.map((agent) => (
          <article className="template-card" key={agent.id}>
            <div className="template-card-head">
              <div>
                <span className="agent-id">{agent.id}</span>
                <h3>{agent.name}</h3>
                <p>{agent.role}</p>
              </div>
              <button className="icon-button" onClick={() => copy(agent.id, agent.systemPrompt)} title="Copy system prompt" type="button">
                {copiedId === agent.id ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <p className="muted">{agent.purpose}</p>
            <pre>{agent.systemPrompt}</pre>
          </article>
        ))}
      </div>
    </section>
  );
};
