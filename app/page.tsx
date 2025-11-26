"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react";
import { Plus } from "lucide-react";
import { UIMessage } from "ai";
import { useEffect, useState, useRef } from "react";
import { AI_NAME, CLEAR_CHAT_TEXT, WELCOME_MESSAGE } from "@/config";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatHeader } from "@/app/parts/chat-header";
import { ChatHeaderBlock } from "@/app/parts/chat-header";


// ---------------------- FORM VALIDATION ---------------------- //
const formSchema = z.object({
  message: z.string().min(1).max(2000),
});

const STORAGE_KEY = "chat-messages";


// ---------------------- LOCAL STORAGE HANDLING ---------------------- //
const loadMessagesFromStorage = (): { messages: UIMessage[]; durations: Record<string, number> } => {
  if (typeof window === "undefined") return { messages: [], durations: {} };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { messages: [], durations: {} };
    const parsed = JSON.parse(stored);
    return { messages: parsed.messages || [], durations: parsed.durations || {} };
  } catch {
    return { messages: [], durations: {} };
  }
};

const saveMessagesToStorage = (messages: UIMessage[], durations: Record<string, number>) => {
  if (typeof window === "undefined") return;
  const data = { messages, durations };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};


// ---------------------- COMPONENT ---------------------- //
export default function Chat() {
  // saved chat memory
  const stored = typeof window !== "undefined" ? loadMessagesFromStorage() : { messages: [], durations: {} };
  const [initialMessages] = useState<UIMessage[]>(stored.messages);

  // main chat engine
  const { messages, sendMessage, status, setMessages } = useChat({ messages: initialMessages });

  // 🔥 VECTOR / WEB MODE SWITCH
  const [mode, setMode] = useState<"vector" | "web">("vector");


  // Welcome message logic
  const welcomeShown = useRef(false);

  useEffect(() => {
    if (!welcomeShown.current && messages.length === 0) {
      const welcome: UIMessage = {
        id: "welcome-" + Date.now(),
        role: "assistant",
        parts: [{ type: "text", text: WELCOME_MESSAGE }],
      };
      setMessages([welcome]);
      saveMessagesToStorage([welcome], {});
      welcomeShown.current = true;
    }
  }, []);


  // form state
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  function clearChat() {
    setMessages([]);
    saveMessagesToStorage([], {});
    toast.success("Chat cleared");
  }

  // ---------------------- SEND ---------------------- //
  function onSubmit(data: z.infer<typeof formSchema>) {
    if (mode === "vector") {
      sendMessage({ content: data.message, role: "user" }); // knowledge database
    } else {
      // 🔥 Placeholder until we add web API
      sendMessage({ content: `🌍 Web Search Mode → ${data.message}`, role: "user" });
    }
    form.reset();
  }


  // ---------------------- UI ---------------------- //
  return (
    <div className="flex h-screen items-center justify-center font-sans dark:bg-black">
      <main className="w-full dark:bg-black h-screen relative">

        {/* HEADER */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-black pb-16">
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
              <Button variant="outline" size="sm" onClick={clearChat}>
                <Plus className="size-4" /> {CLEAR_CHAT_TEXT}
