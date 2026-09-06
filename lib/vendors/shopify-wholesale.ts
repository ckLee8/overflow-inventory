import {
  isOrderDay,
  type PurchaseOrderPayload,
  type VendorAdapter,
  type VendorOrderStatus,
  type VendorSchedule,
} from "./types";

/** Stub: place via wholesale/portal API. */
export class ShopifyWholesaleAdapter implements VendorAdapter {
  readonly name = "ShopifyWholesaleAdapter";

  constructor(private readonly schedule: VendorSchedule) {}

  canAcceptOrders(date: Date): boolean {
    return isOrderDay(date, this.schedule);
  }

  async createOrder(po: PurchaseOrderPayload): Promise<{ externalRef: string }> {
    const externalRef = `SHOPIFY-WS-${po.id}`;
    console.info(`[${this.name}] Would place wholesale order`, {
      externalRef,
      lines: po.lines.length,
      orderDate: po.orderDate,
    });
    return { externalRef };
  }

  async getStatus(externalRef: string): Promise<VendorOrderStatus> {
    console.info(`[${this.name}] getStatus stub`, { externalRef });
    return "pending";
  }
}
