"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function FarmDashboard() {
  const { data: crops } = useSWR("/api/farm/crops", fetcher);
  const { data: ponds } = useSWR("/api/farm/ponds", fetcher);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">
          Dashboard — Tổng quan trại
        </h1>
        <span className="text-sm text-slate-500">
          {crops?.[0]?.code} · {crops?.[0]?.phases?.at(-1)?.name} · Ngày{" "}
          {crops?.[0]?.phases?.at(-1)?.startDate
            ? Math.floor(
                (Date.now() -
                  new Date(crops[0].phases.at(-1).startDate).getTime()) /
                  86400000,
              )
            : "—"}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          label="Tổng CP vụ hiện tại"
          value="285tr"
          delta="+12% vs vụ trước"
          color="red"
        />
        <KpiCard
          label="FCR trung bình"
          value="1.42"
          delta="Tốt"
          color="green"
        />
        <KpiCard
          label="Tỷ lệ sống TB"
          value="78%"
          delta="400K / 510K con"
          color="slate"
        />
        <KpiCard
          label="Công nợ NCC"
          value="45tr"
          delta="3 NCC · 2 quá hạn"
          color="amber"
        />
      </div>

      {/* Pond Status Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Tình trạng ao</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {ponds?.map((pond: any) => {
            const assignment = pond.assignments?.[0];
            return (
              <div
                key={pond.id}
                className="bg-white border border-slate-200 rounded-lg p-4 hover:border-rose-300 transition-colors"
              >
                <div className="font-semibold mb-2">{pond.name}</div>
                <div className="space-y-1 text-sm">
                  <Row
                    label="Tôm"
                    value={assignment?.shrimpCount?.toLocaleString() ?? "—"}
                  />
                  <Row
                    label="Ngày"
                    value={
                      assignment
                        ? Math.floor(
                            (Date.now() -
                              new Date(assignment.startDate).getTime()) /
                              86400000,
                          ).toString()
                        : "—"
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  color,
}: {
  label: string;
  value: string;
  delta: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    red: "text-rose-600",
    green: "text-emerald-600",
    amber: "text-amber-600",
    slate: "text-slate-800",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <div className="text-xs text-slate-500 font-medium mb-1">{label}</div>
      <div
        className={`text-2xl font-bold font-mono ${colorMap[color] ?? "text-slate-800"}`}
      >
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-1">{delta}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
