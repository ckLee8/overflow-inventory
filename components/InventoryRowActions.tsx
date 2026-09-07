"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { receiveAgainstPo } from "@/lib/actions/receiving";
import { setPoLineDeliveryIssue } from "@/lib/actions/deliveryIssue";
import type { InboundLineBadge } from "@/lib/data";

type Props = {
  /** Primary PO line for this SKU × location (open preferred; else fully received). */
  primary: InboundLineBadge | null;
  canReceive: boolean;
  source: "db" | "mock";
};

function WarningTriangle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * In-row receive: one-way checkbox (receive remaining) + delivery-issue flag.
 * Unchecking does not reverse stock. ADMIN/MANAGER only; STAFF view-only.
 */
export function InventoryRowActions({ primary, canReceive, source }: Props) {
  const [justReceived, setJustReceived] = useState(false);
  const [flagged, setFlagged] = useState(Boolean(primary?.deliveryIssue));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setFlagged(Boolean(primary?.deliveryIssue));
  }, [primary?.lineId, primary?.deliveryIssue]);

  if (!primary) {
    return <td className="px-3 py-3 text-slate-400">—</td>;
  }

  const remaining = primary.remaining;
  const fullyReceived =
    justReceived || remaining <= 0 || primary.fulfillmentStatus === "RECEIVED";
  const hasOpenInbound = remaining > 0 && !justReceived;
  const dbOk = source === "db";

  const receiveDisabled =
    !canReceive || fullyReceived || !hasOpenInbound || pending || !dbOk;
  const flagDisabled = !canReceive || pending || !dbOk;

  const receiveAll = () => {
    setMessage(null);
    setError(null);

    if (!canReceive) {
      setError("STAFF cannot receive — ask a manager or admin.");
      return;
    }
    if (!dbOk) {
      setError("Mock mode — receiving requires DATABASE_URL.");
      return;
    }
    if (remaining <= 0) return;

    startTransition(async () => {
      const result = await receiveAgainstPo({
        purchaseOrderId: primary.poId,
        lines: [{ lineId: primary.lineId, qty: remaining }],
      });
      if (result.ok) {
        setMessage(`+${result.receivedTotal}`);
        setJustReceived(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const toggleFlag = () => {
    setMessage(null);
    setError(null);

    if (!canReceive) {
      setError("STAFF cannot flag delivery issues.");
      return;
    }
    if (!dbOk) {
      setError("Mock mode — flagging requires DATABASE_URL.");
      return;
    }

    const next = !flagged;
    startTransition(async () => {
      const result = await setPoLineDeliveryIssue({
        lineId: primary.lineId,
        deliveryIssue: next,
      });
      if (result.ok) {
        setFlagged(result.deliveryIssue);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <td className="px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {hasOpenInbound || fullyReceived ? (
          <label
            className={`inline-flex min-h-11 items-center gap-2 ${
              receiveDisabled && !fullyReceived ? "opacity-60" : ""
            }`}
            title={
              fullyReceived
                ? "Fully received"
                : canReceive
                  ? `Receive remaining (${remaining})`
                  : "View only"
            }
          >
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-slate-300 text-brand-600 touch-manipulation focus:ring-brand-500 disabled:cursor-not-allowed"
              checked={fullyReceived}
              disabled={receiveDisabled}
              onChange={(e) => {
                // One-way: only checking receives; uncheck never reverses stock.
                if (e.target.checked && hasOpenInbound) {
                  receiveAll();
                }
              }}
              aria-label={
                fullyReceived
                  ? "Received"
                  : `Receive remaining ${remaining}`
              }
            />
            <span className="sr-only">
              {fullyReceived ? "Received" : `Receive ${remaining} remaining`}
            </span>
          </label>
        ) : (
          <span className="text-slate-400">—</span>
        )}

        <button
          type="button"
          title="Flag delivery issue"
          aria-label="Flag delivery issue"
          aria-pressed={flagged}
          disabled={flagDisabled}
          onClick={toggleFlag}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg touch-manipulation transition disabled:cursor-not-allowed disabled:opacity-50 ${
            flagged
              ? "text-amber-600 hover:bg-amber-50 hover:text-amber-700"
              : "text-slate-400 hover:bg-slate-100 hover:text-slate-500"
          }`}
        >
          <WarningTriangle className="h-5 w-5" />
        </button>
      </div>
      {message ? (
        <p className="mt-1 text-[10px] text-emerald-700">{message}</p>
      ) : null}
      {error ? <p className="mt-1 text-[10px] text-red-700">{error}</p> : null}
    </td>
  );
}
