import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { AdminPageClient } from "@/components/AdminPageClient";

async function AdminContent() {
  const session = await auth0.getSession();

  console.log("--> AUTH0 SESSION USER:", JSON.stringify(session?.user, null, 2));

  if (!session?.user) {
    redirect("/auth/login?returnTo=/admin");
  }

  const rawRoles = session.user["https://yourapp.com/roles"];
  const roles: string[] = Array.isArray(rawRoles) ? rawRoles : [];

  console.log("--> DETECTED ROLES:", roles);

  if (!roles.includes("admin")) {
    const roleList = roles.length > 0 ? roles.join(", ") : "none";
    console.warn(`--> ACCESS DENIED: User missing 'admin' role (Current role(s): [${roleList}]). Redirecting home.`);
    redirect("/");
  }

  const user = {
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    roles,
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