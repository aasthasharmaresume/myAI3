"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AI_NAME, CLEAR_CHAT_TEXT, WELCOME_MESSAGE } from "@/config";
import { UIMessage } from "ai";
import Image from "next/image";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ChatHeader, ChatHeaderBlock } from "@/app/parts/chat-header";

// ---------------- VALIDATION ----------------
const formSchema = z.object({
  message: z.string().min(1).max(2000),
});

const STORAGE_KEY = "chat-history";

const loadSaved = (): UIMessage[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const save = (messages: UIMessage[]) => {
  if (typeof window !== "undefined")
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
};

// ------------------------------------------------
export default function Chat() {
  const [mode, setMode] = useState<"vector" | "web">("vector"); // 🔥 Toggle State

  const [initialMessages] = useState<UIMessage[]>(loadSaved());
  const { messages, sendMessage, status, setMessages } = useChat({
    initialMessages,
    body: { mode }, // Pass mode to backend
  });

  const welcomed = useRef(false);

  // Auto welcome message
  useEffect(() => {
    if (!welcomed.current && messages.length === 0) {
      const welcome: UIMessage = {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        parts: [{ type: "text", text: WELCOME_MESSAGE }],
      };
      setMessages([welcome]);
      save([welcome]);
      welcomed.current = true;
    }
  }, []);

  // form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  // ---------------- SEND ----------------
  function onSubmit(data: any) {
    const text = data.message.trim();
    if (!text) return;

    sendMessage({ role: "user", content: text });
    form.reset();
  }

  function clearChat() {
    setMessages([]);
    save([]);
    toast.success("Chat cleared");
  }

  // ---------------- UI ----------------
  return (
    <div className="h-screen w-full flex justify-center items-center font-sans bg-[#e7c08c]">
      <main className="w-full h-full max-w-3xl relative">
        {/* HEADER */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#d49a63] shadow py-3">
          <ChatHeader>
            <ChatHeaderBlock />
            <ChatHeaderBlock className="justify-center items-center gap-2">
              <Avatar className="size-8 ring-2 ring-black">
                <AvatarImage src="/Unknown.png" />
                <AvatarFallback>
                  <Image src="/Unknown.png" alt="logo" width={36} height={36} />
                </AvatarFallback>
              </Avatar>
              <p className="font-semibold tracking-tight">Chat with {AI_NAME}</p>
            </ChatHeaderBlock>
            <ChatHeaderBlock className="justify-end">
              <Button size="sm" onClick={clearChat}>
                <Plus size={14} /> {CLEAR_CHAT_TEXT}
              </Button>
            </ChatHeaderBlock>
          </ChatHeader>
        </div>

        {/* 🔥 TOGGLE BUTTONS - ABSOLUTELY VISIBLE */}
        <div
          style={{
            position: "fixed",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 999,
            display: "flex",
            gap: "10px",
            backgroundColor: "white",
            padding: "10px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          {/* Vector Button */}
          <button
            onClick={() => {
              setMode("vector");
              console.log("Mode changed to: vector");
            }}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "2px solid black",
              backgroundColor: mode === "vector" ? "black" : "white",
              color: mode === "vector" ? "white" : "black",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            📁 Vector DB
          </button>

          {/* Web Button */}
          <button
            onClick={() => {
              setMode("web");
              console.log("Mode changed to: web");
            }}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "2px solid black",
              backgroundColor: mode === "web" ? "black" : "white",
              color: mode === "web" ? "white" : "black",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            🌍 Web Search
          </button>
        </div>

        {/* CHAT MESSAGES */}
        <div className="pt-28 pb-28 px-4 overflow-y-auto h-full">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[75%] px-4 py-3 rounded-xl mb-3 ${
                m.role === "user"
                  ? "ml-auto bg-black text-white"
                  : "mr-auto bg-white text-black"
              }`}
            >
              {m.content}
            </div>
          ))}
        </div>

        {/* INPUT */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-2xl w-full px-4"
        >
          <div className="flex items-center gap-2 bg-white rounded-xl shadow px-4 py-3">
            <input
              {...form.register("message")}
              className="flex-1 outline-none"
              placeholder="Ask something..."
            />
            <button
              type="submit"
              disabled={status === "pending"}
              className="bg-black text-white rounded-lg px-4 py-2"
            >
              {status === "pending" ? "..." : "Send"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
