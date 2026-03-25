"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageSquareOff, MessageSquare, Link2, Check } from "lucide-react";

interface HostControlsProps {
  roomId: string;
  isChatMuted: boolean;
  onChatMuteChange: (muted: boolean) => void;
}

export function HostControls({ roomId, isChatMuted, onChatMuteChange }: HostControlsProps) {
  const [copied, setCopied] = useState(false);

  async function toggleMute() {
    const supabase = createClient();
    const newMuted = !isChatMuted;
    await supabase
      .from("rooms")
      .update({ is_chat_muted: newMuted })
      .eq("id", roomId);
    onChatMuteChange(newMuted);
  }

  async function copyLink() {
    const url = `${window.location.origin}/room/${roomId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 border-t bg-card px-4 py-2">
      <span className="mr-auto text-xs font-medium text-muted-foreground">Host Controls</span>

      <Button variant="ghost" size="sm" onClick={toggleMute} className="gap-1.5">
        {isChatMuted ? (
          <>
            <MessageSquare className="h-4 w-4" /> Unmute Chat
          </>
        ) : (
          <>
            <MessageSquareOff className="h-4 w-4" /> Mute Chat
          </>
        )}
      </Button>

      <Button variant="ghost" size="sm" onClick={copyLink} className="gap-1.5">
        {copied ? (
          <>
            <Check className="h-4 w-4" /> Copied
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4" /> Copy Link
          </>
        )}
      </Button>
    </div>
  );
}
