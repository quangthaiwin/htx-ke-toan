import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const crop = await prisma.cropCycle.findUnique({
    where: { id },
    include: {
      phases: {
        include: {
          ponds: {
            include: {
              pond: true,
              costs: true,
            },
          },
        },
      },
      harvests: true,
    },
  });
  if (!crop) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Summary per pond
  const pondSummaries = crop.phases.flatMap((phase) =>
    phase.ponds.map((pa) => {
      const totalCost = pa.costs.reduce(
        (s, c) => s.add(c.amount),
        new Prisma.Decimal(0),
      );
      const harvests = crop.harvests.filter((h) => h.assignmentId === pa.id);
      const totalRevenue = harvests.reduce(
        (s, h) => s.add(h.totalRevenue),
        new Prisma.Decimal(0),
      );
      return {
        pondName: pa.pond.name,
        assignmentId: pa.id,
        shrimpCount: pa.shrimpCount,
        totalCost: Number(totalCost),
        totalRevenue: Number(totalRevenue),
        profitLoss: Number(totalRevenue.sub(totalCost)),
        costBreakdown: pa.costs.reduce((acc: Record<string, number>, c) => {
          acc[c.costType] = (acc[c.costType] ?? 0) + Number(c.amount);
          return acc;
        }, {}),
      };
    }),
  );

  const totalCost = pondSummaries.reduce((s, p) => s + p.totalCost, 0);
  const totalRevenue = pondSummaries.reduce((s, p) => s + p.totalRevenue, 0);

  return NextResponse.json({
    crop: {
      id: crop.id,
      code: crop.code,
      name: crop.name,
      status: crop.status,
    },
    totalCost,
    totalRevenue,
    profitLoss: totalRevenue - totalCost,
    ponds: pondSummaries,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  if (body.action === "close") {
    const crop = await prisma.cropCycle.update({
      where: { id },
      data: { status: "HARVESTED", endDate: new Date() },
    });
    return NextResponse.json(crop);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
