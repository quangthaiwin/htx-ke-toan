"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PeriodData {
  label: string;
  zone: string;
  revenue: number;
  expense: number;
  profitLoss: number;
}

interface PLChartProps {
  periods: PeriodData[];
  annotation?: string;
}

function fmtAxis(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${Math.round(value / 1_000_000)}M`;
  }
  return value.toLocaleString("vi-VN");
}

function fmtTooltip(value: number): string {
  return value.toLocaleString("vi-VN") + " ₫";
}

export function PLChart({ periods, annotation }: PLChartProps) {
  // Tách ra theo zone + period cho bar chart
  const chartData = periods.map((p) => ({
    name: p.label,
    "Doanh thu": p.revenue,
    "Chi phí": p.expense,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Doanh thu vs Chi phí theo khu vực
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
            <YAxis
              tickFormatter={fmtAxis}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value: number) => fmtTooltip(value)}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Doanh thu" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Chi phí" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {annotation && (
        <p className="mt-3 text-xs text-gray-500 italic border-t border-gray-100 pt-3">
          {annotation}
        </p>
      )}
    </div>
  );
}
