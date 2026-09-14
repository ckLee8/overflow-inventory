"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveDailyMins } from "@/lib/actions/mins";
import type { DailyMinRow } from "@/lib/data";
import { Button, TableWrap, cn } from "@/components/ui";
import { WEEK_GRID_DAYS } from "@/lib/timezone";

type Props = {
  rows: DailyMinRow[];
  todayDayOfWeek: number;
};

export function DailyMinsPanel({ rows, todayDayOfWeek }: Props) {
  return (
    <TableWrap>
      <table className="min-w-full text-sm">
        <thead className="bg-muted/60 text-left text-muted-foreground">
          <tr>
            <th className="sticky left-0 z-10 bg-muted/90 px-3 py-3 font-medium">SKU</th>
            <th className="px-3 py-3 font-medium">Location</th>
            {WEEK_GRID_DAYS.map((d) => (
              <th
                key={d.dayOfWeek}
                className={cn(
                  "px-2 py-3 text-center font-medium",
                  d.dayOfWeek === todayDayOfWeek ? "bg-inbound text-primary" : "",
                )}
              >
                {d.label}
                {d.dayOfWeek === todayDayOfWeek ? (
                  <span className="mt-0.5 block text-xs font-normal">today</span>
                ) : null}
              </th>
            ))}
            <th className="px-3 py-3 font-medium"> </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-3 py-10 text-center text-muted-foreground">
                No stock levels yet. Add products and locations, then seed or create stock rows.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <DailyMinRowEditor
                key={`${row.productId}:${row.storeLocationId}`}
                row={row}
                todayDayOfWeek={todayDayOfWeek}
              />
            ))
          )}
        </tbody>
      </table>
    </TableWrap>
  );
}

function DailyMinRowEditor({
  row,
  todayDayOfWeek,
}: {
  row: DailyMinRow;
  todayDayOfWeek: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [mins, setMins] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    for (const d of WEEK_GRID_DAYS) {
      initial[d.dayOfWeek] = String(row.mins[d.dayOfWeek] ?? row.defaultMin);
    }
    return initial;
  });

  const save = () => {
    setStatus(null);
    startTransition(async () => {
      const result = await saveDailyMins({
        productId: row.productId,
        storeLocationId: row.storeLocationId,
        days: WEEK_GRID_DAYS.map((d) => ({
          dayOfWeek: d.dayOfWeek,
          minLevel: Math.max(0, Math.floor(Number(mins[d.dayOfWeek]) || 0)),
        })),
      });
      if (result.ok) {
        setStatus("Saved");
        router.refresh();
      } else {
        setStatus(result.error);
      }
    });
  };

  return (
    <tr className="border-t border-border">
      <td className="sticky left-0 z-10 bg-card px-3 py-2">
        <div className="font-mono text-xs text-muted-foreground">{row.sku}</div>
        <div className="font-medium text-foreground">{row.name}</div>
      </td>
      <td className="px-3 py-2 text-muted-foreground">{row.locationName}</td>
      {WEEK_GRID_DAYS.map((d) => (
        <td
          key={d.dayOfWeek}
          className={cn("px-2 py-2 text-center", d.dayOfWeek === todayDayOfWeek ? "bg-inbound/40" : "")}
        >
          <label className="sr-only" htmlFor={`min-${row.productId}-${row.storeLocationId}-${d.dayOfWeek}`}>
            Min for {row.sku} on {d.label}
          </label>
          <input
            id={`min-${row.productId}-${row.storeLocationId}-${d.dayOfWeek}`}
            type="number"
            min={0}
            inputMode="numeric"
            value={mins[d.dayOfWeek] ?? "0"}
            disabled={pending}
            onChange={(e) =>
              setMins((prev) => ({
                ...prev,
                [d.dayOfWeek]: e.target.value,
              }))
            }
            className="min-h-11 w-16 rounded-md border border-input bg-card px-2 text-center tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </td>
      ))}
      <td className="px-3 py-2">
        <Button type="button" size="sm" disabled={pending} onClick={save}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {status ? <p className="mt-1 text-[10px] text-muted-foreground">{status}</p> : null}
      </td>
    </tr>
  );
}
