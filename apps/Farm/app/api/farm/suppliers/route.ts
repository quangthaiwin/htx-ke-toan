import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

export async function GET() {
  try {
    const suppliers = await prisma.farmSupplier.findMany({
      where: { tenantId: TENANT_ID, isActive: true },
      include: {
        apEntries: {
          where: { status: { in: ["OPEN", "PARTIAL", "OVERDUE"] } },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("[farm/suppliers] GET error:", error);
    return NextResponse.json(
      { error: "INTERNAL", message: "Lỗi tải dữ liệu NCC" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supplier = await prisma.farmSupplier.create({
    data: { tenantId: TENANT_ID, ...body },
  });
  return NextResponse.json(supplier, { status: 201 });
}
