"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Film, LogOut } from "lucide-react";
import type { Profile } from "@/lib/types";

interface NavbarProps {
  profile: Profile | null;
}

export function Navbar({ profile }: NavbarProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Film className="h-5 w-5 text-primary" />
          <span>WatchParty</span>
        </Link>

        <div className="flex items-center gap-3">
          {profile ? (
            <>
              <div className="flex items-center gap-2">
                <Avatar fallback={profile.username} src={profile.avatar_url} size="sm" />
                <span className="hidden text-sm font-medium sm:inline">{profile.username}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="secondary" size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
