import { useSyncExternalStore } from "react";
import { SAMPLE_FRIDGES, type Fridge } from "@/lib/inventory";

export interface LocationDraft { name: string; address: string; neighbourhood: string; latitude?: string; longitude?: string }
const listeners = new Set<() => void>();
let locations = SAMPLE_FRIDGES;
export function getLocations() { return locations; }
export function makeLocation(draft: LocationDraft, existing: Fridge[]): Fridge {
  const name = draft.name.trim();
  const address = draft.address.trim();
  if (!name || !address) throw new Error("Enter a location name and address.");
  if (existing.some((entry) => entry.name.toLowerCase() === name.toLowerCase() && entry.address.toLowerCase() === address.toLowerCase())) throw new Error("This location already exists. Select it from the list.");
  const hasCoordinates = Boolean(draft.latitude?.trim() || draft.longitude?.trim());
  const lat = Number(draft.latitude);
  const lng = Number(draft.longitude);
  if (hasCoordinates && (!draft.latitude?.trim() || !draft.longitude?.trim() || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180)) throw new Error("Enter valid latitude and longitude, or leave both empty.");
  return { id: `custom-${crypto.randomUUID()}`, name, address, neighbourhood: draft.neighbourhood.trim(), status: "Running low", map: { x: 50, y: 50 }, coordinates: hasCoordinates ? { lat, lng } : undefined, inventory: [], history: [], isNewLocation: true };
}
export function addLocation(draft: LocationDraft) {
  const location = makeLocation(draft, locations);
  locations = [...locations, location];
  listeners.forEach((listener) => listener());
  return location;
}
export function useFridgeLocations() {
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, getLocations, () => SAMPLE_FRIDGES);
}

export { Fridge };
