import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

export async function GET() {
  const prs = await prisma.purchaseRequest.findMany({
    where: { tenantId: TENANT_ID },
    include: {
      lines: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(prs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lines, ...header } = body;

  const count = await prisma.purchaseRequest.count({
    where: { tenantId: TENANT_ID },
  });
  const code = `PR-${String(count + 1).padStart(4, "0")}`;

  const pr = await prisma.purchaseRequest.create({
    data: {
      tenantId: TENANT_ID,
      code,
      status: "DRAFT",
      requestedBy: header.requestedBy ?? "worker",
      lines: {
        create: lines.map(
          (l: {
            productId: string;
            quantity: number;
            unit: string;
            notes?: string;
          }) => ({
            productId: l.productId,
            quantity: l.quantity,
            unit: l.unit,
            notes: l.notes,
          }),
        ),
      },
    },
    include: { lines: { include: { product: true } } },
  });
  return NextResponse.json(pr, { status: 201 });
}
