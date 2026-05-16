import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Role = "coder" | "customer";

export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [hasCoderProfile, setHasCoderProfile] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) {
        setRole(null);
        setUsername(null);
        setHasCoderProfile(false);
        setLoading(authLoading);
        return;
      }
      setLoading(true);
      const [{ data: profile }, { data: coderProfile }] = await Promise.all([
        supabase.from("profiles").select("role, username").eq("id", user.id).maybeSingle(),
        supabase.from("coder_profiles").select("profile_id").eq("profile_id", user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      setRole((profile?.role as Role | undefined) ?? null);
      setUsername(profile?.username ?? null);
      setHasCoderProfile(!!coderProfile);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { user, role, username, hasCoderProfile, loading: authLoading || loading };
}
