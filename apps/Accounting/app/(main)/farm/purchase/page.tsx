"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Tab = "pr" | "po" | "grn";

export default function PurchasePage() {
  const [tab, setTab] = useState<Tab>("pr");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Mua hàng</h1>
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {(
          [
            ["pr", "Yêu cầu mua"],
            ["po", "Đơn hàng"],
            ["grn", "Nhận hàng"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === key ? "bg-white shadow font-medium text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "pr" && <PRTab />}
      {tab === "po" && <POTab />}
      {tab === "grn" && <GRNTab />}
    </div>
  );
}

function PRTab() {
  const { data: prs } = useSWR("/api/farm/purchase-requests", fetcher);
  const { data: products } = useSWR("/api/farm/products", fetcher);
  const [showForm, setShowForm] = useState(false);
  const [lines, setLines] = useState<
    { productId: string; quantity: string; unit: string }[]
  >([{ productId: "", quantity: "", unit: "KG" }]);

  async function handleCreate() {
    const payload = {
      requestedBy: "worker",
      lines: lines
        .filter((l) => l.productId && l.quantity)
        .map((l) => ({ ...l, quantity: Number(l.quantity) })),
    };
    await fetch("/api/farm/purchase-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    mutate("/api/farm/purchase-requests");
    setShowForm(false);
    setLines([{ productId: "", quantity: "", unit: "KG" }]);
  }

  async function handleAction(id: string, action: string) {
    await fetch(`/api/farm/purchase-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    mutate("/api/farm/purchase-requests");
  }

  const statusColor: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-600",
    SUBMITTED: "bg-blue-100 text-blue-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg">Yêu cầu mua hàng (PR)</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700"
        >
          + Tạo PR
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-lg p-4 space-y-3">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-2">
              <select
                value={line.productId}
                onChange={(e) => {
                  const n = [...lines];
                  n[i].productId = e.target.value;
                  setLines(n);
                }}
                className="flex-1 border rounded px-2 py-1 text-sm"
              >
                <option value="">Chọn vật tư</option>
                {products?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="SL"
                value={line.quantity}
                onChange={(e) => {
                  const n = [...lines];
                  n[i].quantity = e.target.value;
                  setLines(n);
                }}
                className="w-20 border rounded px-2 py-1 text-sm"
              />
              <select
                value={line.unit}
                onChange={(e) => {
                  const n = [...lines];
                  n[i].unit = e.target.value;
                  setLines(n);
                }}
                className="w-20 border rounded px-2 py-1 text-sm"
              >
                <option>KG</option>
                <option>BAO</option>
                <option>CHAI</option>
                <option>LÍT</option>
              </select>
            </div>
          ))}
          <div className="flex gap-2">
            <button
              onClick={() =>
                setLines([
                  ...lines,
                  { productId: "", quantity: "", unit: "KG" },
                ])
              }
              className="text-sm text-blue-600"
            >
              + Thêm dòng
            </button>
            <button
              onClick={handleCreate}
              className="ml-auto px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
            >
              Lưu
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {prs?.map((pr: any) => (
          <div key={pr.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-sm font-medium">{pr.code}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${statusColor[pr.status] ?? ""}`}
              >
                {pr.status}
              </span>
            </div>
            <div className="text-sm text-slate-600 mb-2">
              {pr.lines
                ?.map(
                  (l: any) =>
                    `${l.product?.name ?? "?"} × ${l.quantity} ${l.unit}`,
                )
                .join(", ")}
            </div>
            <div className="flex gap-2">
              {pr.status === "DRAFT" && (
                <button
                  onClick={() => handleAction(pr.id, "submit")}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                >
                  Gửi duyệt
                </button>
              )}
              {pr.status === "SUBMITTED" && (
                <>
                  <button
                    onClick={() => handleAction(pr.id, "approve")}
                    className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded"
                  >
                    Duyệt
                  </button>
                  <button
                    onClick={() => handleAction(pr.id, "reject")}
                    className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded"
                  >
                    Từ chối
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function POTab() {
  const { data: pos } = useSWR("/api/farm/purchase-orders", fetcher);
  const { data: suppliers } = useSWR("/api/farm/suppliers", fetcher);
  const { data: products } = useSWR("/api/farm/products", fetcher);
  const [showForm, setShowForm] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState<
    { productId: string; quantity: string; unit: string; unitPrice: string }[]
  >([{ productId: "", quantity: "", unit: "KG", unitPrice: "" }]);

  async function handleCreate() {
    const payload = {
      supplierId,
      lines: lines
        .filter((l) => l.productId && l.quantity && l.unitPrice)
        .map((l) => ({
          ...l,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
        })),
    };
    await fetch("/api/farm/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    mutate("/api/farm/purchase-orders");
    setShowForm(false);
  }

  async function handleAction(id: string, action: string) {
    await fetch(`/api/farm/purchase-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    mutate("/api/farm/purchase-orders");
  }

  const statusColor: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-600",
    APPROVED: "bg-blue-100 text-blue-700",
    SENT: "bg-purple-100 text-purple-700",
    RECEIVED: "bg-emerald-100 text-emerald-700",
    COMPLETED: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg">Đơn hàng (PO)</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700"
        >
          + Tạo PO
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full border rounded px-2 py-1.5 text-sm"
          >
            <option value="">Chọn NCC</option>
            {suppliers?.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {lines.map((line, i) => (
            <div key={i} className="flex gap-2">
              <select
                value={line.productId}
                onChange={(e) => {
                  const n = [...lines];
                  n[i].productId = e.target.value;
                  setLines(n);
                }}
                className="flex-1 border rounded px-2 py-1 text-sm"
              >
                <option value="">Vật tư</option>
                {products?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="SL"
                value={line.quantity}
                onChange={(e) => {
                  const n = [...lines];
                  n[i].quantity = e.target.value;
                  setLines(n);
                }}
                className="w-20 border rounded px-2 py-1 text-sm"
              />
              <select
                value={line.unit}
                onChange={(e) => {
                  const n = [...lines];
                  n[i].unit = e.target.value;
                  setLines(n);
                }}
                className="w-16 border rounded px-2 py-1 text-sm"
              >
                <option>KG</option>
                <option>BAO</option>
                <option>CHAI</option>
              </select>
              <input
                type="number"
                placeholder="Đơn giá"
                value={line.unitPrice}
                onChange={(e) => {
                  const n = [...lines];
                  n[i].unitPrice = e.target.value;
                  setLines(n);
                }}
                className="w-24 border rounded px-2 py-1 text-sm"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <button
              onClick={() =>
                setLines([
                  ...lines,
                  { productId: "", quantity: "", unit: "KG", unitPrice: "" },
                ])
              }
              className="text-sm text-blue-600"
            >
              + Thêm
            </button>
            <button
              onClick={handleCreate}
              className="ml-auto px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
            >
              Lưu
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {pos?.map((po: any) => (
          <div key={po.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="font-mono text-sm font-medium">{po.code}</span>
                <span className="text-xs text-slate-500 ml-2">
                  {po.supplier?.name}
                </span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${statusColor[po.status] ?? ""}`}
              >
                {po.status}
              </span>
            </div>
            <div className="text-sm text-slate-600 mb-2">
              {po.lines
                ?.map(
                  (l: any) =>
                    `${l.product?.name} × ${l.quantity} ${l.unit} @ ${Number(l.unitPrice).toLocaleString()}đ`,
                )
                .join(", ")}
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm font-semibold">
                {Number(po.totalAmount).toLocaleString()}đ
              </span>
              <div className="flex gap-2">
                {po.status === "DRAFT" && (
                  <button
                    onClick={() => handleAction(po.id, "approve")}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                  >
                    Duyệt
                  </button>
                )}
                {po.status === "APPROVED" && (
                  <button
                    onClick={() => handleAction(po.id, "send")}
                    className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded"
                  >
                    Gửi NCC
                  </button>
                )}
                {po.status === "RECEIVED" && (
                  <button
                    onClick={() => handleAction(po.id, "complete")}
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded"
                  >
                    Hoàn tất
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GRNTab() {
  const { data: grns } = useSWR("/api/farm/grn", fetcher);
  const { data: pos } = useSWR("/api/farm/purchase-orders", fetcher);
  const [showForm, setShowForm] = useState(false);
  const [selectedPo, setSelectedPo] = useState<any>(null);
  const [grnLines, setGrnLines] = useState<
    {
      productId: string;
      qtyReceived: string;
      unit: string;
      mfgDate: string;
      expiryDate: string;
      unitCost: string;
    }[]
  >([]);

  const receivablePos =
    pos?.filter((po: any) => ["SENT", "APPROVED"].includes(po.status)) ?? [];

  function selectPo(poId: string) {
    const po = pos?.find((p: any) => p.id === poId);
    setSelectedPo(po);
    if (po) {
      setGrnLines(
        po.lines.map((l: any) => ({
          productId: l.productId,
          qtyReceived: String(l.quantity),
          unit: l.unit,
          mfgDate: new Date().toISOString().slice(0, 10),
          expiryDate: "",
          unitCost: String(l.unitPrice),
        })),
      );
    }
  }

  async function handleReceive() {
    if (!selectedPo) return;
    const payload = {
      poId: selectedPo.id,
      receivedBy: "worker",
      lines: grnLines.map((l) => ({
        ...l,
        qtyReceived: Number(l.qtyReceived),
        unitCost: Number(l.unitCost),
      })),
    };
    await fetch("/api/farm/grn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    mutate("/api/farm/grn");
    mutate("/api/farm/purchase-orders");
    setShowForm(false);
    setSelectedPo(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg">Nhận hàng (GRN)</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700"
        >
          + Nhận hàng
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <select
            onChange={(e) => selectPo(e.target.value)}
            className="w-full border rounded px-2 py-1.5 text-sm"
          >
            <option value="">Chọn PO cần nhận</option>
            {receivablePos.map((po: any) => (
              <option key={po.id} value={po.id}>
                {po.code} — {po.supplier?.name}
              </option>
            ))}
          </select>

          {selectedPo &&
            grnLines.map((line, i) => {
              const product = selectedPo.lines[i]?.product;
              return (
                <div key={i} className="border-t pt-2 space-y-1">
                  <div className="text-sm font-medium">{product?.name}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-500">SL nhận</label>
                      <input
                        type="number"
                        value={line.qtyReceived}
                        onChange={(e) => {
                          const n = [...grnLines];
                          n[i].qtyReceived = e.target.value;
                          setGrnLines(n);
                        }}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Đơn giá</label>
                      <input
                        type="number"
                        value={line.unitCost}
                        onChange={(e) => {
                          const n = [...grnLines];
                          n[i].unitCost = e.target.value;
                          setGrnLines(n);
                        }}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Ngày SX</label>
                      <input
                        type="date"
                        value={line.mfgDate}
                        onChange={(e) => {
                          const n = [...grnLines];
                          n[i].mfgDate = e.target.value;
                          setGrnLines(n);
                        }}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Hạn dùng</label>
                      <input
                        type="date"
                        value={line.expiryDate}
                        onChange={(e) => {
                          const n = [...grnLines];
                          n[i].expiryDate = e.target.value;
                          setGrnLines(n);
                        }}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

          {selectedPo && (
            <button
              onClick={handleReceive}
              className="w-full py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
            >
              Xác nhận nhận hàng
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        {grns?.map((grn: any) => (
          <div key={grn.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-sm">{grn.po?.code}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                {grn.status}
              </span>
            </div>
            <div className="text-sm text-slate-600">
              {grn.lines
                ?.map(
                  (l: any) => `${l.product?.name} × ${l.qtyReceived} ${l.unit}`,
                )
                .join(", ")}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Nhận bởi: {grn.receivedBy} ·{" "}
              {grn.receivedAt
                ? new Date(grn.receivedAt).toLocaleDateString("vi")
                : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
