"use client";

import { useState } from "react";

interface GLEntry {
  date: string;
  entryNumber: string;
  description: string | null;
  debit: number;
  credit: number;
}

interface GLAccount {
  accountNumber: string;
  accountName: string;
  totalDebit: number;
  totalCredit: number;
  entries: GLEntry[];
}

interface GLData {
  periodStart: string;
  periodEnd: string;
  accounts: GLAccount[];
  totalAccounts: number;
  totalEntries: number;
}

const fmt = (n: number) =>
  n === 0 ? "" : new Intl.NumberFormat("vi-VN").format(Math.round(n));

export default function GeneralLedgerPage() {
  const now = new Date();
  const [fromDate, setFromDate] = useState(`${now.getFullYear()}-01-01`);
  const [toDate, setToDate] = useState(now.toISOString().split("T")[0]);
  const [accountFilter, setAccountFilter] = useState("");
  const [data, setData] = useState<GLData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from: fromDate, to: toDate });
      if (accountFilter) params.set("account", accountFilter);
      const res = await fetch(`/api/reports/general-ledger?${params}`);
      const json = await res.json();
      setData(json.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sổ cái tổng hợp</h1>

      <div className="flex items-end gap-4 mb-6 flex-wrap">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Từ ngày
          </label>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Đến ngày
          </label>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tài khoản (để trống = tất cả)
          </label>
          <input
            type="text"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm w-32"
            placeholder="VD: 131"
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
          />
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50"
          style={{ backgroundColor: "#1B2B4B" }}
        >
          {loading ? "Đang tải..." : "Xem sổ cái"}
        </button>
      </div>

      {data && (
        <div className="space-y-6">
          <p className="text-sm text-gray-500">
            Tìm thấy {data.totalAccounts} tài khoản, {data.totalEntries} bút
            toán
          </p>

          {data.accounts.map((acc) => (
            <div
              key={acc.accountNumber}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden print:break-inside-avoid"
            >
              <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                <div>
                  <span className="font-mono text-blue-700 font-semibold">
                    {acc.accountNumber}
                  </span>
                  <span className="ml-2 text-gray-900 font-medium">
                    {acc.accountName}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Nợ:{" "}
                  <span className="font-mono">
                    {new Intl.NumberFormat("vi-VN").format(
                      Math.round(acc.totalDebit),
                    )}
                  </span>{" "}
                  | Có:{" "}
                  <span className="font-mono">
                    {new Intl.NumberFormat("vi-VN").format(
                      Math.round(acc.totalCredit),
                    )}
                  </span>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium w-24">
                      Ngày
                    </th>
                    <th className="px-3 py-2 text-left font-medium w-32">
                      Số CT
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Diễn giải
                    </th>
                    <th className="px-3 py-2 text-right font-medium w-32">
                      Nợ
                    </th>
                    <th className="px-3 py-2 text-right font-medium w-32">
                      Có
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {acc.entries.map((entry, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="px-3 py-1.5 text-gray-700">
                        {entry.date}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-xs">
                        {entry.entryNumber}
                      </td>
                      <td className="px-3 py-1.5 text-gray-900">
                        {entry.description || "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono">
                        {fmt(entry.debit)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono">
                        {fmt(entry.credit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {data.accounts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Không có dữ liệu trong kỳ này</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
