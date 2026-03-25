export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Movie {
  id: string;
  title: string;
  google_drive_file_id: string;
  thumbnail_url: string | null;
  added_by: string;
  created_at: string;
}

export interface PlaybackState {
  playing: boolean;
  timestamp: number;
}

export interface Room {
  id: string;
  name: string;
  host_id: string;
  movie_id: string | null;
  is_chat_muted: boolean;
  playback_state: PlaybackState;
  created_at: string;
  movie?: Movie;
  host?: Profile;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
  profile?: Profile;
}

export interface BroadcastPayload {
  event: "playback";
  playing: boolean;
  timestamp: number;
}

export interface PresenceState {
  user_id: string;
  username: string;
  avatar_url: string | null;
}
