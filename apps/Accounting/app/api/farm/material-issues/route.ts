import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const issues = await prisma.materialIssue.findMany({
    include: {
      assignment: { include: { pond: true } },
      product: true,
    },
    orderBy: { issueDate: "desc" },
  });
  return NextResponse.json(issues);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { productId, assignments, warehouseId } = body;
  // assignments: [{ assignmentId, quantity }]

  const lots = await prisma.farmLot.findMany({
    where: {
      productId,
      warehouseId,
      status: { in: ["AVAILABLE", "EXPIRING"] },
      qtyOnHand: { gt: 0 },
    },
    orderBy: { expiryDate: "asc" }, // FEFO
  });

  const totalNeeded = assignments.reduce(
    (s: number, a: { quantity: number }) => s + a.quantity,
    0,
  );
  const totalAvailable = lots.reduce(
    (s: number, l: any) => s + Number(l.qtyOnHand),
    0,
  );

  if (totalAvailable < totalNeeded) {
    return NextResponse.json(
      {
        error: "Insufficient stock",
        available: totalAvailable,
        needed: totalNeeded,
      },
      { status: 400 },
    );
  }

  // Check no expired lots would be used
  const now = new Date();
  const expiredLots = lots.filter((l) => l.expiryDate < now);
  if (
    expiredLots.length > 0 &&
    lots
      .filter((l) => l.expiryDate >= now)
      .reduce((s, l) => s + Number(l.qtyOnHand), 0) < totalNeeded
  ) {
    return NextResponse.json(
      { error: "Would need expired lots — blocked by FEFO policy" },
      { status: 400 },
    );
  }

  const validLots = lots.filter((l) => l.expiryDate >= now);

  const result = await prisma.$transaction(async (tx) => {
    const issues: any[] = [];
    let lotIdx = 0;
    let lotRemaining = Number(validLots[0]?.qtyOnHand ?? 0);

    for (const { assignmentId, quantity } of assignments) {
      let remaining = quantity;
      let totalCost = new Prisma.Decimal(0);

      while (remaining > 0 && lotIdx < validLots.length) {
        const take = Math.min(remaining, lotRemaining);
        const cost = new Prisma.Decimal(take).mul(validLots[lotIdx].unitCost);
        totalCost = totalCost.add(cost);

        await tx.farmLot.update({
          where: { id: validLots[lotIdx].id },
          data: {
            qtyOnHand: { decrement: take },
            status: lotRemaining - take <= 0 ? "DEPLETED" : undefined,
          },
        });

        remaining -= take;
        lotRemaining -= take;

        if (lotRemaining <= 0) {
          lotIdx++;
          lotRemaining = Number(validLots[lotIdx]?.qtyOnHand ?? 0);
        }
      }

      const unitCost = totalCost.div(quantity);

      const issue = await tx.materialIssue.create({
        data: {
          assignmentId,
          productId,
          lotId: validLots[Math.max(0, lotIdx - 1)]?.id,
          quantity,
          unitCost,
          totalCost,
          issueDate: new Date(),
          issuedBy: body.issuedBy ?? "worker",
          notes: body.notes,
        },
      });

      // Auto cost entry
      const product = await tx.farmProduct.findUnique({
        where: { id: productId },
      });
      await tx.pondCostEntry.create({
        data: {
          assignmentId,
          costType: (product?.category as any) ?? "OTHER",
          amount: totalCost,
          description: `Xuất ${product?.name} × ${quantity} ${product?.secondaryUnit}`,
          transactionDate: new Date(),
          materialIssueId: issue.id,
        },
      });

      issues.push(issue);
    }

    return issues;
  });

  return NextResponse.json(result, { status: 201 });
}
