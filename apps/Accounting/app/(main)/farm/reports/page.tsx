"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ReportsPage() {
  const { data: crops } = useSWR("/api/farm/crops", fetcher);
  const activeCrop = crops?.[0];
  const { data: summary } = useSWR(
    activeCrop ? `/api/farm/crops/${activeCrop.id}` : null,
    fetcher,
  );

  const costTypes = [
    "FEED",
    "MEDICINE",
    "MINERAL",
    "PROBIOTIC",
    "CHEMICAL",
    "SEED",
    "OTHER",
  ];
  const costColors: Record<string, string> = {
    FEED: "bg-rose-500",
    MEDICINE: "bg-blue-500",
    MINERAL: "bg-amber-500",
    PROBIOTIC: "bg-emerald-500",
    CHEMICAL: "bg-purple-500",
    SEED: "bg-slate-500",
    OTHER: "bg-gray-400",
  };

  const maxCost =
    summary?.ponds?.reduce(
      (max: number, p: any) => Math.max(max, p.totalCost),
      0,
    ) ?? 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Báo cáo vụ nuôi</h1>

      {summary && (
        <>
          {/* P&L Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border rounded-lg p-4 text-center">
              <div className="text-xs text-slate-500">Tổng chi phí</div>
              <div className="text-xl font-mono font-bold text-rose-600">
                {(summary.totalCost / 1000000).toFixed(1)}tr
              </div>
            </div>
            <div className="bg-white border rounded-lg p-4 text-center">
              <div className="text-xs text-slate-500">Doanh thu</div>
              <div className="text-xl font-mono font-bold text-emerald-600">
                {(summary.totalRevenue / 1000000).toFixed(1)}tr
              </div>
            </div>
            <div className="bg-white border rounded-lg p-4 text-center">
              <div className="text-xs text-slate-500">Lãi/Lỗ</div>
              <div
                className={`text-xl font-mono font-bold ${summary.profitLoss >= 0 ? "text-emerald-600" : "text-red-600"}`}
              >
                {(summary.profitLoss / 1000000).toFixed(1)}tr
              </div>
            </div>
          </div>

          {/* Stacked Cost Bar Chart */}
          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-4">Chi phí phân loại theo ao</h2>
            <div className="space-y-3">
              {summary.ponds?.map((pond: any) => (
                <div key={pond.assignmentId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{pond.pondName}</span>
                    <span className="font-mono">
                      {(pond.totalCost / 1000000).toFixed(2)}tr
                    </span>
                  </div>
                  <div className="flex h-6 rounded overflow-hidden">
                    {costTypes.map((type) => {
                      const amount = pond.costBreakdown[type] ?? 0;
                      const pct = maxCost > 0 ? (amount / maxCost) * 100 : 0;
                      if (pct < 0.5) return null;
                      return (
                        <div
                          key={type}
                          className={`${costColors[type]} transition-all`}
                          style={{ width: `${pct}%` }}
                          title={`${type}: ${amount.toLocaleString()}đ`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              {costTypes.map((type) => (
                <div key={type} className="flex items-center gap-1 text-xs">
                  <div className={`w-3 h-3 rounded ${costColors[type]}`} />
                  <span>{type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Per-pond P&L */}
          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-3">Lãi/Lỗ theo ao</h2>
            <div className="space-y-2">
              {summary.ponds?.map((pond: any) => (
                <div
                  key={pond.assignmentId}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <span className="text-sm">{pond.pondName}</span>
                  <div className="text-right">
                    <div
                      className={`font-mono text-sm ${pond.profitLoss >= 0 ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {pond.profitLoss >= 0 ? "+" : ""}
                      {(pond.profitLoss / 1000000).toFixed(2)}tr
                    </div>
                    <div className="text-xs text-slate-400">
                      CP {(pond.totalCost / 1000000).toFixed(1)}tr · DT{" "}
                      {(pond.totalRevenue / 1000000).toFixed(1)}tr
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!summary && (
        <div className="text-slate-400 italic">Chưa có dữ liệu vụ nuôi</div>
      )}
    </div>
  );
}
