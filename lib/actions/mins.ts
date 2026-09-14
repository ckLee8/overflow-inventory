"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { hasDatabase } from "@/lib/db";

export type SaveDailyMinsResult = { ok: true } | { ok: false; error: string };

function revalidateMins() {
  revalidatePath("/admin/minimums");
  revalidatePath("/inventory");
  revalidatePath("/ordering");
  revalidatePath("/reports");
}

/**
 * ADMIN only. Upsert weekday minimums for one SKU × location.
 * `days` is 0=Sun … 6=Sat. Days omitted are left unchanged.
 */
export async function saveDailyMins(input: {
  productId: string;
  storeLocationId: string;
  days: { dayOfWeek: number; minLevel: number }[];
}): Promise<SaveDailyMinsResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Forbidden: admin only" };
  }

  if (!hasDatabase()) {
    return { ok: false, error: "DATABASE_URL not set — daily mins need Postgres." };
  }

  const productId = String(input.productId ?? "").trim();
  const storeLocationId = String(input.storeLocationId ?? "").trim();
  if (!productId || !storeLocationId) {
    return { ok: false, error: "Missing product or location" };
  }

  const days = (input.days ?? [])
    .map((d) => ({
      dayOfWeek: Number(d.dayOfWeek),
      minLevel: Math.max(0, Math.floor(Number(d.minLevel) || 0)),
    }))
    .filter((d) => Number.isInteger(d.dayOfWeek) && d.dayOfWeek >= 0 && d.dayOfWeek <= 6);

  if (days.length === 0) {
    return { ok: false, error: "No weekday mins to save" };
  }

  try {
    const { prisma } = await import("@/lib/prisma");

    const level = await prisma.stockLevel.findUnique({
      where: {
        productId_storeLocationId: { productId, storeLocationId },
      },
    });
    if (!level) {
      return { ok: false, error: "Stock level not found for that SKU × location" };
    }

    await prisma.$transaction(
      days.map((d) =>
        prisma.stockMinSchedule.upsert({
          where: {
            productId_storeLocationId_dayOfWeek: {
              productId,
              storeLocationId,
              dayOfWeek: d.dayOfWeek,
            },
          },
          create: {
            productId,
            storeLocationId,
            dayOfWeek: d.dayOfWeek,
            minLevel: d.minLevel,
          },
          update: { minLevel: d.minLevel },
        }),
      ),
    );

    revalidateMins();
    return { ok: true };
  } catch (err) {
    console.error("saveDailyMins failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Save failed" };
  }
}
