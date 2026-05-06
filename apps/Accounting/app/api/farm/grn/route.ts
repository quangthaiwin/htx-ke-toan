import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const grns = await prisma.goodsReceipt.findMany({
    include: {
      po: { include: { supplier: true } },
      lines: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(grns);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { poId, receivedBy, lines } = body;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { lines: true },
  });
  if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 });
  if (!["SENT", "APPROVED"].includes(po.status)) {
    return NextResponse.json(
      { error: "PO not ready for receiving" },
      { status: 400 },
    );
  }

  const mainWarehouse = await prisma.farmWarehouse.findFirst({
    where: { tenantId: po.tenantId, type: "MAIN" },
  });
  if (!mainWarehouse) {
    return NextResponse.json(
      { error: "No MAIN warehouse found" },
      { status: 400 },
    );
  }

  const grn = await prisma.$transaction(async (tx) => {
    const grnRecord = await tx.goodsReceipt.create({
      data: {
        poId,
        status: "RECEIVED",
        receivedBy: receivedBy ?? "worker",
        receivedAt: new Date(),
        lines: {
          create: await Promise.all(
            lines.map(
              async (l: {
                productId: string;
                qtyReceived: number;
                unit: string;
                mfgDate: string;
                expiryDate: string;
                unitCost: number;
              }) => {
                const lot = await tx.farmLot.create({
                  data: {
                    productId: l.productId,
                    lotNumber: `${po.code}-${Date.now().toString(36)}`,
                    poCode: po.code,
                    mfgDate: new Date(l.mfgDate),
                    expiryDate: new Date(l.expiryDate),
                    qtyOnHand: l.qtyReceived,
                    unitCost: l.unitCost,
                    warehouseId: mainWarehouse.id,
                    status: "AVAILABLE",
                  },
                });
                return {
                  productId: l.productId,
                  lotId: lot.id,
                  qtyReceived: l.qtyReceived,
                  unit: l.unit,
                };
              },
            ),
          ),
        },
      },
      include: { lines: { include: { product: true } } },
    });

    await tx.purchaseOrder.update({
      where: { id: poId },
      data: { status: "RECEIVED" },
    });

    return grnRecord;
  });

  return NextResponse.json(grn, { status: 201 });
}
