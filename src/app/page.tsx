import { auth0 } from "@/lib/auth0";
import { Suspense } from "react";

async function AuthContent() {
  const session = await auth0.getSession();

  if (!session) {
    return (
      <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">PantryPulse</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Community fridge &amp; pantry inventory redistribution network
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <a
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 font-medium h-11 px-6 hover:opacity-90 transition-opacity"
          >
            Log In
          </a>
          <a
            href="/auth/login?screen_hint=signup"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-700 font-medium h-11 px-6 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Sign Up
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold">User Profile</h1>
          <p className="text-sm text-zinc-500">
            Logged in as <span className="font-medium text-zinc-900 dark:text-zinc-200">{session.user.email}</span>
          </p>
        </div>
        <a
          href="/auth/logout"
          className="text-xs font-semibold px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-red-600 dark:text-red-400 transition-colors"
        >
          Logout
        </a>
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Session Payload</h2>
        <pre className="p-4 bg-zinc-100 dark:bg-zinc-800/60 rounded-lg text-xs overflow-x-auto text-zinc-800 dark:text-zinc-200 font-mono">
          {JSON.stringify(session.user, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <Suspense
        fallback={
          <div className="text-sm text-zinc-500 animate-pulse">
            Loading session...
          </div>
        }
      >
        <AuthContent />
      </Suspense>
    </main>
  );
}
