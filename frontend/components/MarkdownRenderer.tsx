'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy, ExternalLink, Code2, BookOpen } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

function CodeBlock({ inline, className, children, ...props }: any) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const codeText = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline || !match) {
    return (
      <code
        className="px-1.5 py-0.5 rounded-md bg-slate-800/80 text-amber-300 font-mono text-[12px] border border-amber-500/20"
        {...props}
      >
        {children}
      </code>
    );
  }

  const lang = match[1];

  return (
    <div className="my-3.5 rounded-2xl overflow-hidden border border-slate-700/80 bg-[#0d1117] shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="uppercase text-[11px] font-semibold text-slate-300">{lang}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-[11px]"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto font-mono text-xs text-slate-200 leading-relaxed">
        <pre className="!bg-transparent !p-0 !m-0">
          <code>{children}</code>
        </pre>
      </div>
    </div>
  );
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose-ai text-sm leading-relaxed text-slate-200 space-y-2.5">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-white mt-4 mb-2 pb-1.5 border-b border-slate-700/50 font-sora">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-white mt-3.5 mb-2 font-sora flex items-center gap-2">
              <span className="w-1.5 h-4 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full inline-block" />
              <span>{children}</span>
            </h2>
          ),
          h3: ({ children }) => {
            const isRef = String(children).toLowerCase().includes('reference') || String(children).toLowerCase().includes('source');
            return (
              <h3 className={`text-sm font-semibold mt-3 mb-1.5 font-sora flex items-center gap-2 ${
                isRef ? 'text-cyan-300 pt-2 border-t border-cyan-500/20' : 'text-amber-300'
              }`}>
                {isRef && <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />}
                <span>{children}</span>
              </h3>
            );
          },
          p: ({ children }) => (
            <p className="mb-2 leading-relaxed text-slate-200 text-xs sm:text-sm">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-5 mb-2.5 space-y-1 text-slate-300 text-xs sm:text-sm">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-5 mb-2.5 space-y-1 text-slate-300 text-xs sm:text-sm">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">
              {children}
            </strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-500/70 pl-3.5 py-1.5 my-2.5 text-slate-300 italic bg-indigo-500/5 rounded-r-xl">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-2xl border border-slate-700/60 shadow-lg">
              <table className="min-w-full text-xs text-left divide-y divide-slate-700/60">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-900/90 text-slate-200 font-semibold font-sora">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 text-xs font-semibold text-slate-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2 border-t border-slate-800 text-slate-300 text-xs">
              {children}
            </td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors font-medium"
            >
              <span>{children}</span>
              <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-70" />
            </a>
          ),
          hr: () => (
            <hr className="my-3.5 border-slate-700/60" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
