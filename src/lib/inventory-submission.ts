import { CATEGORIES, type DetectedItem } from "@/lib/inventory";

export interface PendingInventorySubmission {
  id: string;
  status: "pending_approval";
  fridgeId: string;
  fridgeName: string;
  submittedBy: string;
  submittedAt: string;
  photoName: string;
  items: DetectedItem[];
}

export function validReviewItems(items: DetectedItem[]) {
  const names = items.map((item) => item.name.trim().toLowerCase());
  return (
    items.length > 0 &&
    new Set(names).size === names.length &&
    items.every(
      (item) =>
        item.name.trim().length > 0 &&
        Number.isInteger(item.quantity) &&
        item.quantity >= 0 &&
        CATEGORIES.includes(item.category),
    )
  );
}

/** A mock proposal only: never applies changes to the fridge's public inventory. */
export function createPendingSubmission(
  fridge: { id: string; name: string },
  items: DetectedItem[],
  confirmed: boolean,
  submittedBy: string,
  submittedAt: string,
  photoName: string,
): PendingInventorySubmission {
  if (!confirmed)
    throw new Error("Please confirm the reviewed inventory first.");
  if (!validReviewItems(items))
    throw new Error(
      "Use unique item names and whole quantities of zero or more.",
    );
  if (!submittedBy.trim()) throw new Error("Please log in before submitting.");
  return {
    id: `proposal-${fridge.id}-${submittedAt}`,
    status: "pending_approval",
    fridgeId: fridge.id,
    fridgeName: fridge.name,
    submittedBy,
    submittedAt,
    photoName,
    items: items.map((item) => ({ ...item, name: item.name.trim() })),
  };
}
