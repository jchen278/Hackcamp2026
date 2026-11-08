import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, LogIn, Camera, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockLogin } from "@/lib/mock-auth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — PantryPulse" },
      { name: "description", content: "Log in to PantryPulse to update community fridge inventory." },
      { property: "og:title", content: "Log in — PantryPulse" },
      { property: "og:description", content: "Log in to update community fridge inventory." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

const field =
  "h-12 w-full rounded-xl border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-ring";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"uploader" | "admin">("uploader");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = email.split("@")[0] || "Volunteer";
    const name = raw.charAt(0).toUpperCase() + raw.slice(1);
    mockLogin({ name, email, accountType });
    void navigate({ to: accountType === "admin" ? "/admin" : "/upload" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 font-sans">
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <form onSubmit={submit} className="mt-4 space-y-4 rounded-3xl border bg-card p-6 shadow-soft">
          <div>
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">{accountType === "admin" ? "For Foodbank Coordinators and Managers." : "For volunteers and donors uploading fridge photos."}</p>
          </div>
          <Tabs value={accountType} onValueChange={(value) => { if (value === "admin" || value === "uploader") setAccountType(value); }}>
            <TabsList className="grid h-12 w-full grid-cols-2">
              <TabsTrigger value="uploader" className="h-10 gap-2"><Camera className="h-4 w-4" /> Upload fridges</TabsTrigger>
              <TabsTrigger value="admin" className="h-10 gap-2"><ShieldCheck className="h-4 w-4" /> Admin account</TabsTrigger>
            </TabsList>
          </Tabs>
          <label className="block space-y-1 text-sm font-medium">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
              placeholder="you@example.com"
            />
          </label>
          <label className="block space-y-1 text-sm font-medium">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={field}
            />
          </label>
          <Button type="submit" size="lg" className="h-12 w-full rounded-xl text-base">
            <LogIn /> Log in
          </Button>
          <p className="text-center text-xs text-muted-foreground">Any email and password works.</p>
        </form>
      </div>
    </div>
  );
}
