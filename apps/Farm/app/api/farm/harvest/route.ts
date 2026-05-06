import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const records = await prisma.harvestRecord.findMany({
    include: { cropCycle: true },
    orderBy: { harvestDate: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    cropCycleId,
    assignmentId,
    weightKg,
    sizePerKg,
    buyerName,
    pricePerKg,
    paymentStatus,
    notes,
  } = body;

  const totalRevenue = weightKg * pricePerKg;

  const record = await prisma.harvestRecord.create({
    data: {
      cropCycleId,
      assignmentId,
      harvestDate: new Date(),
      weightKg,
      sizePerKg,
      buyerName,
      pricePerKg,
      totalRevenue,
      paymentStatus: paymentStatus ?? "RECEIVED",
      notes,
    },
    include: { cropCycle: true },
  });

  return NextResponse.json(record, { status: 201 });
}
