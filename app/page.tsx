import { createClient } from "@/lib/supabase/server";
import { HomeContent } from "@/components/home-content";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  let rooms: Array<Record<string, unknown>> = [];

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = profileData;

    const { data: participantRooms } = await supabase
      .from("room_participants")
      .select("room_id")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false })
      .limit(10);

    if (participantRooms && participantRooms.length > 0) {
      const roomIds = participantRooms.map((p) => p.room_id);
      const { data: roomsData } = await supabase
        .from("rooms")
        .select("*, movie:movies(*), host:profiles!rooms_host_id_fkey(*)")
        .in("id", roomIds);
      rooms = (roomsData as Array<Record<string, unknown>>) ?? [];
    }
  }

  return <HomeContent profile={profile} rooms={rooms} />;
}
