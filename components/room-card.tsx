"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Film, Users } from "lucide-react";
import type { Room } from "@/lib/types";

interface RoomCardProps {
  room: Room & { movie?: { title: string } | null; host?: { username: string } | null };
}

export function RoomCard({ room }: RoomCardProps) {
  return (
    <Link href={`/room/${room.id}`}>
      <Card className="transition-colors hover:border-primary/50 hover:bg-card/80">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Film className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold">{room.name}</h3>
              {room.movie && (
                <p className="truncate text-sm text-muted-foreground">
                  {room.movie.title}
                </p>
              )}
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>Hosted by {room.host?.username ?? "Unknown"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
