"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface GifResult {
  id: string;
  title: string;
  preview: string;
  url: string;
  width: number;
  height: number;
}

interface GifPickerButtonProps {
  onGifSelect: (gifUrl: string) => void;
  disabled?: boolean;
}

export function GifPickerButton({ onGifSelect, disabled }: GifPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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

  const fetchGifs = useCallback(async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      const res = await fetch(`/api/gifs?${params}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setGifs([]);
      } else {
        setGifs(data.gifs ?? []);
      }
    } catch {
      setError("Failed to load GIFs");
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchGifs("");
  }, [open, fetchGifs]);

  function handleSearchChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchGifs(value);
    }, 400);
  }

  function handleSelect(gif: GifResult) {
    onGifSelect(gif.url);
    setOpen(false);
    setQuery("");
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
        <span className="text-sm font-bold text-muted-foreground">GIF</span>
      </Button>

      {open && (
        <div className="absolute bottom-11 left-0 z-50 w-[300px] rounded-lg border bg-card shadow-xl">
          <div className="p-2 border-b">
            <Input
              placeholder="Search GIFs..."
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>

          <ScrollArea className="h-[300px] p-2">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && (
              <p className="py-8 text-center text-sm text-muted-foreground">{error}</p>
            )}

            {!loading && !error && gifs.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {query ? "No GIFs found" : "No GIFs available"}
              </p>
            )}

            {!loading && !error && gifs.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5">
                {gifs.map((gif) => (
                  <button
                    key={gif.id}
                    onClick={() => handleSelect(gif)}
                    className="overflow-hidden rounded-md hover:ring-2 hover:ring-primary transition-all cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gif.preview}
                      alt={gif.title}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="border-t px-2 py-1">
            <span className="text-[10px] text-muted-foreground">Powered by GIPHY</span>
          </div>
        </div>
      )}
    </div>
  );
}
