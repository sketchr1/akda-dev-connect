import { Link } from "@tanstack/react-router";
import { LogOut, User, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import akdaLogo from "@/assets/akda-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function SiteHeader() {
  const { user, role, username, displayName, hasCoderProfile, loading } = useProfile();

  const accountLabel = displayName || "My Account";
  const myProfileTo = hasCoderProfile && username ? "/coders/$coderId" : "/onboarding/coder";
  const myProfileParams = hasCoderProfile && username ? { coderId: username } : undefined as never;

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
                  to={myProfileTo}
                  params={myProfileParams}
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
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary/10 text-[10px] font-medium text-primary">
                      {accountLabel.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline">{accountLabel}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[10rem]">
                  <DropdownMenuItem asChild>
                    <Link to={myProfileTo} params={myProfileParams} className="flex cursor-pointer items-center gap-2">
                      <User className="h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => supabase.auth.signOut()}
                    className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
