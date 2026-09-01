'use client';

import React, { useState, useEffect } from 'react';
import { fetchRoles, fetchAPIKeys, sendChatMessage, Role } from '@/lib/api';
import {
  Terminal,
  Play,
  Copy,
  Check,
  Code2,
  Key,
  Bot,
  Zap,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function PlaygroundPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [promptMessage, setPromptMessage] = useState('Analyze the key advantages of using multi-connector grounded AI architecture.');
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'python' | 'js' | 'node' | 'go'>('python');
  const [copiedCode, setCopiedCode] = useState(false);

  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const rList = await fetchRoles();
        setRoles(rList);
        if (rList.length > 0) setSelectedRoleId(rList[0].id);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  const handleRunExecution = async () => {
    if (!selectedRoleId || !promptMessage.trim() || executing) return;
    setExecuting(true);
    setExecutionResult(null);

    try {
      const res = await sendChatMessage(selectedRoleId, promptMessage);
      setExecutionResult(res);
    } catch (err: any) {
      setExecutionResult({ error: err.message || 'Execution error' });
    } finally {
      setExecuting(false);
    }
  };

  const generateCodeSnippet = (lang: string) => {
    const roleId = selectedRoleId || 'ROLE_ID';
    const baseUrl = 'http://localhost:8000';

    if (lang === 'curl') {
      return `curl -X POST "${baseUrl}/api/v1/roles/${roleId}/chat" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_OMNIROLE_API_KEY" \\
  -d '{
    "message": "${promptMessage.replace(/"/g, '\\"')}"
  }'`;
    }

    if (lang === 'python') {
      return `import requests

url = "${baseUrl}/api/v1/roles/${roleId}/chat"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "YOUR_OMNIROLE_API_KEY"
}
payload = {
    "message": "${promptMessage.replace(/"/g, '\\"')}"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;
    }

    if (lang === 'js') {
      return `fetch("${baseUrl}/api/v1/roles/${roleId}/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "YOUR_OMNIROLE_API_KEY"
  },
  body: JSON.stringify({
    message: "${promptMessage.replace(/"/g, '\\"')}"
  })
})
.then(res => res.json())
.then(data => console.log(data));`;
    }

    if (lang === 'node') {
      return `const axios = require('axios');

async function run() {
  const res = await axios.post('${baseUrl}/api/v1/roles/${roleId}/chat', {
    message: '${promptMessage.replace(/'/g, "\\'")}'
  }, {
    headers: { 'X-API-Key': 'YOUR_OMNIROLE_API_KEY' }
  });
  console.log(res.data);
}
run();`;
    }

    if (lang === 'go') {
      return `package main

import (
    "bytes"
    "fmt"
    "net/http"
    "io/ioutil"
)

func main() {
    url := "${baseUrl}/api/v1/roles/${roleId}/chat"
    payload := []byte(\`{"message": "${promptMessage.replace(/"/g, '\\"')}"}\`)

    req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("X-API-Key", "YOUR_OMNIROLE_API_KEY")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Println(string(body))
}`;
    }

    return '';
  };

  const handleCopyCode = () => {
    const code = generateCodeSnippet(activeCodeTab);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Terminal className="w-6 h-6 text-blue-400" />
          <span>Interactive REST API Playground & Code Exporter</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Test live inference requests and generate instant production code snippets in 5 languages.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Request Executor */}
        <div className="space-y-5">
          <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Target AI Role Agent
            </h2>

            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-[#18181c] border border-[#27272a] text-xs text-zinc-200 focus:outline-none"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.provider} - {r.model_name})
                </option>
              ))}
            </select>

            {selectedRole && (
              <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a] space-y-1 text-xs text-zinc-400">
                <div className="flex justify-between font-mono">
                  <span>Provider: <strong className="text-emerald-400">{selectedRole.provider}</strong></span>
                  <span>Connectors: <strong className="text-amber-400">{selectedRole.connectors?.length || 0} Enabled</strong></span>
                </div>
                <p className="text-[11px] text-zinc-500">{selectedRole.description}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Prompt Payload Message</label>
              <textarea
                rows={4}
                value={promptMessage}
                onChange={(e) => setPromptMessage(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#18181c] border border-[#27272a] text-xs text-zinc-100 font-mono focus:outline-none"
              />
            </div>

            <button
              onClick={handleRunExecution}
              disabled={executing || !promptMessage.trim()}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <Play className={`w-3.5 h-3.5 ${executing ? 'animate-spin' : ''}`} />
              <span>{executing ? 'Executing API Request...' : 'Run API Execution'}</span>
            </button>
          </div>

          {/* Response JSON Output */}
          {executionResult && (
            <div className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Execution Response Payload
              </h3>
              <pre className="p-4 rounded-xl bg-black/50 border border-[#27272a] text-xs text-emerald-400 font-mono overflow-x-auto max-h-64">
                {JSON.stringify(executionResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Right Column: Multi-Language Code Exporter */}
        <div className="space-y-5">
          <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Multi-Language Code Exporter
              </h2>

              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-xl bg-[#18181c] hover:bg-[#22222a] border border-[#27272a] text-xs font-bold text-zinc-300 flex items-center gap-1.5 transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Language Selector Tabs */}
            <div className="flex gap-1.5 p-1 rounded-xl bg-[#18181c] border border-[#27272a]">
              {(['python', 'curl', 'js', 'node', 'go'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveCodeTab(lang)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                    activeCodeTab === lang
                      ? 'bg-violet-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Snippet Code Window */}
            <pre className="p-4 rounded-xl bg-[#09090d] border border-[#27272a] text-xs text-violet-300 font-mono leading-relaxed overflow-x-auto min-h-[16rem]">
              {generateCodeSnippet(activeCodeTab)}
            </pre>
          </div>

          {/* Interactive Token Quota Progress Meter */}
          <div className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] space-y-3">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-zinc-300">Monthly Quota Consumption</span>
              <span className="text-blue-400 font-mono">27,356 / 500,000 Tokens (5.4%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#1e1e24] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full w-[5.4%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
