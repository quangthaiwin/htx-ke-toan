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
  supplierName: z.string().min(1, "Tên nhà cung cấp bắt buộc"),
  supplierTaxCode: z.string().optional(),
  supplierInvoiceNumber: z.string().optional(),
  description: z.string().optional(),
  expenseAccount: z.string().default("642"),
  lines: z.array(InvoiceLineSchema).min(1, "Cần ít nhất 1 dòng hàng hóa"),
  post: z.boolean().default(false),
});

export async function GET() {
  try {
    const invoices = await prisma.aPInvoice.findMany({
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
      supplierName,
      supplierTaxCode,
      supplierInvoiceNumber,
      description,
      expenseAccount,
      lines,
      post,
    } = parsed.data;

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

    const count = await prisma.aPInvoice.count({
      where: { tenantId: TENANT_ID },
    });
    const year = new Date(invoiceDate).getFullYear();
    const invoiceNumber = `PM-${year}-${String(count + 1).padStart(5, "0")}`;

    const invDate = new Date(invoiceDate);
    const dueDate = new Date(invDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = await prisma.aPInvoice.create({
      data: {
        tenantId: TENANT_ID,
        invoiceNumber,
        invoiceDate: invDate,
        dueDate,
        supplierId: "WALK-IN",
        supplierName,
        supplierTaxCode: supplierTaxCode || null,
        vendorInvoiceNo: supplierInvoiceNumber || null,
        description: description || `Hóa đơn mua hàng: ${supplierName}`,
        subtotal,
        vatRate: lines[0]?.vatRate ?? 0.1,
        vatAmount: totalVat,
        totalAmount,
        paidAmount: 0,
        remainingAmount: totalAmount,
        status: post ? "APPROVED" : "DRAFT",
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

    // Nếu post → tạo journal (Dr expense+1331 / Cr 331)
    if (post) {
      const accExpense = await prisma.account.findFirst({
        where: { accountNumber: expenseAccount, tenantId: TENANT_ID },
      });
      const acc1331 = await prisma.account.findFirst({
        where: { accountNumber: "1331", tenantId: TENANT_ID },
      });
      const acc331 = await prisma.account.findFirst({
        where: { accountNumber: "331", tenantId: TENANT_ID },
      });

      if (acc331 && accExpense) {
        const entryCount = await prisma.journalEntry.count({
          where: { tenantId: TENANT_ID },
        });
        await prisma.journalEntry.create({
          data: {
            tenantId: TENANT_ID,
            entryNumber: `PM-${year}-${String(entryCount + 1).padStart(5, "0")}`,
            entryDate: invDate,
            journalType: "PURCHASE",
            source: "SYSTEM",
            sourceRef: invoice.id,
            description: `Hóa đơn mua: ${supplierName} - ${invoiceNumber}`,
            totalDebit: totalAmount,
            totalCredit: totalAmount,
            status: "POSTED",
            createdBy: "system",
            lines: {
              create: [
                {
                  tenantId: TENANT_ID,
                  lineNumber: 1,
                  accountId: accExpense.id,
                  description: `Chi phí - ${supplierName}`,
                  debitAmount: subtotal,
                  creditAmount: 0,
                },
                ...(acc1331 && totalVat > 0
                  ? [
                      {
                        tenantId: TENANT_ID,
                        lineNumber: 2,
                        accountId: acc1331.id,
                        description: `Thuế GTGT đầu vào`,
                        debitAmount: totalVat,
                        creditAmount: 0,
                      },
                    ]
                  : []),
                {
                  tenantId: TENANT_ID,
                  lineNumber: acc1331 && totalVat > 0 ? 3 : 2,
                  accountId: acc331.id,
                  description: `Phải trả NCC - ${supplierName}`,
                  debitAmount: 0,
                  creditAmount: totalAmount,
                },
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
