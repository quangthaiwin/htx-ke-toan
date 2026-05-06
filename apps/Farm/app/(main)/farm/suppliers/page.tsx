"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SuppliersPage() {
  const { data: suppliers } = useSWR("/api/farm/suppliers", fetcher);

  const now = new Date();

  function aging(dueDate: string | null) {
    if (!dueDate) return "N/A";
    const days = Math.floor(
      (now.getTime() - new Date(dueDate).getTime()) / 86400000,
    );
    if (days <= 0) return "Chưa đến hạn";
    if (days <= 30) return "0-30";
    if (days <= 60) return "31-60";
    if (days <= 90) return "61-90";
    return ">90";
  }

  const agingColor: Record<string, string> = {
    "0-30": "text-amber-600",
    "31-60": "text-orange-600",
    "61-90": "text-red-500",
    ">90": "text-red-700 font-bold",
  };

  async function handlePay(apEntryId: string, amount: number) {
    await fetch("/api/farm/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apEntryId, amount, method: "TRANSFER" }),
    });
    mutate("/api/farm/suppliers");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">NCC & Công nợ</h1>

      {suppliers?.map((s: any) => (
        <div key={s.id} className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="font-semibold">{s.name}</div>
              <div className="text-xs text-slate-500">{s.phone}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono font-medium text-rose-600">
                {s.apEntries
                  ?.reduce(
                    (sum: number, ap: any) => sum + Number(ap.balance),
                    0,
                  )
                  .toLocaleString()}
                đ
              </div>
              <div className="text-xs text-slate-400">Còn nợ</div>
            </div>
          </div>

          {s.apEntries?.length > 0 && (
            <div className="space-y-1.5">
              {s.apEntries.map((ap: any) => (
                <div
                  key={ap.id}
                  className="flex justify-between items-center text-sm border-t pt-1.5"
                >
                  <div>
                    <span className="text-slate-600">{ap.type}</span>
                    <span
                      className={`ml-2 text-xs ${agingColor[aging(ap.dueDate)] ?? "text-slate-400"}`}
                    >
                      {aging(ap.dueDate)} ngày
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">
                      {Number(ap.balance).toLocaleString()}đ
                    </span>
                    {Number(ap.balance) > 0 && (
                      <button
                        onClick={() => handlePay(ap.id, Number(ap.balance))}
                        className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded"
                      >
                        Trả
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
