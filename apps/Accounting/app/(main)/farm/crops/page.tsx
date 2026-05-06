"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CropsPage() {
  const { data: crops } = useSWR("/api/farm/crops", fetcher);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Vụ nuôi</h1>

      {crops?.map((crop: any) => (
        <div key={crop.id} className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="font-mono text-sm font-medium">{crop.code}</span>
              <span className="ml-2 text-sm text-slate-600">{crop.name}</span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${crop.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
            >
              {crop.status}
            </span>
          </div>

          <div className="text-xs text-slate-500 mb-3">
            Bắt đầu: {new Date(crop.startDate).toLocaleDateString("vi")}
            {crop.endDate &&
              ` · Kết thúc: ${new Date(crop.endDate).toLocaleDateString("vi")}`}
          </div>

          {crop.phases?.map((phase: any) => (
            <div
              key={phase.id}
              className="ml-4 border-l-2 border-slate-200 pl-3 mb-2"
            >
              <div className="text-sm font-medium">
                Phase {phase.phaseNumber}: {phase.name}
              </div>
              <div className="text-xs text-slate-500">
                {phase.ponds
                  ?.map(
                    (pa: any) =>
                      `${pa.pond?.name} (${pa.shrimpCount?.toLocaleString()} con)`,
                  )
                  .join(" · ")}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
