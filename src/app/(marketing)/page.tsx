"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  ShieldCheck,
  Zap,
  LayoutDashboard,
  FileSearch,
  GitBranch,
  FileCheck,
  Lock,
  Building2,
  BadgeCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col">
      {/* Hero — deep green, brand-aligned */}
      <section className="relative flex min-h-[75vh] flex-col justify-center overflow-hidden bg-deep-green">
        {/* Subtle gradient and pattern for depth */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-30"
          aria-hidden
          style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 50% at 50% 0%, rgba(240, 237, 228, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 100% 100%, rgba(194, 154, 74, 0.08) 0%, transparent 50%)
            `,
          }}
        />
        <div className="content-width relative z-10 py-20 lg:py-28">
          <div className="mx-auto max-w-3xl">
            <span className="inline-block rounded-full border border-light-cream/20 bg-light-cream/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-light-cream/90 backdrop-blur-sm lg:text-sm">
              Enterprise migration assessment
            </span>
            <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight text-light-cream drop-shadow-sm sm:text-5xl lg:text-6xl">
              Cognos to Looker migration,{" "}
              <span className="text-royal-gold">assessed at scale</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-light-cream/90 lg:text-xl">
              Upload your Cognos exports. Get a structured assessment—structure,
              dependencies, and migration-ready recommendations—so you can plan
              with confidence.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              {user ? (
                <Button
                  size="lg"
                  className="h-12 bg-royal-gold font-medium text-deep-green shadow-lg transition hover:bg-royal-gold/90 hover:shadow-xl"
                  asChild
                >
                  <Link href="/dashboard" className="gap-2">
                    <LayoutDashboard className="h-5 w-5" /> Go to Dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="h-12 bg-royal-gold font-medium text-deep-green shadow-lg transition hover:bg-royal-gold/90 hover:shadow-xl"
                    asChild
                  >
                    <Link href="/login" className="gap-2">
                      Get started <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 border-light-cream/30 bg-transparent text-light-cream transition hover:-translate-y-0.5 hover:bg-light-cream/10 hover:text-light-cream hover:shadow-md"
                    asChild
                  >
                    <Link href="/login">Sign in</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise — trust pillars, premium strip */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-deep-green/8 via-deep-green/5 to-transparent">
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-40"
          aria-hidden
          style={{
            backgroundImage: `
              radial-gradient(ellipse 70% 60% at 50% 0%, rgba(26, 95, 63, 0.06) 0%, transparent 60%),
              linear-gradient(180deg, transparent 0%, transparent 100%)
            `,
          }}
        />
        <div className="content-width relative z-10 py-14 lg:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-deep-green/20 bg-deep-green/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-deep-green">
              <BadgeCheck className="h-3.5 w-3.5" /> Enterprise-ready
            </span>
            <h2 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Built for teams that move with confidence
            </h2>
            <p className="mt-3 text-muted-foreground">
              Plan your Cognos-to-Looker migration with assessment you can trust.
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
            <div className="group relative rounded-xl border border-border/80 bg-card/80 p-6 shadow-sm backdrop-blur-sm transition hover:border-deep-green/25 hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-deep-green/10 text-deep-green transition group-hover:bg-deep-green/15">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
                Your data stays private
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Processing and storage you control. No data leaves your environment without your say.
              </p>
            </div>
            <div className="group relative rounded-xl border border-border/80 bg-card/80 p-6 shadow-sm backdrop-blur-sm transition hover:border-deep-green/25 hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-deep-green/10 text-deep-green transition group-hover:bg-deep-green/15">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
                Scale with your org
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Built for enterprise teams. Assess hundreds of reports and modules in one place.
              </p>
            </div>
            <div className="group relative rounded-xl border border-border/80 bg-card/80 p-6 shadow-sm backdrop-blur-sm transition hover:border-deep-green/25 hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-deep-green/10 text-deep-green transition group-hover:bg-deep-green/15">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
                Migration-ready output
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Structured reports and LookML-ready recommendations for stakeholders and execs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities — three pillars, same content width */}
      <section className="bg-background">
        <div className="content-width py-16 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
              How it works
            </h2>
            <p className="mt-3 text-muted-foreground">
              Deep analysis, automated mapping, and migration-ready output.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col border-b border-border pb-8 last:border-0 sm:border-b-0 sm:pb-0 lg:border-b-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-deep-green/10 text-deep-green">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
                Deep analysis
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Parse Cognos reports and data modules. Understand structure,
                metrics, and dependencies.
              </p>
            </div>
            <div className="flex flex-col border-b border-border pb-8 last:border-0 sm:border-b-0 sm:pb-0 lg:border-b-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-deep-green/10 text-deep-green">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
                Automated mapping
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Relationship graphs between data sources and visualizations.
                See how reports and modules connect.
              </p>
            </div>
            <div className="flex flex-col sm:col-span-2 lg:col-span-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-deep-green/10 text-deep-green">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
                Migration ready
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Issues and LookML recommendations. Export assessment reports for
                stakeholders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow — three steps, same content width */}
      <section className="border-t border-border bg-muted/30">
        <div className="content-width py-16 lg:py-24">
          <h2 className="font-heading text-center text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
            Simple workflow
          </h2>
          <div className="mx-auto mt-12 grid max-w-4xl gap-10 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-deep-green/30 bg-background text-deep-green">
                <FileSearch className="h-6 w-6" />
              </div>
              <span className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Step 1
              </span>
              <h3 className="mt-1 font-heading text-base font-semibold text-foreground">
                Upload
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload your Cognos package and report exports.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-deep-green/30 bg-background text-deep-green">
                <GitBranch className="h-6 w-6" />
              </div>
              <span className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Step 2
              </span>
              <h3 className="mt-1 font-heading text-base font-semibold text-foreground">
                Analyze
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We parse structure and map dependencies automatically.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-deep-green/30 bg-background text-deep-green">
                <FileCheck className="h-6 w-6" />
              </div>
              <span className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Step 3
              </span>
              <h3 className="mt-1 font-heading text-base font-semibold text-foreground">
                Plan
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Review the assessment and export your migration plan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA — deep green, same content width */}
      <section className="bg-deep-green">
        <div className="content-width py-16 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-light-cream lg:text-3xl">
              Ready to assess your migration?
            </h2>
            <p className="mt-4 text-light-cream/90">
              Start with a single export. Get clarity on scope, dependencies,
              and next steps.
            </p>
            <div className="mt-8">
              {user ? (
                <Button
                  size="lg"
                  className="h-12 bg-royal-gold font-medium text-deep-green hover:bg-royal-gold/90"
                  asChild
                >
                  <Link href="/dashboard" className="gap-2">
                    <LayoutDashboard className="h-5 w-5" /> Open dashboard
                  </Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="h-12 bg-royal-gold font-medium text-deep-green hover:bg-royal-gold/90"
                  asChild
                >
                  <Link href="/login" className="gap-2">
                    Get started <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
