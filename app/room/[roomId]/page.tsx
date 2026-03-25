import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RoomView } from "@/components/room-view";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RoomPage({ params }: PageProps) {
  const { roomId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) return notFound();

  const { data: room } = await supabase
    .from("rooms")
    .select("*, movie:movies(*), host:profiles!rooms_host_id_fkey(*)")
    .eq("id", roomId)
    .single();
  if (!room) return notFound();

  // Auto-join participant
  await supabase
    .from("room_participants")
    .upsert(
      { room_id: roomId, user_id: user.id },
      { onConflict: "room_id,user_id" }
    );

  // Fetch existing messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*, profile:profiles(*)")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(100);

  return (
    <RoomView
      room={room as Record<string, unknown>}
      profile={profile}
      initialMessages={(messages as unknown[]) ?? []}
    />
  );
}
