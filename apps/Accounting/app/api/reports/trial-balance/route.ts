import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

/**
 * GET /api/reports/trial-balance?date=YYYY-MM-DD
 * Bảng cân đối phát sinh
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const fromStr = searchParams.get("from") || `${now.getFullYear()}-01-01`;
    const toStr = searchParams.get("to") || now.toISOString().split("T")[0];
    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);

    // Lấy số dư đầu kỳ (trước fromDate)
    const openingLines = await prisma.journalLine.findMany({
      where: {
        tenantId: TENANT_ID,
        journalEntry: { status: "POSTED", entryDate: { lt: fromDate } },
      },
      include: { account: { select: { accountNumber: true, name: true } } },
    });

    // Lấy phát sinh trong kỳ
    const periodLines = await prisma.journalLine.findMany({
      where: {
        tenantId: TENANT_ID,
        journalEntry: {
          status: "POSTED",
          entryDate: { gte: fromDate, lte: toDate },
        },
      },
      include: { account: { select: { accountNumber: true, name: true } } },
    });

    // Tổng hợp
    const accounts = new Map<
      string,
      {
        accountNumber: string;
        accountName: string;
        openingDebit: number;
        openingCredit: number;
        periodDebit: number;
        periodCredit: number;
        closingDebit: number;
        closingCredit: number;
      }
    >();

    // Opening balances
    for (const line of openingLines) {
      const accNum = line.account.accountNumber;
      const existing = accounts.get(accNum) || {
        accountNumber: accNum,
        accountName: line.account.name,
        openingDebit: 0,
        openingCredit: 0,
        periodDebit: 0,
        periodCredit: 0,
        closingDebit: 0,
        closingCredit: 0,
      };
      existing.openingDebit += Number(line.debitAmount);
      existing.openingCredit += Number(line.creditAmount);
      accounts.set(accNum, existing);
    }

    // Period movements
    for (const line of periodLines) {
      const accNum = line.account.accountNumber;
      const existing = accounts.get(accNum) || {
        accountNumber: accNum,
        accountName: line.account.name,
        openingDebit: 0,
        openingCredit: 0,
        periodDebit: 0,
        periodCredit: 0,
        closingDebit: 0,
        closingCredit: 0,
      };
      existing.periodDebit += Number(line.debitAmount);
      existing.periodCredit += Number(line.creditAmount);
      accounts.set(accNum, existing);
    }

    // Tính closing balances
    const rows = Array.from(accounts.values())
      .map((acc) => {
        const netOpening = acc.openingDebit - acc.openingCredit;
        const netPeriod = acc.periodDebit - acc.periodCredit;
        const netClosing = netOpening + netPeriod;
        return {
          ...acc,
          closingDebit: netClosing > 0 ? netClosing : 0,
          closingCredit: netClosing < 0 ? -netClosing : 0,
        };
      })
      .sort((a, b) => a.accountNumber.localeCompare(b.accountNumber));

    // Tổng cộng
    const totals = rows.reduce(
      (t, r) => ({
        openingDebit: t.openingDebit + r.openingDebit,
        openingCredit: t.openingCredit + r.openingCredit,
        periodDebit: t.periodDebit + r.periodDebit,
        periodCredit: t.periodCredit + r.periodCredit,
        closingDebit: t.closingDebit + r.closingDebit,
        closingCredit: t.closingCredit + r.closingCredit,
      }),
      {
        openingDebit: 0,
        openingCredit: 0,
        periodDebit: 0,
        periodCredit: 0,
        closingDebit: 0,
        closingCredit: 0,
      },
    );

    return NextResponse.json({
      data: {
        periodStart: fromStr,
        periodEnd: toStr,
        rows,
        totals,
        isBalanced: Math.abs(totals.periodDebit - totals.periodCredit) < 0.01,
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
