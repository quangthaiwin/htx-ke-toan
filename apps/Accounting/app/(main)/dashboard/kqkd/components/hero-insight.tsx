"use client";

import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import type { Insight } from "./insight-engine";

interface HeroInsightProps {
  profitLoss: number;
  insights: Insight[];
}

function fmtVND(n: number): string {
  return Math.abs(n).toLocaleString("vi-VN") + " ₫";
}

export function HeroInsight({ profitLoss, insights }: HeroInsightProps) {
  const isLoss = profitLoss < 0;
  const criticalInsight = insights.find((i) => i.type === "critical");
  const heroText =
    criticalInsight?.text ||
    (isLoss
      ? `HTX đang lỗ ${fmtVND(profitLoss)}`
      : `HTX có lãi ${fmtVND(profitLoss)}`);

  return (
    <div
      className={`rounded-xl p-6 ${
        isLoss
          ? "bg-red-50 border border-red-200"
          : "bg-green-50 border border-green-200"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
            isLoss ? "bg-red-100" : "bg-green-100"
          }`}
        >
          {isLoss ? (
            <TrendingDown className="w-6 h-6 text-red-600" />
          ) : (
            <TrendingUp className="w-6 h-6 text-green-600" />
          )}
        </div>
        <div className="flex-1">
          <p
            className={`text-lg font-bold ${
              isLoss ? "text-red-800" : "text-green-800"
            }`}
          >
            {isLoss ? "Lỗ" : "Lãi"}{" "}
            <span className="font-mono">{fmtVND(profitLoss)}</span>
          </p>
          <p
            className={`mt-1 text-sm ${
              isLoss ? "text-red-700" : "text-green-700"
            }`}
          >
            {heroText}
          </p>
          {/* Nguyen nhan chinh */}
          {insights
            .filter((i) => i.type === "warning")
            .slice(0, 2)
            .map((insight, idx) => (
              <div
                key={idx}
                className="mt-2 flex items-start gap-2 text-sm text-amber-700"
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{insight.text}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
