import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Decimal from "decimal.js";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

/**
 * GET /api/reports/balance-sheet?date=YYYY-MM-DD
 * Bảng cân đối kế toán (B01-DN)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr =
      searchParams.get("date") || new Date().toISOString().split("T")[0];
    const reportDate = new Date(dateStr);

    // Lấy tất cả journal lines đã posted tính đến ngày báo cáo
    const journalLines = await prisma.journalLine.findMany({
      where: {
        tenantId: TENANT_ID,
        journalEntry: {
          status: "POSTED",
          entryDate: { lte: reportDate },
        },
      },
      include: {
        account: { select: { accountNumber: true, name: true } },
      },
    });

    // Tổng hợp theo account number
    const accountBalances = new Map<
      string,
      { name: string; debit: Decimal; credit: Decimal }
    >();
    for (const line of journalLines) {
      const accNum = line.account.accountNumber;
      const existing = accountBalances.get(accNum) || {
        name: line.account.name,
        debit: new Decimal(0),
        credit: new Decimal(0),
      };
      existing.debit = existing.debit.plus(
        new Decimal(line.debitAmount.toString()),
      );
      existing.credit = existing.credit.plus(
        new Decimal(line.creditAmount.toString()),
      );
      accountBalances.set(accNum, existing);
    }

    // Helper: lấy số dư theo nhóm TK
    const getBalance = (prefix: string): number => {
      let total = new Decimal(0);
      for (const [accNum, bal] of accountBalances) {
        if (accNum.startsWith(prefix)) {
          total = total.plus(bal.debit.minus(bal.credit));
        }
      }
      return total.toNumber();
    };

    const getCreditBalance = (prefix: string): number => {
      let total = new Decimal(0);
      for (const [accNum, bal] of accountBalances) {
        if (accNum.startsWith(prefix)) {
          total = total.plus(bal.credit.minus(bal.debit));
        }
      }
      return total.toNumber();
    };

    // TÀI SẢN NGẮN HẠN
    const cashAndEquivalents =
      getBalance("111") + getBalance("112") + getBalance("113");
    const shortTermInvestments = getBalance("121") + getBalance("128");
    const shortTermReceivables =
      getBalance("131") +
      getBalance("133") +
      getBalance("136") +
      getBalance("138") +
      getBalance("141");
    const inventories =
      getBalance("151") +
      getBalance("152") +
      getBalance("153") +
      getBalance("154") +
      getBalance("155") +
      getBalance("156") +
      getBalance("157");
    const otherCurrentAssets = 0;
    const totalCurrentAssets =
      cashAndEquivalents +
      shortTermInvestments +
      shortTermReceivables +
      inventories +
      otherCurrentAssets;

    // TÀI SẢN DÀI HẠN
    const fixedAssets =
      getBalance("211") +
      getBalance("212") +
      getBalance("213") -
      getCreditBalance("214");
    const investmentProperty = getBalance("217");
    const longTermInvestments =
      getBalance("221") + getBalance("222") + getBalance("228");
    const otherNonCurrentAssets =
      getBalance("241") +
      getBalance("242") +
      getBalance("243") +
      getBalance("244");
    const totalNonCurrentAssets =
      fixedAssets +
      investmentProperty +
      longTermInvestments +
      otherNonCurrentAssets;

    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

    // NỢ PHẢI TRẢ
    const currentLiabilities =
      getCreditBalance("331") +
      getCreditBalance("333") +
      getCreditBalance("334") +
      getCreditBalance("335") +
      getCreditBalance("336") +
      getCreditBalance("337") +
      getCreditBalance("338");
    const nonCurrentLiabilities =
      getCreditBalance("341") +
      getCreditBalance("343") +
      getCreditBalance("347");
    const totalLiabilities = currentLiabilities + nonCurrentLiabilities;

    // VỐN CHỦ SỞ HỮU
    const ownersEquity = getCreditBalance("411");
    const reserves =
      getCreditBalance("414") +
      getCreditBalance("417") +
      getCreditBalance("418");
    const retainedEarnings = getCreditBalance("421");
    const totalEquity = ownersEquity + reserves + retainedEarnings;

    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return NextResponse.json({
      data: {
        reportDate: dateStr,
        currentAssets: {
          cashAndEquivalents,
          shortTermInvestments,
          shortTermReceivables,
          inventories,
          otherCurrentAssets,
          totalCurrentAssets,
        },
        nonCurrentAssets: {
          fixedAssets,
          investmentProperty,
          longTermInvestments,
          otherNonCurrentAssets,
          totalNonCurrentAssets,
        },
        totalAssets,
        liabilities: {
          currentLiabilities,
          nonCurrentLiabilities,
          totalLiabilities,
        },
        equity: { ownersEquity, reserves, retainedEarnings, totalEquity },
        totalLiabilitiesAndEquity,
        isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
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
