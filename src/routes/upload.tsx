import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { mockLogout, useMockUser } from "@/lib/mock-auth";
import { ArrowLeft, CalendarClock, FileImage, HardDrive, Info, Loader2, Sparkles } from "lucide-react";
import { recognizeFridgePhoto, type DetectedItem } from "@/lib/inventory";
import { cn } from "@/lib/utils";
import { PhotoUpload } from "@/components/PhotoUpload";
import { InventoryReview } from "@/components/InventoryReview";
import { Button } from "@/components/ui/button";
import { setMockSubmission } from "@/lib/mock-submission";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload a Fridge Photo — PantryPulse" },
      { name: "description", content: "Upload a community fridge photo, review mock AI results and submit confirmed inventory for approval." },
      { property: "og:title", content: "Upload a Fridge Photo — PantryPulse" },
      { property: "og:description", content: "Upload a community fridge photo, review mock AI results and submit confirmed inventory for approval." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UploadPage,
});

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [at, setAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<DetectedItem[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const runId = useRef(0);
  const [user, ready] = useMockUser();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && !user) void navigate({ to: "/login" });
  }, [ready, user, navigate]);

  const onFile = (f: File | null) => {
    if (f && !ACCEPTED.includes(f.type)) {
      setError("Please use a JPG, JPEG, PNG or WEBP image.");
      return;
    }
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
    setAt(f ? new Date() : null);
    setItems(null);
    const id = ++runId.current;
    if (!f) return setAnalyzing(false);
    setAnalyzing(true);
    void recognizeFridgePhoto(f).then((res) => {
      if (id !== runId.current) return; // photo was replaced or removed
      setItems(res);
      setAnalyzing(false);
    }).catch(() => {
      if (id !== runId.current) return;
      setError("Could not analyze this photo. Please try uploading it again.");
      setAnalyzing(false);
    });
  };

  return (
    <div className="min-h-screen bg-background pb-16 font-sans">
      <main className="mx-auto max-w-2xl space-y-6 px-4 pt-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          {user && (
            <span className="flex items-center gap-3 text-sm">
              <span className="font-medium">Hi, {user.name}</span>
              <Button variant="link"
                onClick={() => {
                  mockLogout();
                  void navigate({ to: "/" });
                }}
                className="text-muted-foreground underline-offset-4 hover:underline"
              >
                Log out
              </Button>
            </span>
          )}
        </div>
        <header>
          <h1 className="text-3xl font-bold sm:text-4xl">Upload a fridge photo</h1>
          <p className="mt-2 text-muted-foreground">
            Snap or upload a clear photo of the fridge contents, then check the preview.
          </p>
        </header>
        <section className="space-y-4 rounded-3xl border bg-card p-5 shadow-soft sm:p-6">
          <PhotoUpload preview={preview} file={file} onFile={onFile} />
          {error && <p className="rounded-xl bg-destructive/15 p-3 text-sm text-destructive">{error}</p>}
          {file && at && (
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <Meta icon={<FileImage />} label="File" value={file.name} />
              <Meta icon={<HardDrive />} label="Size" value={`${(file.size / 1024).toFixed(0)} KB`} />
              <Meta
                icon={<CalendarClock />}
                label="Uploaded"
                value={at.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              />
            </dl>
          )}
        </section>
        {analyzing && (
          <section className="flex flex-col items-center rounded-3xl border bg-card p-8 text-center shadow-soft">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-lg font-semibold">Analyzing your fridge photo...</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              PantryPulse AI is identifying food items and estimating quantities. This may take a moment.
            </p>
          </section>
        )}
        {items && <Results items={items} />}
        {items && file && user && <InventoryReview key={runId.current} items={items} onChange={setItems} submittedBy={user.name} photoName={file.name} onSubmitted={(submission) => {
          setMockSubmission(submission, preview);
          void navigate({ to: "/submitted" });
        }} />}
      </main>
    </div>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-muted p-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-primary">
      <span className="mt-0.5">{icon}</span>
      <span className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate font-medium">{value}</dd>
      </span>
    </div>
  );
}

const perish = {
  high: ["Eat soon", "bg-destructive/15 text-destructive"],
  medium: ["Few days", "bg-warning/30 text-warning-foreground"],
  low: ["Shelf stable", "bg-secondary text-secondary-foreground"],
} as const;

function Results({ items }: { items: DetectedItem[] }) {
  return (
    <section className="space-y-4 rounded-3xl border bg-card p-5 shadow-soft sm:p-6">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <Sparkles className="h-5 w-5 text-primary" /> AI recognition results
      </h2>
      <p className="flex gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 translate-y-0.5" />
        Sample results — quantities are AI estimates and nothing has been saved to the fridge.
      </p>
      <p className="text-sm font-semibold">{items.length} food items detected</p>
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it.id} className="rounded-2xl border p-4">
            <p className="text-lg font-semibold">{it.name}</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Field label="Est. quantity">
                <span className="text-base font-semibold">~{it.quantity}</span>
              </Field>
              <Field label="Category">{it.category}</Field>
              <Field label="Perishability">
                {it.perishability ? (
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", perish[it.perishability][1])}>
                    {perish[it.perishability][0]}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>
              <Field label="Confidence">
                {it.confidence !== undefined ? (
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                      <span
                        className={cn("block h-full", it.confidence < 0.7 ? "bg-warning" : "bg-primary")}
                        style={{ width: `${Math.round(it.confidence * 100)}%` }}
                      />
                    </span>
                    <span className="font-semibold">{Math.round(it.confidence * 100)}%</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Not available</span>
                )}
              </Field>
            </dl>
            {it.confidence !== undefined && it.confidence < 0.7 && (
              <p className="mt-2 text-xs text-warning-foreground">Low confidence — please double-check this item.</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
