import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Loader2, EyeOff } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChatContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING =
  "Hey! I'm your Denied trip assistant. Ask me anything about medical tourism, procedures, travel tips, or planning your trip. What can I help with? 🌎";

function getSuggestions(pathname: string): string[] {
  if (pathname.startsWith("/provider/")) {
    const city = pathname.split("/provider/")[1]?.split("-").pop() || "Mexico";
    return [
      `Tell me about dental work in ${city}`,
      "What should I ask this clinic before booking?",
    ];
  }
  if (pathname.startsWith("/booking/")) {
    return [
      "What should I pack for my procedure?",
      "What's recovery like after dental work?",
    ];
  }
  if (pathname === "/search") {
    return [
      "Help me choose between Tijuana and Cancun",
      "What's the cheapest option for crowns?",
    ];
  }
  return [
    "How do I cross the border at Tijuana?",
    "Is dental work in Mexico safe?",
    "How much can I save on dental implants?",
  ];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export default function TripAssistantChat() {
  const { isOpen: open, setIsOpen: setOpen } = useChat();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { pathname } = useLocation();
  const { user, profile, refreshProfile } = useAuth();

  const chatHidden = (profile as any)?.chat_hidden === true;

  const suggestions = getSuggestions(pathname);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const hideChat = async () => {
    if (!profile) return;
    setOpen(false);
    await supabase
      .from("profiles")
      .update({ chat_hidden: true } as any)
      .eq("user_id", profile.user_id);
    await refreshProfile();
  };

  const getUserContext = useCallback(async () => {
    if (!user) return { currentPage: pathname };
    const ctx: Record<string, unknown> = {
      userName: profile?.first_name || user.email?.split("@")[0],
      currentPage: pathname,
    };
    const [briefs, bookings] = await Promise.all([
      supabase.from("trip_briefs").select("trip_name,destination,travel_start,procedures").eq("user_id", user.id).limit(3),
      supabase.from("bookings").select("provider_slug,status,procedures").eq("user_id", user.id).limit(3),
    ]);
    if (briefs.data?.length) ctx.tripBriefs = briefs.data;
    if (bookings.data?.length) ctx.bookings = bookings.data;
    return ctx;
  }, [user, profile, pathname]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg].filter((m) => m.content !== GREETING);

    try {
      const userContext = await getUserContext();
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, userContext }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Request failed");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && last.content !== GREETING) {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : "Something went wrong";
      setMessages((prev) => [...prev, { role: "assistant", content: `Sorry, I hit an error: ${errorMsg}. Try again in a moment!` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating button — hidden if user dismissed */}
      <AnimatePresence>
        {!open && !chatHidden && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
            style={{ backgroundColor: "#5EB298" }}
            aria-label="Open trip assistant"
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-2rem)] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: "#1A1A1A" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#5EB298" }}>
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Trip Assistant</p>
                  <p className="text-xs text-white/50">by Denied</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={hideChat}
                  className="text-white/40 hover:text-white/70 transition-colors p-1"
                  title="Hide chat bubble"
                >
                  <EyeOff className="h-4 w-4" />
                </button>
                <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white transition-colors p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                      m.role === "user"
                        ? "text-foreground rounded-br-md"
                        : "text-foreground rounded-bl-md"
                    )}
                    style={{
                      backgroundColor: m.role === "user" ? "#FFFFFF" : "#F8B4A0",
                      color: "#1A1A1A",
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5" style={{ backgroundColor: "#F8B4A0" }}>
                    <span className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick suggestions */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-white/70 hover:bg-white/10 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 py-3 border-t border-white/10 flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(input)}
                placeholder="Ask anything..."
                className="flex-1 bg-white/10 text-white placeholder:text-white/40 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-white/30"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 rounded-full flex items-center justify-center disabled:opacity-40 transition-opacity"
                style={{ backgroundColor: "#5EB298" }}
              >
                {isLoading ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
