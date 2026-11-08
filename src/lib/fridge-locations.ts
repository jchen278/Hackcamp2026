import { useSyncExternalStore } from "react";
import type { Fridge } from "@/lib/inventory";

export interface LocationDraft {
  name: string;
  address: string;
  neighbourhood?: string;
  latitude?: string;
  longitude?: string;
}

const listeners = new Set<() => void>();
let locations: Fridge[] = [];

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function getLocations(): Fridge[] {
  return locations;
}

/**
 * Hydrates the client store with live rows from Tiger Data.
 * Call this when the page loads so all components share the live database list.
 */
export function setLocations(newLocations: Fridge[]) {
  locations = newLocations;
  emitChange();
}

/**
 * Formats draft input into the UI's Fridge shape
 */
export function makeLocation(draft: LocationDraft, existing: Fridge[]): Fridge {
  const name = draft.name.trim();
  const address = draft.address.trim();

  if (!name || !address) {
    throw new Error("Enter a location name and address.");
  }

  if (
    existing.some(
      (entry) =>
        entry.name.toLowerCase() === name.toLowerCase() &&
        entry.address.toLowerCase() === address.toLowerCase(),
    )
  ) {
    throw new Error("This location already exists. Select it from the list.");
  }

  const hasCoordinates = Boolean(
    draft.latitude?.trim() || draft.longitude?.trim(),
  );
  const lat = Number(draft.latitude);
  const lng = Number(draft.longitude);

  if (
    hasCoordinates &&
    (!draft.latitude?.trim() ||
      !draft.longitude?.trim() ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180)
  ) {
    throw new Error("Enter valid latitude and longitude, or leave both empty.");
  }

  return {
    id: crypto.randomUUID(),
    name,
    address,
    neighbourhood: draft.neighbourhood?.trim() || "",
    status: "Running low", // Matches "Well stocked" | "Running low" | "Nearly empty"
    map: { x: 50, y: 50 } as any,
    coordinates: hasCoordinates ? { lat, lng } : undefined,
    inventory: [],
    history: [],
    isNewLocation: true,
  };
}

/**
 * Adds a new location to the client store and syncs to Tiger Data if an API route exists
 */
export async function addLocation(draft: LocationDraft): Promise<Fridge> {
  const location = makeLocation(draft, locations);

  // Optimistically update client store
  locations = [...locations, location];
  emitChange();

  // Optionally POST to backend to persist to Tiger Data
  try {
    await fetch("/api/pantries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: location.id,
        name: location.name,
        address: location.address,
        neighbourhood: location.neighbourhood,
        latitude: draft.latitude ? parseFloat(draft.latitude) : null,
        longitude: draft.longitude ? parseFloat(draft.longitude) : null,
      }),
    });
  } catch (err) {
    console.warn("Could not persist new pantry location to backend:", err);
  }

  return location;
}

/**
 * React hook to subscribe to live pantry locations
 */
export function useFridgeLocations(initialFridges?: Fridge[]) {
  // If initial fridges are supplied from Tiger Data and store is empty, seed it
  if (initialFridges && initialFridges.length > 0 && locations.length === 0) {
    locations = initialFridges;
  }

  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getLocations,
    () => locations, // SSR Snapshot
  );
}

export { type Fridge };
