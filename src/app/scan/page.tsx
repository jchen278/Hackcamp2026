import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function ScanContent() {
  const session = await auth0.getSession();

  if (!session?.user) {
    redirect("/auth/login?returnTo=/scan");
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Fridge Scanner</h1>
      <p className="mt-2 text-sm text-gray-600">
        Logged in as volunteer: <strong>{session.user.email}</strong>
      </p>
      {/* Camera capture component goes here */}
    </main>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading session...</p>}>
      <ScanContent />
    </Suspense>
  );
}