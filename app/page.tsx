"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

import { ChatHeader } from "@/app/parts/chat-header";
import { ChatHeaderBlock } from "@/app/parts/chat-header";
import { AI_NAME, CLEAR_CHAT_TEXT, WELCOME_MESSAGE } from "@/config";

const STORAGE_KEY = "chat-messages";

export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const welcomeShown = useRef(false);

  const stored =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
      : [];

  const { messages, sendMessage, setMessages } = useChat({
    messages: stored,
  });

  // enable client-side rendering
  useEffect(() => setIsClient(true), []);

  // save chat history
  useEffect(() => {
    if (isClient) localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages, isClient]);

  // welcome message only once
  useEffect(() => {
    if (!isClient || welcomeShown.current || messages.length > 0) return;

    const msg: UIMessage = {
      id: "welcome",
      role: "assistant",
      parts: [{ type: "text", text: WELCOME_MESSAGE }],
    };

    setMessages([msg]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([msg]));
    welcomeShown.current = true;
  }, [isClient, messages, setMessages]);

  // clear chat
  function clearChat() {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Chat cleared!");
  }

  return (
    <div className="flex h-screen items-center justify-center font-sans dark:bg-black">
      <main className="w-full h-screen relative dark:bg-black">

        {/* 🔥 HEADER stays same UI */}
        <div className="fixed top-0 left-0 right-0 z-50 pb-16 bg-linear-to-b from-background via-background/50 dark:bg-black">
          <ChatHeader>
            <ChatHeaderBlock />
            <ChatHeaderBlock className="justify-center items-center">
              <Avatar className="size-8 ring-1 ring-primary">
                <AvatarImage src="/Unknown.png" />
                <AvatarFallback>
                  <Image src="/Unknown.png" alt="logo" width={36} height={36} />
                </AvatarFallback>
              </Avatar>
              <p className="tracking-tight">Chat with {AI_NAME}</p>
            </ChatHeaderBlock>
            <ChatHeaderBlock className="justify-end">
              <Button variant="outline" size="sm" onClick={clearChat}>
                {CLEAR_CHAT_TEXT}
              </Button>
            </ChatHeaderBlock>
          </ChatHeader>
        </div>

        {/* 🔥 CHAT WINDOW (your clean UI kept intact) */}
        <div className="pt-24 px-4 flex justify-center h-full">
          <div className="chat-window w-full max-w-3xl flex flex-col gap-4 h-[calc(100vh-7rem)]">

            {/* MESSAGE BUBBLES */}
            <div className="flex-1 overflow-y-auto">
              {messages.map((m) => (
                <div key={m.id}
                  className={m.role === "user" ? "user-bubble" : "bot-bubble"}
                >
                  {m.parts?.[0]?.text ??
                    (m as any).content ??
                    JSON.stringify(m)}
                </div>
              ))}
            </div>

            {/* 🟢 INPUT — now ALWAYS typeable */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const value = new FormData(e.target as HTMLFormElement).get("message") as string;
                if (!value.trim()) return;

                sendMessage({ role: "user", content: value });
                (e.target as HTMLFormElement).reset();
              }}
            >
              <div className="input-bar w-full">
                <input
                  name="message"
                  className="flex-1 bg-transparent outline-none"
                  placeholder="Ask me anything…"
                />
                <button type="submit">Send</button>
              </div>
            </form>

          </div>
        </div>
      </main>
    </div>
  );
}
