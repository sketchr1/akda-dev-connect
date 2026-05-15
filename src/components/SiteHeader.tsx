import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import akdaLogo from "@/assets/akda-logo.png";

export function SiteHeader() {
  const { user, role, loading } = useProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={akdaLogo} alt="Akda" className="h-9 w-auto object-contain dark:brightness-0 dark:invert" />
          <span className="rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">beta</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link to="/" className="transition-colors hover:text-foreground" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }}>Home</Link>
          <Link to="/coders" className="transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>Find Coders</Link>
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
        </nav>
        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              {role === "coder" ? (
                <Link
                  to="/coders/$coderId"
                  params={{ coderId: user.id }}
                  className="hidden rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 md:inline-flex"
                >
                  My Profile
                </Link>
              ) : role === "customer" ? (
                <Link
                  to="/projects/new"
                  className="hidden rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 md:inline-flex"
                >
                  Post a project
                </Link>
              ) : null}
              <span className="hidden text-sm text-muted-foreground lg:block">{user.email}</span>
              <button
                onClick={() => supabase.auth.signOut()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:block">Sign in</Link>
              <Link
                to="/signup"
                className="rounded-lg bg-gradient-akda px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
