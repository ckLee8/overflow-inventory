-- CreateEnum
CREATE TYPE "PoLineFulfillmentStatus" AS ENUM ('ORDERED', 'SHIPPED', 'RECEIVED');

-- AlterTable
ALTER TABLE "PurchaseOrderLine" ADD COLUMN "fulfillmentStatus" "PoLineFulfillmentStatus" NOT NULL DEFAULT 'ORDERED';
