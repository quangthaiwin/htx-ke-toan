import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Decimal from "decimal.js";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

/**
 * GET /api/reports/income-statement?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Báo cáo kết quả hoạt động kinh doanh (B02-DN)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const fromStr = searchParams.get("from") || `${now.getFullYear()}-01-01`;
    const toStr = searchParams.get("to") || now.toISOString().split("T")[0];
    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);

    // Lấy journal lines trong kỳ
    const journalLines = await prisma.journalLine.findMany({
      where: {
        tenantId: TENANT_ID,
        journalEntry: {
          status: "POSTED",
          entryDate: { gte: fromDate, lte: toDate },
        },
      },
      include: {
        account: { select: { accountNumber: true, name: true } },
      },
    });

    // Tổng hợp theo account prefix
    const getPeriodDebit = (prefix: string): number => {
      return journalLines
        .filter((l) => l.account.accountNumber.startsWith(prefix))
        .reduce((sum, l) => sum + Number(l.debitAmount), 0);
    };

    const getPeriodCredit = (prefix: string): number => {
      return journalLines
        .filter((l) => l.account.accountNumber.startsWith(prefix))
        .reduce((sum, l) => sum + Number(l.creditAmount), 0);
    };

    const grossRevenue = getPeriodCredit("511");
    const revenueDeductions = getPeriodDebit("521");
    const netRevenue = grossRevenue - revenueDeductions;

    const costOfGoodsSold = getPeriodDebit("632");
    const grossProfit = netRevenue - costOfGoodsSold;

    const financialIncome = getPeriodCredit("515");
    const financialExpenses = getPeriodDebit("635");
    const sellingExpenses = getPeriodDebit("641");
    const adminExpenses = getPeriodDebit("642");

    const operatingProfit =
      grossProfit +
      financialIncome -
      financialExpenses -
      sellingExpenses -
      adminExpenses;

    const otherIncome = getPeriodCredit("711");
    const otherExpenses = getPeriodDebit("811");
    const otherProfit = otherIncome - otherExpenses;

    const profitBeforeTax = operatingProfit + otherProfit;
    const citExpense = getPeriodDebit("821");
    const netProfit = profitBeforeTax - citExpense;

    return NextResponse.json({
      data: {
        periodStart: fromStr,
        periodEnd: toStr,
        grossRevenue,
        revenueDeductions,
        netRevenue,
        costOfGoodsSold,
        grossProfit,
        financialIncome,
        financialExpenses,
        sellingExpenses,
        adminExpenses,
        operatingProfit,
        otherIncome,
        otherExpenses,
        otherProfit,
        profitBeforeTax,
        citExpense,
        netProfit,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi server" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
