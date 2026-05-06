import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { action, approvedBy } = body;

  const transfer = await prisma.pondTransfer.findUnique({ where: { id } });
  if (!transfer)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "confirm") {
    if (transfer.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Can only confirm DRAFT transfers" },
        { status: 400 },
      );
    }
    const updated = await prisma.pondTransfer.update({
      where: { id },
      data: { status: "CONFIRMED", approvedBy: approvedBy ?? "owner" },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
