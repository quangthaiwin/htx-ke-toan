import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

export async function GET() {
  const warehouses = await prisma.farmWarehouse.findMany({
    where: { tenantId: TENANT_ID },
    include: {
      lots: {
        where: {
          status: { in: ["AVAILABLE", "EXPIRING"] },
          qtyOnHand: { gt: 0 },
        },
        include: { product: true },
        orderBy: { expiryDate: "asc" },
      },
    },
  });
  return NextResponse.json(warehouses);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const wh = await prisma.farmWarehouse.create({
    data: { tenantId: TENANT_ID, ...body },
  });
  return NextResponse.json(wh, { status: 201 });
}
