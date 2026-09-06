import { AmazonAdapter } from "./amazon";
import { EmailPdfPoAdapter } from "./email-pdf-po";
import { ShopifyWholesaleAdapter } from "./shopify-wholesale";
import type { VendorAdapter, VendorSchedule } from "./types";

export type { PurchaseOrderPayload, VendorAdapter, VendorOrderStatus, VendorSchedule } from "./types";
export { isOrderDay } from "./types";
export { AmazonAdapter, EmailPdfPoAdapter, ShopifyWholesaleAdapter };

export type AdapterType = "email_pdf" | "shopify_wholesale" | "amazon";

export function createVendorAdapter(
  adapterType: AdapterType,
  schedule: VendorSchedule,
): VendorAdapter {
  switch (adapterType) {
    case "email_pdf":
      return new EmailPdfPoAdapter(schedule);
    case "shopify_wholesale":
      return new ShopifyWholesaleAdapter(schedule);
    case "amazon":
      return new AmazonAdapter(schedule);
    default: {
      const _exhaustive: never = adapterType;
      throw new Error(`Unknown adapter type: ${_exhaustive}`);
    }
  }
}
