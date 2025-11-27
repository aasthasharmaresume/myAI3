"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react";
import { Plus } from "lucide-react";
import { ChatHeader } from "@/app/parts/chat-header";
import { ChatHeaderBlock } from "@/app/parts/chat-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UIMessage } from "ai";
import { useEffect, useState, useRef } from "react";
import { AI_NAME, CLEAR_CHAT_TEXT, WELCOME_MESSAGE } from "@/config";
import Image from "next/image";

// ---------- button styling (small + safe) ----------
const btn = {
  padding:"6px 14px",
  fontSize:"14px",
  borderRadius:"6px",
  background:"#000",
  color:"white",
  border:"1px solid #444",
  cursor:"pointer"
};
// ----------------------------------------------------

const formSchema = z.object({
  message: z.string().min(1).max(2000),
});

const STORAGE_KEY = "chat-messages";

type StorageData = {
  messages: UIMessage[];
  durations: Record<string, number>;
};

const loadMessagesFromStorage = () => {
  if (typeof window === "undefined") return { messages: [], durations: {} };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if(!stored) return { messages:[], durations:{} };
    const parsed = JSON.parse(stored);
    return {
      messages: parsed.messages || [],
      durations: parsed.durations || {},
    };
  } catch {
    return { messages: [], durations:{} };
  }
};

const saveMessagesToStorage = (messages: UIMessage[], durations:Record<string,number>) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({messages,durations}));
  } catch {}
};

export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string,number>>({});
  const welcomeMessageShownRef = useRef(false);

  const stored = typeof window !== "undefined" ? loadMessagesFromStorage() : {messages:[],durations:{}};
  const [initialMessages] = useState<UIMessage[]>(stored.messages);

  const { messages, sendMessage, setMessages } = useChat(); // ← we use sendMessage(value)

  useEffect(() => {
    setIsClient(true);
    setDurations(stored.durations);

    if(initialMessages.length>0){
      setMessages(initialMessages);
    } else if(!welcomeMessageShownRef.current){
      const welcomeMessage: UIMessage = {
        id:`welcome-${Date.now()}`,
        role:"assistant",
        parts:[{type:"text", text:WELCOME_MESSAGE}]
      };
      setMessages([welcomeMessage]);
      saveMessagesToStorage([welcomeMessage],{});
      welcomeMessageShownRef.current = true;
    }
  },[]);

  useEffect(()=> {
    if(isClient) saveMessagesToStorage(messages,durations);
  },[messages,durations,isClient]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver:zodResolver(formSchema),
    defaultValues:{message:""}
  });

  // ----------- FIXED SO DEPLOY WILL PASS ✔-----------
  function onSubmit(data:z.infer<typeof formSchema>) {
      const value = data.message.trim();
      if(!value) return;
      sendMessage(value);      // ← FIX 🔥 NO {content:} object
      form.reset();
  }
  // --------------------------------------------------

  function clearChat(){
    setMessages([]);
    setDurations({});
    saveMessagesToStorage([], {});
    toast.success("Chat cleared");
  }

  return (
    <div className="flex h-screen items-center justify-center font-sans dark:bg-black">
      <main className="w-full dark:bg-black h-screen relative">

        {/* HEADER (unchanged) */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-linear-to-b from-background via-background/50 dark:bg-black pb-16">
          <ChatHeader>
            <ChatHeaderBlock/>
            <ChatHeaderBlock className="justify-center items-center">
              <Avatar className="size-8 ring-1 ring-primary">
                <AvatarImage src="/Unknown.png"/>
                <AvatarFallback>
                  <Image src="/Unknown.png" alt="Logo" width={36} height={36}/>
                </AvatarFallback>
              </Avatar>
              <p>Chat with {AI_NAME}</p>
            </ChatHeaderBlock>
            <ChatHeaderBlock className="justify-end">
              <Button variant="outline" size="sm" onClick={clearChat}>
                <Plus className="size-4"/>{CLEAR_CHAT_TEXT}
              </Button>
            </ChatHeaderBlock>
          </ChatHeader>
        </div>

        {/* BUTTON BAR — small & safe */}
        <div style={{position:"fixed",top:70,left:8,zIndex:200,display:"flex",gap:"6px",flexWrap:"wrap"}}>
          <button style={btn}>Seating Charts</button>
          <button style={btn}>BITSoM Map</button>
          <button style={btn}>Block Timetables</button>
          <button style={btn}>Menu's</button>
          <button style={btn}>Templates</button>
          <button style={btn}>Important Contacts</button>
        </div>

        <div className="pt-24 px-4 h-full flex justify-center">
          <div className="chat-window w-full max-w-3xl flex flex-col gap-4 h-[calc(100vh-7rem)]">

            <div className="flex-1 overflow-y-auto">
              {messages.map(m=>{
                 const text = m.parts?.[0]?.text ?? m.content ?? "";
                 return(
                   <div key={m.id} className={m.role==="user"?"user-bubble":"bot-bubble"}>
                     {text}
                   </div>
                 );
              })}
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-2">
              <div className="input-bar w-full">
                <input {...form.register("message")} placeholder="Ask me anything…" className="flex-1 bg-transparent outline-none"/>
                <button type="submit">Send</button>
              </div>
            </form>

          </div>
        </div>
      </main>
    </div>
  );
}
