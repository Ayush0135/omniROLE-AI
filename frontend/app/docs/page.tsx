'use client';

import React from 'react';
import { BookOpen, Terminal, Cpu, Layers, Code2, Server } from 'lucide-react';

export default function DocumentationPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-400" />
          <span>OmniRole AI Developer Documentation</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Complete sitemap, architectural guide, REST API reference, and real LLM server integration steps.
        </p>
      </div>

      {/* Architecture Diagram Section */}
      <section className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          1. System Architecture
        </h2>
        <p className="text-xs text-zinc-300 leading-relaxed">
          OmniRole AI decouples role configuration, system instruction synthesis, and API key auth from the underlying model provider using a clean strategy pattern.
        </p>

        <div className="p-4 rounded-xl bg-[#09090b] border border-[#27272a] font-mono text-xs text-blue-300 leading-loose overflow-x-auto">
          User / Client App → [X-API-Key] → FastAPI Router → PromptBuilder Engine → LLMProvider (Mock / OpenAI-Compatible) → Response Payload
        </div>
      </section>

      {/* REST API Endpoints */}
      <section className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-violet-400" />
          2. REST API Reference
        </h2>

        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between">
            <span className="font-bold text-emerald-400">GET /health</span>
            <span className="text-zinc-400">Health check & engine status</span>
          </div>

          <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between">
            <span className="font-bold text-blue-400">GET /api/v1/roles</span>
            <span className="text-zinc-400">List all configured AI roles</span>
          </div>

          <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between">
            <span className="font-bold text-blue-400">POST /api/v1/roles</span>
            <span className="text-zinc-400">Create new AI role</span>
          </div>

          <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between">
            <span className="font-bold text-violet-400">POST /api/v1/roles/{'{id}'}/chat</span>
            <span className="text-zinc-400">Internal chat workspace endpoint</span>
          </div>

          <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-between">
            <span className="font-bold text-amber-400">POST /v1/roles/{'{role_id}'}/chat</span>
            <span className="text-zinc-400">Public Developer API (Requires X-API-Key)</span>
          </div>
        </div>
      </section>

      {/* Integration Code Examples */}
      <section className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Code2 className="w-4 h-4 text-emerald-400" />
          3. Developer Integration Snippets
        </h2>

        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-zinc-300 mb-2">cURL Example</h4>
            <pre className="p-4 rounded-xl bg-[#09090b] border border-[#27272a] text-xs font-mono text-emerald-400 overflow-x-auto">
{`curl -X POST "http://localhost:8000/v1/roles/research-scientist/chat" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: omni_live_your_key_here" \\
  -d '{
    "message": "Explain literature review methodology.",
    "temperature": 0.3
  }'`}
            </pre>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-300 mb-2">Python Example</h4>
            <pre className="p-4 rounded-xl bg-[#09090b] border border-[#27272a] text-xs font-mono text-blue-400 overflow-x-auto">
{`import requests

res = requests.post(
    "http://localhost:8000/v1/roles/code-architect/chat",
    headers={"X-API-Key": "omni_live_your_key_here"},
    json={"message": "Design a high-throughput microservice architecture."}
)
print(res.json()["response"])`}
            </pre>
          </div>
        </div>
      </section>

      {/* Real LLM Server Integration Guide */}
      <section className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          4. Connecting to Real Qwen / vLLM Server
        </h2>

        <p className="text-xs text-zinc-300 leading-relaxed">
          To switch from the local <code className="text-blue-400 font-mono">MockProvider</code> to a live LLM endpoint (e.g. vLLM serving Qwen-2.5-72B or Ollama), update your <code className="text-blue-400 font-mono">backend/.env</code>:
        </p>

        <pre className="p-4 rounded-xl bg-[#09090b] border border-[#27272a] text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
{`# Enable real LLM provider
LLM_PROVIDER=openai_compatible
LLM_BASE_URL=http://your-vllm-host:8000/v1
LLM_API_KEY=your_optional_api_key
LLM_MODEL=qwen-2.5-72b-instruct`}
        </pre>
      </section>
    </div>
  );
}
