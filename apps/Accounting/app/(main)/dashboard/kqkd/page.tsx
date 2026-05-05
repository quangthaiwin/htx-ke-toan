import { prisma } from "@/lib/prisma";
import { KQKDDashboardClient } from "./kqkd-client";

export const dynamic = "force-dynamic";

const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

/**
 * KQKD Dashboard - Data Story
 * Server component: fetch data, compute aggregates, pass to client for charts
 */
export default async function KQKDDashboardPage() {
  // Lấy tất cả journal lines đã ghi sổ (KQKD period: T8/2025 - T2/2026)
  const fromDate = new Date("2025-08-01");
  const toDate = new Date("2026-02-28");

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
      journalEntry: { select: { entryDate: true, description: true } },
    },
  });

  // === HELPER ===
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

  // === SUMMARY ===
  let totalRevenue = 0;
  let totalExpense = 0;

  for (const line of journalLines) {
    const accNum = line.account.accountNumber;
    if (isRevenueAccount(accNum)) totalRevenue += Number(line.creditAmount);
    if (isExpenseAccount(accNum)) totalExpense += Number(line.debitAmount);
  }

  const profitLoss = totalRevenue - totalExpense;
  const margin = totalRevenue > 0 ? (profitLoss / totalRevenue) * 100 : 0;

  // === ZONES ===
  const zoneMap = new Map<string, { revenue: number; expense: number }>();
  for (const line of journalLines) {
    const zone = line.costCenterId || "UNKNOWN";
    const accNum = line.account.accountNumber;
    if (!zoneMap.has(zone)) zoneMap.set(zone, { revenue: 0, expense: 0 });
    const z = zoneMap.get(zone)!;
    if (isRevenueAccount(accNum)) z.revenue += Number(line.creditAmount);
    if (isExpenseAccount(accNum)) z.expense += Number(line.debitAmount);
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
            ? -9999
            : 0,
    }))
    .sort((a, b) => b.profitLoss - a.profitLoss);

  // === COST BREAKDOWN ===
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

  const costMap = new Map<string, { name: string; amount: number }>();
  for (const line of journalLines) {
    const accNum = line.account.accountNumber;
    if (!isExpenseAccount(accNum)) continue;

    let catKey: string;
    if (accNum.startsWith("627")) {
      catKey = accNum.substring(0, 4);
    } else {
      catKey = accNum.substring(0, 3);
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

  // === PERIODS (for bar chart) ===
  // Aggregate by entryDate + zone
  const periodDateMap = new Map<
    string,
    { zone: string; date: string; revenue: number; expense: number }
  >();

  for (const line of journalLines) {
    const zone = line.costCenterId || "UNKNOWN";
    if (zone === "UNKNOWN") continue;
    const dateKey = line.journalEntry.entryDate.toISOString().split("T")[0];
    const key = `${zone}_${dateKey}`;
    const accNum = line.account.accountNumber;

    if (!periodDateMap.has(key)) {
      periodDateMap.set(key, { zone, date: dateKey, revenue: 0, expense: 0 });
    }
    const p = periodDateMap.get(key)!;
    if (isRevenueAccount(accNum)) p.revenue += Number(line.creditAmount);
    if (isExpenseAccount(accNum)) p.expense += Number(line.debitAmount);
  }

  // Gom theo zone (match seed structure: KHU_I có 2 kỳ, KHU_II có 1 kỳ)
  const periodsByZoneDate = Array.from(periodDateMap.values());

  // Tạo labels cho chart dựa trên date + zone
  const periods = periodsByZoneDate.map((p) => {
    let label: string;
    if (p.zone === "KHU_I" && p.date === "2025-11-30") {
      label = "Khu I (T8-T11)";
    } else if (p.zone === "KHU_I" && p.date === "2026-02-28") {
      label = "Khu I (T12-T2)";
    } else if (p.zone === "KHU_II") {
      label = "Khu II (T11-T2)";
    } else {
      label = `${p.zone} ${p.date}`;
    }
    return {
      label,
      zone: p.zone,
      revenue: p.revenue,
      expense: p.expense,
      profitLoss: p.revenue - p.expense,
    };
  });

  // === PASS TO CLIENT ===
  const dashboardData = {
    period: {
      start: "2025-08-01",
      end: "2026-02-28",
      label: "T8/2025 — T2/2026",
    },
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
  };

  return <KQKDDashboardClient data={dashboardData} />;
}
