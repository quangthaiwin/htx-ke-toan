import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

export async function GET() {
  const suppliers = await prisma.farmSupplier.findMany({
    where: { tenantId: TENANT_ID, isActive: true },
    include: {
      apEntries: { where: { status: { in: ["OPEN", "PARTIAL", "OVERDUE"] } } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(suppliers);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supplier = await prisma.farmSupplier.create({
    data: { tenantId: TENANT_ID, ...body },
  });
  return NextResponse.json(supplier, { status: 201 });
}
