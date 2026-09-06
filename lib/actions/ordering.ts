"use server";

import { revalidatePath } from "next/cache";
import { hasDatabase } from "@/lib/db";

export type UpdateCellResult =
  | { ok: true; quantity: number }
  | { ok: false; error: string };

/**
 * Upsert a weekly order plan cell quantity.
 * Row id format from the grid: `${productId}:${storeLocationId}`.
 */
export async function updateOrderCell(input: {
  planId: string;
  rowId: string;
  orderDate: string;
  quantity: number;
}): Promise<UpdateCellResult> {
  if (!hasDatabase()) {
    return { ok: false, error: "DATABASE_URL not set — cell changes are local-only in mock mode." };
  }

  const qty = Math.max(0, Math.floor(Number(input.quantity) || 0));
  const [productId, storeLocationId] = input.rowId.split(":");
  if (!productId || !storeLocationId) {
    return { ok: false, error: "Invalid row id" };
  }

  const orderDate = new Date(`${input.orderDate}T00:00:00.000Z`);
  if (Number.isNaN(orderDate.getTime())) {
    return { ok: false, error: "Invalid order date" };
  }

  try {
    const { prisma } = await import("@/lib/prisma");

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { vendor: true },
    });
    if (!product) return { ok: false, error: "Product not found" };

    if (product.vendor) {
      const day = orderDate.getUTCDay();
      if (!product.vendor.orderDaysOfWeek.includes(day)) {
        return { ok: false, error: "Vendor is closed on that day" };
      }
    }

    if (qty === 0) {
      await prisma.weeklyOrderPlanCell.deleteMany({
        where: {
          planId: input.planId,
          productId,
          storeLocationId,
          orderDate,
        },
      });
    } else {
      await prisma.weeklyOrderPlanCell.upsert({
        where: {
          planId_productId_storeLocationId_orderDate: {
            planId: input.planId,
            productId,
            storeLocationId,
            orderDate,
          },
        },
        create: {
          planId: input.planId,
          productId,
          storeLocationId,
          orderDate,
          quantity: qty,
        },
        update: { quantity: qty },
      });
    }

    revalidatePath("/ordering");
    revalidatePath("/approvals");
    revalidatePath("/reports");
    return { ok: true, quantity: qty };
  } catch (err) {
    console.error("updateOrderCell failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Update failed" };
  }
}
