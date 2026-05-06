"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TransferPage() {
  const { data: ponds } = useSWR("/api/farm/ponds", fetcher);
  const { data: crops } = useSWR("/api/farm/crops", fetcher);
  const { data: transfers } = useSWR("/api/farm/transfers", fetcher);

  const [fromAssignmentId, setFromAssignmentId] = useState("");
  const [toPhaseId, setToPhaseId] = useState("");
  const [toPondId, setToPondId] = useState("");
  const [shrimpCount, setShrimpCount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activePonds =
    ponds?.filter((p: any) => p.assignments?.length > 0) ?? [];
  const phases = crops?.flatMap((c: any) => c.phases) ?? [];

  const fromAssignment = activePonds
    .flatMap((p: any) => p.assignments)
    .find((a: any) => a.id === fromAssignmentId);

  async function handleSubmit() {
    if (!fromAssignmentId || !toPhaseId || !toPondId || !shrimpCount) return;
    setSubmitting(true);
    await fetch("/api/farm/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAssignmentId,
        toPhaseId,
        toPondId,
        shrimpCount: Number(shrimpCount),
        notes,
      }),
    });
    mutate("/api/farm/transfers");
    mutate("/api/farm/ponds");
    setShrimpCount("");
    setNotes("");
    setSubmitting(false);
  }

  async function handleConfirm(id: string) {
    await fetch(`/api/farm/transfers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirm" }),
    });
    mutate("/api/farm/transfers");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">San tôm</h1>

      <div className="bg-white border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Tạo lệnh san tôm</h2>

        <div>
          <label className="text-xs text-slate-500">Ao nguồn</label>
          <select
            value={fromAssignmentId}
            onChange={(e) => setFromAssignmentId(e.target.value)}
            className="w-full border rounded px-2 py-1.5 text-sm mt-1"
          >
            <option value="">Chọn ao nguồn</option>
            {activePonds.map((p: any) => (
              <option key={p.assignments[0]?.id} value={p.assignments[0]?.id}>
                {p.name} — {p.assignments[0]?.shrimpCount?.toLocaleString()} con
              </option>
            ))}
          </select>
        </div>

        {fromAssignment && (
          <div className="bg-blue-50 rounded p-2 text-sm">
            Hiện có:{" "}
            <span className="font-mono font-medium">
              {fromAssignment.shrimpCount?.toLocaleString()}
            </span>{" "}
            con
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500">Phase đích</label>
            <select
              value={toPhaseId}
              onChange={(e) => setToPhaseId(e.target.value)}
              className="w-full border rounded px-2 py-1.5 text-sm mt-1"
            >
              <option value="">Chọn phase</option>
              {phases.map((ph: any) => (
                <option key={ph.id} value={ph.id}>
                  Phase {ph.phaseNumber} — {ph.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Ao đích</label>
            <select
              value={toPondId}
              onChange={(e) => setToPondId(e.target.value)}
              className="w-full border rounded px-2 py-1.5 text-sm mt-1"
            >
              <option value="">Chọn ao</option>
              {ponds?.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500">Số con san</label>
          <input
            type="number"
            value={shrimpCount}
            onChange={(e) => setShrimpCount(e.target.value)}
            className="w-full border rounded px-2 py-1.5 text-sm mt-1"
            placeholder="0"
          />
        </div>

        <div>
          <label className="text-xs text-slate-500">Ghi chú</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded px-2 py-1.5 text-sm mt-1"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-2 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 disabled:opacity-50"
        >
          Tạo lệnh san tôm
        </button>
      </div>

      <div>
        <h2 className="font-semibold text-lg mb-2">Lịch sử san tôm</h2>
        <div className="space-y-2">
          {transfers?.map((t: any) => (
            <div
              key={t.id}
              className="bg-white border rounded-lg p-3 flex justify-between items-center"
            >
              <div>
                <div className="text-sm">
                  {t.shrimpCount?.toLocaleString()} con ·{" "}
                  {Number(t.costPerUnit).toLocaleString()}đ/con
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(t.transferDate).toLocaleDateString("vi")}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${t.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                >
                  {t.status}
                </span>
                {t.status === "DRAFT" && (
                  <button
                    onClick={() => handleConfirm(t.id)}
                    className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded"
                  >
                    Duyệt
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
