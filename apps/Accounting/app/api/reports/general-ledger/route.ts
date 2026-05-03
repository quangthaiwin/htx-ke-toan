import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

/**
 * GET /api/reports/general-ledger?from=YYYY-MM-DD&to=YYYY-MM-DD&account=131
 * Sổ cái tổng hợp
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const fromStr = searchParams.get("from") || `${now.getFullYear()}-01-01`;
    const toStr = searchParams.get("to") || now.toISOString().split("T")[0];
    const accountFilter = searchParams.get("account") || "";
    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);

    // Query journal lines
    const whereClause: Record<string, unknown> = {
      tenantId: TENANT_ID,
      journalEntry: {
        status: "POSTED",
        entryDate: { gte: fromDate, lte: toDate },
      },
    };

    // Nếu filter theo account
    if (accountFilter) {
      whereClause.account = { accountNumber: { startsWith: accountFilter } };
    }

    const journalLines = await prisma.journalLine.findMany({
      where: whereClause,
      include: {
        account: { select: { accountNumber: true, name: true } },
        journalEntry: {
          select: { entryNumber: true, entryDate: true, description: true },
        },
      },
      orderBy: [{ journalEntry: { entryDate: "asc" } }, { lineNumber: "asc" }],
    });

    // Group by account
    const accountSummary = new Map<
      string,
      {
        accountNumber: string;
        accountName: string;
        totalDebit: number;
        totalCredit: number;
        entries: Array<{
          date: string;
          entryNumber: string;
          description: string | null;
          debit: number;
          credit: number;
        }>;
      }
    >();

    for (const line of journalLines) {
      const accNum = line.account.accountNumber;
      const existing = accountSummary.get(accNum) || {
        accountNumber: accNum,
        accountName: line.account.name,
        totalDebit: 0,
        totalCredit: 0,
        entries: [],
      };
      existing.totalDebit += Number(line.debitAmount);
      existing.totalCredit += Number(line.creditAmount);
      existing.entries.push({
        date: line.journalEntry.entryDate.toISOString().split("T")[0],
        entryNumber: line.journalEntry.entryNumber,
        description: line.description,
        debit: Number(line.debitAmount),
        credit: Number(line.creditAmount),
      });
      accountSummary.set(accNum, existing);
    }

    // Sắp xếp theo account number
    const accounts = Array.from(accountSummary.values()).sort((a, b) =>
      a.accountNumber.localeCompare(b.accountNumber),
    );

    return NextResponse.json({
      data: {
        periodStart: fromStr,
        periodEnd: toStr,
        accounts,
        totalAccounts: accounts.length,
        totalEntries: journalLines.length,
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
