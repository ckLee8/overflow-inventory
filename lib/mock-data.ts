export type MockVendor = {
  id: string;
  name: string;
  adapterType: "email_pdf" | "shopify_wholesale" | "amazon";
  orderDaysOfWeek: number[];
};

export type MockLocation = {
  id: string;
  code: string;
  name: string;
};

export type MockSkuRow = {
  id: string;
  sku: string;
  name: string;
  vendorId: string;
  vendorName: string;
  locationId: string;
  locationName: string;
  onHand: number;
  onOrder: number;
  minLevel: number;
  quantities: Record<string, number>;
};

export const mockVendors: MockVendor[] = [
  { id: "v1", name: "Acme Wholesale", adapterType: "email_pdf", orderDaysOfWeek: [1, 2, 3, 4, 5] },
  { id: "v2", name: "Shopify Portal Co", adapterType: "shopify_wholesale", orderDaysOfWeek: [1, 3, 5] },
  { id: "v3", name: "Amazon Business", adapterType: "amazon", orderDaysOfWeek: [1, 2, 3, 4, 5] },
];

export const mockLocations: MockLocation[] = [
  { id: "loc1", code: "MAIN", name: "Main Floor" },
  { id: "loc2", code: "BACK", name: "Back Stock" },
];

function weekDates(start: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function getMockWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + mondayOffset));
  return monday;
}

export function getMockWeekColumns(): { date: string; label: string }[] {
  const start = getMockWeekStart();
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return weekDates(start).map((date, i) => ({ date, label: labels[i] }));
}

export const mockOrderRows: MockSkuRow[] = [
  {
    id: "r1",
    sku: "SKU-1001",
    name: "Ceramic Mug 12oz",
    vendorId: "v1",
    vendorName: "Acme Wholesale",
    locationId: "loc1",
    locationName: "Main Floor",
    onHand: 8,
    onOrder: 0,
    minLevel: 24,
    quantities: {},
  },
  {
    id: "r2",
    sku: "SKU-1002",
    name: "Tea Towel Set",
    vendorId: "v1",
    vendorName: "Acme Wholesale",
    locationId: "loc2",
    locationName: "Back Stock",
    onHand: 40,
    onOrder: 12,
    minLevel: 20,
    quantities: {},
  },
  {
    id: "r3",
    sku: "SKU-2001",
    name: "Soy Candle — Cedar",
    vendorId: "v2",
    vendorName: "Shopify Portal Co",
    locationId: "loc1",
    locationName: "Main Floor",
    onHand: 3,
    onOrder: 6,
    minLevel: 15,
    quantities: {},
  },
  {
    id: "r4",
    sku: "SKU-3001",
    name: "Packing Tape 6-pack",
    vendorId: "v3",
    vendorName: "Amazon Business",
    locationId: "loc2",
    locationName: "Back Stock",
    onHand: 2,
    onOrder: 0,
    minLevel: 10,
    quantities: {},
  },
];

export type GroupBy = "vendor" | "location";

export function groupOrderRows(rows: MockSkuRow[], groupBy: GroupBy) {
  const map = new Map<string, MockSkuRow[]>();
  for (const row of rows) {
    const key = groupBy === "vendor" ? row.vendorName : row.locationName;
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}
