export type VendorOrderStatus =
  | "pending"
  | "submitted"
  | "acknowledged"
  | "shipped"
  | "cancelled"
  | "unknown";

export interface PurchaseOrderPayload {
  id: string;
  vendorId: string;
  orderDate: string;
  notes?: string;
  lines: Array<{
    sku: string;
    productName: string;
    quantity: number;
    unitCost?: number;
  }>;
}

export interface VendorAdapter {
  readonly name: string;
  canAcceptOrders(date: Date): boolean;
  createOrder(po: PurchaseOrderPayload): Promise<{ externalRef: string }>;
  getStatus(externalRef: string): Promise<VendorOrderStatus>;
}

export interface VendorSchedule {
  /** 0 = Sunday … 6 = Saturday */
  orderDaysOfWeek: number[];
  blackoutDates: string[];
}

export function isOrderDay(date: Date, schedule: VendorSchedule): boolean {
  const day = date.getUTCDay();
  if (!schedule.orderDaysOfWeek.includes(day)) return false;
  const iso = date.toISOString().slice(0, 10);
  return !schedule.blackoutDates.includes(iso);
}
