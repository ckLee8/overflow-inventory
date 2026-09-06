"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  receiveAgainstPo,
  updatePoLineFulfillmentStatus,
} from "@/lib/actions/receiving";
import type { InboundLineBadge } from "@/lib/data";

type Props = {
  /** Primary open PO line for this SKU × location (prefer SHIPPED over ORDERED). */
  primary: InboundLineBadge | null;
  /** Count of additional open lines beyond primary (shown as +N). */
  extraCount: number;
  canReceive: boolean;
  source: "db" | "mock";
};

function fulfillmentTone(status: string) {
  if (status === "RECEIVED") return "bg-emerald-50 text-emerald-800";
  if (status === "SHIPPED") return "bg-sky-50 text-sky-800";
  return "bg-slate-100 text-slate-700";
}

function fulfillmentLabel(status: string) {
  if (status === "SHIPPED") return "Shipped";
  if (status === "RECEIVED") return "Received";
  if (status === "ORDERED") return "Ordered";
  return status;
}

/**
 * In-row inbound + receive + mark-ship controls for the unified Inventory table.
 * One primary open PO line per SKU×location (SHIPPED preferred); extras as +N.
 */
export function InventoryRowActions({
  primary,
  extraCount,
  canReceive,
  source,
}: Props) {
  const [qty, setQty] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!primary || primary.remaining <= 0) {
    return (
      <>
        <td className="px-3 py-3 text-slate-400">—</td>
        <td className="px-3 py-3 text-slate-400">—</td>
        <td className="px-3 py-3 text-slate-400">—</td>
      </>
    );
  }

  const remaining = primary.remaining;
  const isOrdered = primary.fulfillmentStatus === "ORDERED";
  const receiveDisabled =
    !canReceive || remaining <= 0 || pending || source !== "db";
  const markShipDisabled =
    !canReceive || !isOrdered || pending || source !== "db";

  const receive = () => {
    setMessage(null);
    setError(null);

    if (!canReceive) {
      setError("STAFF cannot receive — ask a manager or admin.");
      return;
    }
    if (source !== "db") {
      setError("Mock mode — receiving requires DATABASE_URL.");
      return;
    }

    const n = Math.max(0, Math.floor(Number(qty) || 0));
    if (n <= 0) {
      setError("Enter a receive qty greater than 0.");
      return;
    }
    if (n > remaining) {
      setError(`Only ${remaining} remaining.`);
      return;
    }

    startTransition(async () => {
      const result = await receiveAgainstPo({
        purchaseOrderId: primary.poId,
        lines: [{ lineId: primary.lineId, qty: n }],
      });
      if (result.ok) {
        setMessage(`+${result.receivedTotal}`);
        setQty("");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const markShipped = () => {
    setMessage(null);
    setError(null);

    if (!canReceive) {
      setError("STAFF cannot mark shipped — ask a manager or admin.");
      return;
    }
    if (source !== "db") {
      setError("Mock mode — status updates require DATABASE_URL.");
      return;
    }

    startTransition(async () => {
      const result = await updatePoLineFulfillmentStatus({
        lineId: primary.lineId,
        fulfillmentStatus: "SHIPPED",
      });
      if (result.ok) {
        setMessage("Shipped");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <>
      {/* Inbound */}
      <td className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-1">
          <span
            title={`PO ${primary.poId}: ${primary.receivedQty}/${primary.quantity} received, ${remaining} remaining`}
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${fulfillmentTone(primary.fulfillmentStatus)}`}
          >
            {fulfillmentLabel(primary.fulfillmentStatus)}
            <span className="ml-1 font-normal opacity-80">{remaining} left</span>
          </span>
          {extraCount > 0 ? (
            <span
              className="text-xs text-slate-500"
              title={`${extraCount} more open PO line(s) for this SKU × location`}
            >
              +{extraCount}
            </span>
          ) : null}
        </div>
      </td>

      {/* Receive */}
      <td className="px-3 py-3">
        {canReceive ? (
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor={`recv-${primary.lineId}`}>
              Receive qty ({remaining} remaining)
            </label>
            <input
              id={`recv-${primary.lineId}`}
              type="number"
              min={0}
              max={remaining}
              inputMode="numeric"
              value={qty}
              disabled={receiveDisabled}
              placeholder="0"
              onChange={(e) => setQty(e.target.value)}
              className="min-h-11 w-20 rounded-md border border-slate-300 bg-white px-2 text-center touch-manipulation disabled:bg-slate-100 disabled:text-slate-400"
            />
            <button
              type="button"
              onClick={receive}
              disabled={receiveDisabled}
              className="min-h-11 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white touch-manipulation hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {pending ? "…" : "Receive"}
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-500">View only</span>
        )}
        {message ? <p className="mt-1 text-[10px] text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-1 text-[10px] text-red-700">{error}</p> : null}
      </td>

      {/* Actions — Mark ship when ORDERED */}
      <td className="px-3 py-3">
        {isOrdered ? (
          canReceive ? (
            <button
              type="button"
              disabled={markShipDisabled}
              onClick={markShipped}
              className="min-h-11 rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-900 touch-manipulation hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mark ship
            </button>
          ) : (
            <span className="text-xs text-slate-500">View only</span>
          )
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
    </>
  );
}
