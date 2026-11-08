import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { getPantries } from "@/features/pantries/queries";
import { ScanPageClient } from "@/components/ScanPageClient";

async function ScanContent() {
  const session = await auth0.getSession();

  if (!session?.user) {
    redirect("/auth/login?returnTo=/scan");
  }

  const [pantries] = await Promise.all([
    getPantries(),
  ]);

  const user = {
    name: session.user.name ?? null,
    email: session.user.email ?? null,
  };

  return <ScanPageClient user={user} pantries={pantries} />;
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground animate-pulse">Loading scanner session...</p>
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  );
}