"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Film, HardDrive, Search } from "lucide-react";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string | null;
  thumbnail: string | null;
}

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function CreateRoomDialog({ open, onOpenChange, userId }: CreateRoomDialogProps) {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [files, setFiles] = useState<DriveFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    setFilesLoading(true);
    setFilesError(null);

    fetch("/api/drive-files")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setFilesError(data.error);
        } else {
          setFiles(data.files ?? []);
        }
      })
      .catch(() => setFilesError("Failed to load files"))
      .finally(() => setFilesLoading(false));
  }, [open]);

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const roomId = nanoid(10);

      const { data: movie, error: movieError } = await supabase
        .from("movies")
        .insert({
          title: selectedFile.name,
          google_drive_file_id: selectedFile.id,
          added_by: userId,
        })
        .select()
        .single();

      if (movieError) throw movieError;

      const { error: roomError } = await supabase
        .from("rooms")
        .insert({
          id: roomId,
          name: roomName,
          host_id: userId,
          movie_id: movie.id,
        });

      if (roomError) throw roomError;

      await supabase
        .from("room_participants")
        .insert({ room_id: roomId, user_id: userId });

      router.push(`/room/${roomId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create room");
      setLoading(false);
    }
  }

  function handleReset() {
    setRoomName("");
    setSelectedFile(null);
    setSearch("");
    setError(null);
  }

  useEffect(() => {
    if (!open) handleReset();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Create a Watch Party</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="room-name" className="text-sm font-medium">
              Room Name
            </label>
            <Input
              id="room-name"
              placeholder="Friday Movie Night"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
            />
          </div>

          {/* File Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select a Movie</label>

            {selectedFile ? (
              <div className="flex items-center gap-3 rounded-lg border bg-secondary/50 p-3">
                <Film className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                  {selectedFile.size && (
                    <p className="text-xs text-muted-foreground">{selectedFile.size}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border">
                {/* Search within file list */}
                <div className="flex items-center gap-2 border-b px-3 py-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>

                <ScrollArea className="h-[200px]">
                  {filesLoading && (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading files from Google Drive...
                    </div>
                  )}

                  {filesError && (
                    <div className="flex flex-col items-center gap-1 py-8 text-sm text-muted-foreground">
                      <HardDrive className="h-5 w-5" />
                      <p>{filesError}</p>
                    </div>
                  )}

                  {!filesLoading && !filesError && filteredFiles.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      {search ? "No matching files" : "No video files found in the folder"}
                    </p>
                  )}

                  {!filesLoading && !filesError && filteredFiles.length > 0 && (
                    <div className="p-1">
                      {filteredFiles.map((file) => (
                        <button
                          key={file.id}
                          type="button"
                          onClick={() => setSelectedFile(file)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-accent transition-colors cursor-pointer"
                        >
                          <Film className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">{file.name}</p>
                            {file.size && (
                              <p className="text-xs text-muted-foreground">{file.size}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedFile}>
              {loading && <Loader2 className="animate-spin" />}
              Create Room
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
