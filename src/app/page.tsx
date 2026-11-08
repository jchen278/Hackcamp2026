import { Suspense } from "react";
import { auth0 } from "@/lib/auth0";
import { HomePageClient } from "@/components/HomePageClient";

async function HomeContent() {
  const session = await auth0.getSession();

  const user = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      }
    : null;

  return <HomePageClient user={user} />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground animate-pulse">Loading PantryPulse...</p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
