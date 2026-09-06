"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { updateOrderCell } from "@/lib/actions/ordering";
import { groupOrderRows, type GroupBy, type MockSkuRow, type MockVendor } from "@/lib/mock-data";

export type WeekColumn = { date: string; label: string };

type Props = {
  planId: string | null;
  columns: WeekColumn[];
  rows: MockSkuRow[];
  vendors: MockVendor[];
  source: "db" | "mock";
};

export function WeeklyOrderGrid({ planId, columns, rows, vendors, source }: Props) {
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

  const persistCell = (rowId: string, date: string, value: number) => {
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
        <label className="text-sm font-medium text-slate-700" htmlFor="groupBy">
          Group by
        </label>
        <select
          id="groupBy"
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
        >
          <option value="vendor">Vendor</option>
          <option value="location">Store location</option>
        </select>
        <p className="text-sm text-slate-500">
          {source === "db"
            ? "Live weekly plan from Postgres · grey cells = vendor closed"
            : "Mock data (set DATABASE_URL to use Prisma) · grey cells = vendor closed"}
          {pending ? " · saving…" : null}
        </p>
        {status ? <p className="w-full text-xs text-slate-500">{status}</p> : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="sticky left-0 z-10 bg-slate-50 px-3 py-3 font-semibold text-slate-700">
                SKU
              </th>
              <th className="px-3 py-3 font-semibold text-slate-700">Location</th>
              <th className="px-3 py-3 font-semibold text-slate-700">Stock</th>
              {columns.map((col) => (
                <th key={col.date} className="px-3 py-3 text-center font-semibold text-slate-700">
                  <div>{col.label}</div>
                  <div className="text-xs font-normal text-slate-500">{col.date.slice(5)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(([groupName, groupRows]) => (
              <Fragment key={`g-${groupName}`}>
                <tr className="bg-brand-50">
                  <td
                    colSpan={3 + columns.length}
                    className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-900"
                  >
                    {groupBy === "vendor" ? "Vendor" : "Location"}: {groupName}
                  </td>
                </tr>
                {groupRows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="sticky left-0 z-10 bg-white px-3 py-2">
                      <div className="font-medium text-slate-900">{row.sku}</div>
                      <div className="text-xs text-slate-500">{row.name}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{row.locationName}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {row.onHand}
                      <span className="text-xs text-slate-400"> / min {row.minLevel}</span>
                    </td>
                    {columns.map((col) => {
                      const blocked = vendorBlocked(row.vendorName, col.date);
                      const key = cellKey(row.id, col.date);
                      return (
                        <td key={key} className="px-2 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            disabled={blocked}
                            value={qty[key] ?? ""}
                            placeholder={blocked ? "—" : "0"}
                            onChange={(e) =>
                              setQty((prev) => ({
                                ...prev,
                                [key]: Number(e.target.value) || 0,
                              }))
                            }
                            onBlur={(e) => {
                              if (blocked) return;
                              const value = Number(e.target.value) || 0;
                              persistCell(row.id, col.date, value);
                            }}
                            className={`min-h-11 w-16 rounded-md border px-2 text-center touch-manipulation ${
                              blocked
                                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                : "border-slate-300 bg-white"
                            }`}
                            aria-label={`Order qty for ${row.sku} on ${col.date}`}
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
      </div>
    </div>
  );
}
