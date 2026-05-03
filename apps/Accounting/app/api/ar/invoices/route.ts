import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

const InvoiceLineSchema = z.object({
  description: z.string().min(1, "Tên hàng hóa/dịch vụ bắt buộc"),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  vatRate: z.number().min(0).max(1).default(0.1),
});

const CreateInvoiceSchema = z.object({
  invoiceDate: z.string(),
  customerName: z.string().min(1, "Tên khách hàng bắt buộc"),
  customerTaxCode: z.string().optional(),
  customerAddress: z.string().optional(),
  description: z.string().optional(),
  lines: z.array(InvoiceLineSchema).min(1, "Cần ít nhất 1 dòng hàng hóa"),
  post: z.boolean().default(false),
});

export async function GET() {
  try {
    const invoices = await prisma.aRInvoice.findMany({
      where: { tenantId: TENANT_ID },
      orderBy: { invoiceDate: "desc" },
      take: 100,
      include: { lines: true },
    });
    return NextResponse.json({ data: invoices });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi server" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CreateInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }
    const {
      invoiceDate,
      customerName,
      customerTaxCode,
      description,
      lines,
      post,
    } = parsed.data;

    // Tính toán
    let subtotal = 0;
    let totalVat = 0;
    const invoiceLines = lines.map((line, idx) => {
      const amount = line.quantity * line.unitPrice;
      const vatAmount = amount * line.vatRate;
      subtotal += amount;
      totalVat += vatAmount;
      return {
        lineNumber: idx + 1,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        amount,
        vatRate: line.vatRate,
        vatAmount,
      };
    });
    const totalAmount = subtotal + totalVat;

    // Tạo số hóa đơn
    const count = await prisma.aRInvoice.count({
      where: { tenantId: TENANT_ID },
    });
    const year = new Date(invoiceDate).getFullYear();
    const invoiceNumber = `HD-${year}-${String(count + 1).padStart(5, "0")}`;

    // Tính ngày đáo hạn (30 ngày)
    const invDate = new Date(invoiceDate);
    const dueDate = new Date(invDate);
    dueDate.setDate(dueDate.getDate() + 30);

    // Tạo invoice
    const invoice = await prisma.aRInvoice.create({
      data: {
        tenantId: TENANT_ID,
        invoiceNumber,
        invoiceDate: invDate,
        dueDate,
        customerId: "WALK-IN",
        customerName,
        customerTaxCode: customerTaxCode || null,
        description: description || `Hóa đơn bán hàng: ${customerName}`,
        subtotal,
        vatRate: lines[0]?.vatRate ?? 0.1,
        vatAmount: totalVat,
        totalAmount,
        paidAmount: 0,
        remainingAmount: totalAmount,
        status: post ? "SENT" : "DRAFT",
        createdBy: "system",
        lines: {
          create: invoiceLines.map((l) => ({
            tenantId: TENANT_ID,
            lineNumber: l.lineNumber,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            amount: l.amount,
            vatRate: l.vatRate,
            vatAmount: l.vatAmount,
          })),
        },
      },
      include: { lines: true },
    });

    // Nếu post → tạo journal entry (Dr 131 / Cr 511 + Cr 33311)
    if (post) {
      const acc131 = await prisma.account.findFirst({
        where: { accountNumber: "131", tenantId: TENANT_ID },
      });
      const acc511 = await prisma.account.findFirst({
        where: { accountNumber: "5111", tenantId: TENANT_ID },
      });
      const acc33311 = await prisma.account.findFirst({
        where: { accountNumber: "33311", tenantId: TENANT_ID },
      });

      if (acc131 && acc511) {
        const entryCount = await prisma.journalEntry.count({
          where: { tenantId: TENANT_ID },
        });
        await prisma.journalEntry.create({
          data: {
            tenantId: TENANT_ID,
            entryNumber: `HD-${year}-${String(entryCount + 1).padStart(5, "0")}`,
            entryDate: invDate,
            journalType: "SALES",
            source: "SYSTEM",
            sourceRef: invoice.id,
            description: `Hóa đơn bán hàng: ${customerName} - ${invoiceNumber}`,
            totalDebit: totalAmount,
            totalCredit: totalAmount,
            status: "POSTED",
            createdBy: "system",
            lines: {
              create: [
                {
                  tenantId: TENANT_ID,
                  lineNumber: 1,
                  accountId: acc131.id,
                  description: `Phải thu KH - ${customerName}`,
                  debitAmount: totalAmount,
                  creditAmount: 0,
                },
                {
                  tenantId: TENANT_ID,
                  lineNumber: 2,
                  accountId: acc511.id,
                  description: `Doanh thu bán hàng`,
                  debitAmount: 0,
                  creditAmount: subtotal,
                },
                ...(acc33311 && totalVat > 0
                  ? [
                      {
                        tenantId: TENANT_ID,
                        lineNumber: 3,
                        accountId: acc33311.id,
                        description: `Thuế GTGT đầu ra`,
                        debitAmount: 0,
                        creditAmount: totalVat,
                      },
                    ]
                  : []),
              ],
            },
          },
        });
      }
    }

    return NextResponse.json({ data: invoice }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi server" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
