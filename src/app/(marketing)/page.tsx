"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, ShieldCheck, Zap, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center px-4 py-24 md:py-32 bg-background">
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground mb-4">
            🚀 Phase 4: Frontend Beta
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter sm:text-5xl">
            Cognos to Looker Migration
          </h1>
          <p className="text-xl text-muted-foreground max-w-[600px] mx-auto leading-relaxed">
            Automated assessment service to analyze exports, map relationships, and plan your migration.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            {user ? (
              <Button size="lg" className="h-11 px-8 gap-2" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" /> Go to Dashboard
                </Link>
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="h-11 px-8 gap-2" asChild>
                  <Link href="/login">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-11 px-8" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Minimal Features Grid */}
      <section className="container py-12 md:py-24 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Deep Analysis</h3>
            <p className="text-muted-foreground text-sm">Parse complex Cognos exports including Reports and Data Modules.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Automated Mapping</h3>
            <p className="text-muted-foreground text-sm">Generate relationship graphs between data sources and visualizations.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Migration Ready</h3>
            <p className="text-muted-foreground text-sm">Identify issues and get recommendations for LookML.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
