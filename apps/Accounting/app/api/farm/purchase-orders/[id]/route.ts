import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      lines: { include: { product: true } },
      grns: { include: { lines: true } },
    },
  });
  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(po);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const transitions: Record<string, { from: string[]; to: string }> = {
    approve: { from: ["DRAFT"], to: "APPROVED" },
    send: { from: ["APPROVED"], to: "SENT" },
    complete: { from: ["RECEIVED"], to: "COMPLETED" },
  };

  const t = transitions[action];
  if (!t)
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  if (!t.from.includes(po.status)) {
    return NextResponse.json(
      { error: `Cannot ${action} PO in ${po.status} status` },
      { status: 400 },
    );
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: t.to as any },
    include: { supplier: true, lines: { include: { product: true } } },
  });
  return NextResponse.json(updated);
}
