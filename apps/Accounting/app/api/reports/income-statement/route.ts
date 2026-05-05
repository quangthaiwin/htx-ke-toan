import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

/**
 * GET /api/reports/income-statement?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Báo cáo kết quả hoạt động kinh doanh (B02-DN)
 *
 * Mapping chi phí sản xuất cho HTX nuôi tôm:
 * - 621: Chi phí NVL trực tiếp (thức ăn, con giống)
 * - 622: Chi phí nhân công trực tiếp (lương, công nhật)
 * - 627: Chi phí sản xuất chung (thuốc, hạ tầng, dịch vụ, IoT...)
 * Tổng 621+622+627 = Giá vốn hàng bán (tương đương 632 sau kết chuyển)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const fromStr = searchParams.get("from") || `${now.getFullYear()}-01-01`;
    const toStr = searchParams.get("to") || now.toISOString().split("T")[0];
    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);

    // Lấy journal lines trong kỳ (chỉ bút toán đã ghi sổ)
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

    // === DOANH THU ===
    const grossRevenue = getPeriodCredit("511");
    const revenueDeductions = getPeriodDebit("521");
    const netRevenue = grossRevenue - revenueDeductions;

    // === GIÁ VỐN HÀNG BÁN ===
    // Theo VAS: GVHB = 632 (sau kết chuyển cuối kỳ)
    // Thực tế HTX: chưa kết chuyển, chi phí SX nằm tại 621/622/627
    // => Tính GVHB = 632 + 621 + 622 + 627 (bao gồm cả trường hợp đã kết chuyển và chưa)
    const costOfGoodsSold =
      getPeriodDebit("632") + // Giá vốn (nếu đã kết chuyển)
      getPeriodDebit("621") + // Chi phí NVL trực tiếp
      getPeriodDebit("622") + // Chi phí nhân công trực tiếp
      getPeriodDebit("627"); // Chi phí sản xuất chung

    const grossProfit = netRevenue - costOfGoodsSold;

    // === THU NHẬP & CHI PHÍ TÀI CHÍNH ===
    const financialIncome = getPeriodCredit("515");
    const financialExpenses = getPeriodDebit("635");

    // === CHI PHÍ BÁN HÀNG & QUẢN LÝ ===
    const sellingExpenses = getPeriodDebit("641");
    const adminExpenses = getPeriodDebit("642");

    const operatingProfit =
      grossProfit +
      financialIncome -
      financialExpenses -
      sellingExpenses -
      adminExpenses;

    // === THU NHẬP & CHI PHÍ KHÁC ===
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
        // Doanh thu
        grossRevenue,
        revenueDeductions,
        netRevenue,
        // Giá vốn (chi tiết)
        costOfGoodsSold,
        directMaterials: getPeriodDebit("621"),
        directLabor: getPeriodDebit("622"),
        manufacturingOverhead: getPeriodDebit("627"),
        costOfGoodsSoldClosed: getPeriodDebit("632"),
        // Lợi nhuận gộp
        grossProfit,
        // Tài chính
        financialIncome,
        financialExpenses,
        // Bán hàng & quản lý
        sellingExpenses,
        adminExpenses,
        // Lợi nhuận thuần từ HĐKD
        operatingProfit,
        // Khác
        otherIncome,
        otherExpenses,
        otherProfit,
        // Kết quả
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
  }
}
