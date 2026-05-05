"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface CostItem {
  code: string;
  name: string;
  amount: number;
  percentage: number;
}

interface CostBreakdownProps {
  costs: CostItem[];
  totalExpense: number;
  annotation?: string;
}

function fmtVND(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toFixed(2)} tỷ`;
  }
  if (Math.abs(n) >= 1_000_000) {
    return `${Math.round(n / 1_000_000)}M`;
  }
  return n.toLocaleString("vi-VN") + " ₫";
}

// Màu gradient từ đậm → nhạt cho sorted bars
const BAR_COLORS = [
  "#dc2626", // red-600
  "#ea580c", // orange-600
  "#d97706", // amber-600
  "#ca8a04", // yellow-600
  "#65a30d", // lime-600
  "#16a34a", // green-600
  "#0891b2", // cyan-600
  "#2563eb", // blue-600
  "#7c3aed", // violet-600
  "#c026d3", // fuchsia-600
];

export function CostBreakdown({
  costs,
  totalExpense,
  annotation,
}: CostBreakdownProps) {
  const chartData = costs.slice(0, 10).map((c) => ({
    name: c.name,
    amount: c.amount,
    percentage: c.percentage,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Cơ cấu chi phí
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        Tổng chi phí: {fmtVND(totalExpense)}
      </p>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f5f5f5"
              horizontal={false}
            />
            <XAxis
              type="number"
              tickFormatter={(v) => `${Math.round(v / 1_000_000)}M`}
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={150}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value: number) => [
                `${fmtVND(value)} (${((value / totalExpense) * 100).toFixed(1)}%)`,
                "Chi phí",
              ]}
              labelStyle={{ fontWeight: 600, fontSize: 12 }}
            />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={BAR_COLORS[index % BAR_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table supplement */}
      <div className="mt-4 border-t border-gray-100 pt-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400">
              <th className="text-left pb-1">Khoản mục</th>
              <th className="text-right pb-1">Số tiền</th>
              <th className="text-right pb-1">Tỷ trọng</th>
            </tr>
          </thead>
          <tbody>
            {costs.slice(0, 7).map((c, i) => (
              <tr key={c.code} className="border-t border-gray-50">
                <td className="py-1.5 text-gray-700 flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{
                      backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                    }}
                  />
                  {c.name}
                </td>
                <td className="py-1.5 text-right font-mono text-gray-800">
                  {fmtVND(c.amount)}
                </td>
                <td className="py-1.5 text-right font-mono text-gray-500">
                  {c.percentage.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {annotation && (
        <p className="mt-3 text-xs text-gray-500 italic border-t border-gray-100 pt-3">
          {annotation}
        </p>
      )}
    </div>
  );
}
