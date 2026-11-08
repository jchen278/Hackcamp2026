"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  FileImage,
  HardDrive,
  Info,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { recognizeFridgePhoto, type DetectedItem, type Category } from "@/lib/inventory";
import { cn } from "@/lib/utils";
import { PhotoUpload } from "@/components/PhotoUpload";
import { InventoryReview } from "@/components/InventoryReview";
import { Button } from "@/components/ui/button";
import { setMockSubmission } from "@/lib/mock-submission";
import type { PantryLocation } from "@/types/pantry";
import type { FridgeScanResponse } from "@/features/vision/types";

interface UserProfile {
  name?: string | null;
  email?: string | null;
}

interface ScanPageClientProps {
  user: UserProfile;
  pantries?: PantryLocation[];
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

function mapVisionCategoryToUi(cat: string): Category {
  switch (cat) {
    case "fresh_produce":
      return "Produce";
    case "dairy_and_eggs":
      return "Dairy";
    case "bakery":
      return "Bakery";
    case "canned_goods":
    case "dry_staples":
      return "Pantry Staples";
    case "prepared_meals":
      return "Prepared Meals";
    case "beverages":
      return "Beverages";
    default:
      return "Other";
  }
}

function mapUiCategoryToVision(cat: Category): string {
  switch (cat) {
    case "Produce":
      return "fresh_produce";
    case "Dairy":
      return "dairy_and_eggs";
    case "Bakery":
      return "bakery";
    case "Pantry Staples":
      return "dry_staples";
    case "Prepared Meals":
      return "prepared_meals";
    case "Beverages":
      return "beverages";
    default:
      return "other";
  }
}

export function ScanPageClient({ user, pantries = [] }: ScanPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Resolve target pantry UUID (from URL ?pantryId=..., prop pantries, or fallback)
  const queryPantryId = searchParams.get("pantryId");
  const activePantry = pantries.find((p) => p.id === queryPantryId) || pantries[0];
  const [selectedPantryId, setSelectedPantryId] = useState<string>(activePantry?.id || "");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [at, setAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<DetectedItem[] | null>(null);
  const [rawScan, setRawScan] = useState<FridgeScanResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewKey, setReviewKey] = useState(0);
  const runId = useRef(0);

  const displayName = user.name || (user.email ? user.email.split("@")[0] : "Volunteer");

  const onFile = async (f: File | null) => {
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
    setRawScan(null);

    const id = ++runId.current;
    if (!f) {
      setAnalyzing(false);
      return;
    }

    setAnalyzing(true);
    setReviewKey((k) => k + 1);

    try {
      // 1. Call Gemini Vision API endpoint
      const compressedFile = await compressImage(f);
      const formData = new FormData();
      formData.append("image", compressedFile);

      const res = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      if (id !== runId.current) return;

      if (res.ok) {
        const json = await res.json();
        const scanData: FridgeScanResponse = json.data;
        setRawScan(scanData);

        if (scanData?.items && Array.isArray(scanData.items) && scanData.items.length > 0) {
          const mapped: DetectedItem[] = scanData.items.map((it, idx) => ({
            id: `ai-${idx}-${Date.now()}`,
            name: it.name,
            category: mapVisionCategoryToUi(it.category),
            quantity: Number(it.estimatedQuantity) || 1,
            perishability: it.isPerishable ? "high" : "low",
            confidence: 0.95,
            source: "ai" as const,
          }));
          setItems(mapped);
          setAnalyzing(false);
          return;
        }
      }

      // 2. Offline / Mock fallback if API fails or is unconfigured
      const fallback = await recognizeFridgePhoto(f);
      if (id !== runId.current) return;
      setItems(fallback);
      setAnalyzing(false);
    } catch {
      if (id !== runId.current) return;
      try {
        const fallback = await recognizeFridgePhoto(f);
        if (id !== runId.current) return;
        setItems(fallback);
      } catch {
        setError("Could not analyze this photo. Please try uploading it again.");
      }
      setAnalyzing(false);
    }
  };

  const handleAuditSubmit = async (submission: any) => {
    setSubmitting(true);
    setError(null);

    // Resolve target pantry UUID
    const targetPantryId =
      selectedPantryId ||
      pantries.find((p) => p.id === submission.fridgeId)?.id ||
      pantries[0]?.id ||
      submission.fridgeId;

    try {
      // Build reconciled payload matching FridgeScanResponseSchema
      const payload: FridgeScanResponse = {
        capacityEstimatePct: rawScan?.capacityEstimatePct ?? 45,
        cleanlinessScore: rawScan?.cleanlinessScore ?? "clean",
        items: submission.items.map((i: DetectedItem) => ({
          name: i.name,
          category: mapUiCategoryToVision(i.category),
          estimatedQuantity: i.quantity,
          unit: "units",
          isPerishable: i.perishability === "high",
          needsRemoval: false,
          notes: null, // explicit null matches schema
        })),
      };

      const res = await fetch(`/api/pantries/${encodeURIComponent(targetPantryId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scan: payload,
          metadata: {
            scannedByEmail: user.email ?? null,
            imageUrl: null,
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.warn("DB commit error:", errJson);
      }
    } catch (e) {
      console.warn("Backend commit skipped or network error:", e);
    } finally {
      setMockSubmission(submission, preview);
      router.push("/submitted");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 font-sans">
      <main className="mx-auto max-w-2xl space-y-6 px-4 pt-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <span className="flex items-center gap-3 text-sm">
            <span className="font-medium text-foreground">Hi, {displayName}</span>
            <Button
              asChild
              variant="link"
              className="text-xs text-muted-foreground hover:text-destructive p-0 h-auto"
            >
              <a href="/auth/logout">Log out</a>
            </Button>
          </span>
        </div>

        <header>
          <h1 className="text-3xl font-bold sm:text-4xl text-foreground">
            Upload a fridge photo
          </h1>
          <p className="mt-2 text-muted-foreground">
            Snap or upload a clear photo of the fridge contents, then review the detected items.
          </p>
        </header>

        {/* Target Pantry Selector (if pantries passed) */}
        {pantries.length > 0 && (
          <section className="rounded-2xl border bg-card p-4 shadow-soft">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Target Community Fridge
            </label>
            <select
              value={selectedPantryId}
              onChange={(e) => setSelectedPantryId(e.target.value)}
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {pantries.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.address})
                </option>
              ))}
            </select>
          </section>
        )}

        <section className="space-y-4 rounded-3xl border bg-card p-5 shadow-soft sm:p-6">
          <PhotoUpload
            preview={preview}
            file={file}
            onFile={onFile}
            disabled={analyzing || submitting}
          />
          {error && (
            <p className="rounded-xl bg-destructive/15 p-3 text-sm text-destructive">{error}</p>
          )}
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
          <section className="flex flex-col items-center rounded-3xl border bg-card p-8 text-center shadow-soft animate-in fade-in">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-lg font-semibold">Analyzing your fridge photo...</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Multimodal vision is identifying food items, evaluating capacity, and checking spoilage.
            </p>
          </section>
        )}

        {/* AI Capacity & Disposal Flags Banner */}
        {rawScan && (
          <section className="rounded-3xl border bg-card p-5 shadow-soft space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-muted p-4">
                <span className="text-xs uppercase font-medium text-muted-foreground">Capacity</span>
                <p className="text-2xl font-bold text-primary mt-1">{rawScan.capacityEstimatePct}%</p>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <span className="text-xs uppercase font-medium text-muted-foreground">Cleanliness</span>
                <p className="text-2xl font-bold capitalize text-primary mt-1">{rawScan.cleanlinessScore}</p>
              </div>
            </div>

            {/* Display discarded / flagged items */}
            {rawScan.items.some((i) => i.needsRemoval) && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 space-y-2">
                <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Items Flagged for Removal / Disposal</span>
                </div>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {rawScan.items
                    .filter((i) => i.needsRemoval)
                    .map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center bg-card/60 p-2 rounded-lg">
                        <span className="font-medium text-destructive">{item.name}</span>
                        <span>{item.notes || "Spoiled / Unsafe"}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {items && <Results items={items} />}

        {items && file && (
          <InventoryReview
            key={reviewKey}
            items={items}
            onChange={setItems}
            submittedBy={displayName}
            photoName={file.name}
            onSubmitted={handleAuditSubmit}
          />
        )}
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
        <Sparkles className="h-5 w-5 text-primary" /> Multimodal recognition results
      </h2>
      <p className="flex gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 translate-y-0.5" />
        Quantities and categories are AI estimates. You can adjust counts and categories below before submitting.
      </p>
      <p className="text-sm font-semibold">{items.length} food items detected</p>
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it.id} className="rounded-2xl border p-4 bg-background">
            <p className="text-lg font-semibold">{it.name}</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Field label="Est. quantity">
                <span className="text-base font-semibold">~{it.quantity}</span>
              </Field>
              <Field label="Category">{it.category}</Field>
              <Field label="Perishability">
                {it.perishability ? (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      perish[it.perishability][1]
                    )}
                  >
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
                        className={cn(
                          "block h-full",
                          it.confidence < 0.7 ? "bg-warning" : "bg-primary"
                        )}
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
              <p className="mt-2 text-xs text-warning-foreground">
                Low confidence — please double-check this item.
              </p>
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

async function compressImage(file: File, maxWidth = 1280, quality = 0.75): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality
        );
      };
    };
  });
}