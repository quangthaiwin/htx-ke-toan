import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pr = await prisma.purchaseRequest.findUnique({
    where: { id },
    include: { lines: { include: { product: true } } },
  });
  if (!pr) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(pr);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { action, approvedBy } = body;

  const pr = await prisma.purchaseRequest.findUnique({ where: { id } });
  if (!pr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "submit") {
    if (pr.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Can only submit DRAFT PRs" },
        { status: 400 },
      );
    }
    const updated = await prisma.purchaseRequest.update({
      where: { id },
      data: { status: "SUBMITTED" },
      include: { lines: { include: { product: true } } },
    });
    return NextResponse.json(updated);
  }

  if (action === "approve") {
    if (pr.status !== "SUBMITTED") {
      return NextResponse.json(
        { error: "Can only approve SUBMITTED PRs" },
        { status: 400 },
      );
    }
    const updated = await prisma.purchaseRequest.update({
      where: { id },
      data: { status: "APPROVED", approvedBy: approvedBy ?? "manager" },
      include: { lines: { include: { product: true } } },
    });
    return NextResponse.json(updated);
  }

  if (action === "reject") {
    if (pr.status !== "SUBMITTED") {
      return NextResponse.json(
        { error: "Can only reject SUBMITTED PRs" },
        { status: 400 },
      );
    }
    const updated = await prisma.purchaseRequest.update({
      where: { id },
      data: { status: "REJECTED", approvedBy: approvedBy ?? "manager" },
      include: { lines: { include: { product: true } } },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
