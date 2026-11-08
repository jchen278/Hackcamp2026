import type { PendingInventorySubmission } from "@/lib/inventory-submission";

let latestSubmission: PendingInventorySubmission | null = null;
let latestPhotoUrl: string | null = null;
const allSubmissions: PendingInventorySubmission[] = [];

export function setMockSubmission(submission: PendingInventorySubmission, photoUrl?: string | null) {
  latestSubmission = submission;
  latestPhotoUrl = photoUrl ?? null;
  allSubmissions.unshift(submission);
}

export function getMockSubmission(): PendingInventorySubmission | null {
  return latestSubmission;
}

export function getMockSubmissionPhoto(): string | null {
  return latestPhotoUrl;
}

export function getMockSubmissions(): PendingInventorySubmission[] {
  return allSubmissions;
}
