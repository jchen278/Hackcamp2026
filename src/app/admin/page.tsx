import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { AdminPageClient } from "@/components/AdminPageClient";

async function AdminContent() {
  const session = await auth0.getSession();

  if (!session?.user) {
    redirect("/auth/login?returnTo=/admin");
  }

  const rawRoles = (session.user as Record<string, unknown>)["https://pantrypulse.com/roles"];
  const roles = Array.isArray(rawRoles) && rawRoles.every((role) => typeof role === "string")
    ? rawRoles
    : [];

  if (!roles.includes("admin")) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <section className="w-full max-w-xl space-y-5 rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-destructive">
              Access check failed
            </p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">Admin role not found in this session</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              You are signed in, but this app did not receive the <code>admin</code> role in the
              Auth0 ID token claim <code>https://pantrypulse.com/roles</code>.
            </p>
          </div>

          <div className="rounded-xl bg-muted p-4 text-sm">
            <p className="font-semibold text-foreground">Roles received by the app</p>
            <p className="mt-1 text-muted-foreground">{roles.length ? roles.join(", ") : "No roles claim received"}</p>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            Auth0 role assignments are added to the ID token by the deployed Post Login Action.
            After confirming that Action is attached to the Login flow, sign out and sign in again
            so Auth0 can issue a fresh token with the current roles.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="/auth/logout?returnTo=%2Fadmin"
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Sign out and try again
            </a>
            <a
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Go home
            </a>
          </div>
        </section>
      </main>
    );
  }

  const user = {
    name: session.user.name ?? null,
    email: session.user.email ?? null,
  };

  return <AdminPageClient user={user} />;
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground animate-pulse">Loading admin dashboard...</p>
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
