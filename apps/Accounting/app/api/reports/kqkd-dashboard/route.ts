import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

/**
 * GET /api/reports/kqkd-dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Dashboard KQKD Data Story - HTX Farmext Aqua Cần Giờ
 * Trả về dữ liệu tổng hợp cho:
 * - Summary (tổng doanh thu, chi phí, lãi/lỗ)
 * - Zone comparison (Khu I vs Khu II)
 * - Cost breakdown (theo loại chi phí)
 * - Period breakdown (theo kỳ kế toán)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const fromStr = searchParams.get("from") || "2025-08-01";
    const toStr = searchParams.get("to") || now.toISOString().split("T")[0];
    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);

    // Lấy tất cả journal lines đã ghi sổ trong kỳ
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
        journalEntry: {
          select: { entryDate: true, description: true },
        },
      },
    });

    // === HELPER FUNCTIONS ===
    const isRevenueAccount = (accNum: string) =>
      accNum.startsWith("511") || accNum.startsWith("515");

    const isExpenseAccount = (accNum: string) =>
      accNum.startsWith("621") ||
      accNum.startsWith("622") ||
      accNum.startsWith("627") ||
      accNum.startsWith("632") ||
      accNum.startsWith("635") ||
      accNum.startsWith("641") ||
      accNum.startsWith("642");

    // Xác định kỳ dựa trên ngày bút toán
    const getPeriodLabel = (date: Date): string => {
      const d = new Date(date);
      const month = d.getMonth() + 1; // 1-12
      const year = d.getFullYear();

      if (year === 2025 && month >= 8 && month <= 11)
        return "Khu I (T8-T11/2025)";
      if ((year === 2025 && month === 12) || (year === 2026 && month <= 2))
        return "T12/2025-T2/2026";
      return `T${month}/${year}`;
    };

    // === 1. SUMMARY ===
    let totalRevenue = 0;
    let totalExpense = 0;

    for (const line of journalLines) {
      const accNum = line.account.accountNumber;
      if (isRevenueAccount(accNum)) {
        totalRevenue += Number(line.creditAmount);
      }
      if (isExpenseAccount(accNum)) {
        totalExpense += Number(line.debitAmount);
      }
    }

    const profitLoss = totalRevenue - totalExpense;
    const margin = totalRevenue > 0 ? (profitLoss / totalRevenue) * 100 : 0;

    // === 2. ZONE COMPARISON ===
    const zoneMap = new Map<string, { revenue: number; expense: number }>();

    for (const line of journalLines) {
      const zone = line.costCenterId || "UNKNOWN";
      const accNum = line.account.accountNumber;

      if (!zoneMap.has(zone)) {
        zoneMap.set(zone, { revenue: 0, expense: 0 });
      }
      const z = zoneMap.get(zone)!;

      if (isRevenueAccount(accNum)) {
        z.revenue += Number(line.creditAmount);
      }
      if (isExpenseAccount(accNum)) {
        z.expense += Number(line.debitAmount);
      }
    }

    const zones = Array.from(zoneMap.entries())
      .filter(([key]) => key !== "UNKNOWN")
      .map(([name, data]) => ({
        name: name === "KHU_I" ? "Khu I" : name === "KHU_II" ? "Khu II" : name,
        revenue: data.revenue,
        expense: data.expense,
        profitLoss: data.revenue - data.expense,
        margin:
          data.revenue > 0
            ? ((data.revenue - data.expense) / data.revenue) * 100
            : data.expense > 0
              ? -Infinity
              : 0,
      }))
      .sort((a, b) => b.profitLoss - a.profitLoss);

    // === 3. COST BREAKDOWN (theo loại chi phí) ===
    const costMap = new Map<string, { name: string; amount: number }>();

    // Mapping VAS account → tên chi phí thân thiện
    const costNameMap: Record<string, string> = {
      "621": "Thức ăn & Con giống",
      "622": "Nhân công",
      "6272": "Thuốc, hóa chất",
      "6273": "Xăng dầu, bảo trì & IoT",
      "6274": "Hạ tầng trang trại",
      "6277": "Dịch vụ Farmext LAB",
      "6278": "Vận hành & Mua hàng nội bộ",
      "632": "Giá vốn (kết chuyển)",
      "635": "Kinh doanh tài chính",
      "641": "Phí vận chuyển & bán hàng",
      "642": "Chi phí quản lý",
    };

    for (const line of journalLines) {
      const accNum = line.account.accountNumber;
      if (!isExpenseAccount(accNum)) continue;

      // Xác định category key (4 ký tự cho 627x, 3 cho 621/622/632/635/641/642)
      let catKey: string;
      if (accNum.startsWith("627")) {
        catKey = accNum.substring(0, 4); // 6272, 6273, 6274, 6277, 6278
      } else {
        catKey = accNum.substring(0, 3); // 621, 622, 632, 635, 641, 642
      }

      const existing = costMap.get(catKey) || {
        name: costNameMap[catKey] || line.account.name,
        amount: 0,
      };
      existing.amount += Number(line.debitAmount);
      costMap.set(catKey, existing);
    }

    const costBreakdown = Array.from(costMap.entries())
      .map(([code, data]) => ({
        code,
        name: data.name,
        amount: data.amount,
        percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // === 4. PERIOD BREAKDOWN ===
    const periodMap = new Map<
      string,
      { revenue: number; expense: number; zone: string }
    >();

    for (const line of journalLines) {
      const entryDate = line.journalEntry.entryDate;
      const zone = line.costCenterId || "UNKNOWN";
      const periodKey = `${zone}_${entryDate.toISOString().split("T")[0]}`;
      const accNum = line.account.accountNumber;

      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, { revenue: 0, expense: 0, zone });
      }
      const p = periodMap.get(periodKey)!;

      if (isRevenueAccount(accNum)) {
        p.revenue += Number(line.creditAmount);
      }
      if (isExpenseAccount(accNum)) {
        p.expense += Number(line.debitAmount);
      }
    }

    // Gom theo kỳ + zone thực tế
    const periodsAgg = new Map<
      string,
      { label: string; zone: string; revenue: number; expense: number }
    >();

    for (const [, data] of periodMap) {
      // Dùng zone làm key phân biệt kỳ (theo seed data structure)
      const label =
        data.zone === "KHU_I"
          ? "Khu I"
          : data.zone === "KHU_II"
            ? "Khu II"
            : data.zone;

      if (!periodsAgg.has(data.zone)) {
        periodsAgg.set(data.zone, {
          label,
          zone: data.zone,
          revenue: 0,
          expense: 0,
        });
      }
      const agg = periodsAgg.get(data.zone)!;
      agg.revenue += data.revenue;
      agg.expense += data.expense;
    }

    const periods = Array.from(periodsAgg.values()).map((p) => ({
      label: p.label,
      zone: p.zone,
      revenue: p.revenue,
      expense: p.expense,
      profitLoss: p.revenue - p.expense,
    }));

    // === RESPONSE ===
    return NextResponse.json({
      data: {
        period: { start: fromStr, end: toStr, label: `${fromStr} → ${toStr}` },
        summary: {
          revenue: totalRevenue,
          expense: totalExpense,
          profitLoss,
          margin: Math.round(margin * 10) / 10,
          expenseToRevenueRatio:
            totalRevenue > 0
              ? Math.round((totalExpense / totalRevenue) * 10) / 10
              : null,
        },
        zones,
        costBreakdown,
        periods,
        caveat:
          "Số liệu chưa trừ tồn kho thuốc + thức ăn. Lợi nhuận thực tế cao hơn số báo cáo.",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi server" },
      { status: 500 },
    );
  }
}
