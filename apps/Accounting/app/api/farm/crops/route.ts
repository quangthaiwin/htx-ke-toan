import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

export async function GET() {
  const crops = await prisma.cropCycle.findMany({
    where: { tenantId: TENANT_ID },
    include: {
      phases: {
        orderBy: { phaseNumber: "asc" },
        include: {
          ponds: {
            where: { status: "ACTIVE" },
            include: { pond: true },
          },
        },
      },
    },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(crops);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const crop = await prisma.cropCycle.create({
    data: { tenantId: TENANT_ID, ...body },
  });
  return NextResponse.json(crop, { status: 201 });
}
