"use client";

import { AlertTriangle, Info } from "lucide-react";
import type { Insight } from "./insight-engine";

interface AlertsPanelProps {
  insights: Insight[];
}

export function AlertsPanel({ insights }: AlertsPanelProps) {
  // Chỉ hiện warning + info + note (critical đã hiện ở Hero)
  const alerts = insights.filter((i) => i.type !== "critical");

  if (alerts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Cảnh báo & Lưu ý
      </h3>
      <div className="space-y-3">
        {alerts.map((insight, idx) => {
          const isWarning = insight.type === "warning";
          const isNote = insight.type === "note";

          return (
            <div
              key={idx}
              className={`flex items-start gap-3 rounded-lg px-4 py-3 ${
                isWarning
                  ? "bg-amber-50 border border-amber-100"
                  : isNote
                    ? "bg-blue-50 border border-blue-100"
                    : "bg-gray-50 border border-gray-100"
              }`}
            >
              {isWarning ? (
                <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
              ) : (
                <Info className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
              )}
              <p
                className={`text-sm ${
                  isWarning
                    ? "text-amber-800"
                    : isNote
                      ? "text-blue-800"
                      : "text-gray-700"
                }`}
              >
                {insight.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
