import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-akda shadow-glow">
            <span className="font-mono text-sm font-bold text-primary-foreground">A</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">Akda</span>
          <span className="ml-1 rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">beta</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link to="/" className="transition-colors hover:text-foreground" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }}>Home</Link>
          <Link to="/coders" className="transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>Find Coders</Link>
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
        </nav>
        <div className="flex items-center gap-3">
          <button className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:block">Sign in</button>
          <button className="rounded-lg bg-gradient-akda px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]">
            Post a project
          </button>
        </div>
      </div>
    </header>
  );
}
