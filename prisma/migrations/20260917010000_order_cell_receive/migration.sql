-- Receive / Expected follow weekly grid cells (orders placed on prior days).
ALTER TABLE "WeeklyOrderPlanCell" ADD COLUMN "markedReceived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WeeklyOrderPlanCell" ADD COLUMN "markedReceivedOn" TIMESTAMP(3);
ALTER TABLE "WeeklyOrderPlanCell" ADD COLUMN "deliveryIssue" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WeeklyOrderPlanCell" ADD COLUMN "deliveryIssueNote" TEXT;
