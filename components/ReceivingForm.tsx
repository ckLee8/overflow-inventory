"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  receiveAgainstPo,
  updatePoLineFulfillmentStatus,
} from "@/lib/actions/receiving";
import type { ReceivablePoView } from "@/lib/data";

type Props = {
  po: ReceivablePoView;
  canReceive: boolean;
};

function fulfillmentTone(status: string) {
  if (status === "RECEIVED") return "bg-emerald-50 text-emerald-800";
  if (status === "SHIPPED") return "bg-sky-50 text-sky-800";
  return "bg-slate-100 text-slate-700";
}

export function ReceivingForm({ po, canReceive }: Props) {
  const [qtys, setQtys] = useState<Record<string, string>>(() =>
    Object.fromEntries(po.lines.map((l) => [l.id, ""])),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const statusTone =
    po.status === "PARTIAL"
      ? "bg-sky-50 text-sky-800"
      : po.status === "SUBMITTED"
        ? "bg-indigo-50 text-indigo-800"
        : "bg-emerald-50 text-emerald-800";

  const hasPositiveQty = useMemo(
    () => Object.values(qtys).some((v) => Math.floor(Number(v) || 0) > 0),
    [qtys],
  );

  const submit = () => {
    setMessage(null);
    setError(null);

    if (!canReceive) {
      setError("STAFF cannot receive — ask a manager or admin.");
      return;
    }

    if (po.source !== "db") {
      setError("Mock mode — receiving requires DATABASE_URL.");
      return;
    }

    if (!po.storeLocationId) {
      setError(
        "This PO has no store location. Set a location on the PO before receiving.",
      );
      return;
    }

    const lines = po.lines
      .map((line) => ({
        lineId: line.id,
        qty: Math.max(0, Math.floor(Number(qtys[line.id]) || 0)),
      }))
      .filter((l) => l.qty > 0);

    if (lines.length === 0) {
      setError("Enter a receive qty greater than 0 on at least one line.");
      return;
    }

    for (const line of po.lines) {
      const qty = Math.floor(Number(qtys[line.id]) || 0);
      if (qty > line.remaining) {
        setError(
          `Cannot receive ${qty} for ${line.sku}: only ${line.remaining} remaining.`,
        );
        return;
      }
    }

    startTransition(async () => {
      const result = await receiveAgainstPo({
        purchaseOrderId: po.id,
        lines,
      });
      if (result.ok) {
        setMessage(
          `Received ${result.receivedTotal} unit(s). PO status → ${result.status}.`,
        );
        setQtys(Object.fromEntries(po.lines.map((l) => [l.id, ""])));
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const setLineStatus = (lineId: string, fulfillmentStatus: "ORDERED" | "SHIPPED") => {
    setMessage(null);
    setError(null);

    if (!canReceive) {
      setError("STAFF cannot update line status — ask a manager or admin.");
      return;
    }

    if (po.source !== "db") {
      setError("Mock mode — status updates require DATABASE_URL.");
      return;
    }

    startTransition(async () => {
      const result = await updatePoLineFulfillmentStatus({
        lineId,
        fulfillmentStatus,
      });
      if (result.ok) {
        setMessage(`Line status → ${result.fulfillmentStatus}.`);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">{po.vendorName}</h2>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone}`}
            >
              {po.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Order date {po.orderDate}
            {" · "}
            Location: {po.storeLocationName ?? "— (required for receive)"}
            {po.notes ? ` · ${po.notes}` : null}
          </p>
          <p className="mt-0.5 font-mono text-xs text-slate-400">{po.id}</p>
        </div>
      </div>

      {!po.storeLocationId ? (
        <div className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This PO has no store location. Receiving is blocked until a location is set.
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-3 py-3 font-semibold">SKU</th>
              <th className="px-3 py-3 font-semibold">Product</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Ordered</th>
              <th className="px-3 py-3 font-semibold">Received</th>
              <th className="px-3 py-3 font-semibold">Remaining</th>
              <th className="px-3 py-3 font-semibold">Receive qty</th>
              <th className="px-3 py-3 font-semibold">Mark</th>
            </tr>
          </thead>
          <tbody>
            {po.lines.map((line) => {
              const remaining = line.remaining;
              const disabled =
                !canReceive || remaining <= 0 || !po.storeLocationId || pending;
              const canMark =
                canReceive &&
                remaining > 0 &&
                line.fulfillmentStatus !== "RECEIVED" &&
                !pending;
              return (
                <tr key={line.id} className="border-t border-slate-100">
                  <td className="px-3 py-3 font-medium">{line.sku}</td>
                  <td className="px-3 py-3">{line.productName}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${fulfillmentTone(line.fulfillmentStatus)}`}
                    >
                      {line.fulfillmentStatus}
                    </span>
                  </td>
                  <td className="px-3 py-3">{line.quantity}</td>
                  <td className="px-3 py-3">{line.receivedQty}</td>
                  <td className="px-3 py-3">{remaining}</td>
                  <td className="px-3 py-3">
                    <label className="sr-only" htmlFor={`recv-${line.id}`}>
                      Receive qty for {line.sku}
                    </label>
                    <input
                      id={`recv-${line.id}`}
                      type="number"
                      min={0}
                      max={remaining}
                      inputMode="numeric"
                      value={qtys[line.id] ?? ""}
                      disabled={disabled}
                      placeholder={remaining === 0 ? "Done" : "0"}
                      onChange={(e) =>
                        setQtys((prev) => ({ ...prev, [line.id]: e.target.value }))
                      }
                      className="min-h-11 w-24 rounded-md border border-slate-300 bg-white px-2 text-center touch-manipulation disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        disabled={!canMark || line.fulfillmentStatus === "SHIPPED"}
                        onClick={() => setLineStatus(line.id, "SHIPPED")}
                        className="min-h-9 rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-900 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Shipped
                      </button>
                      <button
                        type="button"
                        disabled={!canMark || line.fulfillmentStatus === "ORDERED"}
                        onClick={() => setLineStatus(line.id, "ORDERED")}
                        className="min-h-9 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Ordered
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-4 py-3">
        {canReceive ? (
          <button
            type="button"
            onClick={submit}
            disabled={pending || !hasPositiveQty || !po.storeLocationId}
            className="min-h-11 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white touch-manipulation hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {pending ? "Receiving…" : "Receive selected"}
          </button>
        ) : (
          <p className="text-sm text-amber-800">
            View only — STAFF cannot receive or mark shipped. Ask a manager or admin.
          </p>
        )}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>
    </section>
  );
}
