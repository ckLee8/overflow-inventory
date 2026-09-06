import {
  isOrderDay,
  type PurchaseOrderPayload,
  type VendorAdapter,
  type VendorOrderStatus,
  type VendorSchedule,
} from "./types";

/** Stub: generate PDF PO + email to vendor (MVP path). */
export class EmailPdfPoAdapter implements VendorAdapter {
  readonly name = "EmailPdfPoAdapter";

  constructor(private readonly schedule: VendorSchedule) {}

  canAcceptOrders(date: Date): boolean {
    return isOrderDay(date, this.schedule);
  }

  async createOrder(po: PurchaseOrderPayload): Promise<{ externalRef: string }> {
    const externalRef = `EMAIL-PDF-${po.id}`;
    console.info(`[${this.name}] Would email PDF PO`, {
      externalRef,
      lines: po.lines.length,
      orderDate: po.orderDate,
    });
    return { externalRef };
  }

  async getStatus(externalRef: string): Promise<VendorOrderStatus> {
    console.info(`[${this.name}] getStatus stub`, { externalRef });
    return "submitted";
  }
}
