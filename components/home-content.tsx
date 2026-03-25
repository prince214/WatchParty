"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { RoomCard } from "@/components/room-card";
import { CreateRoomDialog } from "@/components/create-room-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Film, Plus, ArrowRight } from "lucide-react";
import type { Profile, Room } from "@/lib/types";

interface HomeContentProps {
  profile: Profile | null;
  rooms: unknown[];
}

export function HomeContent({ profile, rooms }: HomeContentProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinId, setJoinId] = useState("");

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (joinId.trim()) {
      router.push(`/room/${joinId.trim()}`);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar profile={profile} />

      <main className="mx-auto max-w-4xl px-4 py-12">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20">
            <Film className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-2 text-4xl font-bold tracking-tight">Movie Watch Party</h1>
          <p className="mx-auto max-w-md text-lg text-muted-foreground">
            Watch movies together with friends in perfect sync. Create a room, share the link, and enjoy.
          </p>
        </div>

        {/* Actions */}
        {profile ? (
          <div className="mb-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-5 w-5" />
              Create Room
            </Button>

            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="hidden sm:inline">or</span>
            </div>

            <form onSubmit={handleJoin} className="flex gap-2">
              <Input
                placeholder="Enter room ID..."
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                className="w-48"
              />
              <Button type="submit" variant="secondary" size="default">
                <ArrowRight className="h-4 w-4" />
                Join
              </Button>
            </form>

            <CreateRoomDialog
              open={createOpen}
              onOpenChange={setCreateOpen}
              userId={profile.id}
            />
          </div>
        ) : (
          <div className="mb-12 text-center">
            <Button size="lg" onClick={() => router.push("/login")}>
              Sign in to get started
            </Button>
          </div>
        )}

        {/* Recent Rooms */}
        {profile && rooms.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold">Your Recent Rooms</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {rooms.map((room) => (
                <RoomCard key={(room as Room).id} room={room as Room & { movie?: { title: string } | null; host?: { username: string } | null }} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
