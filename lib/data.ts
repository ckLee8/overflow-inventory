import {
  getMockWeekColumns,
  getMockWeekStart,
  mockLocations,
  mockOrderRows,
  mockVendors,
  type MockSkuRow,
  type MockVendor,
} from "@/lib/mock-data";
import { hasDatabase } from "@/lib/db";
import { getBusinessToday } from "@/lib/clock";
import { mondayUtcForDateString, weekdayUtc } from "@/lib/timezone";

import type { InventoryRow } from "@/lib/inventoryQuery";
import { getInventoryRows } from "@/lib/inventoryQuery";
export type { InboundLineBadge, InventoryRow } from "@/lib/inventoryQuery";
export { getInventoryRows } from "@/lib/inventoryQuery";
export { isInboundActive, isReceiveChecked, isReceiveSettled } from "@/lib/inbound";

export type OrderGridRow = MockSkuRow & { source: "db" | "mock" };

export type VendorView = MockVendor & {
  contactEmail?: string | null;
  active?: boolean;
  source: "db" | "mock";
};

export type PurchaseOrderView = {
  id: string;
  vendorName: string;
  storeLocationName: string | null;
  orderDate: string;
  status: string;
  lineCount: number;
  notes: string | null;
  source: "db" | "mock";
};

export type ReceivablePoLineView = {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  receivedQty: number;
  remaining: number;
  fulfillmentStatus: string;
};

export type ReceivablePoView = {
  id: string;
  vendorName: string;
  storeLocationId: string | null;
  storeLocationName: string | null;
  orderDate: string;
  status: string;
  notes: string | null;
  lines: ReceivablePoLineView[];
  source: "db" | "mock";
};

export type WeekColumn = { date: string; label: string };

export type OrderingBundle = {
  planId: string | null;
  weekStart: string;
  columns: WeekColumn[];
  rows: OrderGridRow[];
  vendors: VendorView[];
  source: "db" | "mock";
};

function weekColumnsFromStart(start: Date): WeekColumn[] {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return { date: d.toISOString().slice(0, 10), label: labels[i] };
  });
}

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

export async function getVendors(): Promise<VendorView[]> {
  if (!hasDatabase()) {
    return mockVendors.map((v) => ({ ...v, source: "mock" as const }));
  }

  try {
    const prisma = await getPrisma();
    const vendors = await prisma.vendor.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    return vendors.map((v) => ({
      id: v.id,
      name: v.name,
      adapterType: v.adapterType as MockVendor["adapterType"],
      orderDaysOfWeek: v.orderDaysOfWeek,
      contactEmail: v.contactEmail,
      active: v.active,
      source: "db" as const,
    }));
  } catch (err) {
    console.error("getVendors failed, using mock:", err);
    return mockVendors.map((v) => ({ ...v, source: "mock" as const }));
  }
}

export async function getOrderingBundle(): Promise<OrderingBundle> {
  if (!hasDatabase()) {
    const start = getMockWeekStart();
    return {
      planId: null,
      weekStart: start.toISOString().slice(0, 10),
      columns: getMockWeekColumns(),
      rows: mockOrderRows.map((r) => ({ ...r, source: "mock" as const })),
      vendors: mockVendors.map((v) => ({ ...v, source: "mock" as const })),
      source: "mock",
    };
  }

  try {
    const prisma = await getPrisma();
    const today = await getBusinessToday();
    const todayDow = weekdayUtc(today);
    const weekStart = mondayUtcForDateString(today);
    const columns = weekColumnsFromStart(weekStart);

    let plan = await prisma.weeklyOrderPlan.findUnique({
      where: { weekStart },
      include: { cells: true },
    });

    if (!plan) {
      plan = await prisma.weeklyOrderPlan.create({
        data: { weekStart, status: "draft" },
        include: { cells: true },
      });
    }

    const [levels, vendors, minSchedules] = await Promise.all([
      prisma.stockLevel.findMany({
        include: {
          product: { include: { vendor: true } },
          storeLocation: true,
        },
        orderBy: [{ product: { sku: "asc" } }, { storeLocation: { code: "asc" } }],
      }),
      prisma.vendor.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      prisma.stockMinSchedule.findMany().catch((err: unknown) => {
        console.error("stockMinSchedule query failed; using StockLevel.minLevel:", err);
        return [] as { productId: string; storeLocationId: string; dayOfWeek: number; minLevel: number }[];
      }),
    ]);

    const minByKey = new Map<string, number>();
    for (const row of minSchedules) {
      minByKey.set(`${row.productId}:${row.storeLocationId}:${row.dayOfWeek}`, row.minLevel);
    }

    const cellMap = new Map<string, number>();
    for (const cell of plan.cells) {
      const date = cell.orderDate.toISOString().slice(0, 10);
      cellMap.set(`${cell.productId}:${cell.storeLocationId}:${date}`, cell.quantity);
    }

    const rows: OrderGridRow[] = levels.map((level) => {
      const quantities: Record<string, number> = {};
      for (const col of columns) {
        const q = cellMap.get(`${level.productId}:${level.storeLocationId}:${col.date}`);
        if (q != null && q > 0) quantities[col.date] = q;
      }
      return {
        id: `${level.productId}:${level.storeLocationId}`,
        sku: level.product.sku,
        name: level.product.name,
        vendorId: level.product.vendorId ?? "",
        vendorName: level.product.vendor?.name ?? "—",
        locationId: level.storeLocationId,
        locationName: level.storeLocation.name,
        onHand: level.onHand,
        onOrder: level.onOrder,
        minLevel:
          minByKey.get(`${level.productId}:${level.storeLocationId}:${todayDow}`) ??
          level.minLevel,
        quantities,
        source: "db" as const,
      };
    });

    return {
      planId: plan.id,
      weekStart: weekStart.toISOString().slice(0, 10),
      columns,
      rows,
      vendors: vendors.map((v) => ({
        id: v.id,
        name: v.name,
        adapterType: v.adapterType as MockVendor["adapterType"],
        orderDaysOfWeek: v.orderDaysOfWeek,
        contactEmail: v.contactEmail,
        active: v.active,
        source: "db" as const,
      })),
      source: "db",
    };
  } catch (err) {
    console.error("getOrderingBundle failed, using mock:", err);
    const start = getMockWeekStart();
    return {
      planId: null,
      weekStart: start.toISOString().slice(0, 10),
      columns: getMockWeekColumns(),
      rows: mockOrderRows.map((r) => ({ ...r, source: "mock" as const })),
      vendors: mockVendors.map((v) => ({ ...v, source: "mock" as const })),
      source: "mock",
    };
  }
}

export async function getPendingPurchaseOrders(): Promise<PurchaseOrderView[]> {
  if (!hasDatabase()) {
    return [];
  }

  try {
    const prisma = await getPrisma();
    const pos = await prisma.purchaseOrder.findMany({
      where: { status: { in: ["DRAFT", "APPROVED"] } },
      include: {
        vendor: true,
        storeLocation: true,
        lines: true,
      },
      orderBy: { orderDate: "asc" },
    });

    return pos.map((po) => ({
      id: po.id,
      vendorName: po.vendor.name,
      storeLocationName: po.storeLocation?.name ?? null,
      orderDate: po.orderDate.toISOString().slice(0, 10),
      status: po.status,
      lineCount: po.lines.length,
      notes: po.notes,
      source: "db" as const,
    }));
  } catch (err) {
    console.error("getPendingPurchaseOrders failed:", err);
    return [];
  }
}


export async function getReceivablePurchaseOrders(): Promise<ReceivablePoView[]> {
  if (!hasDatabase()) {
    return [];
  }

  try {
    const prisma = await getPrisma();
    const pos = await prisma.purchaseOrder.findMany({
      where: { status: { in: ["APPROVED", "SUBMITTED", "PARTIAL"] } },
      include: {
        vendor: true,
        storeLocation: true,
        lines: {
          include: { product: true },
          orderBy: { product: { sku: "asc" } },
        },
      },
      orderBy: [{ orderDate: "asc" }, { createdAt: "asc" }],
    });

    return pos.map((po) => ({
      id: po.id,
      vendorName: po.vendor.name,
      storeLocationId: po.storeLocationId,
      storeLocationName: po.storeLocation?.name ?? null,
      orderDate: po.orderDate.toISOString().slice(0, 10),
      status: po.status,
      notes: po.notes,
      lines: po.lines.map((line) => ({
        id: line.id,
        productId: line.productId,
        sku: line.product.sku,
        productName: line.product.name,
        quantity: line.quantity,
        receivedQty: line.receivedQty,
        remaining: Math.max(0, line.quantity - line.receivedQty),
        fulfillmentStatus: line.fulfillmentStatus,
      })),
      source: "db" as const,
    }));
  } catch (err) {
    console.error("getReceivablePurchaseOrders failed:", err);
    return [];
  }
}

export async function getBelowMinRows(): Promise<InventoryRow[]> {
  const rows = await getInventoryRows();
  return rows.filter((r) => r.onHand + r.expected < r.minLevel);
}

export async function getOnHandSummary(): Promise<{
  totalSkus: number;
  totalOnHand: number;
  belowMin: number;
  source: "db" | "mock";
}> {
  const rows = await getInventoryRows();
  return {
    totalSkus: rows.length,
    totalOnHand: rows.reduce((sum, r) => sum + r.onHand, 0),
    belowMin: rows.filter((r) => r.onHand + r.expected < r.minLevel).length,
    source: rows[0]?.source ?? "mock",
  };
}

export type DailyMinRow = {
  productId: string;
  storeLocationId: string;
  sku: string;
  name: string;
  locationName: string;
  defaultMin: number;
  /** min for dayOfWeek 0–6 (Sun–Sat). Missing days fall back to defaultMin in the UI. */
  mins: Partial<Record<number, number>>;
};

export async function getDailyMinRows(): Promise<DailyMinRow[]> {
  if (!hasDatabase()) return [];

  try {
    const prisma = await getPrisma();
    const [levels, schedules] = await Promise.all([
      prisma.stockLevel.findMany({
        include: {
          product: true,
          storeLocation: true,
        },
        orderBy: [{ product: { sku: "asc" } }, { storeLocation: { code: "asc" } }],
      }),
      prisma.stockMinSchedule.findMany(),
    ]);

    const byKey = new Map<string, Partial<Record<number, number>>>();
    for (const row of schedules) {
      const key = `${row.productId}:${row.storeLocationId}`;
      const current = byKey.get(key) ?? {};
      current[row.dayOfWeek] = row.minLevel;
      byKey.set(key, current);
    }

    return levels.map((level) => ({
      productId: level.productId,
      storeLocationId: level.storeLocationId,
      sku: level.product.sku,
      name: level.product.name,
      locationName: level.storeLocation.name,
      defaultMin: level.minLevel,
      mins: byKey.get(`${level.productId}:${level.storeLocationId}`) ?? {},
    }));
  } catch (err) {
    console.error("getDailyMinRows failed:", err);
    return [];
  }
}

/** Re-export mock locations for any UI that still needs them without DB. */
export { mockLocations };
