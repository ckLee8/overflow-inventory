-- AlterTable
ALTER TABLE "PurchaseOrderLine" ADD COLUMN "deliveryIssue" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PurchaseOrderLine" ADD COLUMN "deliveryIssueNote" TEXT;
