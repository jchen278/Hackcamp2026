"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Home,
  Clock,
  MapPin,
  FileImage,
  ListChecks,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getMockSubmission,
  getMockSubmissionPhoto,
} from "@/lib/mock-submission";

export function SubmittedPageClient() {
  const submission = getMockSubmission();
  const photoUrl = getMockSubmissionPhoto();

  return (
    <div className="min-h-screen bg-background px-4 py-16 font-sans sm:py-24">
      <main className="mx-auto max-w-lg space-y-6 text-center">
        <p className="font-display text-xl font-bold text-primary">
          SpreadTheLoaf
        </p>
        <CheckCircle2
          className="mx-auto h-16 w-16 text-primary"
          aria-hidden="true"
        />
        <h1 className="text-3xl font-bold sm:text-4xl text-foreground">
          {submission
            ? "Your photo has been submitted!"
            : "No submission to show yet"}
        </h1>

        {submission ? (
          <>
            <p className="text-base text-muted-foreground">
              Thank you for helping care for your community fridge.
            </p>
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-primary">
              <Clock className="h-4 w-4" /> Logged &amp; Verified
            </p>

            {submission.solanaRewardStatus === "sent" &&
              submission.solanaRewardSignature && (
                <section className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-left">
                  <p className="font-semibold text-foreground">
                    0.01 SOL Devnet reward sent
                  </p>
                  <a
                    href={`https://explorer.solana.com/tx/${encodeURIComponent(submission.solanaRewardSignature)}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    View transaction on Solana Explorer
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </section>
              )}
            {submission.solanaRewardStatus === "failed" && (
              <p
                role="status"
                className="rounded-xl bg-muted p-3 text-sm text-muted-foreground"
              >
                Your scan was saved, but the Devnet reward could not be sent.
                Check the server’s Solana Devnet configuration and treasury balance.
              </p>
            )}
            {submission.solanaRewardStatus === "not_requested" && (
              <p className="text-sm text-muted-foreground">
                No Devnet reward was requested. Add a wallet address on the scan page to receive one.
              </p>
            )}

            <section className="space-y-5 rounded-3xl border bg-card p-5 text-left shadow-soft sm:p-6">
              <div className="space-y-1">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" /> Selected fridge
                </h2>
                <p className="break-words text-lg font-semibold text-foreground">
                  {submission.fridgeName}
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <FileImage className="h-4 w-4 text-primary" /> Uploaded photo
                </h2>
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt={`Uploaded fridge photo ${submission.photoName}`}
                    className="max-h-64 w-full rounded-2xl border object-cover"
                  />
                ) : null}
                <p className="break-words text-xs text-muted-foreground">
                  {submission.photoName}
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <ListChecks className="h-4 w-4 text-primary" /> Reviewed items
                  &amp; quantities
                </h2>
                <ul className="divide-y rounded-2xl border bg-background/50 overflow-hidden">
                  {submission.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">
                          {item.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.category}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground font-mono">
                        ×{item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <p className="text-xs text-muted-foreground">
              Scan audit logged in Tiger Data. Restock webhooks are
              automatically dispatched if staples run low.
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">
            Upload and review a fridge photo to submit an update.
          </p>
        )}

        <div className="pt-2">
          <Button asChild size="lg" className="min-h-12 w-full rounded-xl">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" /> Back to home
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
