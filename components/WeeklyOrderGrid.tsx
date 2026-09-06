"use client";

import { Fragment, useMemo, useState } from "react";
import {
  getMockWeekColumns,
  groupOrderRows,
  mockOrderRows,
  mockVendors,
  type GroupBy,
} from "@/lib/mock-data";

export function WeeklyOrderGrid() {
  const columns = useMemo(() => getMockWeekColumns(), []);
  const [groupBy, setGroupBy] = useState<GroupBy>("vendor");
  const [qty, setQty] = useState<Record<string, number>>({});

  const groups = useMemo(() => groupOrderRows(mockOrderRows, groupBy), [groupBy]);

  const vendorBlocked = (vendorName: string, date: string) => {
    const vendor = mockVendors.find((v) => v.name === vendorName);
    if (!vendor) return false;
    const day = new Date(`${date}T00:00:00Z`).getUTCDay();
    return !vendor.orderDaysOfWeek.includes(day);
  };

  const cellKey = (rowId: string, date: string) => `${rowId}:${date}`;

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
          Placeholder grid with mock SKUs · grey cells = vendor closed that day
        </p>
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
            {groups.map(([groupName, rows]) => (
              <Fragment key={`g-${groupName}`}>
                <tr className="bg-brand-50">
                  <td
                    colSpan={3 + columns.length}
                    className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-900"
                  >
                    {groupBy === "vendor" ? "Vendor" : "Location"}: {groupName}
                  </td>
                </tr>
                {rows.map((row) => (
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
                            disabled={blocked}
                            value={qty[key] ?? ""}
                            placeholder={blocked ? "—" : "0"}
                            onChange={(e) =>
                              setQty((prev) => ({
                                ...prev,
                                [key]: Number(e.target.value) || 0,
                              }))
                            }
                            className={`min-h-11 w-16 rounded-md border px-2 text-center ${
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
