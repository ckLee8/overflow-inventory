"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { updateOrderCell } from "@/lib/actions/ordering";
import { groupOrderRows, type GroupBy, type MockSkuRow, type MockVendor } from "@/lib/mock-data";
import { cn, Select, TableWrap } from "@/components/ui";

export type WeekColumn = { date: string; label: string };

type Props = {
  planId: string | null;
  columns: WeekColumn[];
  rows: MockSkuRow[];
  vendors: MockVendor[];
  source: "db" | "mock";
  /** YYYY-MM-DD in APP_TIMEZONE — only this column’s qty is editable. */
  todayDate: string;
  /** IANA timezone label for UI copy (e.g. America/New_York). */
  timezone: string;
};

export function WeeklyOrderGrid({
  planId,
  columns,
  rows,
  vendors,
  source,
  todayDate,
  timezone,
}: Props) {
  const [groupBy, setGroupBy] = useState<GroupBy>("vendor");
  const [qty, setQty] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const row of rows) {
      for (const [date, value] of Object.entries(row.quantities ?? {})) {
        if (value > 0) initial[`${row.id}:${date}`] = value;
      }
    }
    return initial;
  });
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const groups = useMemo(() => groupOrderRows(rows, groupBy), [rows, groupBy]);

  const vendorBlocked = (vendorName: string, date: string) => {
    const vendor = vendors.find((v) => v.name === vendorName);
    if (!vendor) return false;
    const day = new Date(`${date}T00:00:00Z`).getUTCDay();
    return !vendor.orderDaysOfWeek.includes(day);
  };

  const cellKey = (rowId: string, date: string) => `${rowId}:${date}`;

  const isToday = (date: string) => date === todayDate;

  const persistCell = (rowId: string, date: string, value: number) => {
    if (!isToday(date)) {
      setStatus(`Locked — only today (${todayDate}, ${timezone}) is editable.`);
      return;
    }
    if (!planId || source !== "db") {
      setStatus("Mock mode — changes stay in this browser session only.");
      return;
    }
    startTransition(async () => {
      const result = await updateOrderCell({
        planId,
        rowId,
        orderDate: date,
        quantity: value,
      });
      if (result.ok) {
        setStatus(`Saved ${value} for ${date}`);
      } else {
        setStatus(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-foreground" htmlFor="groupBy">
          Group by
        </label>
        <Select
          id="groupBy"
          className="w-auto min-w-[12rem]"
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
        >
          <option value="vendor">Vendor</option>
          <option value="location">Store location</option>
        </Select>
        <p className="text-sm text-muted-foreground">
          {source === "db"
            ? "Live weekly plan · only today is editable · grey = locked or vendor closed"
            : "Mock data · only today is editable · grey = locked or vendor closed"}
          {" · "}
          today {todayDate} ({timezone})
          {pending ? " · saving…" : null}
        </p>
        {status ? <p className="w-full text-xs text-muted-foreground">{status}</p> : null}
      </div>

      <TableWrap>
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/60 text-left text-muted-foreground">
              <th className="sticky left-0 z-10 bg-muted/90 px-3 py-3 font-medium">SKU</th>
              <th className="px-3 py-3 font-medium">Location</th>
              <th className="px-3 py-3 font-medium">Stock</th>
              {columns.map((col) => {
                const today = isToday(col.date);
                return (
                  <th
                    key={col.date}
                    className={cn(
                      "px-3 py-3 text-center font-medium",
                      today ? "bg-inbound text-primary" : "",
                    )}
                  >
                    <div>{col.label}</div>
                    <div className={cn("text-xs font-normal", today ? "text-primary/80" : "")}>
                      {col.date.slice(5)}
                      {today ? " · today" : " · locked"}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {groups.map(([groupName, groupRows]) => (
              <Fragment key={`g-${groupName}`}>
                <tr className="bg-inbound/70">
                  <td
                    colSpan={3 + columns.length}
                    className="px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-primary"
                  >
                    {groupBy === "vendor" ? "Vendor" : "Location"}: {groupName}
                  </td>
                </tr>
                {groupRows.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="sticky left-0 z-10 bg-card px-3 py-2">
                      <div className="font-mono text-xs text-muted-foreground">{row.sku}</div>
                      <div className="font-medium text-foreground">{row.name}</div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{row.locationName}</td>
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">
                      {row.onHand}
                      <span className="text-xs"> / min {row.minLevel}</span>
                    </td>
                    {columns.map((col) => {
                      const today = isToday(col.date);
                      const blocked = vendorBlocked(row.vendorName, col.date);
                      const locked = !today || blocked;
                      const key = cellKey(row.id, col.date);
                      const lockReason = !today
                        ? todayDate > col.date
                          ? "Past day — locked"
                          : "Future day — locked"
                        : blocked
                          ? "Vendor closed"
                          : undefined;
                      return (
                        <td
                          key={key}
                          className={cn("px-2 py-2 text-center", today && !blocked ? "bg-inbound/40" : "")}
                        >
                          <input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            disabled={locked}
                            readOnly={locked}
                            value={qty[key] ?? ""}
                            placeholder={locked ? "—" : "0"}
                            title={lockReason}
                            onChange={(e) => {
                              if (locked) return;
                              setQty((prev) => ({
                                ...prev,
                                [key]: Number(e.target.value) || 0,
                              }));
                            }}
                            onBlur={(e) => {
                              if (locked) return;
                              const value = Number(e.target.value) || 0;
                              persistCell(row.id, col.date, value);
                            }}
                            className={cn(
                              "min-h-11 w-16 rounded-md border px-2 text-center tabular-nums touch-manipulation outline-none",
                              locked
                                ? "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-80"
                                : "border-primary/30 bg-card shadow-card ring-1 ring-primary/15 focus-visible:ring-2 focus-visible:ring-ring",
                            )}
                            aria-label={`Order qty for ${row.sku} on ${col.date}${
                              locked ? ` (${lockReason})` : ""
                            }`}
                            aria-disabled={locked}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}
