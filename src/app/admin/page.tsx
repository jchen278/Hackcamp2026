import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { AdminPageClient } from "@/components/AdminPageClient";

async function AdminContent() {
  const session = await auth0.getSession();

  if (!session?.user) {
    redirect("/auth/login?returnTo=/admin");
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
