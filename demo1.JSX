import { useState, useRef, useEffect } from "react";
import {
  Send, Square, ChevronDown, ChevronRight, Search,
  FileText, Brain, RefreshCw, CheckCircle, Loader2,
  Cpu, Database, Zap, Clock, X, Menu, Plus,
  MessageSquare, Sparkles, BookOpen, CornerDownLeft
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const HISTORY = [
  { id: 1, title: "RAG pipeline architecture", time: "2h ago" },
  { id: 2, title: "Vector database comparison", time: "Yesterday" },
  { id: 3, title: "Chunking strategies for LLMs", time: "2d ago" },
  { id: 4, title: "Embedding models benchmark", time: "3d ago" },
];

const MOCK_SOURCES = [
  { id: 1, title: "RAG Survey 2024.pdf", chunk: "Retrieval-Augmented Generation combines parametric and non-parametric memory to improve factual accuracy in language models by grounding responses in retrieved documents..." },
  { id: 2, title: "LLM Grounding Techniques", chunk: "Iterative refinement loops in agentic RAG systems demonstrate up to 34% improvement in factual precision over single-pass retrieval, particularly for multi-hop reasoning tasks..." },
  { id: 3, title: "Critic-Rewriter Patterns", chunk: "The critic component evaluates retrieved context for relevance and completeness before allowing the generator to proceed, implementing a self-verification loop..." },
];

// ─── Thought Process Component ────────────────────────────────────────────────
const ThoughtTrace = ({ iterations, isStreaming }) => {
  const [open, setOpen] = useState(true);

  const stepIcons = [Database, Brain, RefreshCw, CheckCircle];
  const stepColors = [
    "text-blue-400 bg-blue-500/10 border-blue-500/30",
    "text-amber-400 bg-amber-500/10 border-amber-500/30",
    "text-violet-400 bg-violet-500/10 border-violet-500/30",
    "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  ];

  return (
    <div className="mb-3 rounded-xl border border-white/8 bg-white/3 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/4 transition-colors text-left"
      >
        <div className="flex items-center gap-1.5 flex-1">
          <Cpu size={13} className="text-violet-400" />
          <span className="text-xs font-medium text-slate-300 tracking-wide">Thought process</span>
          {isStreaming && (
            <span className="ml-1 flex gap-0.5">
              {[0,1,2].map(i => (
                <span key={i} className="w-1 h-1 rounded-full bg-violet-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500">{iterations.length} step{iterations.length !== 1 ? "s" : ""}</span>
        {open ? <ChevronDown size={13} className="text-slate-500" /> : <ChevronRight size={13} className="text-slate-500" />}
      </button>

      {open && (
        <div className="px-4 pb-3 space-y-2 border-t border-white/6">
          {iterations.map((iter, idx) => {
            const Icon = stepIcons[idx % stepIcons.length];
            const color = stepColors[idx % stepColors.length];
            return (
              <div key={idx} className="flex gap-2.5 pt-2">
                <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 border ${color}`}>
                  {iter.done
                    ? <CheckCircle size={11} />
                    : iter.active
                    ? <Loader2 size={11} className="animate-spin" />
                    : <Icon size={11} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-medium text-slate-300">{iter.label}</p>
                    {iter.done && <span className="text-[10px] text-slate-600">{iter.ms}ms</span>}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{iter.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Source Badge ─────────────────────────────────────────────────────────────
const SourceBadge = ({ source }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-300 hover:bg-blue-500/25 transition-colors"
      >
        <FileText size={9} />
        {source.title}
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-72 rounded-xl bg-slate-800 border border-white/10 shadow-2xl p-3 z-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
              <BookOpen size={11} className="text-blue-400" />
              {source.title}
            </p>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300">
              <X size={12} />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">{source.chunk}</p>
        </div>
      )}
    </div>
  );
};

// ─── Message Bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[72%] px-4 py-3 rounded-2xl rounded-tr-sm bg-violet-600/80 border border-violet-500/40 text-sm text-white leading-relaxed shadow-lg shadow-violet-900/20">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-6 items-start">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/30 to-blue-500/30 border border-violet-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles size={13} className="text-violet-300" />
      </div>
      <div className="flex-1 min-w-0">
        {msg.iterations?.length > 0 && (
          <ThoughtTrace iterations={msg.iterations} isStreaming={msg.streaming} />
        )}

        {msg.streaming && !msg.content ? (
          <div className="flex items-center gap-2 py-2">
            <span className="text-xs text-slate-500">{msg.statusText}</span>
            <span className="flex gap-0.5">
              {[0,1,2].map(i => (
                <span key={i} className="w-1 h-1 rounded-full bg-slate-600 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </span>
          </div>
        ) : (
          <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {msg.content}
            {msg.streaming && <span className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 animate-pulse align-text-bottom" />}
          </div>
        )}

        {msg.sources?.length > 0 && !msg.streaming && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="text-[10px] text-slate-600 self-center">Sources:</span>
            {msg.sources.map(src => <SourceBadge key={src.id} source={src} />)}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ open, onClose }) => (
  <>
    {open && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />}
    <aside className={`fixed lg:relative inset-y-0 left-0 z-30 w-64 flex flex-col bg-slate-950 border-r border-white/6 transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/6">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
          <Zap size={14} className="text-white" />
        </div>
        <span className="font-semibold text-white tracking-tight">Iteria</span>
        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-medium tracking-wide">RAG</span>
      </div>

      <div className="px-3 py-3">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-white/6 transition-colors">
          <Plus size={14} />
          New session
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
        <p className="text-[10px] text-slate-600 uppercase tracking-widest px-2 py-1 font-medium">Recent</p>
        {HISTORY.map(h => (
          <button key={h.id} className="w-full flex items-start gap-2 px-2.5 py-2 rounded-lg hover:bg-white/5 transition-colors text-left group">
            <MessageSquare size={13} className="text-slate-600 mt-0.5 flex-shrink-0 group-hover:text-slate-400" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 truncate group-hover:text-slate-200 transition-colors">{h.title}</p>
              <p className="text-[10px] text-slate-600">{h.time}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="px-3 py-3 border-t border-white/6">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-[10px] text-white font-bold">U</div>
          <span className="text-xs text-slate-400">user@iteria.ai</span>
        </div>
      </div>
    </aside>
  </>
);

// ─── Build mock iterations progressively ─────────────────────────────────────
const ITER_STEPS = [
  { label: "Pass 1 — Retrieving", detail: "Querying vector store with semantic embeddings…", ms: 312 },
  { label: "Pass 1 — Generating", detail: "Synthesizing initial response from 3 retrieved chunks…", ms: 891 },
  { label: "Pass 2 — Critiquing", detail: "Critic agent evaluating factual coverage and gaps…", ms: 445 },
  { label: "Pass 2 — Refining", detail: "Rewriter expanding query with identified missing facets…", ms: 623 },
  { label: "Pass 3 — Final generation", detail: "Synthesizing refined response with all retrieved context…", ms: 702 },
];

const FINAL_ANSWER = `Iteria's iterative RAG loop works across up to 3 refinement passes:

**Pass 1 — Retrieve & Generate**
The system encodes your query, retrieves the top-k semantically similar chunks from the vector store, and generates an initial draft answer.

**Pass 2 — Critic & Rewrite**
A Critic agent inspects the draft for factual gaps, contradictions, or missing context. If confidence is below threshold, a Rewriter agent reformulates the query to target the identified gaps and retrieves supplementary chunks.

**Pass 3 — Final Synthesis**
The expanded context window is fed into the generator for a final, grounded answer — complete with inline citations and source attribution.

This loop ensures that the system "does not trust its first answer," systematically improving coverage and accuracy before returning a response.`;

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function IteriaApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const stopRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const streamText = async (text, msgId) => {
    const chars = text.split("");
    let built = "";
    for (let i = 0; i < chars.length; i++) {
      if (stopRef.current) break;
      built += chars[i];
      const snap = built;
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: snap, streaming: true } : m));
      await sleep(10 + Math.random() * 8);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const query = input.trim();
    setInput("");
    stopRef.current = false;
    setStopRequested(false);

    const userMsg = { id: Date.now(), role: "user", content: query };
    const assistantId = Date.now() + 1;
    const assistantMsg = {
      id: assistantId, role: "assistant", content: "",
      streaming: true, statusText: "Initializing retrieval…",
      iterations: [], sources: [],
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    // Simulate iterations
    for (let i = 0; i < ITER_STEPS.length; i++) {
      if (stopRef.current) break;
      const step = ITER_STEPS[i];

      setMessages(prev => prev.map(m => m.id === assistantId ? {
        ...m,
        statusText: step.label,
        iterations: [
          ...m.iterations.map((it, idx) => idx === m.iterations.length - 1 ? { ...it, active: false, done: true } : it),
          { ...step, active: true, done: false }
        ]
      } : m));

      await sleep(step.ms + Math.random() * 200);
      if (stopRef.current) break;

      setMessages(prev => prev.map(m => m.id === assistantId ? {
        ...m,
        iterations: m.iterations.map((it, idx) =>
          idx === m.iterations.length - 1 ? { ...it, active: false, done: true } : it
        )
      } : m));
    }

    if (!stopRef.current) {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, statusText: "Generating final answer…" } : m));
      await streamText(FINAL_ANSWER, assistantId);
    }

    setMessages(prev => prev.map(m => m.id === assistantId ? {
      ...m, streaming: false,
      sources: stopRef.current ? [] : MOCK_SOURCES,
      content: stopRef.current ? "Response interrupted." : m.content,
    } : m));

    setIsLoading(false);
    stopRef.current = false;
    inputRef.current?.focus();
  };

  const handleStop = () => {
    stopRef.current = true;
    setStopRequested(true);
  };

  const handleKey = e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/6 bg-slate-900/80 backdrop-blur-sm flex-shrink-0">
          <button onClick={() => setSidebarOpen(o => !o)} className="lg:hidden p-1.5 rounded-lg hover:bg-white/8 text-slate-400 hover:text-white transition-colors">
            <Menu size={16} />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-500">Agentic RAG · 3-pass loop</span>
          </div>
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-600/30 border border-violet-500/30 flex items-center justify-center mb-5">
                <Zap size={24} className="text-violet-300" />
              </div>
              <h1 className="text-xl font-semibold text-white mb-2 tracking-tight">Iteria</h1>
              <p className="text-sm text-slate-500 max-w-sm mb-8 leading-relaxed">
                An agentic RAG system that iteratively retrieves, critiques, and refines its answers before responding.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {[
                  "How does iterative RAG improve accuracy?",
                  "Explain the critic-rewriter loop",
                  "What chunking strategy works best for long docs?",
                  "Compare dense vs sparse retrieval",
                ].map(q => (
                  <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="text-left text-xs px-3.5 py-2.5 rounded-xl border border-white/8 bg-white/3 hover:bg-white/6 text-slate-400 hover:text-slate-200 transition-all leading-relaxed">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto px-4 py-6">
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="flex-shrink-0 px-4 py-4 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent">
          <div className="max-w-2xl mx-auto">
            <div className="relative flex items-end gap-2 bg-slate-800/80 border border-white/10 rounded-2xl px-4 py-3 shadow-2xl shadow-black/40 focus-within:border-violet-500/40 transition-colors">
              <Search size={15} className="text-slate-500 flex-shrink-0 mb-0.5" />
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask Iteria anything…"
                rows={1}
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 resize-none outline-none leading-relaxed max-h-32 overflow-y-auto py-0.5"
                style={{ scrollbarWidth: "none" }}
              />
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isLoading ? (
                  <button onClick={handleStop}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs hover:bg-red-500/30 transition-colors">
                    <Square size={11} fill="currentColor" />
                    Stop
                  </button>
                ) : (
                  <button onClick={handleSend} disabled={!input.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <Send size={11} />
                    <CornerDownLeft size={10} className="opacity-60" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-center text-[10px] text-slate-600 mt-2">
              Iteria runs up to 3 retrieval-critique-refine iterations per query
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}