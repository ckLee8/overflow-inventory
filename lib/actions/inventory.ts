"use server";

import { revalidatePath } from "next/cache";
import { requireManagerOrAdmin } from "@/lib/auth";
import { hasDatabase } from "@/lib/db";
import { APP_TIMEZONE, todayDateString } from "@/lib/timezone";

export type UpdateOnHandResult =
  | { ok: true; onHand: number; delta: number }
  | { ok: false; error: string };

/**
 * Set StockLevel.onHand to a new count (today’s count in APP_TIMEZONE).
 * Writes a StockMovement of type ADJUST with the delta.
 * ADMIN and MANAGER only.
 */
export async function updateStockOnHand(input: {
  stockLevelId: string;
  onHand: number;
}): Promise<UpdateOnHandResult> {
  try {
    await requireManagerOrAdmin();
  } catch {
    return { ok: false, error: "Forbidden: manager or admin only" };
  }

  if (!hasDatabase()) {
    return {
      ok: false,
      error: "DATABASE_URL not set — on-hand edits are local-only in mock mode.",
    };
  }

  const onHand = Math.max(0, Math.floor(Number(input.onHand) || 0));
  if (!input.stockLevelId) {
    return { ok: false, error: "Missing stock level id" };
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const { StockMovementType } = await import("@prisma/client");

    const level = await prisma.stockLevel.findUnique({
      where: { id: input.stockLevelId },
    });
    if (!level) return { ok: false, error: "Stock level not found" };

    const delta = onHand - level.onHand;
    if (delta === 0) {
      return { ok: true, onHand, delta: 0 };
    }

    const today = todayDateString();
    await prisma.$transaction([
      prisma.stockLevel.update({
        where: { id: level.id },
        data: { onHand },
      }),
      prisma.stockMovement.create({
        data: {
          productId: level.productId,
          storeLocationId: level.storeLocationId,
          type: StockMovementType.ADJUST,
          quantity: delta,
          note: `Manual on-hand count for ${today} (${APP_TIMEZONE})`,
        },
      }),
    ]);

    revalidatePath("/inventory");
    revalidatePath("/ordering");
    revalidatePath("/reports");
    return { ok: true, onHand, delta };
  } catch (err) {
    console.error("updateStockOnHand failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Update failed" };
  }
}
