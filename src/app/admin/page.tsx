import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function AdminContent() {
  const session = await auth0.getSession();

  if (!session?.user) {
    redirect("/auth/login?returnTo=/admin");
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Admin Inventory Controls</h1>
      <p className="mt-2 text-sm text-gray-600">
        Admin session: <strong>{session.user.email}</strong>
      </p>
      {/* Inventory threshold controls go here */}
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading admin panel...</p>}>
      <AdminContent />
    </Suspense>
  );
}