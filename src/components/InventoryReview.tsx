import { useState } from "react";
import { ClipboardCheck, Plus, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, type DetectedItem } from "@/lib/inventory";
import { useFridgeLocations } from "@/lib/fridge-locations";
import { AddFridgeLocation } from "@/components/AddFridgeLocation";
import { createPendingSubmission, validReviewItems, type PendingInventorySubmission } from "@/lib/inventory-submission";

export function InventoryReview({ items, onChange, submittedBy, photoName, onSubmitted }: {
  items: DetectedItem[];
  onChange: (items: DetectedItem[]) => void;
  submittedBy: string;
  photoName: string;
  onSubmitted: (submission: PendingInventorySubmission) => void;
}) {
  const [fridgeId, setFridgeId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const fridges = useFridgeLocations();
  const fridge = fridges.find((entry) => entry.id === fridgeId);
  const valid = validReviewItems(items);
  const changeItems = (next: DetectedItem[]) => {
    setConfirmed(false);
    onChange(next);
  };
  const edit = (id: string, changes: Partial<DetectedItem>) =>
    changeItems(items.map((item) => item.id === id ? { ...item, ...changes } : item));

  return (
    <section className="space-y-5 border-t pt-6">
      <header>
        <h2 className="flex items-center gap-2 text-2xl font-bold"><ClipboardCheck className="h-5 w-5 text-primary" /> Review inventory</h2>
      </header>
      <div className="space-y-2">
        <label id="review-fridge-label" className="text-sm font-medium">Fridge location</label>
        <Select value={fridgeId} onValueChange={(value) => { setFridgeId(value); setConfirmed(false); }}>
          <SelectTrigger aria-labelledby="review-fridge-label" className="h-12"><SelectValue placeholder="Select a fridge" /></SelectTrigger>
          <SelectContent>{fridges.map((entry) => <SelectItem key={entry.id} value={entry.id}>{entry.name}</SelectItem>)}</SelectContent>
        </Select>
        {fridge && <p className="text-sm text-muted-foreground">{fridge.address} · {fridge.neighbourhood}</p>}
        <AddFridgeLocation onAdded={(id) => { setFridgeId(id); setConfirmed(false); }} />
      </div>
      <ul className="space-y-4">
        {items.map((item, index) => <li key={item.id} className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex items-end gap-2">
            <label className="min-w-0 flex-1 space-y-1 text-sm font-medium">Item name
              <Input aria-label={`Item ${index + 1} name`} value={item.name} onChange={(event) => edit(item.id, { name: event.target.value })} className="h-12" />
            </label>
            <Button size="icon" variant="ghost" className="h-12 w-12 shrink-0 text-destructive" title={`Remove item ${index + 1}`} aria-label={`Remove item ${index + 1}`} onClick={() => changeItems(items.filter((entry) => entry.id !== item.id))}><Trash2 /></Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-sm font-medium">Quantity
              <Input aria-label={`Item ${index + 1} quantity`} type="number" min={0} step={1} value={Number.isNaN(item.quantity) ? "" : item.quantity} onChange={(event) => edit(item.id, { quantity: event.target.value === "" ? NaN : Number(event.target.value) })} className="h-12" />
            </label>
            <div className="min-w-0 space-y-1">
              <label id={`category-${item.id}`} className="text-sm font-medium">Category</label>
              <Select value={item.category} onValueChange={(value) => { const category = CATEGORIES.find((entry) => entry === value); if (category) edit(item.id, { category }); }}>
                <SelectTrigger aria-labelledby={`category-${item.id}`} className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </li>)}
      </ul>
      <Button variant="outline" className="h-12" onClick={() => changeItems([...items, { id: `manual-${crypto.randomUUID()}`, name: "", quantity: 1, category: "Other", source: "manual" }])}><Plus /> Add item</Button>
      {!valid && <p role="alert" className="text-sm text-destructive">Add at least one item. Use unique names and whole quantities of zero or more.</p>}
      <div className="space-y-4 border-t pt-5">
        <p className="text-sm text-muted-foreground">Items missing from the photo stay unchanged. Submitted changes are pending admin approval.</p>
        <div className="flex items-start gap-3">
          <Checkbox id="confirm-inventory" checked={confirmed} className="mt-1 h-5 w-5" onCheckedChange={(value) => setConfirmed(value === true)} />
          <label htmlFor="confirm-inventory" className="text-sm font-medium">I have reviewed and confirm these items and quantities for the selected fridge.</label>
        </div>
        {!fridge && <p className="text-sm text-muted-foreground">Select a fridge location above before submitting.</p>}
        <Button className="min-h-12 w-full whitespace-normal px-4" disabled={!confirmed || !valid || !fridge} onClick={() => {
          if (!fridge) return;
          onSubmitted(createPendingSubmission(fridge, items, confirmed, submittedBy, new Date().toISOString(), photoName));
        }}><Send /> Submit for approval</Button>
        <p className="text-xs text-muted-foreground">Demo only — no live inventory changes or admin delivery.</p>
      </div>
    </section>
  );
}