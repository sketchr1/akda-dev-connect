import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Role = "coder" | "customer";

export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [hasCoderProfile, setHasCoderProfile] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) {
        setRole(null);
        setUsername(null);
        setDisplayName(null);
        setHasCoderProfile(false);
        setLoading(authLoading);
        return;
      }
      setLoading(true);
      const [{ data: profile }, { data: coderProfile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("username, display_name").eq("id", user.id).maybeSingle(),
        supabase.from("coder_profiles").select("profile_id").eq("profile_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (cancelled) return;
      const roleValues = (roles ?? []).map((r) => r.role as Role);
      const resolvedRole: Role | null = roleValues.includes("coder") ? "coder" : roleValues.includes("customer") ? "customer" : null;
      setRole(resolvedRole);
      setUsername(profile?.username ?? null);
      setDisplayName(profile?.display_name ?? null);
      setHasCoderProfile(!!coderProfile);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { user, role, username, displayName, hasCoderProfile, loading: authLoading || loading };
}
