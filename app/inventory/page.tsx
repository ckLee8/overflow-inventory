import { InventoryRowActions } from "@/components/InventoryRowActions";
import { OnHandEditor } from "@/components/OnHandEditor";
import { PageHead, TableWrap, cn } from "@/components/ui";
import { auth } from "@/lib/auth";
import { getBusinessClock } from "@/lib/clock";
import { getInventoryRows, type InboundLineBadge } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * Primary inbound line for a SKU×location row: prefer unmarked SHIPPED over
 * ORDERED; if all marked, fall back to a marked line (checkbox reversible).
 */
function pickPrimaryInbound(lines: InboundLineBadge[]): InboundLineBadge | null {
  if (lines.length === 0) return null;
  const unmarked = lines.filter((l) => !l.markedReceived);
  if (unmarked.length > 0) {
    const shipped = unmarked.filter((l) => l.fulfillmentStatus === "SHIPPED");
    const ordered = unmarked.filter((l) => l.fulfillmentStatus === "ORDERED");
    return shipped[0] ?? ordered[0] ?? unmarked[0];
  }
  return lines[0] ?? null;
}

export default async function InventoryPage() {
  const [rows, session, clock] = await Promise.all([getInventoryRows(), auth(), getBusinessClock()]);
  const source = rows[0]?.source ?? "mock";
  const todayDate = clock.today;
  const role = session?.user?.role;
  const canEditStock = role === "ADMIN" || role === "MANAGER";
  const canReceive = role === "ADMIN" || role === "MANAGER";

  return (
    <div>
      <PageHead kicker="Stock · SKU × location" title="Inventory">
        On hand is <strong className="font-medium text-foreground">today's count</strong> ({todayDate},{" "}
        {clock.timezone}
        {clock.simulated ? " · test clock" : ""})
        {source === "db" ? " from Postgres." : " (mock fallback — set DATABASE_URL)."}
        {canEditStock
          ? " ADMIN/MANAGER can edit; saves an ADJUST movement."
          : " View only for STAFF."}{" "}
        Expected is read-only. Receive only marks the inbound line — it does{" "}
        <strong className="font-medium text-foreground">not</strong> change on-hand
        {canReceive ? " (ADMIN/MANAGER)." : " (STAFF view-only)."} Unmarked inbound rows are
        highlighted.
      </PageHead>

      <TableWrap>
        <table className="min-w-full text-sm">
          <thead className="bg-muted/60 text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-3 font-medium">SKU</th>
              <th className="px-3 py-3 font-medium">Location</th>
              <th className="px-3 py-3 font-medium">
                On hand
                <span className="mt-0.5 block text-xs font-normal">today ({todayDate.slice(5)})</span>
              </th>
              <th className="px-3 py-3 font-medium">Min</th>
              <th className="px-3 py-3 font-medium">Expected</th>
              <th className="px-3 py-3 font-medium">Receive</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                  No stock levels yet. Run seed.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const below = row.onHand + row.onOrder < row.minLevel;
                const inbound = row.inboundLines ?? [];
                const primary = pickPrimaryInbound(inbound);
                const hasUnmarkedInbound = Boolean(primary && !primary.markedReceived);
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-t border-border",
                      hasUnmarkedInbound ? "bg-inbound/80" : "",
                    )}
                  >
                    <td className="px-3 py-3">
                      <div className="font-mono text-xs text-muted-foreground">{row.sku}</div>
                      <div className="font-medium text-foreground">{row.name}</div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{row.locationName}</td>
                    <td className="px-3 py-3">
                      <OnHandEditor
                        stockLevelId={row.id}
                        initialOnHand={row.onHand}
                        canEdit={canEditStock}
                        source={row.source}
                        todayDate={todayDate}
                        timezone={clock.timezone}
                        belowMin={below}
                      />
                    </td>
                    <td className="px-3 py-3 tabular-nums">{row.minLevel}</td>
                    <td className="px-3 py-3 tabular-nums">{row.onOrder}</td>
                    <InventoryRowActions
                      key={primary?.lineId ?? row.id}
                      primary={primary}
                      canReceive={canReceive}
                      source={row.source}
                    />
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}
