"use client";

import { TrendingDown } from "lucide-react";

interface ZoneData {
  name: string;
  revenue: number;
  expense: number;
  profitLoss: number;
  margin: number;
}

interface ZoneCompareProps {
  zones: ZoneData[];
  annotation?: string;
}

function fmtVND(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toFixed(2)} tỷ`;
  }
  if (abs >= 1_000_000) {
    return `${Math.round(n / 1_000_000)}M`;
  }
  return n.toLocaleString("vi-VN") + " ₫";
}

export function ZoneCompare({ zones, annotation }: ZoneCompareProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        So sánh hiệu quả theo khu vực
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {zones.map((zone) => {
          const isLoss = zone.profitLoss < 0;
          return (
            <div
              key={zone.name}
              className={`rounded-lg p-4 border ${
                isLoss
                  ? "bg-red-50/50 border-red-100"
                  : "bg-green-50/50 border-green-100"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-800">{zone.name}</h4>
                {isLoss && <TrendingDown className="w-4 h-4 text-red-500" />}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Doanh thu</span>
                  <span className="font-mono font-medium text-green-700">
                    {fmtVND(zone.revenue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Chi phí</span>
                  <span className="font-mono font-medium text-red-600">
                    {fmtVND(zone.expense)}
                  </span>
                </div>
                <div className="border-t border-gray-200 my-1" />
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Lỗ/Lãi</span>
                  <span
                    className={`font-mono font-bold ${
                      isLoss ? "text-red-700" : "text-green-700"
                    }`}
                  >
                    {fmtVND(zone.profitLoss)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Margin</span>
                  <span
                    className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isLoss
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {isFinite(zone.margin)
                      ? `${Math.round(zone.margin)}%`
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {annotation && (
        <p className="mt-4 text-xs text-gray-500 italic border-t border-gray-100 pt-3">
          {annotation}
        </p>
      )}
    </div>
  );
}
