"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Refrigerator,
  PackageX,
  TriangleAlert,
  ClipboardCheck,
  Home,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFridgeLocations } from "@/lib/fridge-locations";
import {
  DEMO_LOW_STOCK_THRESHOLD,
  getAdminMetrics,
} from "@/lib/admin-overview";
import { getMockSubmissions } from "@/lib/mock-submission";
import { StatusBadge } from "@/components/FridgeLocator";

const emptySubscribe = () => () => {};

interface UserProfile {
  name?: string | null;
  email?: string | null;
}

export function AdminPageClient({ user }: { user: UserProfile }) {
  const fridges = useFridgeLocations();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [now] = useState<Date>(() => new Date());

  const displayName =
    user.name || (user.email ? user.email.split("@")[0] : "Coordinator");

  if (!mounted) {
    return (
      <main
        className="min-h-screen flex items-center justify-center p-8 text-muted-foreground"
        role="status"
      >
        Loading admin overview…
      </main>
    );
  }

  const submissions = getMockSubmissions();
  const metrics = getAdminMetrics(fridges, submissions, now);

  const cards = [
    {
      label: "Total Fridges",
      value: metrics.totalFridges,
      description: "Registered community fridges",
      icon: Refrigerator,
      tone: "text-primary",
    },
    {
      label: "Needs Restocking",
      value: metrics.needsRestocking,
      description: "Fridges with critical shortages",
      icon: PackageX,
      tone: "text-destructive",
    },
    {
      label: "Low-Stock Items",
      value: metrics.lowStockItems,
      description: `Items with ≤${DEMO_LOW_STOCK_THRESHOLD} units remaining`,
      icon: TriangleAlert,
      tone: "text-warning-foreground",
    },
    {
      label: "Updates Today",
      value: metrics.updatesToday,
      description: "Audited scans committed today",
      icon: ClipboardCheck,
      tone: "text-primary",
    },
  ];

  return (
    <div className="min-h-screen bg-background font-sans">
      <nav className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link
            href="/"
            className="font-display text-xl font-bold text-primary"
          >
            PantryPulse
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <Home className="h-4 w-4 mr-1" /> Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/auth/logout">
                <LogOut className="h-4 w-4 mr-1" /> Log out
              </a>
            </Button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:py-12">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Foodbank Coordinators &amp; Managers
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl text-foreground">
            Admin Overview
          </h1>
          <p className="text-muted-foreground">
            Welcome, <strong>{displayName}</strong> ({user.email}).
          </p>
        </header>

        {/* Metrics Grid */}
        <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {cards.map(({ label, value, description, icon: Icon, tone }) => (
            <div
              key={label}
              className="min-w-0 rounded-2xl border bg-card p-5 shadow-soft"
            >
              <Icon className={`mb-3 h-6 w-6 ${tone}`} aria-hidden="true" />
              <dt className="text-sm font-semibold text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1 text-3xl font-bold tabular-nums text-foreground">
                {value}
              </dd>
              <p className="mt-2 text-xs text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </dl>

        {/* Fridge Status Breakdown */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">
            Community Fridge Status
          </h2>
          <ul className="divide-y rounded-2xl border bg-card overflow-hidden">
            {fridges.map((fridge) => (
              <li
                key={fridge.id}
                className="p-4 sm:p-5 hover:bg-muted/30 transition-colors"
              >
                <details className="group">
                  <summary className="flex min-h-10 cursor-pointer list-none flex-wrap items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                    <div>
                      <p className="font-semibold text-foreground text-base">
                        {fridge.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {fridge.address}
                        {fridge.neighbourhood && ` · ${fridge.neighbourhood}`}
                      </p>
                    </div>
                    <span className="flex items-center gap-3">
                      <StatusBadge status={fridge.status} />
                      <ChevronDown
                        className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </span>
                  </summary>

                  <div className="pt-4 mt-3 border-t border-border">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Current stock items
                    </p>
                    {fridge.inventory.length > 0 ? (
                      <ul className="divide-y rounded-xl border bg-background/80 overflow-hidden">
                        {fridge.inventory.map((item) => (
                          <li
                            key={item.name}
                            className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-foreground">
                                {item.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {item.category}
                              </span>
                            </span>
                            <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground font-mono">
                              ×{item.quantity}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground italic">
                        No stock items reported yet for this fridge.
                      </p>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>

        <p className="border-t pt-4 text-xs text-muted-foreground">
          Critical shortages trigger alerts when stock drops below{" "}
          {DEMO_LOW_STOCK_THRESHOLD} units. Audit logs and scan revisions sync
          directly with Tiger Data.
        </p>
      </main>
    </div>
  );
}
