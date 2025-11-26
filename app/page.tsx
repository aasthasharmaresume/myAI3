"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";

export default function Page() {
  const [mode, setMode] = useState<"vector" | "web">("vector");
  const [text, setText] = useState("");

  const { messages, append, status } = useChat({
    body: { mode },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText("");
    await append({ role: "user", content: value as any });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "system-ui, sans-serif",
        backgroundColor: "#f5e4c3",
      }}
    >
      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "10px" }}>
        Simple Chat (Test)
      </h1>

      <p style={{ marginBottom: "20px" }}>
        Current mode: <strong>{mode}</strong>
      </p>

      {/* MODE TOGGLE BUTTONS */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => setMode("vector")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid #000",
            backgroundColor: mode === "vector" ? "black" : "white",
            color: mode === "vector" ? "white" : "black",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          📁 Vector
        </button>
        <button
          onClick={() => setMode("web")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid #000",
            backgroundColor: mode === "web" ? "black" : "white",
            color: mode === "web" ? "white" : "black",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          🌍 Web
        </button>
      </div>

      {/* CHAT MESSAGES */}
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "10px",
          marginBottom: "20px",
          maxHeight: "60vh",
          overflowY: "auto",
          background: "white",
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              marginBottom: "8px",
              textAlign: m.role === "user" ? "right" : "left",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "6px 10px",
                borderRadius: "12px",
                backgroundColor: m.role === "user" ? "black" : "#eee",
                color: m.role === "user" ? "white" : "black",
                maxWidth: "80%",
              }}
            >
              {(m as any).content ?? JSON.stringify(m)}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <p style={{ color: "#777" }}>No messages yet. Say hi!</p>
        )}
      </div>

      {/* INPUT FORM */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          disabled={status === "submitted" || status === "streaming"}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "black",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {status === "submitted" || status === "streaming" ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
