import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Refrigerator, PackageX, TriangleAlert, ClipboardCheck, Home, LogOut, ShieldCheck, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockLogout, useMockUser } from "@/lib/mock-auth";
import { SAMPLE_FRIDGES } from "@/lib/inventory";
import { useFridgeLocations } from "@/lib/fridge-locations";
import { DEMO_LOW_STOCK_THRESHOLD, getAdminMetrics } from "@/lib/admin-overview";
import { getMockSubmissions } from "@/lib/mock-submission";
import { StatusBadge } from "@/components/FridgeLocator";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Admin Overview — PantryPulse" },
    { name: "description", content: "Community fridge stock and submission overview for foodbank coordinators and managers." },
    { property: "og:title", content: "Admin Overview — PantryPulse" },
    { property: "og:description", content: "Monitor community fridge shortages, low stock and daily submissions." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [user, ready] = useMockUser();
  const fridges = useFridgeLocations();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); }, []);
  if (!ready || !now) return <main className="p-8 text-muted-foreground" role="status">Loading overview…</main>;
  // Demo account selection only: no real privileges or private data exist here.
  if (user?.accountType !== "admin") return (
    <main className="mx-auto max-w-md space-y-5 px-4 py-20">
      <ShieldCheck className="h-10 w-10 text-primary" />
      <h1 className="text-3xl font-bold">Admin Overview</h1>
      <p className="text-muted-foreground">Sign in with an admin account for foodbank coordinators and managers.</p>
      <Button asChild className="min-h-12"><Link to="/login">Go to login</Link></Button>
      <Button asChild variant="outline" className="ml-2 min-h-12"><Link to="/"><Home /> Home</Link></Button>
    </main>
  );
  const metrics = getAdminMetrics(SAMPLE_FRIDGES, getMockSubmissions(), now);
  const cards = [
    { label: "Total Fridges", value: metrics.totalFridges, description: "Registered community fridges", icon: Refrigerator, tone: "text-primary" },
    { label: "Needs Restocking", value: metrics.needsRestocking, description: "Fridges with critical shortages", icon: PackageX, tone: "text-destructive" },
    { label: "Low-Stock Items", value: metrics.lowStockItems, description: "Items below their thresholds", icon: TriangleAlert, tone: "text-warning-foreground" },
    { label: "Updates Today", value: metrics.updatesToday, description: "Inventory submissions today", icon: ClipboardCheck, tone: "text-primary" },
  ];
  return (
    <div className="min-h-screen bg-background font-sans">
      <nav className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to="/" className="font-display text-xl font-bold text-primary">PantryPulse</Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost"><Link to="/"><Home /> Home</Link></Button>
            <Button variant="outline" onClick={() => { mockLogout(); void navigate({ to: "/login", replace: true }); }}><LogOut /> Log out</Button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:py-12">
        <header className="space-y-2">
          <p className="text-sm font-medium text-primary">Foodbank Coordinators & Managers</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Admin Overview</h1>
          <p className="text-muted-foreground">Welcome, {user.name}.</p>
        </header>
        <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {cards.map(({ label, value, description, icon: Icon, tone }) => <div key={label} className="min-w-0 rounded-lg border bg-card p-4 sm:p-5">
            <Icon className={`mb-4 h-6 w-6 ${tone}`} aria-hidden="true" />
            <dt className="text-sm font-semibold">{label}</dt>
            <dd className="mt-2 text-4xl font-bold tabular-nums">{value}</dd>
            <p className="mt-2 text-xs text-muted-foreground">{description}</p>
          </div>)}
        </dl>
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Community Fridge Status</h2>
          <ul className="divide-y border-y">
            {fridges.map((fridge) => <li key={fridge.id}>
              <details className="group">
                <summary className="flex min-h-12 cursor-pointer list-none flex-wrap items-center justify-between gap-3 py-4 [&::-webkit-details-marker]:hidden">
                  <div><p className="font-semibold">{fridge.name}</p><p className="text-sm text-muted-foreground">{fridge.neighbourhood}</p></div>
                  <span className="flex items-center gap-3">
                    <StatusBadge status={fridge.status} />
                    <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
                  </span>
                </summary>
                <div className="pb-4 pl-1">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Current stock</p>
                  {fridge.inventory.length > 0 ? (
                    <ul className="divide-y rounded-2xl border">
                      {fridge.inventory.map((item) => <li key={item.name} className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{item.name}</span>
                          <span className="text-xs text-muted-foreground">{item.category}</span>
                        </span>
                        <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">×{item.quantity}</span>
                      </li>)}
                    </ul>
                  ) : <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">No stock data reported yet for this fridge.</p>}
                </div>
              </details>
            </li>)}
          </ul>
        </section>
        <p className="border-t pt-4 text-xs text-muted-foreground">Critical shortages use “Nearly empty” status; the low-stock threshold is {DEMO_LOW_STOCK_THRESHOLD} units per item. Today uses Vancouver time.</p>
      </main>
    </div>
  );
}