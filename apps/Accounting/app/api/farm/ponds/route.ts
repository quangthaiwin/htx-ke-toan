import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

export async function GET() {
  try {
    const ponds = await prisma.pond.findMany({
      where: { tenantId: TENANT_ID, isActive: true },
      include: {
        assignments: {
          where: { status: "ACTIVE" },
          include: { phase: { include: { cropCycle: true } } },
        },
      },
      orderBy: { code: "asc" },
    });
    return NextResponse.json(ponds);
  } catch (error) {
    console.error("[farm/ponds] GET error:", error);
    return NextResponse.json(
      { error: "INTERNAL", message: "Lỗi tải dữ liệu ao" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pond = await prisma.pond.create({
    data: { tenantId: TENANT_ID, ...body },
  });
  return NextResponse.json(pond, { status: 201 });
}
