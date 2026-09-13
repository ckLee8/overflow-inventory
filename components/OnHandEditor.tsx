"use client";

import { useState, useTransition } from "react";
import { updateStockOnHand } from "@/lib/actions/inventory";
import { cn } from "@/components/ui";

type Props = {
  stockLevelId: string;
  initialOnHand: number;
  canEdit: boolean;
  source: "db" | "mock";
  /** Shown in helper text — today's count label. */
  todayDate: string;
  timezone: string;
  belowMin?: boolean;
};

export function OnHandEditor({
  stockLevelId,
  initialOnHand,
  canEdit,
  source,
  todayDate,
  timezone,
  belowMin,
}: Props) {
  const [value, setValue] = useState(String(initialOnHand));
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canEdit) {
    return (
      <span className={cn("tabular-nums", belowMin && "font-semibold text-warn")}>{initialOnHand}</span>
    );
  }

  const save = () => {
    const next = Math.max(0, Math.floor(Number(value) || 0));
    setValue(String(next));
    if (next === initialOnHand) return;

    if (source !== "db") {
      setStatus("Mock — not persisted");
      return;
    }

    startTransition(async () => {
      const result = await updateStockOnHand({
        stockLevelId,
        onHand: next,
      });
      if (result.ok) {
        setStatus(
          result.delta === 0
            ? "No change"
            : `Saved (Δ ${result.delta > 0 ? "+" : ""}${result.delta})`,
        );
      } else {
        setValue(String(initialOnHand));
        setStatus(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="sr-only" htmlFor={`onhand-${stockLevelId}`}>
        Today's on hand ({todayDate}, {timezone})
      </label>
      <input
        id={`onhand-${stockLevelId}`}
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        title={`Today's on-hand count (${todayDate}, ${timezone})`}
        className={cn(
          "min-h-11 w-20 rounded-md border px-2 text-center tabular-nums touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-ring",
          belowMin
            ? "border-warn/40 bg-warn/10 font-semibold text-warn"
            : "border-input bg-card text-foreground",
        )}
        aria-label={`Today's on hand for stock ${stockLevelId}`}
      />
      {status ? <span className="text-[10px] text-muted-foreground">{status}</span> : null}
    </div>
  );
}
