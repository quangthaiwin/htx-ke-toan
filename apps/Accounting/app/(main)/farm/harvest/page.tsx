"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HarvestPage() {
  const { data: harvests } = useSWR("/api/farm/harvest", fetcher);
  const { data: crops } = useSWR("/api/farm/crops", fetcher);
  const { data: ponds } = useSWR("/api/farm/ponds", fetcher);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    cropCycleId: "",
    assignmentId: "",
    weightKg: "",
    sizePerKg: "",
    buyerName: "",
    pricePerKg: "",
  });

  const activeCrop = crops?.[0];
  const activePonds =
    ponds?.filter((p: any) => p.assignments?.length > 0) ?? [];

  async function handleSubmit() {
    await fetch("/api/farm/harvest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        cropCycleId: form.cropCycleId || activeCrop?.id,
        weightKg: Number(form.weightKg),
        sizePerKg: Number(form.sizePerKg),
        pricePerKg: Number(form.pricePerKg),
      }),
    });
    mutate("/api/farm/harvest");
    setShowForm(false);
    setForm({
      cropCycleId: "",
      assignmentId: "",
      weightKg: "",
      sizePerKg: "",
      buyerName: "",
      pricePerKg: "",
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Thu hoạch</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700"
        >
          + Ghi thu hoạch
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <div>
            <label className="text-xs text-slate-500">Ao</label>
            <select
              value={form.assignmentId}
              onChange={(e) =>
                setForm({ ...form, assignmentId: e.target.value })
              }
              className="w-full border rounded px-2 py-1.5 text-sm mt-1"
            >
              <option value="">Chọn ao</option>
              {activePonds.map((p: any) => (
                <option key={p.assignments[0]?.id} value={p.assignments[0]?.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Kg thu</label>
              <input
                type="number"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                className="w-full border rounded px-2 py-1.5 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Size (con/kg)</label>
              <input
                type="number"
                value={form.sizePerKg}
                onChange={(e) =>
                  setForm({ ...form, sizePerKg: e.target.value })
                }
                className="w-full border rounded px-2 py-1.5 text-sm mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Người mua</label>
              <input
                type="text"
                value={form.buyerName}
                onChange={(e) =>
                  setForm({ ...form, buyerName: e.target.value })
                }
                className="w-full border rounded px-2 py-1.5 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Giá/kg</label>
              <input
                type="number"
                value={form.pricePerKg}
                onChange={(e) =>
                  setForm({ ...form, pricePerKg: e.target.value })
                }
                className="w-full border rounded px-2 py-1.5 text-sm mt-1"
              />
            </div>
          </div>
          {form.weightKg && form.pricePerKg && (
            <div className="bg-emerald-50 rounded p-2 text-sm text-emerald-700 font-mono">
              Doanh thu:{" "}
              {(
                Number(form.weightKg) * Number(form.pricePerKg)
              ).toLocaleString()}
              đ
            </div>
          )}
          <button
            onClick={handleSubmit}
            className="w-full py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
          >
            Xác nhận
          </button>
        </div>
      )}

      <div className="space-y-2">
        {harvests?.map((h: any) => (
          <div key={h.id} className="bg-white border rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium">{h.buyerName}</div>
                <div className="text-xs text-slate-500">
                  {Number(h.weightKg).toLocaleString()} kg · {h.sizePerKg}{" "}
                  con/kg · {new Date(h.harvestDate).toLocaleDateString("vi")}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-semibold text-emerald-600">
                  {Number(h.totalRevenue).toLocaleString()}đ
                </div>
                <div className="text-xs text-slate-400">
                  {Number(h.pricePerKg).toLocaleString()}đ/kg
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
