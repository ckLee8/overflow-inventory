"use server";

import { revalidatePath } from "next/cache";
import { requireManagerOrAdmin } from "@/lib/auth";
import { hasDatabase } from "@/lib/db";

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
