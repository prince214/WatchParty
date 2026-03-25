# Movie Watch Party

Watch movies together with friends in real-time. Create a room, share the link, and enjoy synchronized playback with live chat.

## Features

- **Synchronized playback** — Host controls play/pause/seek; all guests stay in sync
- **Real-time chat** — Chat with friends while watching
- **Google Drive streaming** — Stream movies from Google Drive through a server-side proxy
- **Host controls** — Mute chat, manage playback
- **Responsive UI** — Works on desktop and mobile with a dark cinema theme

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Supabase** (Auth, PostgreSQL, Realtime)
- **Google Drive API** (video storage)
- **Tailwind CSS v4**

## Getting Started

### 1. Clone and install

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL migration from `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor
3. Enable Realtime for the `messages` and `rooms` tables (the migration does this automatically)

### 3. Set up Google Drive

1. Create a Google Cloud project and enable the Drive API
2. Create a service account and download the JSON key
3. Share your movie files/folders with the service account email

### 4. Configure environment variables

Copy `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Sign up / sign in
2. Click **Create Room** — enter a room name, movie title, and the Google Drive file ID
3. Share the room link with friends
4. The host controls playback; guests watch in sync
5. Chat in real-time while watching
