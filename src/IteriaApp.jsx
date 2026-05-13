import { useState, useRef, useEffect } from "react";
import {
  Send, Square, ChevronDown, ChevronRight, Search,
  FileText, Brain, RefreshCw, CheckCircle, Loader2,
  Cpu, Database, Zap, X, Menu, Plus,
  MessageSquare, Sparkles, BookOpen, CornerDownLeft
} from "lucide-react";
import "./IteriaApp.css";

const HISTORY = [
  { id: 1, title: "RAG pipeline architecture", time: "2h ago" },
  { id: 2, title: "Vector database comparison", time: "Yesterday" },
  { id: 3, title: "Chunking strategies for LLMs", time: "2d ago" },
  { id: 4, title: "Embedding models benchmark", time: "3d ago" },
];

const MOCK_SOURCES = [
  { id: 1, title: "RAG Survey 2024.pdf", chunk: "Retrieval-Augmented Generation combines parametric and non-parametric memory to improve factual accuracy..." },
  { id: 2, title: "LLM Grounding Techniques", chunk: "Iterative refinement loops in agentic RAG systems demonstrate up to 34% improvement in factual precision..." },
  { id: 3, title: "Critic-Rewriter Patterns", chunk: "The critic component evaluates retrieved context for relevance and completeness before allowing the generator to proceed..." },
];

// Thought Process
const ThoughtTrace = ({ iterations, isStreaming }) => {
  const [open, setOpen] = useState(true);
  const stepColors = ["blue", "amber", "violet", "emerald"];
  return (
    <div className="thought-trace">
      <button className="thought-header" onClick={() => setOpen(o => !o)}>
        <Cpu size={13} style={{ color: "#a78bfa" }} />
        <span className="thought-label">Thought process</span>
        {isStreaming && (
          <span className="bounce-dots">
            {[0,1,2].map(i => <span key={i} className="bounce-dot" style={{ animationDelay: `${i*150}ms` }} />)}
          </span>
        )}
        <span className="thought-count">{iterations.length} step{iterations.length !== 1 ? "s" : ""}</span>
        {open ? <ChevronDown size={13} style={{ color: "#64748b" }} /> : <ChevronRight size={13} style={{ color: "#64748b" }} />}
      </button>
      {open && (
        <div className="thought-body">
          {iterations.map((iter, idx) => (
            <div key={idx} className="thought-step">
              <div className={`step-icon ${stepColors[idx % 4]}`}>
                {iter.done ? <CheckCircle size={11} /> : iter.active ? <Loader2 size={11} className="spinner" /> :
                  idx % 4 === 0 ? <Database size={11} /> : idx % 4 === 1 ? <Brain size={11} /> :
                  idx % 4 === 2 ? <RefreshCw size={11} /> : <CheckCircle size={11} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span className="step-label">{iter.label}</span>
                  {iter.done && <span className="step-ms">{iter.ms}ms</span>}
                </div>
                <p className="step-detail">{iter.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Source Badge
const SourceBadge = ({ source }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button className="source-badge" onClick={() => setOpen(o => !o)}>
        <FileText size={9} /> {source.title}
      </button>
      {open && (
        <div className="source-popup">
          <div className="source-popup-header">
            <span className="source-popup-title"><BookOpen size={11} style={{ color: "#60a5fa" }} /> {source.title}</span>
            <button className="source-popup-close" onClick={() => setOpen(false)}><X size={12} /></button>
          </div>
          <p className="source-popup-text">{source.chunk}</p>
        </div>
      )}
    </div>
  );
};

// Message Bubble
const MessageBubble = ({ msg }) => {
  if (msg.role === "user") {
    return <div className="user-msg"><div className="user-bubble">{msg.content}</div></div>;
  }
  return (
    <div className="assistant-msg">
      <div className="assistant-avatar"><Sparkles size={13} style={{ color: "#c4b5fd" }} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {msg.iterations?.length > 0 && <ThoughtTrace iterations={msg.iterations} isStreaming={msg.streaming} />}
        {msg.streaming && !msg.content ? (
          <div className="streaming-text">
            <span>{msg.statusText}</span>
            <span className="bounce-dots">{[0,1,2].map(i => <span key={i} className="bounce-dot" style={{ animationDelay: `${i*150}ms`, background: "#475569" }} />)}</span>
          </div>
        ) : (
          <div className="assistant-content">
            {msg.content}
            {msg.streaming && <span className="streaming-cursor" />}
          </div>
        )}
        {msg.sources?.length > 0 && !msg.streaming && (
          <div className="sources-row">
            <span className="sources-label">Sources:</span>
            {msg.sources.map(src => <SourceBadge key={src.id} source={src} />)}
          </div>
        )}
      </div>
    </div>
  );
};

// Sidebar
const Sidebar = ({ open, onClose }) => (
  <>
    {open && <div className="sidebar-overlay" onClick={onClose} />}
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo"><Zap size={14} /></div>
        <span className="sidebar-title">Iteria</span>
        <span className="rag-badge">RAG</span>
      </div>
      <button className="new-session-btn"><Plus size={14} /> New Chat</button>
      <div className="history-list">
        <p className="history-label">Recent</p>
        {HISTORY.map(h => (
          <button key={h.id} className="history-item">
            <MessageSquare size={13} className="history-item-icon" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="history-item-title">{h.title}</p>
              <p className="history-item-time">{h.time}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="user-avatar">U</div>
        <span className="user-email">user@iteria.ai</span>
      </div>
    </aside>
  </>
);

// Iteration steps
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

export default function IteriaApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const stopRef = useRef(false);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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
    const userMsg = { id: Date.now(), role: "user", content: query };
    const aId = Date.now() + 1;
    const aMsg = { id: aId, role: "assistant", content: "", streaming: true, statusText: "Initializing retrieval…", iterations: [], sources: [] };
    setMessages(prev => [...prev, userMsg, aMsg]);
    setIsLoading(true);

    for (let i = 0; i < ITER_STEPS.length; i++) {
      if (stopRef.current) break;
      const step = ITER_STEPS[i];
      setMessages(prev => prev.map(m => m.id === aId ? {
        ...m, statusText: step.label,
        iterations: [...m.iterations.map((it, idx) => idx === m.iterations.length - 1 ? { ...it, active: false, done: true } : it), { ...step, active: true, done: false }]
      } : m));
      await sleep(step.ms + Math.random() * 200);
      if (stopRef.current) break;
      setMessages(prev => prev.map(m => m.id === aId ? {
        ...m, iterations: m.iterations.map((it, idx) => idx === m.iterations.length - 1 ? { ...it, active: false, done: true } : it)
      } : m));
    }

    if (!stopRef.current) {
      setMessages(prev => prev.map(m => m.id === aId ? { ...m, statusText: "Generating final answer…" } : m));
      await streamText(FINAL_ANSWER, aId);
    }

    setMessages(prev => prev.map(m => m.id === aId ? {
      ...m, streaming: false,
      sources: stopRef.current ? [] : MOCK_SOURCES,
      content: stopRef.current ? "Response interrupted." : m.content,
    } : m));
    setIsLoading(false);
    stopRef.current = false;
    inputRef.current?.focus();
  };

  const handleStop = () => { stopRef.current = true; };
  const handleKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const isEmpty = messages.length === 0;

  return (
    <div className="iteria-root">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-area">
        <header className="main-header">
          <button className="menu-btn" onClick={() => setSidebarOpen(o => !o)}><Menu size={16} /></button>
          <span className="status-dot" style={{ marginLeft: "auto" }} />
          <span className="status-text">Agentic RAG · 3-pass loop</span>
        </header>
        <div className="chat-area">
          {isEmpty ? (
            <div className="empty-state">
              <div className="empty-logo"><Zap size={24} style={{ color: "#c4b5fd" }} /></div>
              <h1 className="empty-title">Iteria</h1>
              <p className="empty-desc">An agentic RAG system that iteratively retrieves, critiques, and refines its answers before responding.</p>
              <div className="suggestions">
                {["How does iterative RAG improve accuracy?", "Explain the critic-rewriter loop", "What chunking strategy works best for long docs?", "Compare dense vs sparse retrieval"].map(q => (
                  <button key={q} className="suggestion-btn" onClick={() => { setInput(q); inputRef.current?.focus(); }}>{q}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages-container">
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
        <div className="input-area">
          <div className="input-wrapper">
            <div className="input-box">
              <Search size={15} className="input-icon" />
              <textarea
                ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey} placeholder="Ask anything — Iteria will reason iteratively..."
                rows={1} className="input-textarea"
              />
              {isLoading ? (
                <button className="send-btn stop" onClick={handleStop}><Square size={11} /> Stop</button>
              ) : (
                <button className="send-btn primary" onClick={handleSend} disabled={!input.trim()}>
                  <Send size={11} /> Send
                </button>
              )}
            </div>
            <p className="input-footer">Iteria runs up to 3 retrieval-critique-refine iterations per query</p>
          </div>
        </div>
      </main>
    </div>
  );
}