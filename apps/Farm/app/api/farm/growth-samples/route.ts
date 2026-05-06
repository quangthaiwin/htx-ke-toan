import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const assignmentId = req.nextUrl.searchParams.get("assignmentId");

  const where = assignmentId ? { assignmentId } : {};
  const samples = await prisma.growthSample.findMany({
    where,
    include: { assignment: { include: { pond: true } } },
    orderBy: { sampleDate: "desc" },
  });
  return NextResponse.json(samples);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { assignmentId, avgWeightG, sampleCount } = body;

  const assignment = await prisma.pondAssignment.findUnique({
    where: { id: assignmentId },
  });
  if (!assignment)
    return NextResponse.json(
      { error: "Assignment not found" },
      { status: 404 },
    );

  const estimatedBiomassKg = (avgWeightG * assignment.shrimpCount) / 1000;

  const sample = await prisma.growthSample.create({
    data: {
      assignmentId,
      sampleDate: new Date(),
      avgWeightG,
      sampleCount,
      estimatedBiomassKg,
    },
    include: { assignment: { include: { pond: true } } },
  });

  return NextResponse.json(sample, { status: 201 });
}
