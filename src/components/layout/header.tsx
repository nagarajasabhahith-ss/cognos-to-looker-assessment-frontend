"use client";

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Github, LogOut, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ModeToggle } from "@/components/mode-toggle"

export function Header() {
    const { user, webLogin, logout, isLoading } = useAuth();

    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container flex h-14 items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xl mr-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                            <FileText className="h-5 w-5" />
                        </div>
                        <span>C2L Assessment</span>
                    </Link>
                </div>

                <nav className="flex items-center gap-6 text-sm font-medium">
                    <Link href="/dashboard" className="transition-colors hover:text-foreground text-foreground/60">
                        Dashboard
                    </Link>
                    <Link href="/docs" className="transition-colors hover:text-foreground text-foreground/60">
                        Docs
                    </Link>
                </nav>

                <div className="flex items-center gap-2">

                    <ModeToggle />
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="https://github.com/ua-cognos-parser" target="_blank">
                            <Github className="h-4 w-4" />
                            <span className="sr-only">GitHub</span>
                        </Link>
                    </Button>

                    {!isLoading && (
                        user ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground hidden sm:inline-block">
                                    {user.email}
                                </span>
                                <Button variant="ghost" size="icon" onClick={logout} title="Sign Out">
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={webLogin}>Sign In</Button>
                        )
                    )}
                </div>
            </div>
        </header>
    )
}
