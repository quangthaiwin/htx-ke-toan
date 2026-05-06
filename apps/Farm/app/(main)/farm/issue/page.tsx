"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Mode = "single" | "multi";

export default function IssuePage() {
  const { data: products } = useSWR("/api/farm/products", fetcher);
  const { data: ponds } = useSWR("/api/farm/ponds", fetcher);
  const { data: warehouses } = useSWR("/api/farm/warehouses", fetcher);
  const [mode, setMode] = useState<Mode>("single");
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [assignmentId, setAssignmentId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [multiQty, setMultiQty] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const workingWh = warehouses?.find((w: any) => w.type === "WORKING");
  const selectedProduct = products?.find((p: any) => p.id === productId);

  const activePonds =
    ponds?.filter((p: any) => p.assignments?.length > 0) ?? [];

  const availableLots =
    workingWh?.lots?.filter((l: any) => l.productId === productId) ?? [];
  const totalAvailable = availableLots.reduce(
    (s: number, l: any) => s + Number(l.qtyOnHand),
    0,
  );

  async function handleSubmit() {
    if (!productId || !workingWh) return;
    setSubmitting(true);

    let assignments: { assignmentId: string; quantity: number }[];
    if (mode === "single") {
      if (!assignmentId || !quantity) return;
      assignments = [{ assignmentId, quantity: Number(quantity) }];
    } else {
      assignments = Object.entries(multiQty)
        .filter(([, q]) => Number(q) > 0)
        .map(([aid, q]) => ({ assignmentId: aid, quantity: Number(q) }));
    }

    await fetch("/api/farm/material-issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        warehouseId: workingWh.id,
        assignments,
      }),
    });

    mutate("/api/farm/warehouses");
    setQuantity("");
    setMultiQty({});
    setSubmitting(false);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Xuất kho cho ao</h1>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setMode("single")}
          className={`px-4 py-1.5 text-sm rounded-md ${mode === "single" ? "bg-white shadow font-medium" : "text-slate-500"}`}
        >
          Xuất cho 1 ao
        </button>
        <button
          onClick={() => setMode("multi")}
          className={`px-4 py-1.5 text-sm rounded-md ${mode === "multi" ? "bg-white shadow font-medium" : "text-slate-500"}`}
        >
          Chia nhiều ao
        </button>
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-3">
        <div>
          <label className="text-xs text-slate-500 font-medium">Vật tư</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full border rounded px-2 py-1.5 text-sm mt-1"
          >
            <option value="">Chọn vật tư</option>
            {products?.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>
        </div>

        {productId && (
          <div className="bg-slate-50 rounded p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Tồn kho tạm</span>
              <span className="font-mono font-medium">
                {totalAvailable.toLocaleString()}{" "}
                {selectedProduct?.secondaryUnit}
              </span>
            </div>
            {availableLots.length > 0 && (
              <div className="mt-2 space-y-1">
                {availableLots.map((l: any) => (
                  <div key={l.id} className="flex justify-between text-xs">
                    <span>Lot {l.lotNumber}</span>
                    <span>
                      {Number(l.qtyOnHand).toLocaleString()} · HSD{" "}
                      {new Date(l.expiryDate).toLocaleDateString("vi")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {mode === "single" ? (
          <>
            <div>
              <label className="text-xs text-slate-500 font-medium">Ao</label>
              <select
                value={assignmentId}
                onChange={(e) => setAssignmentId(e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-sm mt-1"
              >
                <option value="">Chọn ao</option>
                {activePonds.map((p: any) => (
                  <option
                    key={p.assignments[0]?.id}
                    value={p.assignments[0]?.id}
                  >
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">
                Số lượng ({selectedProduct?.secondaryUnit ?? "KG"})
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-sm mt-1"
                placeholder="0"
              />
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <label className="text-xs text-slate-500 font-medium">
              Chia cho từng ao
            </label>
            {activePonds.map((p: any) => {
              const aid = p.assignments[0]?.id;
              return (
                <div key={aid} className="flex items-center gap-3">
                  <span className="text-sm w-20">{p.name}</span>
                  <input
                    type="number"
                    value={multiQty[aid] ?? ""}
                    onChange={(e) =>
                      setMultiQty({ ...multiQty, [aid]: e.target.value })
                    }
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    placeholder="0"
                  />
                  <span className="text-xs text-slate-400">
                    {selectedProduct?.secondaryUnit ?? "KG"}
                  </span>
                </div>
              );
            })}
            <div className="flex justify-between text-sm pt-1 border-t">
              <span className="text-slate-500">Tổng xuất</span>
              <span className="font-mono">
                {Object.values(multiQty)
                  .reduce((s, q) => s + (Number(q) || 0), 0)
                  .toLocaleString()}{" "}
                {selectedProduct?.secondaryUnit}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-2 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 disabled:opacity-50"
        >
          {submitting ? "Đang xử lý..." : "Xác nhận xuất kho"}
        </button>
      </div>
    </div>
  );
}
