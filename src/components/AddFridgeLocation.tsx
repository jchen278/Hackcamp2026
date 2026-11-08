import { useState } from "react";
import { Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addLocation } from "@/lib/fridge-locations";

export function AddFridgeLocation({
  onAdded,
}: {
  onAdded: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        setError("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-12 gap-2">
          <Plus /> Add a location
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <MapPin className="h-5 w-5" /> Add a fridge location
          </DialogTitle>
          <DialogDescription>
            New locations are available in this demo session only.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            try {
              const location = await addLocation({
                name: String(data.get("name") ?? ""),
                address: String(data.get("address") ?? ""),
                neighbourhood: String(data.get("neighbourhood") ?? ""),
                latitude: String(data.get("latitude") ?? ""),
                longitude: String(data.get("longitude") ?? ""),
              });
              onAdded(location.id);
              setOpen(false);
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "Unable to add this location.",
              );
            }
          }}
        >
          <label className="block space-y-1 text-sm font-medium">
            Location name
            <Input
              name="name"
              required
              placeholder="e.g. Cedar Cottage Community Fridge"
              className="h-12"
            />
          </label>
          <label className="block space-y-1 text-sm font-medium">
            Street address
            <Input
              name="address"
              required
              placeholder="Street address and city"
              className="h-12"
            />
          </label>
          <label className="block space-y-1 text-sm font-medium">
            Neighbourhood (optional)
            <Input name="neighbourhood" className="h-12" />
          </label>
          <details className="text-sm">
            <summary className="cursor-pointer py-2 font-medium">
              Map coordinates (optional)
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <label className="space-y-1">
                Latitude
                <Input
                  name="latitude"
                  type="number"
                  step="any"
                  min={-90}
                  max={90}
                />
              </label>
              <label className="space-y-1">
                Longitude
                <Input
                  name="longitude"
                  type="number"
                  step="any"
                  min={-180}
                  max={180}
                />
              </label>
            </div>
            <p className="mt-2 text-muted-foreground">
              Without coordinates, the location appears in the directory but not
              on the map.
            </p>
          </details>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="h-12 w-full">
            <Plus /> Add location
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
