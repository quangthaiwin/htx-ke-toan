import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

export async function POST() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_SEED !== "true"
  ) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Seed không khả dụng trong production" },
      { status: 403 },
    );
  }

  const existing = await prisma.farmProduct.findFirst({
    where: { tenantId: TENANT_ID },
  });
  if (existing) {
    return NextResponse.json({ message: "Farm data already seeded" });
  }

  // Products
  const products = await Promise.all([
    prisma.farmProduct.create({
      data: {
        tenantId: TENANT_ID,
        code: "FEED-001",
        name: "Thức ăn Grobest #2",
        category: "FEED",
        primaryUnit: "BAO",
        secondaryUnit: "KG",
        conversionRate: 25,
      },
    }),
    prisma.farmProduct.create({
      data: {
        tenantId: TENANT_ID,
        code: "MIN-001",
        name: "Khoáng tạt AquaMin",
        category: "MINERAL",
        primaryUnit: "CHAI",
        secondaryUnit: "ML",
        conversionRate: 500,
      },
    }),
    prisma.farmProduct.create({
      data: {
        tenantId: TENANT_ID,
        code: "PRO-001",
        name: "Vi sinh ProBio",
        category: "PROBIOTIC",
        primaryUnit: "CHAI",
        secondaryUnit: "ML",
        conversionRate: 1000,
      },
    }),
    prisma.farmProduct.create({
      data: {
        tenantId: TENANT_ID,
        code: "MED-001",
        name: "Thuốc BKC diệt khuẩn",
        category: "MEDICINE",
        primaryUnit: "THÙNG",
        secondaryUnit: "LÍT",
        conversionRate: 20,
      },
    }),
  ]);

  // Warehouses
  const whMain = await prisma.farmWarehouse.create({
    data: {
      tenantId: TENANT_ID,
      code: "WH-MAIN",
      name: "Kho chính",
      type: "MAIN",
    },
  });
  const whWorking = await prisma.farmWarehouse.create({
    data: {
      tenantId: TENANT_ID,
      code: "WH-WORK",
      name: "Kho tạm (tại ao)",
      type: "WORKING",
    },
  });

  // Lots
  await Promise.all([
    prisma.farmLot.create({
      data: {
        productId: products[0].id,
        lotNumber: "L001",
        poCode: "PO-002",
        mfgDate: new Date("2026-03-01"),
        expiryDate: new Date("2026-06-15"),
        qtyOnHand: 18.5,
        unitCost: 14000,
        warehouseId: whWorking.id,
        status: "AVAILABLE",
      },
    }),
    prisma.farmLot.create({
      data: {
        productId: products[0].id,
        lotNumber: "L002",
        poCode: "PO-002",
        mfgDate: new Date("2026-03-15"),
        expiryDate: new Date("2026-07-20"),
        qtyOnHand: 25,
        unitCost: 14000,
        warehouseId: whMain.id,
        status: "AVAILABLE",
      },
    }),
    prisma.farmLot.create({
      data: {
        productId: products[1].id,
        lotNumber: "L003",
        mfgDate: new Date("2026-01-10"),
        expiryDate: new Date("2026-05-08"),
        qtyOnHand: 2500,
        unitCost: 120,
        warehouseId: whWorking.id,
        status: "EXPIRING",
      },
    }),
    prisma.farmLot.create({
      data: {
        productId: products[2].id,
        lotNumber: "L004",
        mfgDate: new Date("2026-02-20"),
        expiryDate: new Date("2026-05-25"),
        qtyOnHand: 3000,
        unitCost: 80,
        warehouseId: whMain.id,
        status: "AVAILABLE",
      },
    }),
  ]);

  // Ponds
  const ponds = await Promise.all([
    prisma.pond.create({
      data: { tenantId: TENANT_ID, code: "AO-1", name: "Ao 1", areaM2: 2000 },
    }),
    prisma.pond.create({
      data: { tenantId: TENANT_ID, code: "AO-2", name: "Ao 2", areaM2: 1500 },
    }),
    prisma.pond.create({
      data: { tenantId: TENANT_ID, code: "AO-3", name: "Ao 3", areaM2: 1500 },
    }),
    prisma.pond.create({
      data: { tenantId: TENANT_ID, code: "AO-4", name: "Ao 4", areaM2: 1200 },
    }),
  ]);

  // Suppliers
  const suppliers = await Promise.all([
    prisma.farmSupplier.create({
      data: {
        tenantId: TENANT_ID,
        code: "NCC-01",
        name: "Grobest",
        phone: "0909123456",
      },
    }),
    prisma.farmSupplier.create({
      data: {
        tenantId: TENANT_ID,
        code: "NCC-02",
        name: "BioMin",
        phone: "0909234567",
      },
    }),
    prisma.farmSupplier.create({
      data: {
        tenantId: TENANT_ID,
        code: "NCC-03",
        name: "AquaChem",
        phone: "0909345678",
      },
    }),
  ]);

  // Crop Cycle + Phases + Assignments
  const crop = await prisma.cropCycle.create({
    data: {
      tenantId: TENANT_ID,
      code: "VU-2026-01",
      name: "Vụ 1/2026",
      startDate: new Date("2026-03-01"),
      status: "ACTIVE",
    },
  });

  const phase1 = await prisma.cropPhase.create({
    data: {
      cropCycleId: crop.id,
      phaseNumber: 1,
      name: "Ương",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-04-15"),
    },
  });

  const phase2 = await prisma.cropPhase.create({
    data: {
      cropCycleId: crop.id,
      phaseNumber: 2,
      name: "Nuôi thương phẩm",
      startDate: new Date("2026-04-16"),
    },
  });

  // Pond assignments — Phase 1 (ương)
  await prisma.pondAssignment.create({
    data: {
      phaseId: phase1.id,
      pondId: ponds[0].id,
      shrimpCount: 380000,
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-04-15"),
      status: "TRANSFERRED",
    },
  });

  // Phase 2 assignments
  await Promise.all([
    prisma.pondAssignment.create({
      data: {
        phaseId: phase2.id,
        pondId: ponds[1].id,
        shrimpCount: 145000,
        startDate: new Date("2026-04-16"),
      },
    }),
    prisma.pondAssignment.create({
      data: {
        phaseId: phase2.id,
        pondId: ponds[2].id,
        shrimpCount: 120000,
        startDate: new Date("2026-04-16"),
      },
    }),
    prisma.pondAssignment.create({
      data: {
        phaseId: phase2.id,
        pondId: ponds[3].id,
        shrimpCount: 95000,
        startDate: new Date("2026-04-16"),
      },
    }),
  ]);

  return NextResponse.json({
    message: "Farm data seeded successfully",
    counts: {
      products: products.length,
      warehouses: 2,
      ponds: ponds.length,
      suppliers: suppliers.length,
      cropCycles: 1,
      phases: 2,
    },
  });
}
