import React, { useState, useRef, useEffect } from "react";
import "./App.css";

export default function GeminiChat() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", content: input }]);
    setInput("");
    // Simulate assistant reply (replace with backend call)
    setTimeout(() => {
      setMessages(msgs => [
        ...msgs,
        { role: "assistant", content: "(This is a mock reply. Connect your backend here.)" }
      ]);
    }, 800);
  };

  const handleKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="gemini-chat-root">
      <header className="gemini-header">Gemini Chat UI</header>
      <main className="gemini-chat-main">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`gemini-msg ${msg.role === "user" ? "gemini-user" : "gemini-assistant"}`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </main>
      <footer className="gemini-chat-footer">
        <textarea
          className="gemini-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={1}
        />
        <button className="gemini-send" onClick={handleSend} disabled={!input.trim()}>
          Send
        </button>
      </footer>
    </div>
  );
}
