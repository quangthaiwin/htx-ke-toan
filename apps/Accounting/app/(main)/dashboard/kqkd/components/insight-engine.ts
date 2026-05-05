/**
 * Insight Engine - Rule-based annotations cho KQKD Dashboard
 *
 * Tự động generate text insights dựa trên dữ liệu tài chính.
 * Không dùng AI/LLM - chỉ logic rules.
 */

export type InsightSeverity = "critical" | "warning" | "info" | "note";

export interface Insight {
  type: InsightSeverity;
  text: string;
  metric?: string; // Giá trị liên quan (VD: "-2.2 tỷ")
}

interface ZoneData {
  name: string;
  revenue: number;
  expense: number;
  profitLoss: number;
  margin: number;
}

interface CostItem {
  code: string;
  name: string;
  amount: number;
  percentage: number;
}

interface DashboardData {
  summary: {
    revenue: number;
    expense: number;
    profitLoss: number;
    margin: number;
    expenseToRevenueRatio: number | null;
  };
  zones: ZoneData[];
  costBreakdown: CostItem[];
}

/** Format số tiền VND ngắn gọn */
function fmtShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  }
  if (abs >= 1_000_000) {
    return `${Math.round(n / 1_000_000)}M`;
  }
  if (abs >= 1_000) {
    return `${Math.round(n / 1_000)}K`;
  }
  return n.toLocaleString("vi-VN");
}

/**
 * Generate insights từ dữ liệu KQKD dashboard
 */
export function generateInsights(data: DashboardData): Insight[] {
  const insights: Insight[] = [];
  const { summary, zones, costBreakdown } = data;

  // Rule 1: Tổng lỗ/lãi
  if (summary.profitLoss < 0) {
    const ratio = summary.expenseToRevenueRatio;
    insights.push({
      type: "critical",
      text: `HTX đang lỗ ${fmtShort(Math.abs(summary.profitLoss))} — chi phí gấp ${ratio?.toFixed(1) ?? "N/A"} lần doanh thu`,
      metric: fmtShort(summary.profitLoss),
    });
  } else if (summary.profitLoss > 0) {
    insights.push({
      type: "info",
      text: `HTX có lãi ${fmtShort(summary.profitLoss)} — margin ${summary.margin.toFixed(1)}%`,
      metric: fmtShort(summary.profitLoss),
    });
  }

  // Rule 2: Zone comparison - tìm zone hiệu quả thấp nhất
  if (zones.length >= 2) {
    const worstZone = [...zones].sort((a, b) => a.margin - b.margin)[0];
    const bestZone = [...zones].sort((a, b) => b.margin - a.margin)[0];

    if (worstZone && worstZone.margin < -100) {
      insights.push({
        type: "warning",
        text: `${worstZone.name} có margin ${Math.round(worstZone.margin)}% — hiệu quả thấp nhất. ${bestZone.name} lỗ nhiều hơn về số tuyệt đối nhưng margin đỡ hơn.`,
        metric: `${Math.round(worstZone.margin)}%`,
      });
    }
  }

  // Rule 3: Chi phí vượt doanh thu
  const costExceedingRevenue = costBreakdown.filter(
    (c) => c.amount > summary.revenue * 0.7,
  );
  for (const cost of costExceedingRevenue) {
    insights.push({
      type: "warning",
      text: `${cost.name} (${fmtShort(cost.amount)}) gần bằng hoặc vượt tổng doanh thu (${fmtShort(summary.revenue)})`,
      metric: fmtShort(cost.amount),
    });
  }

  // Rule 4: Top 3 cost concentration
  const top3 = costBreakdown.slice(0, 3);
  if (top3.length >= 3) {
    const top3Pct = top3.reduce((s, c) => s + c.percentage, 0);
    insights.push({
      type: "info",
      text: `Top 3 chi phí chiếm ${top3Pct.toFixed(0)}% tổng: ${top3.map((c) => c.name).join(", ")}`,
      metric: `${top3Pct.toFixed(0)}%`,
    });
  }

  // Rule 5: Inventory caveat
  insights.push({
    type: "note",
    text: "Số liệu chưa trừ tồn kho thuốc + thức ăn. Lợi nhuận thực tế cao hơn số báo cáo.",
  });

  return insights;
}
