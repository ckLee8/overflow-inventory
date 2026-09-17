import { mockOrderRows } from "@/lib/mock-data";
import { getBusinessToday } from "@/lib/clock";
import { hasDatabase } from "@/lib/db";
import {
  expectedFromInbound,
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
      expected: r.onOrder,
      minLevel: r.minLevel,
      source: "mock" as const,
    }));
  }

  try {
    const prisma = await getPrisma();
    const today = await getBusinessToday();
    const todayDow = weekdayUtc(today);
    const { PoLineFulfillmentStatus, PurchaseOrderStatus } = await import(
      "@prisma/client"
    );

    const inboundPoStatus = {
      in: [
        PurchaseOrderStatus.APPROVED,
        PurchaseOrderStatus.SUBMITTED,
        PurchaseOrderStatus.PARTIAL,
        PurchaseOrderStatus.RECEIVED,
      ],
    };

    const levels = await prisma.stockLevel.findMany({
      include: {
        product: { include: { vendor: true } },
        storeLocation: true,
      },
      orderBy: [{ product: { sku: "asc" } }, { storeLocation: { code: "asc" } }],
    });

    try {
      await prisma.purchaseOrderLine.updateMany({
        where: {
          markedReceived: true,
          markedReceivedOn: { lt: new Date(`${today}T00:00:00.000Z`) },
        },
        data: { markedReceived: false },
      });
    } catch (expireErr) {
      console.error("expire settled receives failed:", expireErr);
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

    // Inbound lines for checkbox / flag UI (ORDERED|SHIPPED|RECEIVED).
    let openLines;
    try {
      openLines = await prisma.purchaseOrderLine.findMany({
        where: {
          purchaseOrder: {
            status: inboundPoStatus,
            storeLocationId: { not: null },
          },
          fulfillmentStatus: {
            in: [
              PoLineFulfillmentStatus.ORDERED,
              PoLineFulfillmentStatus.SHIPPED,
              PoLineFulfillmentStatus.RECEIVED,
            ],
          },
        },
        include: { purchaseOrder: true },
      });
    } catch (lineErr) {
      console.error(
        "purchaseOrderLine inbound query failed; retrying without fulfillmentStatus filter:",
        lineErr,
      );
      openLines = await prisma.purchaseOrderLine.findMany({
        where: {
          purchaseOrder: {
            status: inboundPoStatus,
            storeLocationId: { not: null },
          },
        },
        include: { purchaseOrder: true },
      });
    }

    const inboundByKey = new Map<string, InboundLineBadge[]>();
    for (const line of openLines) {
      const locId = line.purchaseOrder.storeLocationId;
      if (!locId) continue;
      if (line.quantity <= 0) continue;

      const remaining = Math.max(0, line.quantity - line.receivedQty);
      const fulfillmentStatus =
        (line as { fulfillmentStatus?: string }).fulfillmentStatus ?? "ORDERED";
      const markedReceived = Boolean(
        (line as { markedReceived?: boolean }).markedReceived,
      );
      const markedReceivedOn = ymdFromUnknown(
        (line as { markedReceivedOn?: Date | string | null }).markedReceivedOn,
      );
      const deliveryIssue = Boolean(
        (line as { deliveryIssue?: boolean }).deliveryIssue,
      );
      const deliveryIssueNote =
        (line as { deliveryIssueNote?: string | null }).deliveryIssueNote ??
        null;
      const key = `${line.productId}:${locId}`;
      const list = inboundByKey.get(key) ?? [];
      list.push({
        lineId: line.id,
        poId: line.purchaseOrderId,
        fulfillmentStatus,
        remaining,
        quantity: line.quantity,
        receivedQty: line.receivedQty,
        markedReceived,
        markedReceivedOn,
        deliveryIssue,
        deliveryIssueNote,
      });
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
        expected: expectedFromInbound(level.onOrder, inbound, today),
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
      expected: r.onOrder,
      minLevel: r.minLevel,
      source: "mock" as const,
    }));
  }
}
