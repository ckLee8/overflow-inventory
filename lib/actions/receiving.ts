"use server";

import { revalidatePath } from "next/cache";
import { requireManagerOrAdmin } from "@/lib/auth";
import { hasDatabase } from "@/lib/db";

export type ReceiveLineInput = {
  lineId: string;
  qty: number;
};

export type ReceiveAgainstPoResult =
  | {
      ok: true;
      purchaseOrderId: string;
      status: string;
      receivedTotal: number;
    }
  | { ok: false; error: string };

/**
 * Receive quantities against an open PO (APPROVED | SUBMITTED | PARTIAL).
 * Partial shipments are allowed: only lines with qty > 0 are applied.
 *
 * Rule: PO.storeLocationId is required. Receiving without a location is rejected
 * so stock is always attributed to a concrete store location.
 *
 * ADMIN / MANAGER only; STAFF cannot receive.
 */
export async function receiveAgainstPo(input: {
  purchaseOrderId: string;
  lines: ReceiveLineInput[];
}): Promise<ReceiveAgainstPoResult> {
  try {
    await requireManagerOrAdmin();
  } catch {
    return { ok: false, error: "Forbidden: manager or admin only" };
  }

  if (!hasDatabase()) {
    return {
      ok: false,
      error: "DATABASE_URL not set — receiving requires Postgres.",
    };
  }

  if (!input.purchaseOrderId) {
    return { ok: false, error: "Missing purchase order id" };
  }

  const requested = (input.lines ?? [])
    .map((l) => ({
      lineId: String(l.lineId ?? ""),
      qty: Math.floor(Number(l.qty) || 0),
    }))
    .filter((l) => l.lineId && l.qty > 0);

  if (requested.length === 0) {
    return { ok: false, error: "Enter a receive qty greater than 0 on at least one line" };
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const { PurchaseOrderStatus, StockMovementType } = await import("@prisma/client");

    const result = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: input.purchaseOrderId },
        include: { lines: true },
      });

      if (!po) {
        throw new Error("Purchase order not found");
      }

      const openStatuses: string[] = [
        PurchaseOrderStatus.APPROVED,
        PurchaseOrderStatus.SUBMITTED,
        PurchaseOrderStatus.PARTIAL,
      ];
      if (!openStatuses.includes(po.status)) {
        throw new Error(
          `Cannot receive against PO in status ${po.status} (need APPROVED, SUBMITTED, or PARTIAL)`,
        );
      }

      if (!po.storeLocationId) {
        throw new Error(
          "PO has no store location. Set storeLocationId on the purchase order before receiving — stock must be attributed to a location.",
        );
      }

      const storeLocationId = po.storeLocationId;
      const lineById = new Map(po.lines.map((l) => [l.id, l]));
      let receivedTotal = 0;

      for (const req of requested) {
        const line = lineById.get(req.lineId);
        if (!line || line.purchaseOrderId !== po.id) {
          throw new Error(`Line ${req.lineId} does not belong to this PO`);
        }

        const remaining = line.quantity - line.receivedQty;
        if (req.qty > remaining) {
          throw new Error(
            `Cannot receive ${req.qty} on line ${req.lineId}: only ${remaining} remaining (ordered ${line.quantity}, already received ${line.receivedQty})`,
          );
        }

        await tx.purchaseOrderLine.update({
          where: { id: line.id },
          data: { receivedQty: line.receivedQty + req.qty },
        });

        const existing = await tx.stockLevel.findUnique({
          where: {
            productId_storeLocationId: {
              productId: line.productId,
              storeLocationId,
            },
          },
        });

        if (existing) {
          await tx.stockLevel.update({
            where: { id: existing.id },
            data: {
              onHand: existing.onHand + req.qty,
              onOrder: Math.max(0, existing.onOrder - req.qty),
            },
          });
        } else {
          await tx.stockLevel.create({
            data: {
              productId: line.productId,
              storeLocationId,
              onHand: req.qty,
              onOrder: 0,
            },
          });
        }

        await tx.stockMovement.create({
          data: {
            productId: line.productId,
            storeLocationId,
            type: StockMovementType.RECEIVE,
            quantity: req.qty,
            note: `Receive against PO ${po.id}`,
          },
        });

        // Keep local copy in sync for status calc
        line.receivedQty += req.qty;
        receivedTotal += req.qty;
      }

      const refreshed = await tx.purchaseOrderLine.findMany({
        where: { purchaseOrderId: po.id },
      });

      const allFullyReceived = refreshed.every((l) => l.receivedQty >= l.quantity);
      const anyReceived = refreshed.some((l) => l.receivedQty > 0);

      let nextStatus = po.status;
      if (allFullyReceived) {
        nextStatus = PurchaseOrderStatus.RECEIVED;
      } else if (anyReceived) {
        nextStatus = PurchaseOrderStatus.PARTIAL;
      }

      if (nextStatus !== po.status) {
        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: { status: nextStatus },
        });
      }

      return {
        purchaseOrderId: po.id,
        status: nextStatus,
        receivedTotal,
      };
    });

    revalidatePath("/receiving");
    revalidatePath("/inventory");
    revalidatePath("/approvals");
    revalidatePath("/ordering");
    revalidatePath("/reports");

    return { ok: true, ...result };
  } catch (err) {
    console.error("receiveAgainstPo failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Receive failed",
    };
  }
}
