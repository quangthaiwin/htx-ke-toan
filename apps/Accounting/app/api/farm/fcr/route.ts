import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const assignmentId = req.nextUrl.searchParams.get("assignmentId");
  if (!assignmentId) {
    return NextResponse.json(
      { error: "assignmentId required" },
      { status: 400 },
    );
  }

  const assignment = await prisma.pondAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      costs: { where: { costType: "FEED" } },
      issues: {
        where: { product: { category: "FEED" } },
        include: { product: true },
      },
    },
  });
  if (!assignment)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const samples = await prisma.growthSample.findMany({
    where: { assignmentId },
    orderBy: { sampleDate: "asc" },
  });

  const totalFeedKg = assignment.issues
    .filter((i: any) => i.product?.category === "FEED")
    .reduce((s: number, i: any) => s + Number(i.quantity), 0);

  const firstSample = samples[0];
  const lastSample = samples[samples.length - 1];

  let fcr: number | null = null;
  let biomassGainKg: number | null = null;

  if (firstSample && lastSample && samples.length >= 2) {
    const initialBiomass = Number(firstSample.estimatedBiomassKg);
    const currentBiomass = Number(lastSample.estimatedBiomassKg);
    biomassGainKg = currentBiomass - initialBiomass;
    if (biomassGainKg > 0) {
      fcr = totalFeedKg / biomassGainKg;
    }
  }

  return NextResponse.json({
    assignmentId,
    totalFeedKg,
    biomassGainKg,
    fcr: fcr ? Number(fcr.toFixed(2)) : null,
    sampleCount: samples.length,
    latestAvgWeightG: lastSample ? Number(lastSample.avgWeightG) : null,
    estimatedBiomassKg: lastSample
      ? Number(lastSample.estimatedBiomassKg)
      : null,
  });
}
