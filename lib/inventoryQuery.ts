import { mockOrderRows } from "@/lib/mock-data";
import { hasDatabase } from "@/lib/db";

export type InboundLineBadge = {
  lineId: string;
  poId: string;
  fulfillmentStatus: string;
  /** Expected open qty display helper (quantity − receivedQty); checkbox ignores this. */
  remaining: number;
  quantity: number;
  receivedQty: number;
  /** True/false Receive checkbox state — independent of stock numbers. */
  markedReceived: boolean;
  deliveryIssue: boolean;
  deliveryIssueNote?: string | null;
};

export type InventoryRow = {
  id: string;
  productId?: string;
  storeLocationId?: string;
  sku: string;
  name: string;
  locationName: string;
  vendorName: string;
  onHand: number;
  onOrder: number;
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
      minLevel: r.minLevel,
      source: "mock" as const,
    }));
  }

  try {
    const prisma = await getPrisma();
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
        deliveryIssue,
        deliveryIssueNote,
      });
      inboundByKey.set(key, list);
    }

    return levels.map((level) => ({
      id: level.id,
      productId: level.productId,
      storeLocationId: level.storeLocationId,
      sku: level.product.sku,
      name: level.product.name,
      locationName: level.storeLocation.name,
      vendorName: level.product.vendor?.name ?? "—",
      onHand: level.onHand,
      onOrder: level.onOrder,
      minLevel: level.minLevel,
      inboundLines:
        inboundByKey.get(`${level.productId}:${level.storeLocationId}`) ?? [],
      source: "db" as const,
    }));
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
      minLevel: r.minLevel,
      source: "mock" as const,
    }));
  }
}
