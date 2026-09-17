/** Isomorphic inbound / receive helpers — safe to import from client components. */

export type InboundLineBadge = {
  lineId: string;
  poId: string;
  fulfillmentStatus: string;
  remaining: number;
  quantity: number;
  receivedQty: number;
  markedReceived: boolean;
  /** YYYY-MM-DD the checkbox was last turned on; null when unmarked. */
  markedReceivedOn: string | null;
  deliveryIssue: boolean;
  deliveryIssueNote?: string | null;
};

export function ymdFromUnknown(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
}

/** Marked received on a prior business day — checkbox should be off. */
export function isReceiveSettled(
  line: { markedReceivedOn?: string | null },
  today: string,
): boolean {
  return Boolean(line.markedReceivedOn && line.markedReceivedOn < today);
}

/** Checkbox is on only for the remainder of the day it was checked. */
export function isReceiveChecked(
  line: { markedReceived: boolean; markedReceivedOn?: string | null },
  today: string,
): boolean {
  if (!line.markedReceived) return false;
  return !isReceiveSettled(line, today);
}

/**
 * Still counts toward Expected. Received lines do not — Expected goes to 0
 * as soon as Receive is checked, and stays 0 after the checkbox settles.
 */
export function isInboundActive(
  line: { markedReceived: boolean; markedReceivedOn?: string | null },
  today: string,
): boolean {
  if (line.markedReceived) return false;
  if (isReceiveSettled(line, today)) return false;
  return true;
}

export function expectedFromInbound(
  onOrder: number,
  inbound: InboundLineBadge[],
  today: string,
): number {
  if (inbound.length === 0) return onOrder;
  return inbound
    .filter((line) => isInboundActive(line, today))
    .reduce((sum, line) => sum + Math.max(0, line.remaining), 0);
}
