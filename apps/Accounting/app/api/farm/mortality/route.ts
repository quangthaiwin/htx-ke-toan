import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const records = await prisma.mortalityRecord.findMany({
    include: { assignment: { include: { pond: true } } },
    orderBy: { recordDate: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { assignmentId, count, cause, reportedBy } = body;

  const assignment = await prisma.pondAssignment.findUnique({
    where: { id: assignmentId },
  });
  if (!assignment)
    return NextResponse.json(
      { error: "Assignment not found" },
      { status: 404 },
    );

  const result = await prisma.$transaction(async (tx) => {
    const record = await tx.mortalityRecord.create({
      data: {
        assignmentId,
        count,
        recordDate: new Date(),
        cause,
        reportedBy: reportedBy ?? "worker",
      },
    });

    await tx.pondAssignment.update({
      where: { id: assignmentId },
      data: { shrimpCount: { decrement: count } },
    });

    return record;
  });

  return NextResponse.json(result, { status: 201 });
}
