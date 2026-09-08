"use server";

import { revalidatePath } from "next/cache";
import { requireManagerOrAdmin } from "@/lib/auth";
import { hasDatabase } from "@/lib/db";

export type SetLineMarkedReceivedResult =
  | {
      ok: true;
      lineId: string;
      markedReceived: boolean;
      purchaseOrderId: string;
      status: string;
    }
  | { ok: false; error: string };

export type UpdateLineFulfillmentResult =
  | { ok: true; lineId: string; fulfillmentStatus: string }
  | { ok: false; error: string };

/** @deprecated Stock-ledger receive removed — use setLineMarkedReceived. */
export type ReceiveAgainstPoResult =
  | {
      ok: true;
      purchaseOrderId: string;
      status: string;
      receivedTotal: number;
    }
  | { ok: false; error: string };

/** @deprecated Stock-ledger reverse removed — use setLineMarkedReceived. */
export type ReverseReceiveResult =
  | {
      ok: true;
      purchaseOrderId: string;
      lineId: string;
      status: string;
      reversedQty: number;
    }
  | { ok: false; error: string };

function revalidateReceivingPaths() {
  revalidatePath("/receiving");
  revalidatePath("/inventory");
  revalidatePath("/approvals");
  revalidatePath("/ordering");
  revalidatePath("/reports");
}

/**
 * Two-way Receive checkbox: mark an inbound PO line as actually received
 * (true) or not (false). Does **not** mutate StockLevel.onHand / onOrder,
 * receivedQty, or create stock movements. Delivery-issue flag is independent.
 *
 * Optionally updates PO header: all lines marked → RECEIVED; some → PARTIAL;
 * none after prior PARTIAL/RECEIVED → SUBMITTED (if any SHIPPED) else APPROVED.
 *
 * ADMIN / MANAGER only.
 */
export async function setLineMarkedReceived(
  lineId: string,
  markedReceived: boolean,
): Promise<SetLineMarkedReceivedResult> {
  try {
    await requireManagerOrAdmin();
  } catch {
    return { ok: false, error: "Forbidden: manager or admin only" };
  }

  if (!hasDatabase()) {
    return {
      ok: false,
      error: "DATABASE_URL not set — marking received requires Postgres.",
    };
  }

  const id = String(lineId ?? "");
  if (!id) {
    return { ok: false, error: "Missing line id" };
  }

  const nextMarked = Boolean(markedReceived);

  try {
    const { prisma } = await import("@/lib/prisma");
    const { PurchaseOrderStatus, PoLineFulfillmentStatus } = await import(
      "@prisma/client"
    );

    const result = await prisma.$transaction(async (tx) => {
      const line = await tx.purchaseOrderLine.findUnique({
        where: { id },
        include: { purchaseOrder: { include: { lines: true } } },
      });

      if (!line) {
        throw new Error("Purchase order line not found");
      }

      const po = line.purchaseOrder;
      const allowed: string[] = [
        PurchaseOrderStatus.APPROVED,
        PurchaseOrderStatus.SUBMITTED,
        PurchaseOrderStatus.PARTIAL,
        PurchaseOrderStatus.RECEIVED,
      ];
      if (!allowed.includes(po.status)) {
        throw new Error(
          `Cannot mark received on PO in status ${po.status} (need APPROVED, SUBMITTED, PARTIAL, or RECEIVED)`,
        );
      }

      await tx.purchaseOrderLine.update({
        where: { id: line.id },
        data: { markedReceived: nextMarked },
      });

      const refreshed = await tx.purchaseOrderLine.findMany({
        where: { purchaseOrderId: po.id },
      });

      const allMarked = refreshed.every(
        (l) => Boolean((l as { markedReceived?: boolean }).markedReceived),
      );
      const anyMarked = refreshed.some((l) =>
        Boolean((l as { markedReceived?: boolean }).markedReceived),
      );

      let nextStatus = po.status;
      if (allMarked && refreshed.length > 0) {
        nextStatus = PurchaseOrderStatus.RECEIVED;
      } else if (anyMarked) {
        nextStatus = PurchaseOrderStatus.PARTIAL;
      } else if (
        po.status === PurchaseOrderStatus.RECEIVED ||
        po.status === PurchaseOrderStatus.PARTIAL
      ) {
        const anyShipped = refreshed.some(
          (l) => l.fulfillmentStatus === PoLineFulfillmentStatus.SHIPPED,
        );
        nextStatus = anyShipped
          ? PurchaseOrderStatus.SUBMITTED
          : PurchaseOrderStatus.APPROVED;
      }

      if (nextStatus !== po.status) {
        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: { status: nextStatus },
        });
      }

      return {
        lineId: line.id,
        markedReceived: nextMarked,
        purchaseOrderId: po.id,
        status: nextStatus,
      };
    });

    revalidateReceivingPaths();
    return { ok: true, ...result };
  } catch (err) {
    console.error("setLineMarkedReceived failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}

/**
 * Manually set a PO line fulfillment status to ORDERED or SHIPPED
 * (without marking received). Lines with markedReceived stay markable via
 * the Inventory checkbox independently. ADMIN / MANAGER only.
 */
export async function updatePoLineFulfillmentStatus(input: {
  lineId: string;
  fulfillmentStatus: "ORDERED" | "SHIPPED";
}): Promise<UpdateLineFulfillmentResult> {
  try {
    await requireManagerOrAdmin();
  } catch {
    return { ok: false, error: "Forbidden: manager or admin only" };
  }

  if (!hasDatabase()) {
    return {
      ok: false,
      error: "DATABASE_URL not set — fulfillment status requires Postgres.",
    };
  }

  const lineId = String(input.lineId ?? "");
  if (!lineId) {
    return { ok: false, error: "Missing line id" };
  }

  const wanted = input.fulfillmentStatus;
  if (wanted !== "ORDERED" && wanted !== "SHIPPED") {
    return { ok: false, error: "Status must be ORDERED or SHIPPED" };
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const { PoLineFulfillmentStatus, PurchaseOrderStatus } = await import(
      "@prisma/client"
    );

    const line = await prisma.purchaseOrderLine.findUnique({
      where: { id: lineId },
      include: { purchaseOrder: true },
    });
    if (!line) {
      return { ok: false, error: "Purchase order line not found" };
    }

    if (Boolean((line as { markedReceived?: boolean }).markedReceived)) {
      return {
        ok: false,
        error:
          "Line is marked received — uncheck Receive before changing ship status",
      };
    }

    const openStatuses: string[] = [
      PurchaseOrderStatus.APPROVED,
      PurchaseOrderStatus.SUBMITTED,
      PurchaseOrderStatus.PARTIAL,
      PurchaseOrderStatus.DRAFT,
    ];
    if (!openStatuses.includes(line.purchaseOrder.status)) {
      return {
        ok: false,
        error: `Cannot update line status on PO in status ${line.purchaseOrder.status}`,
      };
    }

    const next =
      wanted === "SHIPPED"
        ? PoLineFulfillmentStatus.SHIPPED
        : PoLineFulfillmentStatus.ORDERED;

    const updated = await prisma.purchaseOrderLine.update({
      where: { id: line.id },
      data: { fulfillmentStatus: next },
    });

    revalidateReceivingPaths();

    return {
      ok: true,
      lineId: updated.id,
      fulfillmentStatus: updated.fulfillmentStatus,
    };
  } catch (err) {
    console.error("updatePoLineFulfillmentStatus failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}

/**
 * @deprecated No stock ledger. Forwards to setLineMarkedReceived(lineId, true)
 * for the first requested line. Does not change onHand/onOrder/receivedQty.
 */
export async function receiveAgainstPo(input: {
  purchaseOrderId: string;
  lines: { lineId: string; qty: number }[];
}): Promise<ReceiveAgainstPoResult> {
  const first = (input.lines ?? []).find((l) => l?.lineId);
  if (!first?.lineId) {
    return { ok: false, error: "Missing line id" };
  }
  const result = await setLineMarkedReceived(first.lineId, true);
  if (!result.ok) return result;
  return {
    ok: true,
    purchaseOrderId: result.purchaseOrderId,
    status: result.status,
    receivedTotal: 0,
  };
}

/**
 * @deprecated No stock ledger. Forwards to setLineMarkedReceived(lineId, false).
 */
export async function reverseReceiveForLine(input: {
  lineId: string;
}): Promise<ReverseReceiveResult> {
  const result = await setLineMarkedReceived(String(input.lineId ?? ""), false);
  if (!result.ok) return result;
  return {
    ok: true,
    purchaseOrderId: result.purchaseOrderId,
    lineId: result.lineId,
    status: result.status,
    reversedQty: 0,
  };
}
