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


// === small safe style for your 6 buttons ===
const btn = {
  padding:"6px 14px",
  fontSize:"14px",
  borderRadius:"6px",
  background:"#000",
  color:"white",
  border:"1px solid #444",
  cursor:"pointer"
};


// === form validation ===
const formSchema = z.object({
  message: z.string().min(1).max(2000),
});

const STORAGE_KEY = "chat-messages";

export default function Chat() {

  const [isClient, setIsClient] = useState(false);
  const welcomeRef = useRef(false);

  const stored = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    : {};

  const [initialMessages] = useState<UIMessage[]>(stored.messages || []);

  const { messages, sendMessage, setMessages } = useChat();


  // === load welcome message ===
  useEffect(() => {
    setIsClient(true);

    if(initialMessages.length > 0){
      setMessages(initialMessages);

    } else if(!welcomeRef.current){

      setMessages([
        {
          id:`welcome-${Date.now()}`,
          role:"assistant",
          parts:[{ type:"text", text:WELCOME_MESSAGE }]
        }
      ]);

      welcomeRef.current = true;
    }
  },[]);


  const form = useForm({
    resolver:zodResolver(formSchema),
    defaultValues:{ message:"" }
  });


  // === FINAL FIX → SEND PROPER MESSAGE SHAPE ===
  function onSubmit(data:any) {
    const value = data.message.trim();
    if(!value) return;

    sendMessage({
      role:"user",
      parts:[{ type:"text", text:value }]
    });

    form.reset();
  }


  // === clear chat feature ===
  function clearChat(){
    setMessages([]);
    toast.success("Chat cleared");
  }


  return (
    <div className="flex h-screen items-center justify-center font-sans dark:bg-black">
      <main className="w-full dark:bg-black h-screen relative">


        {/* ---------------- HEADER UI (unchanged) ---------------- */}
        <div className="fixed top-0 left-0 right-0 z-50 dark:bg-black pb-16">
          <ChatHeader>
            <ChatHeaderBlock />
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
        {/* -------------------------------------------------------- */}


        {/* ---------------- BUTTON BAR (safe + simple) ------------ */}
        <div style={{position:"fixed",top:70,left:8,zIndex:200,display:"flex",gap:"6px",flexWrap:"wrap"}}>
          <button style={btn}>Seating Charts</button>
          <button style={btn}>BITSoM Map</button>
          <button style={btn}>Block Timetables</button>
          <button style={btn}>Menu's</button>
          <button style={btn}>Templates</button>
          <button style={btn}>Important Contacts</button>
        </div>
        {/* -------------------------------------------------------- */}


        {/* ---------------- CHAT WINDOW (unchanged UI) ------------ */}
        <div className="pt-24 px-4 h-full flex justify-center">
          <div className="chat-window w-full max-w-3xl flex flex-col gap-4 h-[calc(100vh-7rem)]">


            {/* Display messages */}
            <div className="flex-1 overflow-y-auto">
              {messages.map((m)=>{

                // 🔥 The correct + safe text extraction fix:
                const text =
                  (m as any).parts?.[0]?.text ??
                  (m as any).content ??
                  "";

                return(
                  <div key={m.id} className={m.role==="user" ? "user-bubble" : "bot-bubble"}>
                    {text}
                  </div>
                );
              })}
            </div>


            {/* Input bar */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-2">
              <div className="input-bar w-full">
                <input {...form.register("message")} placeholder="Ask me anything…" className="flex-1 bg-transparent outline-none"/>
                <button type="submit">Send</button>
              </div>
            </form>

          </div>
        </div>
        {/* -------------------------------------------------------- */}


      </main>
    </div>
  );
}
