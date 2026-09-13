import { cache } from "react";
import { hasDatabase } from "@/lib/db";
import { APP_TIMEZONE, isYmd, realTodayDateString } from "@/lib/timezone";

export const SIMULATED_TODAY_KEY = "simulated_today";

export type BusinessClock = {
  /** Effective YYYY-MM-DD used by the weekly grid, on-hand copy, and edit locks. */
  today: string;
  realToday: string;
  simulated: boolean;
  timezone: string;
};

export const getBusinessClock = cache(async (): Promise<BusinessClock> => {
  const realToday = realTodayDateString();
  const fallback: BusinessClock = {
    today: realToday,
    realToday,
    simulated: false,
    timezone: APP_TIMEZONE,
  };

  if (!hasDatabase()) return fallback;

  try {
    const { prisma } = await import("@/lib/prisma");
    const row = await prisma.appSetting.findUnique({
      where: { key: SIMULATED_TODAY_KEY },
    });
    const value = row?.value?.trim() ?? "";
    if (!isYmd(value)) return fallback;
    return {
      today: value,
      realToday,
      simulated: value !== realToday,
      timezone: APP_TIMEZONE,
    };
  } catch (err) {
    console.error("getBusinessClock failed:", err);
    return fallback;
  }
});

export async function getBusinessToday(): Promise<string> {
  return (await getBusinessClock()).today;
}

export async function isBusinessToday(date: string): Promise<boolean> {
  return date === (await getBusinessToday());
}
