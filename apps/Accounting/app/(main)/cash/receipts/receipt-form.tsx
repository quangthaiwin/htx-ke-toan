"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Account = { accountNumber: string; name: string };

export default function ReceiptForm({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [form, setForm] = useState({
    entryDate: new Date().toISOString().slice(0, 10),
    description: "",
    amount: "",
    debitAccountNumber: "1111",
    creditAccountNumber: "131",
    payer: "",
    reference: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(postImmediately: boolean) {
    setLoading(true);
    setError("");

    const res = await fetch("/api/cash/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
        post: postImmediately,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(
        typeof data.error === "string"
          ? data.error
          : JSON.stringify(data.error),
      );
      setLoading(false);
      return;
    }

    setOpen(false);
    setForm({
      entryDate: new Date().toISOString().slice(0, 10),
      description: "",
      amount: "",
      debitAccountNumber: "1111",
      creditAccountNumber: "131",
      payer: "",
      reference: "",
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-primary">
          + Tạo phiếu thu
        </button>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Tạo phiếu thu mới
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(true);
            }}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <label className="label">Ngày thu</label>
              <input
                type="date"
                required
                value={form.entryDate}
                onChange={(e) => set("entryDate", e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Số tiền (VNĐ)</label>
              <input
                type="number"
                required
                min="1"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                className="input"
                placeholder="1000000"
              />
            </div>
            <div className="col-span-2">
              <label className="label">Nội dung thu</label>
              <input
                type="text"
                required
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="input"
                placeholder="Thu tiền bán hàng tháng 5"
              />
            </div>
            <div>
              <label className="label">Người nộp tiền</label>
              <input
                type="text"
                value={form.payer}
                onChange={(e) => set("payer", e.target.value)}
                className="input"
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="label">Số chứng từ gốc</label>
              <input
                type="text"
                value={form.reference}
                onChange={(e) => set("reference", e.target.value)}
                className="input"
                placeholder="HĐ-2026-001"
              />
            </div>
            <div>
              <label className="label">Tài khoản Nợ (tiền về)</label>
              <select
                value={form.debitAccountNumber}
                onChange={(e) => set("debitAccountNumber", e.target.value)}
                className="input"
              >
                {accounts
                  .filter((a) => ["1111", "1121"].includes(a.accountNumber))
                  .map((a) => (
                    <option key={a.accountNumber} value={a.accountNumber}>
                      {a.accountNumber} — {a.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="label">Tài khoản Có (nguồn thu)</label>
              <select
                value={form.creditAccountNumber}
                onChange={(e) => set("creditAccountNumber", e.target.value)}
                className="input"
              >
                {accounts.map((a) => (
                  <option key={a.accountNumber} value={a.accountNumber}>
                    {a.accountNumber} — {a.name}
                  </option>
                ))}
              </select>
            </div>
            {error && (
              <p className="col-span-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <div className="col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Đang lưu..." : "Ghi sổ"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => submit(false)}
                className="btn-secondary"
              >
                Lưu nháp
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-secondary"
              >
                Huỷ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
