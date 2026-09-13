"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { SIMULATED_TODAY_KEY } from "@/lib/clock";
import { hasDatabase } from "@/lib/db";
import { isYmd, realTodayDateString } from "@/lib/timezone";

export type ClockActionResult = { ok: true; today: string } | { ok: false; error: string };

function revalidateClock() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/clock");
  revalidatePath("/inventory");
  revalidatePath("/ordering");
  revalidatePath("/approvals");
  revalidatePath("/reports");
}

/**
 * ADMIN only. `date: null` clears the override (back to wall-clock today).
 * Setting the real calendar date also clears — no point storing a no-op.
 */
export async function setSimulatedToday(input: {
  date: string | null;
}): Promise<ClockActionResult> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { ok: false, error: "Forbidden: admin only" };
  }

  if (!hasDatabase()) {
    return { ok: false, error: "DATABASE_URL not set — test clock needs Postgres." };
  }

  const realToday = realTodayDateString();
  const raw = input.date == null ? "" : String(input.date).trim();
  const shouldClear = raw === "" || raw === realToday;

  if (!shouldClear && !isYmd(raw)) {
    return { ok: false, error: "Date must be YYYY-MM-DD" };
  }

  try {
    const { prisma } = await import("@/lib/prisma");

    if (shouldClear) {
      await prisma.appSetting.deleteMany({ where: { key: SIMULATED_TODAY_KEY } });
      revalidateClock();
      return { ok: true, today: realToday };
    }

    await prisma.appSetting.upsert({
      where: { key: SIMULATED_TODAY_KEY },
      create: {
        key: SIMULATED_TODAY_KEY,
        value: raw,
        updatedBy: session.user.id,
      },
      update: {
        value: raw,
        updatedBy: session.user.id,
      },
    });

    revalidateClock();
    return { ok: true, today: raw };
  } catch (err) {
    console.error("setSimulatedToday failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Update failed" };
  }
}

export async function clearSimulatedToday(): Promise<ClockActionResult> {
  return setSimulatedToday({ date: null });
}
