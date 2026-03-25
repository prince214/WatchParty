"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquareOff } from "lucide-react";
import { formatChatTime } from "@/lib/utils";
import type { Message, Profile, PresenceState } from "@/lib/types";

interface ChatPanelProps {
  roomId?: string;
  userId: string;
  profile?: Profile;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isMuted: boolean;
  onlineUsers: PresenceState[];
}

export function ChatPanel({
  userId,
  messages,
  onSendMessage,
  isMuted,
  onlineUsers,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isMuted) return;
    onSendMessage(trimmed);
    setInput("");
  }

  return (
    <div className="flex h-full flex-col border-r bg-card">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold text-sm">Chat</h2>
        <div className="flex items-center gap-1 mt-1">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">
            {onlineUsers.length} online
          </span>
        </div>
      </div>

      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto border-b px-4 py-2">
          {onlineUsers.map((u) => (
            <Avatar key={u.user_id} fallback={u.username} src={u.avatar_url} size="sm" />
          ))}
        </div>
      )}

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 px-4 py-2">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet. Say hi!
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.user_id === userId;
          return (
            <div key={msg.id} className={`mb-3 flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
              <Avatar
                fallback={msg.profile?.username ?? "?"}
                src={msg.profile?.avatar_url}
                size="sm"
              />
              <div className={`max-w-[75%] ${isOwn ? "text-right" : ""}`}>
                <div className="flex items-baseline gap-1.5">
                  {!isOwn && (
                    <span className="text-xs font-medium text-primary">
                      {msg.profile?.username}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatChatTime(msg.created_at)}
                  </span>
                </div>
                <p
                  className={`mt-0.5 inline-block rounded-lg px-3 py-1.5 text-sm ${
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {msg.content}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-3">
        {isMuted ? (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
            <MessageSquareOff className="h-4 w-4" />
            Chat is muted by the host
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
