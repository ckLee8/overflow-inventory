import { Badge, Card, PageHead, TableWrap } from "@/components/ui";
import { getPendingPurchaseOrders } from "@/lib/data";
import { hasDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const db = hasDatabase();
  const pos = await getPendingPurchaseOrders();
  const session = await auth();
  const canApprove = session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";

  return (
    <div>
      <PageHead kicker="Place · vendor adapters" title="Approvals">
        Draft and approved purchase orders from the database. Day-plan approval that splits lines
        by vendor and calls adapters is next.
      </PageHead>

      {!canApprove ? (
        <div className="mb-4 rounded-lg border border-warn/25 bg-warn/10 px-4 py-3 text-sm text-warn">
          You can view pending orders, but approving is limited to MANAGER and ADMIN roles.
        </div>
      ) : null}

      {!db ? (
        <Card className="border-dashed px-5 py-10 text-center text-muted-foreground">
          Set DATABASE_URL and seed to list pending POs. Until then this page is a stub.
        </Card>
      ) : pos.length === 0 ? (
        <Card className="border-dashed px-5 py-10 text-center text-muted-foreground">
          No draft/approved purchase orders. Seed data includes sample POs.
        </Card>
      ) : (
        <TableWrap>
          <table className="min-w-full text-sm">
            <thead className="bg-muted/60 text-left text-muted-foreground">
              <tr>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Vendor</th>
                <th className="px-3 py-3 font-medium">Location</th>
                <th className="px-3 py-3 font-medium">Order date</th>
                <th className="px-3 py-3 font-medium">Lines</th>
                <th className="px-3 py-3 font-medium">Notes</th>
                {canApprove ? <th className="px-3 py-3 font-medium">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {pos.map((po) => (
                <tr key={po.id} className="border-t border-border">
                  <td className="px-3 py-3">
                    <Badge tone={po.status === "APPROVED" ? "ok" : "warn"}>{po.status}</Badge>
                  </td>
                  <td className="px-3 py-3 font-medium">{po.vendorName}</td>
                  <td className="px-3 py-3 text-muted-foreground">{po.storeLocationName ?? "—"}</td>
                  <td className="px-3 py-3 tabular-nums">{po.orderDate}</td>
                  <td className="px-3 py-3 tabular-nums">{po.lineCount}</td>
                  <td className="px-3 py-3 text-muted-foreground">{po.notes ?? "—"}</td>
                  {canApprove ? (
                    <td className="px-3 py-3 text-muted-foreground">Approve (soon)</td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </div>
  );
}
