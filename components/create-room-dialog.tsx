"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function CreateRoomDialog({ open, onOpenChange, userId }: CreateRoomDialogProps) {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const [driveFileId, setDriveFileId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const roomId = nanoid(10);

      const { data: movie, error: movieError } = await supabase
        .from("movies")
        .insert({
          title: movieTitle,
          google_drive_file_id: driveFileId,
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

      // Host auto-joins
      await supabase
        .from("room_participants")
        .insert({ room_id: roomId, user_id: userId });

      router.push(`/room/${roomId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create room");
      setLoading(false);
    }
  }

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
          <div className="space-y-2">
            <label htmlFor="movie-title" className="text-sm font-medium">
              Movie Title
            </label>
            <Input
              id="movie-title"
              placeholder="The Grand Budapest Hotel"
              value={movieTitle}
              onChange={(e) => setMovieTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="drive-id" className="text-sm font-medium">
              Google Drive File ID
            </label>
            <Input
              id="drive-id"
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgV..."
              value={driveFileId}
              onChange={(e) => setDriveFileId(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              The file ID from your Google Drive sharing link
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Create Room
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
