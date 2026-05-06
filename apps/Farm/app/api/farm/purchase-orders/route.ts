import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

export async function GET() {
  const pos = await prisma.purchaseOrder.findMany({
    where: { tenantId: TENANT_ID },
    include: {
      supplier: true,
      lines: { include: { product: true } },
      grns: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(pos);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { supplierId, prId, lines } = body;

  const count = await prisma.purchaseOrder.count({
    where: { tenantId: TENANT_ID },
  });
  const code = `PO-${String(count + 1).padStart(4, "0")}`;

  const totalAmount = lines.reduce(
    (sum: number, l: { quantity: number; unitPrice: number }) =>
      sum + l.quantity * l.unitPrice,
    0,
  );

  const po = await prisma.purchaseOrder.create({
    data: {
      tenantId: TENANT_ID,
      code,
      supplierId,
      prId: prId ?? null,
      status: "DRAFT",
      totalAmount,
      lines: {
        create: lines.map(
          (l: {
            productId: string;
            quantity: number;
            unit: string;
            unitPrice: number;
          }) => ({
            productId: l.productId,
            quantity: l.quantity,
            unit: l.unit,
            unitPrice: l.unitPrice,
            amount: l.quantity * l.unitPrice,
          }),
        ),
      },
    },
    include: { supplier: true, lines: { include: { product: true } } },
  });
  return NextResponse.json(po, { status: 201 });
}
