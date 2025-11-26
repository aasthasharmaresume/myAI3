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
  } catch { return []; }
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
    messages: initialMessages,
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

    if (mode === "vector") {
      // normal Pinecone mode
      sendMessage({ role: "user", content: text });
    } else {
      // *** Web Mode Placeholder ***
      sendMessage({ role: "user", content: "🌍 Web Search → " + text });
    }

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
                  <Image src="/Unknown.png" alt="logo" width={36} height={36}/>
                </AvatarFallback>
              </Avatar>
              <p className="font-semibold tracking-tight">Chat with {AI_NAME}</p>
            </ChatHeaderBlock>
            <ChatHeaderBlock className="justify-end">
              <Button size="sm" onClick={clearChat}>
                <Plus size={14}/> {CLEAR_CHAT_TEXT}
              </Button>
            </ChatHeaderBlock>
          </ChatHeader>
        </div>


        {/* 🔥 Toggle Bar */}
        <div className="mt-20 flex justify-center gap-3 py-3">

          {/* Vector */}
          <button
            onClick={() => setMode("vector")}
            className={`px-4 py-2 rounded-lg font-medium ${
              mode === "vector"
                ? "bg-black text-white"
                : "bg-white text-black"
            }`}
          >
            📁 Vector DB
          </button>

          {/* Web */}
          <button
            onClick={() => setMode("web")}
            className={`px-4 py-2 rounded-lg font-medium ${
              mode === "web"
                ? "bg-black text-white"
                : "bg-white text-black"
            }`}
          >
            🌍 Web Search
          </button>

        </div>


        {/* CHAT MESSAGES */}
        <div className="pt-6 pb-28 px-4 overflow-y-auto h-full">
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

