"use client";

import { Printer } from "lucide-react";
import { generateInsights } from "./components/insight-engine";
import { HeroInsight } from "./components/hero-insight";
import { PLChart } from "./components/pl-chart";
import { ZoneCompare } from "./components/zone-compare";
import { CostBreakdown } from "./components/cost-breakdown";
import { AlertsPanel } from "./components/alerts-panel";

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

interface PeriodData {
  label: string;
  zone: string;
  revenue: number;
  expense: number;
  profitLoss: number;
}

interface DashboardData {
  period: { start: string; end: string; label: string };
  summary: {
    revenue: number;
    expense: number;
    profitLoss: number;
    margin: number;
    expenseToRevenueRatio: number | null;
  };
  zones: ZoneData[];
  costBreakdown: CostItem[];
  periods: PeriodData[];
  caveat: string;
}

interface Props {
  data: DashboardData;
}

export function KQKDDashboardClient({ data }: Props) {
  const { summary, zones, costBreakdown, periods } = data;

  // Generate insights
  const insights = generateInsights({
    summary,
    zones,
    costBreakdown,
  });

  // Annotations cho charts (tự động từ data)
  const plAnnotation =
    periods.length > 0
      ? (() => {
          const worstPeriod = [...periods].sort(
            (a, b) => a.profitLoss - b.profitLoss,
          )[0];
          if (worstPeriod && worstPeriod.expense > 0) {
            const ratio = (
              worstPeriod.expense / Math.max(worstPeriod.revenue, 1)
            ).toFixed(1);
            return `Mỗi kỳ đều lỗ. ${worstPeriod.label} lỗ nặng nhất: chi phí gấp ${ratio} lần doanh thu.`;
          }
          return undefined;
        })()
      : undefined;

  const zoneAnnotation =
    zones.length >= 2
      ? (() => {
          const sorted = [...zones].sort((a, b) => a.margin - b.margin);
          const worst = sorted[0];
          const best = sorted[sorted.length - 1];
          if (worst && best && worst.name !== best.name) {
            return `${best.name} lỗ nhiều hơn về số tuyệt đối, nhưng ${worst.name} có margin xấu hơn. ${worst.name} mới bắt đầu T11/2025.`;
          }
          return undefined;
        })()
      : undefined;

  const costAnnotation = (() => {
    const top3 = costBreakdown.slice(0, 3);
    if (top3.length >= 3) {
      const pct = top3.reduce((s, c) => s + c.percentage, 0);
      return `Top 3 chi phí chiếm ${pct.toFixed(0)}% tổng. Lưu ý: chưa trừ tồn kho.`;
    }
    return undefined;
  })();

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:block">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Tình hình kinh doanh HTX Farmext
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Kỳ: {data.period.label}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors print:hidden"
        >
          <Printer className="w-4 h-4" />
          In báo cáo
        </button>
      </div>

      {/* Hero Insight Card */}
      <HeroInsight profitLoss={summary.profitLoss} insights={insights} />

      {/* KPI Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Tổng doanh thu" value={summary.revenue} color="green" />
        <KPICard label="Tổng chi phí" value={summary.expense} color="red" />
        <KPICard
          label="Lỗ ròng"
          value={summary.profitLoss}
          color={summary.profitLoss >= 0 ? "green" : "red"}
        />
        <KPICard
          label="CP/DT"
          value={summary.expenseToRevenueRatio}
          suffix="x"
          color="orange"
        />
      </div>

      {/* Section 1: DT vs CP chart */}
      <PLChart periods={periods} annotation={plAnnotation} />

      {/* Section 2: Zone comparison */}
      <ZoneCompare zones={zones} annotation={zoneAnnotation} />

      {/* Section 3: Cost breakdown */}
      <CostBreakdown
        costs={costBreakdown}
        totalExpense={summary.expense}
        annotation={costAnnotation}
      />

      {/* Section 4: Alerts & recommendations */}
      <AlertsPanel insights={insights} />

      {/* Footer */}
      <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 flex items-center justify-between print:block print:text-center">
        <span>Nguồn: Bao_cao_KQKD_HTX_Farmext_Aqua_Can_Gio-chi_tiet.xlsx</span>
        <span>Cập nhật: {new Date().toLocaleDateString("vi-VN")}</span>
      </div>
    </div>
  );
}

// === Internal KPI Card ===
function KPICard({
  label,
  value,
  color,
  suffix,
}: {
  label: string;
  value: number | null;
  color: "green" | "red" | "orange" | "blue";
  suffix?: string;
}) {
  const colorMap = {
    green: { bg: "bg-green-50", text: "text-green-700" },
    red: { bg: "bg-red-50", text: "text-red-700" },
    orange: { bg: "bg-orange-50", text: "text-orange-700" },
    blue: { bg: "bg-blue-50", text: "text-blue-700" },
  };
  const c = colorMap[color];

  const formatted = (() => {
    if (value === null) return "N/A";
    if (suffix === "x") return `${value}${suffix}`;
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
    if (abs >= 1_000_000) return `${Math.round(value / 1_000_000)}M`;
    return value.toLocaleString("vi-VN") + " ₫";
  })();

  return (
    <div className={`${c.bg} rounded-xl p-4`}>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono ${c.text}`}>{formatted}</p>
    </div>
  );
}
