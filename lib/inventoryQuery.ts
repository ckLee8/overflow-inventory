import { mockOrderRows } from "@/lib/mock-data";
import { getBusinessToday } from "@/lib/clock";
import { hasDatabase } from "@/lib/db";
import {
  expectedFromInbound,
  isInboundActive,
  isReceiveChecked,
  ymdFromUnknown,
  type InboundLineBadge,
} from "@/lib/inbound";
import { weekdayUtc } from "@/lib/timezone";

export type { InboundLineBadge } from "@/lib/inbound";
export {
  expectedFromInbound,
  isInboundActive,
  isReceiveChecked,
  isReceiveSettled,
  ymdFromUnknown,
} from "@/lib/inbound";

export type InventoryRow = {
  id: string;
  productId?: string;
  storeLocationId?: string;
  sku: string;
  name: string;
  locationName: string;
  vendorName: string;
  onHand: number;
  /** Raw StockLevel.onOrder (may still hold inbound after Receive). */
  onOrder: number;
  /** Expected receipts still open. Drops to 0 as soon as Receive is checked. */
  expected: number;
  minLevel: number;
  inboundLines?: InboundLineBadge[];
  source: "db" | "mock";
};

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

export async function getInventoryRows(): Promise<InventoryRow[]> {
  if (!hasDatabase()) {
    return mockOrderRows.map((r) => ({
      id: r.id,
      sku: r.sku,
      name: r.name,
      locationName: r.locationName,
      vendorName: r.vendorName,
      onHand: r.onHand,
      onOrder: r.onOrder,
      expected: 0,
      minLevel: r.minLevel,
      source: "mock" as const,
    }));
  }

  try {
    const prisma = await getPrisma();
    const today = await getBusinessToday();
    const todayDow = weekdayUtc(today);
    const todayStart = new Date(`${today}T00:00:00.000Z`);

    const levels = await prisma.stockLevel.findMany({
      include: {
        product: { include: { vendor: true } },
        storeLocation: true,
      },
      orderBy: [{ product: { sku: "asc" } }, { storeLocation: { code: "asc" } }],
    });

    try {
      await prisma.weeklyOrderPlanCell.updateMany({
        where: {
          markedReceived: true,
          markedReceivedOn: { lt: todayStart },
        },
        data: { markedReceived: false },
      });
    } catch (expireErr) {
      console.error("expire settled order-cell receives failed:", expireErr);
    }

    let minSchedules: { productId: string; storeLocationId: string; dayOfWeek: number; minLevel: number }[] =
      [];
    try {
      minSchedules = await prisma.stockMinSchedule.findMany();
    } catch (minErr) {
      console.error("stockMinSchedule query failed; using StockLevel.minLevel:", minErr);
    }

    const minByKey = new Map<string, number>();
    for (const row of minSchedules) {
      minByKey.set(`${row.productId}:${row.storeLocationId}:${row.dayOfWeek}`, row.minLevel);
    }

    // Expected = weekly grid qty placed on a previous day, not yet received.
    const priorCells = await prisma.weeklyOrderPlanCell.findMany({
      where: {
        quantity: { gt: 0 },
        orderDate: { lt: todayStart },
      },
    });

    const inboundByKey = new Map<string, InboundLineBadge[]>();
    for (const cell of priorCells) {
      const orderDate = ymdFromUnknown(cell.orderDate);
      const markedReceived = Boolean(cell.markedReceived);
      const markedReceivedOn = ymdFromUnknown(cell.markedReceivedOn);
      const badge: InboundLineBadge = {
        lineId: cell.id,
        poId: cell.planId,
        productId: cell.productId,
        storeLocationId: cell.storeLocationId,
        orderDate: orderDate ?? undefined,
        fulfillmentStatus: "ORDERED",
        remaining: cell.quantity,
        quantity: cell.quantity,
        receivedQty: 0,
        markedReceived,
        markedReceivedOn,
        deliveryIssue: Boolean(cell.deliveryIssue),
        deliveryIssueNote: cell.deliveryIssueNote ?? null,
      };
      if (!isInboundActive(badge, today) && !isReceiveChecked(badge, today)) {
        continue;
      }
      const key = `${cell.productId}:${cell.storeLocationId}`;
      const list = inboundByKey.get(key) ?? [];
      list.push(badge);
      inboundByKey.set(key, list);
    }

    return levels.map((level) => {
      const inbound =
        inboundByKey.get(`${level.productId}:${level.storeLocationId}`) ?? [];
      const scheduledMin = minByKey.get(
        `${level.productId}:${level.storeLocationId}:${todayDow}`,
      );
      return {
        id: level.id,
        productId: level.productId,
        storeLocationId: level.storeLocationId,
        sku: level.product.sku,
        name: level.product.name,
        locationName: level.storeLocation.name,
        vendorName: level.product.vendor?.name ?? "—",
        onHand: level.onHand,
        onOrder: level.onOrder,
        expected: expectedFromInbound(inbound, today),
        minLevel: scheduledMin ?? level.minLevel,
        inboundLines: inbound,
        source: "db" as const,
      };
    });
  } catch (err) {
    console.error("getInventoryRows failed, using mock:", err);
    return mockOrderRows.map((r) => ({
      id: r.id,
      sku: r.sku,
      name: r.name,
      locationName: r.locationName,
      vendorName: r.vendorName,
      onHand: r.onHand,
      onOrder: r.onOrder,
      expected: 0,
      minLevel: r.minLevel,
      source: "mock" as const,
    }));
  }
}
