import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { apEntryId, amount, method, approvedBy, notes } = body;

  const ap = await prisma.aPEntry.findUnique({ where: { id: apEntryId } });
  if (!ap)
    return NextResponse.json({ error: "AP entry not found" }, { status: 404 });

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        apEntryId,
        amount,
        payDate: new Date(),
        method,
        approvedBy,
        notes,
      },
    });

    const newBalance = Number(ap.balance) - amount;
    await tx.aPEntry.update({
      where: { id: apEntryId },
      data: {
        balance: newBalance,
        status: newBalance <= 0 ? "PAID" : "PARTIAL",
      },
    });

    return payment;
  });

  return NextResponse.json(result, { status: 201 });
}
