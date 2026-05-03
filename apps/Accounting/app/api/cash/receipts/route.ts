import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, JournalSource } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

const ReceiptSchema = z.object({
  entryDate: z.string(),
  description: z.string().min(1, "Nội dung không được trống"),
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  debitAccountNumber: z.string().default("1111"), // Tiền mặt mặc định
  creditAccountNumber: z.string(), // Đối tượng thanh toán
  payer: z.string().optional(),
  reference: z.string().optional(),
  post: z.boolean().default(true), // true = POSTED, false = DRAFT
});

export async function GET() {
  const entries = await prisma.journalEntry.findMany({
    where: { tenantId: TENANT_ID, journalType: "CASH_RECEIPT" },
    include: {
      lines: {
        include: { account: { select: { accountNumber: true, name: true } } },
      },
    },
    orderBy: { entryDate: "desc" },
    take: 100,
  });
  await prisma.$disconnect();
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parse = ReceiptSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: parse.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const {
    entryDate,
    description,
    amount,
    debitAccountNumber,
    creditAccountNumber,
    payer,
    reference,
    post,
  } = parse.data;

  try {
    const [debitAcc, creditAcc] = await Promise.all([
      prisma.account.findFirst({
        where: { accountNumber: debitAccountNumber, tenantId: TENANT_ID },
      }),
      prisma.account.findFirst({
        where: { accountNumber: creditAccountNumber, tenantId: TENANT_ID },
      }),
    ]);
    if (!debitAcc)
      return NextResponse.json(
        { error: `Không tìm thấy tài khoản Nợ: ${debitAccountNumber}` },
        { status: 422 },
      );
    if (!creditAcc)
      return NextResponse.json(
        { error: `Không tìm thấy tài khoản Có: ${creditAccountNumber}` },
        { status: 422 },
      );

    const count = await prisma.journalEntry.count({
      where: { tenantId: TENANT_ID, journalType: "CASH_RECEIPT" },
    });
    const entryNumber = `PT-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

    const entry = await prisma.journalEntry.create({
      data: {
        entryNumber,
        entryDate: new Date(entryDate),
        journalType: "CASH_RECEIPT",
        source: JournalSource.MANUAL,
        description: payer ? `${description} — ${payer}` : description,
        totalDebit: amount,
        totalCredit: amount,
        status: post ? "POSTED" : "DRAFT",
        postedAt: post ? new Date() : null,
        postedBy: post ? "HTX_DEFAULT" : null,
        sourceRef: reference,
        tenantId: TENANT_ID,
        createdBy: "HTX_DEFAULT",
        lines: {
          create: [
            {
              lineNumber: 1,
              accountId: debitAcc.id,
              description,
              debitAmount: amount,
              creditAmount: 0,
              baseCurrencyDebit: amount,
              baseCurrencyCredit: 0,
              tenantId: TENANT_ID,
            },
            {
              lineNumber: 2,
              accountId: creditAcc.id,
              description,
              debitAmount: 0,
              creditAmount: amount,
              baseCurrencyDebit: 0,
              baseCurrencyCredit: amount,
              tenantId: TENANT_ID,
            },
          ],
        },
      },
      include: { lines: true },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
