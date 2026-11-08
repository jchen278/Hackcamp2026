import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Fridge } from "@/lib/inventory";
import type { Map as LeafletMap, CircleMarker } from "leaflet";
import { Button } from "@/components/ui/button";

export const statusStyle: Record<Fridge["status"], string> = {
  "Well stocked": "bg-secondary text-secondary-foreground",
  "Running low": "bg-warning/30 text-warning-foreground",
  "Nearly empty": "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }: { status: Fridge["status"] }) {
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", statusStyle[status])}>{status}</span>;
}

export function LocationStatus({ fridge }: { fridge: Fridge }) {
  return fridge.isNewLocation ? <span className="shrink-0 text-xs text-muted-foreground">Not yet reviewed</span> : <StatusBadge status={fridge.status} />;
}

export function FridgePicker({
  fridges,
  value,
  onChange,
  disabled,
}: {
  fridges: Fridge[];
  value: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [q, setQ] = useState("");
  const list = useMemo(
    () =>
      fridges.filter((f) =>
        [f.name, f.address, f.neighbourhood].join(" ").toLowerCase().includes(q.toLowerCase()),
      ),
    [fridges, q],
  );
  return (
    <div className="space-y-3">
      <label className="relative block">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, street or neighbourhood"
          className="h-12 w-full rounded-xl border border-input bg-background pl-11 pr-4 outline-none focus:ring-2 focus:ring-ring"
          disabled={disabled}
        />
      </label>
      <ul className="max-h-72 space-y-2 overflow-auto" role="listbox" aria-label="Community fridges">
        {list.map((f) => (
          <li key={f.id}>
            <Button variant="ghost"
              role="option"
              aria-selected={value === f.id}
              disabled={disabled}
              onClick={() => onChange(f.id)}
              className={cn(
                "flex h-auto min-h-16 w-full items-start justify-start gap-3 whitespace-normal rounded-lg border p-3 text-left transition-colors",
                value === f.id ? "border-primary bg-secondary/50 ring-1 ring-primary" : "hover:bg-muted",
              )}
            >
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{f.name}</span>
                <span className="block text-sm text-muted-foreground">
                  {f.address} · {f.neighbourhood}
                </span>
              </span>
              <LocationStatus fridge={f} />
            </Button>
          </li>
        ))}
        {list.length === 0 && <li className="p-3 text-sm text-muted-foreground">No fridges match &quot;{q}&quot;.</li>}
      </ul>
    </div>
  );
}

export function MapPreview({
  fridges,
  selected,
  onSelect,
}: {
  fridges: Fridge[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef(new Map<string, CircleMarker>());
  const select = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => { select.current = onSelect; }, [onSelect]);
  useEffect(() => {
    let cancelled = false;
    const currentMarkers = markers.current;
    void import("leaflet").then((L) => {
      if (cancelled || !container.current) return;
      const instance = L.map(container.current, { scrollWheelZoom: false, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false }).setView([49.271, -123.113], 12);
      map.current = instance;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        maxZoom: 19,
      }).addTo(instance);
      for (const fridge of fridges) {
        if (!fridge.coordinates) continue;
        const marker = L.circleMarker([fridge.coordinates.lat, fridge.coordinates.lng], {
          radius: 10, weight: 3, fillOpacity: 1, className: "fridge-map-marker",
        }).addTo(instance);
        const tooltip = document.createElement("span");
        tooltip.textContent = fridge.name;
        marker.bindTooltip(tooltip, { direction: "top" });
        marker.on("click", () => select.current(fridge.id));
        currentMarkers.set(fridge.id, marker);
      }
      const points: [number, number][] = fridges.flatMap((f) => f.coordinates ? [[f.coordinates.lat, f.coordinates.lng] as [number, number]] : []);
      if (points.length > 0) instance.fitBounds(points, { padding: [30, 30], maxZoom: 13 });
      const observer = new ResizeObserver(() => { if (!cancelled) instance.invalidateSize(); });
      observer.observe(container.current);
      instance.on("unload", () => observer.disconnect());
      setReady(true);
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      currentMarkers.clear();
    };
  }, [fridges]);
  useEffect(() => {
    if (!ready) return;
    markers.current.forEach((marker, id) => {
      marker.setRadius(id === selected ? 14 : 10);
      if (id === selected) { marker.bringToFront(); marker.openTooltip(); }
      else marker.closeTooltip();
    });
    const fridge = fridges.find((f) => f.id === selected);
    if (fridge?.coordinates) map.current?.panTo([fridge.coordinates.lat, fridge.coordinates.lng], { animate: false });
  }, [selected, fridges, ready]);
  return (
    <div className="space-y-2">
      <div className="relative isolate h-72 overflow-hidden rounded-lg border bg-map-land sm:h-80">
        <div ref={container} className="fridge-map h-full w-full" role="region" aria-label="Community fridge map" />
        {!ready && <p role="status" className="absolute inset-0 z-[1000] flex items-center justify-center bg-muted text-sm text-muted-foreground">{failed ? "Map unavailable — select a fridge from the list below." : "Loading map…"}</p>}
      </div>
      <p className="text-xs text-muted-foreground">Demo fridge locations are approximate.</p>
    </div>
  );
}

