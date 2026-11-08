import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Camera,
  Check,
  ChevronDown,
  ImageUp,
  Loader2,
  LogOut,
  MapPin,
  Minus,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  User,
  X,
  ArrowLeft,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PhotoUpload } from "@/components/PhotoUpload";
import { FridgePicker, MapPreview } from "@/components/FridgeLocator";
import {
  applyConfirmedUpdate,
  CATEGORIES,
  isExistingItem,
  recognizeFridgePhoto,
  SAMPLE_FRIDGES,
  type Category,
  type DetectedItem,
  type Fridge,
} from "@/lib/inventory";

export const Route = createFileRoute("/update")({
  head: () => ({
    meta: [
      { title: "Update a Fridge — PantryPulse" },
      {
        name: "description",
        content: "Snap a photo of a community fridge, review AI estimates, and confirm the inventory update.",
      },
      { property: "og:title", content: "Update a Fridge — PantryPulse" },
      {
        property: "og:description",
        content: "Snap a photo of a community fridge, review AI estimates, and confirm the update.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UpdateFridgePage,
});

const CURRENT_USER = { name: "Phina Tran", email: "phina@pantrypulse.org" };
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
type Step = "upload" | "analyzing" | "review" | "confirm" | "done";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

function UpdateFridgePage() {
  const [fridges, setFridges] = useState<Fridge[]>(SAMPLE_FRIDGES);
  const [fridgeId, setFridgeId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedAt, setUploadedAt] = useState<string | null>(null);
  const [items, setItems] = useState<DetectedItem[]>([]);
  const [step, setStep] = useState<Step>("upload");
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  const fridge = fridges.find((f) => f.id === fridgeId) ?? null;

  const setPhoto = (f: File | null) => {
    if (f && !ACCEPTED.includes(f.type)) {
      toast.error("Please use a JPG, PNG or WEBP image.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
    setUploadedAt(f ? new Date().toISOString() : null);
  };

  const analyze = async () => {
    if (!file || !fridge) return;
    setStep("analyzing");
    const result = await recognizeFridgePhoto(file);
    setItems(result);
    setStep("review");
  };

  const confirm = () => {
    if (!fridge || !file) return;
    const at = new Date().toISOString();
    setFridges((all) =>
      all.map((f) => (f.id === fridge.id ? applyConfirmedUpdate(f, items, CURRENT_USER.name, at, file.name) : f)),
    );
    setSubmittedAt(at);
    setStep("done");
  };

  const reset = () => {
    setPhoto(null);
    setItems([]);
    setSubmittedAt(null);
    setStep("upload");
  };

  return (
    <div className="min-h-screen bg-background pb-16 font-sans">
      <TopBar />
      <main className="mx-auto max-w-3xl space-y-6 px-4 pt-6">
        {step !== "done" && (
          <header className="rounded-3xl bg-hero p-6 text-primary-foreground shadow-soft sm:p-8">
            <p className="text-sm opacity-80">Hi {CURRENT_USER.name.split(" ")[0]},</p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Help keep your community stocked! 🌱</h1>
            <p className="mt-3 max-w-xl opacity-90">
              Upload a quick photo of a community fridge to help everyone see what's available and what is
              needed.
            </p>
            <Stepper step={step} />
          </header>
        )}

        {(step === "upload" || step === "analyzing") && (
          <>
            <Section n={1} title="Select a fridge location">
              <FridgePicker fridges={fridges} value={fridgeId} onChange={setFridgeId} disabled={step === "analyzing"} />
              <MapPreview fridges={fridges} selected={fridgeId} onSelect={setFridgeId} />
            </Section>
            <Section n={2} title="Upload a photo">
              <PhotoUpload
                preview={preview}
                file={file}
                onFile={setPhoto}
                disabled={step === "analyzing"}
              />
            </Section>
            {preview && fridge && uploadedAt && (
              <Section n={3} title="Preview & submit">
                {step === "analyzing" ? (
                  <div className="flex flex-col items-center rounded-2xl bg-muted p-8 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="mt-4 text-lg font-semibold">Analyzing your fridge photo...</p>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      PantryPulse AI is identifying food items and estimating quantities. This may take a moment.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <img src={preview} alt="Fridge preview" className="h-40 w-full rounded-xl object-cover sm:w-48" />
                    <dl className="flex-1 space-y-2 text-sm">
                      <Row label="Fridge" value={fridge.name} />
                      <Row label="Uploaded" value={fmt(uploadedAt)} />
                      <Row label="File" value={file?.name ?? ""} />
                    </dl>
                  </div>
                )}
              </Section>
            )}
            {step === "upload" && (
              <div>
                <Button
                  size="lg"
                  className="h-14 w-full rounded-2xl text-base"
                  disabled={!fridge || !file}
                  onClick={analyze}
                >
                  <Sparkles /> Submit for AI Recognition
                </Button>
                {(!fridge || !file) && (
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    {!fridge ? "Select a fridge" : "Add a photo"} to continue.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {step === "review" && fridge && (
          <ReviewItems
            fridge={fridge}
            items={items}
            setItems={setItems}
            onBack={() => setStep("upload")}
            onNext={() => {
              if (items.some((i) => !i.name.trim())) return toast.error("Every item needs a name.");
              if (items.length === 0) return toast.error("Add at least one item.");
              setStep("confirm");
              return undefined;
            }}
          />
        )}

        {step === "confirm" && fridge && preview && (
          <ConfirmSummary
            fridge={fridge}
            items={items}
            preview={preview}
            onBack={() => setStep("review")}
            onConfirm={confirm}
          />
        )}

        {step === "done" && fridge && submittedAt && (
          <Success fridge={fridge} count={items.length} at={submittedAt} onAgain={reset} />
        )}
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <div className="border-b bg-card">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <span className="flex items-center gap-4">
          <span className="font-display text-xl font-bold text-primary">PantryPulse</span>
          <Link to="/upload" className="text-sm font-medium text-muted-foreground hover:text-primary">
            Quick upload
          </Link>
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full bg-secondary py-1 pl-1 pr-3 text-sm font-medium text-secondary-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {CURRENT_USER.name[0]}
            </span>
            <span className="hidden sm:inline">{CURRENT_USER.name}</span>
            <ChevronDown className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{CURRENT_USER.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User /> My profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps = ["Photo", "Review", "Confirm"];
  const idx = step === "review" ? 1 : step === "confirm" ? 2 : 0;
  return (
    <ol className="mt-6 flex gap-2">
      {steps.map((s, i) => (
        <li key={s} className="flex-1">
          <div className={cn("h-1.5 rounded-full", i <= idx ? "bg-primary-foreground" : "bg-primary-foreground/30")} />
          <span className="mt-1 block text-xs opacity-90">{s}</span>
        </li>
      ))}
    </ol>
  );
}

function Section({ n, title, children }: { n?: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl border bg-card p-5 shadow-soft sm:p-6">
      <h2 className="flex items-center gap-3 text-xl font-bold">
        {n && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary font-sans text-sm text-secondary-foreground">
            {n}
          </span>
        )}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-dashed pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

const perishLabel = { high: "Eat soon", medium: "Few days", low: "Shelf stable" } as const;
const perishStyle = {
  high: "bg-destructive/15 text-destructive",
  medium: "bg-warning/30 text-warning-foreground",
  low: "bg-secondary text-secondary-foreground",
} as const;

function ReviewItems({
  fridge,
  items,
  setItems,
  onBack,
  onNext,
}: {
  fridge: Fridge;
  items: DetectedItem[];
  setItems: React.Dispatch<React.SetStateAction<DetectedItem[]>>;
  onBack: () => void;
  onNext: () => void;
}) {
  const update = (id: string, patch: Partial<DetectedItem>) =>
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const add = () =>
    setItems((xs) => [
      ...xs,
      { id: `m-${Date.now()}`, name: "", category: "Other", quantity: 1, source: "manual" },
    ]);

  return (
    <Section title="Review what AI found">
      <p className="flex gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 translate-y-0.5" />
        Quantities are AI estimates — please correct anything that looks off. Items not in the photo stay unchanged.
      </p>
      <ul className="space-y-3">
        {items.map((it) => {
          const existing = it.name.trim() && isExistingItem(fridge, it.name);
          return (
            <li key={it.id} className="rounded-2xl border p-4">
              <div className="flex items-start gap-2">
                <input
                  value={it.name}
                  onChange={(e) => update(it.id, { name: e.target.value })}
                  placeholder="Item name"
                  aria-label="Item name"
                  autoFocus={it.source === "manual" && !it.name}
                  className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 font-semibold outline-none focus:ring-2 focus:ring-ring"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 text-destructive"
                  onClick={() => setItems((xs) => xs.filter((x) => x.id !== it.id))}
                  aria-label={`Remove ${it.name || "item"}`}
                >
                  <Trash2 />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <select
                  value={it.category}
                  onChange={(e) => update(it.id, { category: e.target.value as Category })}
                  aria-label="Category"
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <div className="flex items-center rounded-lg border border-input">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11"
                    onClick={() => update(it.id, { quantity: Math.max(0, it.quantity - 1) })}
                    aria-label="Decrease quantity"
                  >
                    <Minus />
                  </Button>
                  <input
                    type="number"
                    min={0}
                    value={it.quantity}
                    onChange={(e) => update(it.id, { quantity: Math.max(0, Number(e.target.value) || 0) })}
                    aria-label="Quantity"
                    className="h-11 w-14 bg-transparent text-center font-semibold outline-none"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11"
                    onClick={() => update(it.id, { quantity: it.quantity + 1 })}
                    aria-label="Increase quantity"
                  >
                    <Plus />
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">{it.source === "ai" ? "AI estimate" : "Added by you"}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 font-semibold",
                    existing ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground",
                  )}
                >
                  {existing ? "Updates existing record" : "New item"}
                </span>
                {it.perishability && (
                  <span className={cn("rounded-full px-2.5 py-0.5 font-semibold", perishStyle[it.perishability])}>
                    {perishLabel[it.perishability]}
                  </span>
                )}
                {it.confidence !== undefined && (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 font-semibold",
                      it.confidence < 0.7 ? "bg-warning/30 text-warning-foreground" : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {Math.round(it.confidence * 100)}% confident{it.confidence < 0.7 ? " — please check" : ""}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <Button variant="outline" size="lg" className="h-12 w-full rounded-xl border-dashed" onClick={add}>
        <Plus /> Add an item AI missed
      </Button>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="ghost" size="lg" className="h-12 rounded-xl" onClick={onBack}>
          <ArrowLeft /> Change photo
        </Button>
        <Button size="lg" className="h-12 rounded-xl" onClick={onNext}>
          Review summary
        </Button>
      </div>
    </Section>
  );
}

function ConfirmSummary({
  fridge,
  items,
  preview,
  onBack,
  onConfirm,
}: {
  fridge: Fridge;
  items: DetectedItem[];
  preview: string;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const now = new Date().toISOString();
  return (
    <Section title="Confirm your update">
      <div className="flex flex-col gap-4 sm:flex-row">
        <img src={preview} alt="Uploaded fridge" className="h-36 w-full rounded-xl object-cover sm:w-40" />
        <dl className="flex-1 space-y-2 text-sm">
          <Row label="Fridge" value={fridge.name} />
          <Row label="Submitted by" value={CURRENT_USER.name} />
          <Row label="Date & time" value={fmt(now)} />
          <Row label="Items" value={String(items.length)} />
        </dl>
      </div>
      <ul className="divide-y rounded-xl border">
        {items.map((it) => (
          <li key={it.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span>
              <span className="font-semibold">{it.name}</span>
              <span className="block text-xs text-muted-foreground">
                {it.category} · {isExistingItem(fridge, it.name) ? "updates existing" : "new"}
              </span>
            </span>
            <span className="font-semibold">~{it.quantity}</span>
          </li>
        ))}
      </ul>
      <p className="flex gap-2 rounded-xl bg-warning/25 p-3 text-sm text-warning-foreground">
        <Info className="h-4 w-4 shrink-0 translate-y-0.5" />
        Please review your inventory before confirming. AI-generated results are estimates and may not be completely
        accurate.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="outline" size="lg" className="h-14 rounded-xl" onClick={onBack}>
          <ArrowLeft /> Go Back and Edit
        </Button>
        <Button size="lg" className="h-14 rounded-xl text-base" onClick={onConfirm}>
          <Check /> Confirm Inventory Update
        </Button>
      </div>
    </Section>
  );
}

function Success({ fridge, count, at, onAgain }: { fridge: Fridge; count: number; at: string; onAgain: () => void }) {
  const [showFridge, setShowFridge] = useState(false);
  return (
    <section className="rounded-3xl border bg-card p-6 text-center shadow-soft sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <Check className="h-8 w-8 text-primary" />
      </div>
      <h1 className="mt-4 text-3xl font-bold">Inventory successfully updated! 🌱</h1>
      <p className="mt-2 text-muted-foreground">Thank you for helping keep your community fridge stocked.</p>
      <dl className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm">
        <Row label="Fridge" value={fridge.name} />
        <Row label="Items updated" value={String(count)} />
        <Row label="Submitted" value={fmt(at)} />
        <Row label="Submitted by" value={CURRENT_USER.name} />
      </dl>
      {showFridge && (
        <div className="mx-auto mt-6 max-w-sm rounded-xl bg-muted p-4 text-left">
          <p className="mb-2 font-semibold">Current inventory</p>
          <ul className="space-y-1 text-sm">
            {fridge.inventory.map((i) => (
              <li key={i.name} className="flex justify-between">
                <span>{i.name}</span>
                <span className="font-semibold">{i.quantity}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">{fridge.history.length} update(s) in history</p>
        </div>
      )}
      <div className="mx-auto mt-8 grid max-w-md gap-3 sm:grid-cols-2">
        <Button variant="outline" size="lg" className="h-12 rounded-xl" onClick={() => setShowFridge((s) => !s)}>
          View Updated Fridge
        </Button>
        <Button size="lg" className="h-12 rounded-xl" onClick={onAgain}>
          <Camera /> Upload Another Photo
        </Button>
      </div>
    </section>
  );
}
