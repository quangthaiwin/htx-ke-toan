import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

export async function GET() {
  const transfers = await prisma.stockTransfer.findMany({
    include: {
      fromWh: true,
      toWh: true,
      lot: { include: { product: true } },
    },
    orderBy: { transferDate: "desc" },
  });
  return NextResponse.json(transfers);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lotId, toWhId, quantity } = body;

  const lot = await prisma.farmLot.findUnique({
    where: { id: lotId },
    include: { warehouse: true },
  });
  if (!lot)
    return NextResponse.json({ error: "Lot not found" }, { status: 404 });
  if (Number(lot.qtyOnHand) < quantity) {
    return NextResponse.json(
      { error: "Insufficient quantity" },
      { status: 400 },
    );
  }

  const transfer = await prisma.$transaction(async (tx) => {
    await tx.farmLot.update({
      where: { id: lotId },
      data: { qtyOnHand: { decrement: quantity } },
    });

    const newLot = await tx.farmLot.create({
      data: {
        productId: lot.productId,
        lotNumber: `${lot.lotNumber}-W`,
        poCode: lot.poCode,
        mfgDate: lot.mfgDate,
        expiryDate: lot.expiryDate,
        qtyOnHand: quantity,
        unitCost: lot.unitCost,
        warehouseId: toWhId,
        status: lot.status,
      },
    });

    const st = await tx.stockTransfer.create({
      data: {
        fromWhId: lot.warehouseId,
        toWhId,
        lotId: newLot.id,
        quantity,
        transferDate: new Date(),
      },
      include: {
        fromWh: true,
        toWh: true,
        lot: { include: { product: true } },
      },
    });

    return st;
  });

  return NextResponse.json(transfer, { status: 201 });
}
