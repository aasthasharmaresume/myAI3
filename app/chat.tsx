"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";

export default function Chat() {
  const [mode, setMode] = useState<"vector" | "web">("vector");

  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    body: { mode },   // ONLY allowed property
  });

  return (
    <div style={{
      minHeight: "100vh",
      padding: "40px",
      background: "#ffeccc",
      fontFamily: "sans-serif"
    }}>
      <h1 style={{ fontSize: 26, fontWeight: "bold" }}>Chat.tsx placeholder</h1>
      <p>This file now builds successfully ✔</p>

      <p style={{ marginTop: 20 }}>Current Mode: {mode}</p>

      <button onClick={() => setMode("vector")}>Vector</button>
      <button onClick={() => setMode("web")} style={{ marginLeft: 10 }}>Web</button>

      <div style={{ marginTop: 20, background: "white", padding: 15, borderRadius: 8 }}>
        {messages.map(m => (
          <p key={m.id}><b>{m.role}:</b> {(m as any).content}</p>
        ))}
        {messages.length === 0 && <p>No chat history yet.</p>}
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type here..."
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" disabled={status !== "ready"}>Send</button>
      </form>
    </div>
  );
}


