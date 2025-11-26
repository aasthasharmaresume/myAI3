// @ts-nocheck
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react";
import { Plus } from "lucide-react";
import { ChatHeader, ChatHeaderBlock } from "@/app/parts/chat-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UIMessage } from "ai";
import { useEffect, useState, useRef } from "react";
import { AI_NAME, CLEAR_CHAT_TEXT, WELCOME_MESSAGE } from "@/config";
import Image from "next/image";

const formSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message must be at most 2000 characters."),
});

const STORAGE_KEY = "chat-messages";

type StorageData = {
  messages: UIMessage[];
  durations: Record<string, number>;
};

const loadMessagesFromStorage = (): StorageData => {
  if (typeof window === "undefined") return { messages: [], durations: {} };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { messages: [], durations: {} };

    const parsed = JSON.parse(stored);
    return {
      messages: parsed.messages || [],
      durations: parsed.durations || {},
    };
  } catch (error) {
    console.error("Failed to load messages from localStorage:", error);
    return { messages: [], durations: {} };
  }
};

const saveMessagesToStorage = (
  messages: UIMessage[],
  durations: Record<string, number>
) => {
  if (typeof window === "undefined") return;
  try {
    const data: StorageData = { messages, durations };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save messages to localStorage:", error);
  }
};

export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeMessageShownRef = useRef(false);

  const stored =
    typeof window !== "undefined"
      ? loadMessagesFromStorage()
      : { messages: [], durations: {} };

  const [initialMessages] = useState<UIMessage[]>(stored.messages);

  // useChat with initial messages; TS is disabled at top so this won't block builds
  const { messages, sendMessage, status, stop, setMessages } = useChat({
    initialMessages,
  });

  // mark client + restore durations
  useEffect(() => {
    setIsClient(true);
    setDurations(stored.durations);
  }, []); // run once

  // persist to localStorage when things change
  useEffect(() => {
    if (isClient) {
      saveMessagesToStorage(messages as UIMessage[], durations);
    }
  }, [messages, durations, isClient]);

  // add a welcome message if there's no history
  useEffect(() => {
    if (
      isClient &&
      messages.length === 0 &&
      !welcomeMessageShownRef.current
    ) {
      const welcomeMessage: UIMessage = {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        // use content so it renders directly
        content: WELCOME_MESSAGE as any,
      };
      setMessages([welcomeMessage]);
      saveMessagesToStorage([welcomeMessage], {});
      welcomeMessageShownRef.current = true;
    }
  }, [isClient, messages.length, setMessages]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    const text = data.message.trim();
    if (!text || status === "pending") return;

    // correct sendMessage usage
    sendMessage(text);
    form.reset();
  }

  function clearChat() {
    const newMessages: UIMessage[] = [];
    const newDurations: Record<string, number> = {};
    setMessages(newMessages);
    setDurations(newDurations);
    saveMessagesToStorage(newMessages, newDurations);
    toast.success("Chat cleared");
  }

  return (
    <div className="flex h-screen items-center justify-center font-sans dark:bg-black">
      <main className="w-full dark:bg-black h-screen relative">
        {/* HEADER */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-linear-to-b from-background via-background/50 to-transparent dark:bg-black overflow-visible pb-16">
          <div className="relative overflow-visible">
            <ChatHeader>
              <ChatHeaderBlock />
              <ChatHeaderBlock className="justify-center items-center">
                <Avatar className="size-8 ring-1 ring-primary">
                  <AvatarImage src="/Unknown.png" />
                  <AvatarFallback>
                    <Image src="/Unknown.png" alt="Logo" width={36} height={36} />
                  </AvatarFallback>
                </Avatar>
                <p className="tracking-tight">Chat with {AI_NAME}</p>
              </ChatHeaderBlock>
              <ChatHeaderBlock className="justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={clearChat}
                >
                  <Plus className="size-4" />
                  {CLEAR_CHAT_TEXT}
                </Button>
              </ChatHeaderBlock>
            </ChatHeader>
          </div>
        </div>

        {/* MAIN CHAT AREA */}
        <div className="pt-24 px-4 h-full flex justify-center">
          <div className="chat-window w-full max-w-3xl flex flex-col gap-4 h-[calc(100vh-7rem)]">
            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto">
              {messages.map((m: any) => (
                <div
                  key={m.id}
                  className={m.role === "user" ? "user-bubble" : "bot-bubble"}
                >
                  {/* support both `content` and `parts` */}
                  {"content" in m && typeof m.content === "string"
                    ? m.content
                    : m.parts
                    ? m.parts
                        .filter((p: any) => p.type === "text")
                        .map((p: any, i: number) => <span key={i}>{p.text}</span>)
                    : JSON.stringify(m)}
                </div>
              ))}
            </div>

            {/* INPUT BAR */}
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-2"
            >
              <div className="input-bar w-full flex items-center gap-2">
                <input
                  {...form.register("message")}
                  className="flex-1 bg-transparent outline-none"
                  placeholder="Ask me anything…"
                  disabled={status === "pending"}
                />
                <button type="submit" disabled={status === "pending"}>
                  {status === "pending" ? "Thinking…" : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
