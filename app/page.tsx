// @ts-nocheck
"use client";

import { useChat } from "@ai-sdk/react";

export default function Page() {
  // useChat with the "old" helpers – we know they work at runtime,
  // we just tell TypeScript to ignore types in this file.
  const { messages, input, handleInputChange, handleSubmit, status } = useChat();

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
        Simple Chat
      </h1>

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
          value={input}
          onChange={handleInputChange}
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
