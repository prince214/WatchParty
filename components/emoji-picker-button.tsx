"use client";

import { useState, useRef, useEffect } from "react";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmojiPickerButtonProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

export function EmojiPickerButton({ onEmojiSelect, disabled }: EmojiPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleSelect(data: EmojiClickData) {
    onEmojiSelect(data.emoji);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() => setOpen(!open)}
        disabled={disabled}
      >
        <Smile className="h-4 w-4 text-muted-foreground" />
      </Button>

      {open && (
        <div className="absolute bottom-11 left-0 z-50 shadow-xl rounded-lg overflow-hidden">
          <EmojiPicker
            theme={Theme.DARK}
            onEmojiClick={handleSelect}
            width={300}
            height={380}
            searchPlaceholder="Search emoji..."
            lazyLoadEmojis
          />
        </div>
      )}
    </div>
  );
}
