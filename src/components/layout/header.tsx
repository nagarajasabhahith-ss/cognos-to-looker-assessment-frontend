"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, Github, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { ModeToggle } from "@/components/mode-toggle";

export function Header() {
  const { user, webLogin, logout, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="content-width flex h-16 items-center justify-between gap-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 font-heading font-bold text-foreground transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-deep-green text-light-cream">
            <FileText className="h-5 w-5" />
          </div>
          <span className="text-lg tracking-tight">C2L Assessment</span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/dashboard"
            className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/docs"
            className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Docs
          </Link>
        </nav>

        {/* Right: theme, GitHub, auth — aligned to content edge */}
        <div className="flex shrink-0 items-center gap-1">
          <ModeToggle />
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" asChild>
            <Link href="https://github.com/ua-cognos-parser" target="_blank">
              <Github className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </Link>
          </Button>

          {!isLoading &&
            (user ? (
              <div className="flex items-center gap-2">
                <span className="hidden max-w-[140px] truncate text-sm text-muted-foreground sm:inline md:max-w-[200px]">
                  {user.email}
                </span>
                <Button variant="ghost" size="icon" onClick={logout} title="Sign Out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={webLogin}
                className="ml-2 bg-deep-green font-medium text-light-cream hover:bg-deep-green/90"
              >
                Sign In
              </Button>
            ))}
        </div>
      </div>
    </header>
  );
}
