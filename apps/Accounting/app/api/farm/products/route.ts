import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

export async function GET() {
  const products = await prisma.farmProduct.findMany({
    where: { tenantId: TENANT_ID, isActive: true },
    include: { lots: { where: { status: { in: ["AVAILABLE", "EXPIRING"] } } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const product = await prisma.farmProduct.create({
    data: { tenantId: TENANT_ID, ...body },
  });
  return NextResponse.json(product, { status: 201 });
}
