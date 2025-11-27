"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { useChat } from "@ai-sdk/react";
import { ChatHeader } from "@/app/parts/chat-header";
import { ChatHeaderBlock } from "@/app/parts/chat-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { UIMessage } from "ai";
import { useEffect, useState, useRef } from "react";
import { Response } from "@/components/ai-elements/response";  // << NEW import here

import { AI_NAME, CLEAR_CHAT_TEXT, WELCOME_MESSAGE } from "@/config";
import Image from "next/image";


// ----------------- FORM SCHEMA ----------------- //

const formSchema = z.object({
  message: z.string().min(1).max(2000),
});


// ----------------- LOCAL STORAGE CONFIG ----------------- //

const STORAGE_KEY = "chat-messages";

type StorageData = {
  messages: UIMessage[];
  durations: Record<string, number>;
};

const loadMessagesFromStorage = () => {
  if (typeof window === "undefined") return { messages: [], durations: {} };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { messages: [], durations: {} };

    return JSON.parse(stored) as StorageData;
  } catch {
    return { messages: [], durations: {} };
  }
};

const saveMessagesToStorage = (
  messages: UIMessage[],
  durations: Record<string, number>
) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, durations }));
  } catch {}
};


// ----------------- MAIN COMPONENT ----------------- //

export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeShown = useRef(false);

  const stored = typeof window !== "undefined" ? loadMessagesFromStorage() : { messages: [], durations: {} };
  const [initialMessages] = useState<UIMessage[]>(stored.messages);

  const { messages, sendMessage, setMessages } = useChat({ messages: initialMessages });


  // load on mount
  useEffect(() => {
    setIsClient(true);
    setDurations(stored.durations);
    setMessages(stored.messages);
  }, []);


  // save on change
  useEffect(() => {
    if (isClient) saveMessagesToStorage(messages, durations);
  }, [messages, durations, isClient]);


  // welcome message (first load only)
  useEffect(() => {
    if (isClient && messages.length === 0 && !welcomeShown.current) {
      const welcome: UIMessage = {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        parts: [{ type: "text", text: WELCOME_MESSAGE }],
      };

      setMessages([welcome]);
      saveMessagesToStorage([welcome], {});
      welcomeShown.current = true;
    }
  }, [isClient, messages.length]);


  // ----- form handler ----- //
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    const value = data.message.trim();
    if (!value) return;

    sendMessage({
      role: "user",
      parts: [{ type: "text", text: value }],
    });

    form.reset();
  }


  // ----- clear chat ----- //
  function clearChat() {
    setMessages([]);
    setDurations({});
    saveMessagesToStorage([], {});
    toast.success("Chat cleared");
  }


  // ----------------- UI ----------------- //

  return (
    <div className="flex h-screen items-center justify-center font-sans dark:bg-black">
      <main className="w-full dark:bg-black h-screen relative">

        {/* Header (unchanged) */}
        <div className="fixed top-0 left-0 right-0 z-50 pb-16 bg-linear-to-b from-background via-background/50 to-transparent dark:bg-black">
          <ChatHeader>
            <ChatHeaderBlock />

            <ChatHeaderBlock className="justify-center items-center">
              <Avatar className="size-8 ring-1 ring-primary">
                <AvatarImage src="/Unknown.png" />
                <AvatarFallback><Image src="/Unknown.png" alt="logo" width={36} height={36}/></AvatarFallback>
              </Avatar>
              <p>Chat with {AI_NAME}</p>
            </ChatHeaderBlock>

            <ChatHeaderBlock className="justify-end">
              <Button variant="outline" size="sm" onClick={clearChat}>
                {CLEAR_CHAT_TEXT}
              </Button>
            </ChatHeaderBlock>
          </ChatHeader>
        </div>


        {/* Chat Body */}
        <div className="pt-24 px-4 h-full flex justify-center">
          <div className="chat-window w-full max-w-3xl flex flex-col gap-4 h-[calc(100vh-7rem)]">

          <div className="h-screen overflow-y-auto px-5 py-4 w-full pt-[88px] pb-[150px]">
            <div className="flex flex-col items-center justify-end min-h-full">
              {isClient ? (
                <>
                  <MessageWall messages={messages} status={status} durations={durations} onDurationChange={handleDurationChange} />
                  {status === "submitted" && (
                    <div className="flex justify-start max-w-3xl w-full">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-center max-w-2xl w-full">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

            {/* Input */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-2">
              <div className="input-bar flex w-full">
                <input
                  {...form.register("message")}
                  placeholder="Ask me anything…"
                  className="flex-1 bg-transparent outline-none"
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
