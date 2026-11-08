import { useRef, useState } from "react";
import { Camera, ImageUp, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PhotoUpload({
  preview,
  file,
  onFile,
  disabled,
}: {
  preview: string | null;
  file: File | null;
  onFile: (f: File | null) => void;
  disabled?: boolean;
}) {
  const deviceRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFile(e.target.files?.[0] ?? null);
    e.target.value = "";
  };
  return (
    <div className="space-y-3">
      <input ref={deviceRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={pick} aria-label="Upload from device" />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />
      {preview ? (
        <div className="relative overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Uploaded fridge" className="max-h-80 w-full object-cover" />
          {!disabled && (
            <div className="absolute right-3 top-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => deviceRef.current?.click()}>
                <RefreshCw /> Replace
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onFile(null)} aria-label="Remove photo">
                <X />
              </Button>
            </div>
          )}
          <p className="bg-muted px-3 py-2 text-xs text-muted-foreground">{file?.name}</p>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            onFile(e.dataTransfer.files?.[0] ?? null);
          }}
          className={cn(
            "flex flex-col items-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
            drag ? "border-primary bg-secondary/50" : "border-input bg-muted/50",
          )}
        >
          <ImageUp className="h-10 w-10 text-primary" />
          <p className="mt-3 font-semibold">Drag a photo here</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Open the fridge door and photograph the contents as clearly as possible. JPG, PNG or WEBP.
          </p>
          <div className="mt-5 grid w-full gap-3 sm:grid-cols-2">
            <Button size="lg" className="h-12 rounded-xl" onClick={() => cameraRef.current?.click()}>
              <Camera /> Take a photo
            </Button>
            <Button size="lg" variant="outline" className="h-12 rounded-xl" onClick={() => deviceRef.current?.click()}>
              <ImageUp /> Upload from device
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

