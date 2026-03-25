"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { VideoPlayer } from "@/components/video-player";
import { ChatPanel } from "@/components/chat-panel";
import { HostControls } from "@/components/host-controls";
import { Button } from "@/components/ui/button";
import { MessageSquare, X, Users } from "lucide-react";
import type { Profile, Room, Message, PresenceState, PlaybackState } from "@/lib/types";

interface RoomViewProps {
  room: Record<string, unknown>;
  profile: Profile;
  initialMessages: unknown[];
}

export function RoomView({ room: rawRoom, profile, initialMessages }: RoomViewProps) {
  const room = rawRoom as unknown as Room;
  const isHost = room.host_id === profile.id;

  const [messages, setMessages] = useState<Message[]>(initialMessages as Message[]);
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(
    room.playback_state ?? { playing: false, timestamp: 0 }
  );
  const [isChatMuted, setIsChatMuted] = useState(room.is_chat_muted);
  const [chatOpen, setChatOpen] = useState(true);

  const supabaseRef = useRef(createClient());
  const channelRef = useRef<ReturnType<typeof supabaseRef.current.channel> | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const latestTimestampRef = useRef(playbackState.timestamp);

  // Keep timestamp ref up to date
  useEffect(() => {
    latestTimestampRef.current = playbackState.timestamp;
  }, [playbackState.timestamp]);

  // Set up Realtime channel
  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase.channel(`room:${room.id}`, {
      config: { broadcast: { self: false }, presence: { key: profile.id } },
    });

    // Broadcast: playback sync
    channel.on("broadcast", { event: "playback" }, ({ payload }) => {
      if (!isHost) {
        setPlaybackState({
          playing: payload.playing,
          timestamp: payload.timestamp,
        });
      }
    });

    // Presence: online users
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresenceState>();
      const users: PresenceState[] = [];
      for (const key of Object.keys(state)) {
        const presences = state[key];
        if (presences && presences.length > 0) {
          users.push(presences[0]);
        }
      }
      setOnlineUsers(users);
    });

    // Postgres Changes: new messages
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `room_id=eq.${room.id}`,
      },
      async (payload) => {
        const newMsg = payload.new as Message;
        // Fetch profile for the message
        const { data: msgProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", newMsg.user_id)
          .single();
        newMsg.profile = msgProfile ?? undefined;
        setMessages((prev) => [...prev, newMsg]);
      }
    );

    // Listen for room updates (chat mute changes)
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "rooms",
        filter: `id=eq.${room.id}`,
      },
      (payload) => {
        const updated = payload.new as Room;
        setIsChatMuted(updated.is_chat_muted);
      }
    );

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
        });
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [room.id, profile.id, profile.username, profile.avatar_url, isHost]);

  // Host: periodic timestamp sync every 5 seconds
  useEffect(() => {
    if (!isHost) return;

    syncIntervalRef.current = setInterval(() => {
      channelRef.current?.send({
        type: "broadcast",
        event: "playback",
        payload: {
          playing: playbackState.playing,
          timestamp: latestTimestampRef.current,
        },
      });
    }, 5000);

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [isHost, playbackState.playing]);

  const handlePlayPause = useCallback(
    (playing: boolean) => {
      setPlaybackState((prev) => ({ ...prev, playing }));
      channelRef.current?.send({
        type: "broadcast",
        event: "playback",
        payload: { playing, timestamp: latestTimestampRef.current },
      });
    },
    []
  );

  const handleSeek = useCallback(
    (timestamp: number) => {
      setPlaybackState((prev) => ({ ...prev, timestamp }));
      channelRef.current?.send({
        type: "broadcast",
        event: "playback",
        payload: { playing: playbackState.playing, timestamp },
      });
    },
    [playbackState.playing]
  );

  const handleTimeUpdate = useCallback((timestamp: number) => {
    latestTimestampRef.current = timestamp;
  }, []);

  const handleSendMessage = useCallback(
    async (content: string) => {
      const supabase = supabaseRef.current;
      await supabase.from("messages").insert({
        room_id: room.id,
        user_id: profile.id,
        content,
      });
    },
    [room.id, profile.id]
  );

  const videoSrc = room.movie?.google_drive_file_id
    ? `/api/video/${room.movie.google_drive_file_id}`
    : "";

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b bg-card/80 px-4 py-2 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-bold text-primary">
            WatchParty
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="truncate text-sm font-semibold">{room.name}</h1>
          {room.movie && (
            <span className="hidden truncate text-xs text-muted-foreground sm:inline">
              — {room.movie.title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {onlineUsers.length}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setChatOpen(!chatOpen)}
          >
            {chatOpen ? <X className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat Panel — desktop: always visible; mobile: toggleable */}
        <div
          className={`${
            chatOpen ? "flex" : "hidden"
          } w-full flex-col lg:flex lg:w-80 xl:w-96 shrink-0 absolute lg:relative z-30 h-[calc(100vh-3rem)] lg:h-auto bg-card`}
        >
          <ChatPanel
            roomId={room.id}
            userId={profile.id}
            profile={profile}
            messages={messages}
            onSendMessage={handleSendMessage}
            isMuted={isChatMuted}
            onlineUsers={onlineUsers}
          />
        </div>

        {/* Main content: video + host controls */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 flex items-center justify-center bg-black">
            {videoSrc ? (
              <VideoPlayer
                src={videoSrc}
                isHost={isHost}
                playing={playbackState.playing}
                timestamp={playbackState.timestamp}
                onPlayPause={handlePlayPause}
                onSeek={handleSeek}
                onTimeUpdate={handleTimeUpdate}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <p>No movie selected for this room</p>
              </div>
            )}
          </div>

          {isHost && (
            <HostControls
              roomId={room.id}
              isChatMuted={isChatMuted}
              onChatMuteChange={setIsChatMuted}
            />
          )}
        </div>
      </div>
    </div>
  );
}
