import {
  isOrderDay,
  type PurchaseOrderPayload,
  type VendorAdapter,
  type VendorOrderStatus,
  type VendorSchedule,
} from "./types";

/** Stub: place via Amazon APIs (later in MVP). */
export class AmazonAdapter implements VendorAdapter {
  readonly name = "AmazonAdapter";

  constructor(private readonly schedule: VendorSchedule) {}

  canAcceptOrders(date: Date): boolean {
    return isOrderDay(date, this.schedule);
  }

  async createOrder(po: PurchaseOrderPayload): Promise<{ externalRef: string }> {
    const externalRef = `AMZ-${po.id}`;
    console.info(`[${this.name}] Would place Amazon order`, {
      externalRef,
      lines: po.lines.length,
      orderDate: po.orderDate,
    });
    return { externalRef };
  }

  async getStatus(externalRef: string): Promise<VendorOrderStatus> {
    console.info(`[${this.name}] getStatus stub`, { externalRef });
    return "unknown";
  }
}
