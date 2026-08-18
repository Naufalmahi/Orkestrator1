# Orkestrator

**Agent control room for turning one task into a verified answer.**

Orkestrator started as a four-stage prompt-refinement prototype. Version 2 keeps the useful idea—separating work into roles—but replaces the fixed prompt chain with an observable agent workflow:

```text
User task
   │
   ▼
Planner
   │
   ▼
Context Builder
   │
   ▼
Analyst ─────────────┐
   │                 │
   ▼                 │ revise
Critic ──────────────┘
   │ pass
   ▼
Finalizer
   │
   ▼
Answer
```

The Critic is a real control point: it can reject the current artifact and send a specific revision back to the Analyst. The loop is bounded so a bad run cannot recurse forever.

## What changed from the original prototype

The original repository had four sequential stages—Structure & Intent, Logic & Context, Polish & Clarity, and Final Execution—with every intermediate stage returning a refined prompt. That was useful as a proof of concept, but it behaved like prompt chaining rather than orchestration. fileciteturn35file0

The V2 architecture keeps the good parts:

- React + TypeScript frontend
- Vite development/build workflow
- Gemini model integration
- Lucide icons
- explicit stage state and execution timing
- copyable agent instructions

It changes the execution model to:

- typed agent outputs instead of a single `refined_prompt` shape
- a shared task → plan → context → artifact flow
- a dedicated Critic quality gate
- bounded revision iterations
- a finalizer that hides orchestration details from the delivered answer
- browser-session API key handling instead of build-time key injection
- an execution trace that exposes agent status, inputs, outputs, iterations, and failures

## Agents

| Agent | Job | Output |
| --- | --- | --- |
| **Planner** | Decompose the request and make constraints explicit | plan artifact |
| **Context Builder** | Identify missing context, assumptions, risks, and edge cases | context artifact |
| **Analyst** | Build the first concrete solution | working artifact |
| **Critic** | Verify the artifact and decide `pass` or `revise` | findings + revision instructions |
| **Finalizer** | Turn the verified artifact into the user-facing answer | final text |

### Why this is different from simply calling five prompts

The orchestrator owns state and decisions. Agents do not decide the entire workflow themselves. The application decides which role runs, records its state, passes the relevant artifact forward, and enforces the revision budget.

The current browser implementation is intentionally honest about its boundary: the Context Builder **does not browse the web** and must not invent research or citations. External tools can be added later through a tool interface without changing the agent contract.

## Execution model

A normal run makes these model calls:

1. Planner receives the raw task.
2. Context Builder receives the task and plan.
3. Analyst produces an artifact.
4. Critic checks the artifact.
5. If the Critic returns `revise`, the Analyst receives the critic's revision instructions and gets another pass.
6. The Critic checks the revised artifact again.
7. Finalizer receives the verified artifact and produces the answer.

The revision budget is deliberately small (`MAX_ITERATIONS = 2`). It is a control mechanism, not a quality guarantee.

## Local setup

**Prerequisite:** Node.js

```bash
npm install
npm run dev
```

Open the Vite development URL shown in the terminal.

### API key

You can paste a Gemini API key into the Settings area of the app. The key is stored in `sessionStorage` for the current browser session.

For a real deployment, do **not** put a long-lived provider secret in browser JavaScript. Move Gemini calls behind your backend and give the browser an authenticated application endpoint instead.

## Project map

```text
.
├── App.tsx                    # application shell + orchestration loop
├── components/
│   ├── StageCard.tsx          # agent execution state
│   └── TemplateViewer.tsx     # agent registry / prompts
├── services/
│   └── geminiService.ts       # structured Gemini calls
├── constants.ts               # agent definitions + orchestration limits
├── types.ts                   # shared agent and state contracts
├── index.css                  # product UI system
├── index.html
├── index.tsx
├── metadata.json
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Design direction

The UI is deliberately treated as an operations surface rather than a generic AI landing page.

- No default Tailwind indigo palette.
- No purple/blue hero gradient.
- No emoji feature icons.
- No fake performance metrics.
- No placeholder image CDN.
- A restrained accent token is used instead of scattered raw colors.
- Typography creates hierarchy instead of oversized dashboard cards.
- The execution trace is the main product surface because it reflects what the software actually does.

The visual system uses a dark graphite base, warm brass accent, compact monospace metadata, and a serif display face for the large editorial headings.

## Current limitations

This is still a frontend orchestration prototype, not a production agent platform.

- Gemini is currently the only model provider.
- Agents do not have external tools yet.
- Runs are kept in browser memory and are not persisted.
- There is no authentication or multi-user workspace.
- There is no server-side secret management.
- The Critic score is model-generated and should not be treated as an objective quality metric.

Those limitations are intentional. V2 establishes the orchestration contracts first; persistence, tools, model routing, and backend execution can be added without turning the UI into another monolithic prompt runner.

## License

No license has been declared yet.
