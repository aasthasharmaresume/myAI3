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
import { Plus, Database, Globe } from "lucide-react";
import { toast } from "sonner";
import { ChatHeader, ChatHeaderBlock } from "@/app/parts/chat-header";

// ---------------- VALIDATION ----------------
const formSchema = z.object({
  message: z.string().min(1).max(2000),
});

const STORAGE_KEY = "chat-history";
const MODE_KEY = "chat-mode";

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

const loadMode = (): "vector" | "web" => {
  if (typeof window === "undefined") return "vector";
  return (localStorage.getItem(MODE_KEY) as "vector" | "web") || "vector";
};

const saveMode = (mode: "vector" | "web") => {
  if (typeof window !== "undefined")
    localStorage.setItem(MODE_KEY, mode);
};

// ------------------------------------------------
export default function Chat() {
  const [mode, setMode] = useState<"vector" | "web">(loadMode());
  const [initialMessages] = useState<UIMessage[]>(loadSaved());
  
  const { messages, sendMessage, status, setMessages } = useChat({
    api: mode === "vector" ? "/api/chat/vector" : "/api/chat/web",
    body: { mode }, // Pass mode to API
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
  }, [setMessages, messages.length]);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      save(messages);
    }
  }, [messages]);

  // Handle mode change
  const handleModeChange = (newMode: "vector" | "web") => {
    setMode(newMode);
    saveMode(newMode);
    toast.success(`Switched to ${newMode === "vector" ? "Vector Database" : "Web Search"} mode`);
  };

  // form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  // ---------------- SEND ----------------
  function onSubmit(data: any) {
    const text = data.message.trim();
    if (!text) return;

    sendMessage({ 
      role: "user", 
      content: text,
    });

    form.reset();
  }

  function clearChat() {
    setMessages([]);
    save([]);
    welcomed.current = false;
    toast.success("Chat cleared");
    
    // Re-add welcome message
    setTimeout(() => {
      const welcome: UIMessage = {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        parts: [{ type: "text", text: WELCOME_MESSAGE }],
      };
      setMessages([welcome]);
      save([welcome]);
    }, 100);
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

        {/* 🔥 IMPROVED Toggle Bar */}
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 mt-4">
          <div className="flex items-center gap-1 bg-white rounded-full p-1 shadow-lg">
            {/* Vector DB Button */}
            <button
              onClick={() => handleModeChange("vector")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                mode === "vector"
                  ? "bg-black text-white shadow-md"
                  : "bg-transparent text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Database size={16} />
              <span>Vector DB</span>
            </button>

            {/* Web Search Button */}
            <button
              onClick={() => handleModeChange("web")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                mode === "web"
                  ? "bg-black text-white shadow-md"
                  : "bg-transparent text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Globe size={16} />
              <span>Web Search</span>
            </button>
          </div>
        </div>

        {/* CHAT MESSAGES */}
        <div className="pt-32 pb-28 px-4 overflow-y-auto h-full">
          {messages.map((m) => (
            <div key={m.id} className="mb-4">
              <div
                className={`max-w-[75%] px-4 py-3 rounded-xl ${
                  m.role === "user"
                    ? "ml-auto bg-black text-white"
                    : "mr-auto bg-white text-black shadow"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {status === "pending" && (
            <div className="max-w-[75%] mr-auto bg-white text-black shadow px-4 py-3 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* INPUT */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-2xl w-full px-4"
        >
          <div className="flex items-center gap-2 bg-white rounded-xl shadow-lg px-4 py-3 border-2 border-gray-200 focus-within:border-black transition-colors">
            <input
              {...form.register("message")}
              className="flex-1 outline-none text-gray-800 placeholder:text-gray-400"
              placeholder={
                mode === "vector"
                  ? "Ask about your documents..."
                  : "Search the web..."
              }
              disabled={status === "pending"}
            />
            <button
              type="submit"
              disabled={status === "pending"}
              className="bg-black text-white rounded-lg px-5 py-2 font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {status === "pending" ? "..." : "Send"}
            </button>
          </div>
          
          {/* Mode indicator below input */}
          <div className="text-center mt-2 text-xs text-gray-600">
            Using: {mode === "vector" ? "📁 Vector Database" : "🌍 Web Search"}
          </div>
        </form>
      </main>
    </div>
  );
}

