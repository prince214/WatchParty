"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmojiPickerButton } from "@/components/emoji-picker-button";
import { GifPickerButton } from "@/components/gif-picker-button";
import { Send, MessageSquareOff } from "lucide-react";
import { formatChatTime } from "@/lib/utils";
import type { Message, PresenceState } from "@/lib/types";

const GIF_PREFIX = "[gif]";

function isGifMessage(content: string) {
  return content.startsWith(GIF_PREFIX);
}

function getGifUrl(content: string) {
  return content.slice(GIF_PREFIX.length);
}

interface ChatPanelProps {
  roomId?: string;
  userId: string;
  profile?: unknown;
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
  const inputRef = useRef<HTMLInputElement>(null);

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

  function handleEmojiSelect(emoji: string) {
    setInput((prev) => prev + emoji);
    inputRef.current?.focus();
  }

  function handleGifSelect(gifUrl: string) {
    onSendMessage(`${GIF_PREFIX}${gifUrl}`);
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
          const isGif = isGifMessage(msg.content);

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

                {isGif ? (
                  <div className="mt-0.5 inline-block overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getGifUrl(msg.content)}
                      alt="GIF"
                      className="max-w-[200px] h-auto rounded-lg"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <p
                    className={`mt-0.5 inline-block rounded-lg px-3 py-1.5 text-sm break-words ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {msg.content}
                  </p>
                )}
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
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <EmojiPickerButton onEmojiSelect={handleEmojiSelect} disabled={isMuted} />
              <GifPickerButton onGifSelect={handleGifSelect} disabled={isMuted} />
            </div>
            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
