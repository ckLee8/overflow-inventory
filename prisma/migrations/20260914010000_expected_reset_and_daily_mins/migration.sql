-- Receive: remember which business day the checkbox was turned on so Expected
-- can drop to 0 starting the next day.
ALTER TABLE "PurchaseOrderLine" ADD COLUMN "markedReceivedOn" TIMESTAMP(3);

-- Per SKU × location × weekday minimums (0 = Sunday … 6 = Saturday).
CREATE TABLE "StockMinSchedule" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "storeLocationId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "minLevel" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StockMinSchedule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StockMinSchedule_productId_storeLocationId_dayOfWeek_key"
  ON "StockMinSchedule"("productId", "storeLocationId", "dayOfWeek");

ALTER TABLE "StockMinSchedule"
  ADD CONSTRAINT "StockMinSchedule_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockMinSchedule"
  ADD CONSTRAINT "StockMinSchedule_storeLocationId_fkey"
  FOREIGN KEY ("storeLocationId") REFERENCES "StoreLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
