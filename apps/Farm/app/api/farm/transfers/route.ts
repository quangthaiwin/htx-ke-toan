import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const transfers = await prisma.pondTransfer.findMany({
    include: {
      fromPhase: { include: { cropCycle: true } },
      toPhase: { include: { cropCycle: true } },
    },
    orderBy: { transferDate: "desc" },
  });
  return NextResponse.json(transfers);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { fromAssignmentId, toPhaseId, toPondId, shrimpCount, notes } = body;

  const fromAssignment = await prisma.pondAssignment.findUnique({
    where: { id: fromAssignmentId },
    include: { costs: true, phase: true },
  });
  if (!fromAssignment)
    return NextResponse.json(
      { error: "Source assignment not found" },
      { status: 404 },
    );
  if (fromAssignment.shrimpCount < shrimpCount) {
    return NextResponse.json(
      { error: "Cannot transfer more shrimp than available" },
      { status: 400 },
    );
  }

  // Cascading cost: total CP / surviving shrimp = costPerUnit
  const totalCost = fromAssignment.costs.reduce(
    (s, c) => s.add(c.amount),
    new Prisma.Decimal(0),
  );
  const costPerUnit =
    fromAssignment.shrimpCount > 0
      ? totalCost.div(fromAssignment.shrimpCount)
      : new Prisma.Decimal(0);

  const transfer = await prisma.$transaction(async (tx) => {
    // Decrement source
    await tx.pondAssignment.update({
      where: { id: fromAssignmentId },
      data: { shrimpCount: { decrement: shrimpCount } },
    });

    // Create or find target assignment
    let toAssignment = await tx.pondAssignment.findFirst({
      where: { phaseId: toPhaseId, pondId: toPondId, status: "ACTIVE" },
    });

    if (!toAssignment) {
      toAssignment = await tx.pondAssignment.create({
        data: {
          phaseId: toPhaseId,
          pondId: toPondId,
          shrimpCount: 0,
          startDate: new Date(),
          status: "ACTIVE",
        },
      });
    }

    await tx.pondAssignment.update({
      where: { id: toAssignment.id },
      data: { shrimpCount: { increment: shrimpCount } },
    });

    // Seed cost entry on target
    await tx.pondCostEntry.create({
      data: {
        assignmentId: toAssignment.id,
        costType: "SEED",
        amount: costPerUnit.mul(shrimpCount),
        description: `San tôm từ ao gốc: ${shrimpCount} con × ${costPerUnit.toFixed(2)}đ/con`,
        transactionDate: new Date(),
      },
    });

    // Update phase seedCostPerUnit
    await tx.cropPhase.update({
      where: { id: toPhaseId },
      data: { seedCostPerUnit: costPerUnit },
    });

    const record = await tx.pondTransfer.create({
      data: {
        fromPhaseId: fromAssignment.phaseId,
        toPhaseId,
        fromAssignmentId,
        toAssignmentId: toAssignment.id,
        shrimpCount,
        costPerUnit,
        transferDate: new Date(),
        status: "DRAFT",
        notes,
      },
    });

    return record;
  });

  return NextResponse.json(transfer, { status: 201 });
}
