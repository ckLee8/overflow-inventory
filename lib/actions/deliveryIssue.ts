"use server";

import { revalidatePath } from "next/cache";
import { requireManagerOrAdmin } from "@/lib/auth";
import { getBusinessToday } from "@/lib/clock";
import { hasDatabase } from "@/lib/db";
import { isReceiveSettled, ymdFromUnknown } from "@/lib/inbound";

export type SetDeliveryIssueResult =
  | {
      ok: true;
      lineId: string;
      deliveryIssue: boolean;
      deliveryIssueNote: string | null;
    }
  | { ok: false; error: string };

function revalidateReceivingPaths() {
  revalidatePath("/receiving");
  revalidatePath("/inventory");
  revalidatePath("/approvals");
  revalidatePath("/ordering");
  revalidatePath("/reports");
}

export type SetRowDeliveryIssueResult =
  | { ok: true; deliveryIssue: boolean }
  | { ok: false; error: string };

/**
 * Flag a delivery issue on prior-day orders for this SKU × location.
 * ADMIN / MANAGER only.
 */
export async function setRowDeliveryIssue(input: {
  productId: string;
  storeLocationId: string;
  deliveryIssue: boolean;
}): Promise<SetRowDeliveryIssueResult> {
  try {
    await requireManagerOrAdmin();
  } catch {
    return { ok: false, error: "Forbidden: manager or admin only" };
  }

  if (!hasDatabase()) {
    return { ok: false, error: "DATABASE_URL not set — flagging requires Postgres." };
  }

  const productId = String(input.productId ?? "").trim();
  const storeLocationId = String(input.storeLocationId ?? "").trim();
  if (!productId || !storeLocationId) {
    return { ok: false, error: "Missing product or location" };
  }

  const deliveryIssue = Boolean(input.deliveryIssue);

  try {
    const { prisma } = await import("@/lib/prisma");
    const today = await getBusinessToday();
    const todayStart = new Date(`${today}T00:00:00.000Z`);

    const cells = await prisma.weeklyOrderPlanCell.findMany({
      where: {
        productId,
        storeLocationId,
        quantity: { gt: 0 },
        orderDate: { lt: todayStart },
      },
    });

    const ids = cells
      .filter((cell) => !isReceiveSettled({ markedReceivedOn: ymdFromUnknown(cell.markedReceivedOn) }, today))
      .map((cell) => cell.id);

    if (ids.length === 0) {
      return { ok: false, error: "No prior-day orders to flag." };
    }

    await prisma.weeklyOrderPlanCell.updateMany({
      where: { id: { in: ids } },
      data: { deliveryIssue },
    });

    revalidateReceivingPaths();
    return { ok: true, deliveryIssue };
  } catch (err) {
    console.error("setRowDeliveryIssue failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Update failed" };
  }
}

/**
 * Toggle / set a delivery-issue flag on a PO line (MVP: boolean + optional note).
 * Does not reverse stock. ADMIN / MANAGER only; STAFF view-only in UI.
 */
export async function setPoLineDeliveryIssue(input: {
  lineId: string;
  deliveryIssue: boolean;
  deliveryIssueNote?: string | null;
}): Promise<SetDeliveryIssueResult> {
  try {
    await requireManagerOrAdmin();
  } catch {
    return { ok: false, error: "Forbidden: manager or admin only" };
  }

  if (!hasDatabase()) {
    return {
      ok: false,
      error: "DATABASE_URL not set — delivery issue requires Postgres.",
    };
  }

  const lineId = String(input.lineId ?? "");
  if (!lineId) {
    return { ok: false, error: "Missing line id" };
  }

  const deliveryIssue = Boolean(input.deliveryIssue);
  const noteRaw = input.deliveryIssueNote;
  const deliveryIssueNote =
    noteRaw == null || noteRaw === ""
      ? null
      : String(noteRaw).slice(0, 500);

  try {
    const { prisma } = await import("@/lib/prisma");

    const line = await prisma.purchaseOrderLine.findUnique({
      where: { id: lineId },
    });
    if (!line) {
      return { ok: false, error: "Purchase order line not found" };
    }

    const existingNote =
      (line as { deliveryIssueNote?: string | null }).deliveryIssueNote ?? null;

    const updated = await prisma.purchaseOrderLine.update({
      where: { id: line.id },
      data: {
        deliveryIssue,
        deliveryIssueNote: deliveryIssue
          ? (deliveryIssueNote ?? existingNote)
          : deliveryIssueNote,
      },
    });

    revalidateReceivingPaths();

    return {
      ok: true,
      lineId: updated.id,
      deliveryIssue: Boolean(
        (updated as { deliveryIssue?: boolean }).deliveryIssue,
      ),
      deliveryIssueNote:
        (updated as { deliveryIssueNote?: string | null }).deliveryIssueNote ??
        null,
    };
  } catch (err) {
    console.error("setPoLineDeliveryIssue failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}
