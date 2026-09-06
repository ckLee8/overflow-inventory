import { PrismaClient, PurchaseOrderStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function mondayUtc(d = new Date()): Date {
  const day = d.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + mondayOffset));
}

function addDays(start: Date, days: number): Date {
  const d = new Date(start);
  d.setUTCDate(start.getUTCDate() + days);
  return d;
}

async function main() {
  console.log("Seeding overflow-inventory demo data…");

  // Clear in FK-safe order
  await prisma.weeklyOrderPlanCell.deleteMany();
  await prisma.weeklyOrderPlan.deleteMany();
  await prisma.purchaseOrderLine.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.stockLevel.deleteMany();
  await prisma.product.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.storeLocation.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("admin12345", 10);
  const managerHash = await bcrypt.hash("manager12345", 10);
  const staffHash = await bcrypt.hash("staff12345", 10);

  await prisma.user.createMany({
    data: [
      {
        email: "admin@example.com",
        name: "Default Admin",
        passwordHash,
        role: Role.ADMIN,
        active: true,
      },
      {
        email: "manager@example.com",
        name: "Sample Manager",
        passwordHash: managerHash,
        role: Role.MANAGER,
        active: true,
      },
      {
        email: "staff@example.com",
        name: "Sample Staff",
        passwordHash: staffHash,
        role: Role.STAFF,
        active: true,
      },
    ],
  });

  const mainFloor = await prisma.storeLocation.create({
    data: { code: "MAIN", name: "Main Floor" },
  });
  const backStock = await prisma.storeLocation.create({
    data: { code: "BACK", name: "Back Stock" },
  });

  const acme = await prisma.vendor.create({
    data: {
      name: "Acme Wholesale",
      adapterType: "email_pdf",
      contactEmail: "orders@acme-wholesale.example",
      orderDaysOfWeek: [1, 2, 3, 4, 5],
    },
  });
  const shopifyCo = await prisma.vendor.create({
    data: {
      name: "Shopify Portal Co",
      adapterType: "shopify_wholesale",
      contactEmail: "wholesale@shopify-portal.example",
      orderDaysOfWeek: [1, 3, 5],
    },
  });
  const amazon = await prisma.vendor.create({
    data: {
      name: "Amazon Business",
      adapterType: "amazon",
      contactEmail: null,
      orderDaysOfWeek: [1, 2, 3, 4, 5],
    },
  });

  const mug = await prisma.product.create({
    data: {
      sku: "SKU-1001",
      name: "Ceramic Mug 12oz",
      description: "White ceramic mug",
      vendorId: acme.id,
    },
  });
  const towel = await prisma.product.create({
    data: {
      sku: "SKU-1002",
      name: "Tea Towel Set",
      description: "Set of 2 cotton towels",
      vendorId: acme.id,
    },
  });
  const candle = await prisma.product.create({
    data: {
      sku: "SKU-2001",
      name: "Soy Candle — Cedar",
      description: "8oz soy candle",
      vendorId: shopifyCo.id,
    },
  });
  const tape = await prisma.product.create({
    data: {
      sku: "SKU-3001",
      name: "Packing Tape 6-pack",
      description: "Clear packing tape",
      vendorId: amazon.id,
    },
  });

  await prisma.stockLevel.createMany({
    data: [
      {
        productId: mug.id,
        storeLocationId: mainFloor.id,
        onHand: 8,
        onOrder: 0,
        minLevel: 24,
        reorderQty: 36,
      },
      {
        productId: towel.id,
        storeLocationId: backStock.id,
        onHand: 40,
        onOrder: 12,
        minLevel: 20,
        reorderQty: 24,
      },
      {
        productId: candle.id,
        storeLocationId: mainFloor.id,
        onHand: 3,
        onOrder: 18, // matches APPROVED PO line for receiving demo
        minLevel: 15,
        reorderQty: 24,
      },
      {
        productId: tape.id,
        storeLocationId: backStock.id,
        onHand: 2,
        onOrder: 6, // matches SUBMITTED PO line for receiving demo
        minLevel: 10,
        reorderQty: 12,
      },
    ],
  });

  const weekStart = mondayUtc();
  const plan = await prisma.weeklyOrderPlan.create({
    data: { weekStart, status: "draft" },
  });

  await prisma.weeklyOrderPlanCell.createMany({
    data: [
      {
        planId: plan.id,
        productId: mug.id,
        storeLocationId: mainFloor.id,
        orderDate: addDays(weekStart, 0),
        quantity: 24,
      },
      {
        planId: plan.id,
        productId: mug.id,
        storeLocationId: mainFloor.id,
        orderDate: addDays(weekStart, 3),
        quantity: 12,
      },
      {
        planId: plan.id,
        productId: candle.id,
        storeLocationId: mainFloor.id,
        orderDate: addDays(weekStart, 0),
        quantity: 18,
      },
      {
        planId: plan.id,
        productId: candle.id,
        storeLocationId: mainFloor.id,
        orderDate: addDays(weekStart, 2),
        quantity: 12,
      },
      {
        planId: plan.id,
        productId: tape.id,
        storeLocationId: backStock.id,
        orderDate: addDays(weekStart, 1),
        quantity: 6,
      },
      {
        planId: plan.id,
        productId: towel.id,
        storeLocationId: backStock.id,
        orderDate: addDays(weekStart, 4),
        quantity: 8,
      },
    ],
  });

  const draftPo = await prisma.purchaseOrder.create({
    data: {
      vendorId: acme.id,
      storeLocationId: mainFloor.id,
      orderDate: addDays(weekStart, 0),
      status: PurchaseOrderStatus.DRAFT,
      notes: "Generated from weekly plan (demo)",
      lines: {
        create: [{ productId: mug.id, quantity: 24 }],
      },
    },
  });

  const approvedPo = await prisma.purchaseOrder.create({
    data: {
      vendorId: shopifyCo.id,
      storeLocationId: mainFloor.id,
      orderDate: addDays(weekStart, 2),
      status: PurchaseOrderStatus.APPROVED,
      notes: "Ready to submit via Shopify adapter — receive full or partial on /receiving",
      lines: {
        create: [{ productId: candle.id, quantity: 18 }],
      },
    },
  });

  // SUBMITTED multi-line PO for partial shipment demo (BACK location)
  const submittedPo = await prisma.purchaseOrder.create({
    data: {
      vendorId: amazon.id,
      storeLocationId: backStock.id,
      orderDate: addDays(weekStart, 1),
      status: PurchaseOrderStatus.SUBMITTED,
      notes: "In transit — receive partial lines on /receiving",
      lines: {
        create: [
          { productId: towel.id, quantity: 12 },
          { productId: tape.id, quantity: 6 },
        ],
      },
    },
  });

  console.log("Seed complete:");
  console.log("  users: admin@example.com / admin12345 (CHANGE ME), manager@example.com, staff@example.com");
  console.log(`  locations: MAIN, BACK`);
  console.log(`  vendors: Acme, Shopify Portal, Amazon`);
  console.log(`  products: 4 SKUs with stock levels`);
  console.log(`  weekly plan: ${plan.id} (${weekStart.toISOString().slice(0, 10)})`);
  console.log(`  POs: draft=${draftPo.id}, approved=${approvedPo.id}, submitted=${submittedPo.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
