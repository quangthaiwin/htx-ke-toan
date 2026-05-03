"use client";

import { useState } from "react";
import { exportToCSV, fmtExport } from "@/lib/export-csv";

interface TrialBalanceRow {
  accountNumber: string;
  accountName: string;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
}

interface TrialBalanceData {
  periodStart: string;
  periodEnd: string;
  rows: TrialBalanceRow[];
  totals: {
    openingDebit: number;
    openingCredit: number;
    periodDebit: number;
    periodCredit: number;
    closingDebit: number;
    closingCredit: number;
  };
  isBalanced: boolean;
}

const fmt = (n: number) =>
  n === 0 ? "" : new Intl.NumberFormat("vi-VN").format(Math.round(n));

export default function TrialBalancePage() {
  const now = new Date();
  const [fromDate, setFromDate] = useState(`${now.getFullYear()}-01-01`);
  const [toDate, setToDate] = useState(now.toISOString().split("T")[0]);
  const [data, setData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports/trial-balance?from=${fromDate}&to=${toDate}`,
      );
      const json = await res.json();
      setData(json.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Bảng cân đối phát sinh
      </h1>

      <div className="flex items-end gap-4 mb-6">
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
        <button
          onClick={fetchReport}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50"
          style={{ backgroundColor: "#1B2B4B" }}
        >
          {loading ? "Đang tải..." : "Xem báo cáo"}
        </button>
        {data && (
          <>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              In
            </button>
            <button
              onClick={() => {
                if (!data) return;
                exportToCSV(
                  [
                    "Số TK",
                    "Tên TK",
                    "ĐK Nợ",
                    "ĐK Có",
                    "PS Nợ",
                    "PS Có",
                    "CK Nợ",
                    "CK Có",
                  ],
                  data.rows.map((r) => [
                    r.accountNumber,
                    r.accountName,
                    fmtExport(r.openingDebit),
                    fmtExport(r.openingCredit),
                    fmtExport(r.periodDebit),
                    fmtExport(r.periodCredit),
                    fmtExport(r.closingDebit),
                    fmtExport(r.closingCredit),
                  ]),
                  `bang-can-doi-phat-sinh_${fromDate}_${toDate}`,
                );
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Xuất Excel
            </button>
          </>
        )}
      </div>

      {data && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden print:border-0">
          {!data.isBalanced && (
            <div className="m-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
              Cảnh báo: Bảng cân đối chưa cân bằng! Kiểm tra lại bút toán.
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b-2 border-gray-300">
                <tr>
                  <th
                    rowSpan={2}
                    className="px-3 py-2 text-left font-semibold border-r"
                  >
                    Số TK
                  </th>
                  <th
                    rowSpan={2}
                    className="px-3 py-2 text-left font-semibold border-r"
                  >
                    Tên tài khoản
                  </th>
                  <th
                    colSpan={2}
                    className="px-3 py-1 text-center font-semibold border-r border-b"
                  >
                    Số dư đầu kỳ
                  </th>
                  <th
                    colSpan={2}
                    className="px-3 py-1 text-center font-semibold border-r border-b"
                  >
                    Phát sinh trong kỳ
                  </th>
                  <th
                    colSpan={2}
                    className="px-3 py-1 text-center font-semibold"
                  >
                    Số dư cuối kỳ
                  </th>
                </tr>
                <tr>
                  <th className="px-3 py-1 text-right font-medium border-r">
                    Nợ
                  </th>
                  <th className="px-3 py-1 text-right font-medium border-r">
                    Có
                  </th>
                  <th className="px-3 py-1 text-right font-medium border-r">
                    Nợ
                  </th>
                  <th className="px-3 py-1 text-right font-medium border-r">
                    Có
                  </th>
                  <th className="px-3 py-1 text-right font-medium border-r">
                    Nợ
                  </th>
                  <th className="px-3 py-1 text-right font-medium">Có</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr
                    key={row.accountNumber}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-3 py-1.5 font-mono text-blue-700 border-r">
                      {row.accountNumber}
                    </td>
                    <td className="px-3 py-1.5 border-r">{row.accountName}</td>
                    <td className="px-3 py-1.5 text-right font-mono border-r">
                      {fmt(row.openingDebit)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono border-r">
                      {fmt(row.openingCredit)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono border-r">
                      {fmt(row.periodDebit)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono border-r">
                      {fmt(row.periodCredit)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono border-r">
                      {fmt(row.closingDebit)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono">
                      {fmt(row.closingCredit)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 border-t-2 border-gray-300 font-semibold">
                <tr>
                  <td colSpan={2} className="px-3 py-2 border-r">
                    Tổng cộng
                  </td>
                  <td className="px-3 py-2 text-right font-mono border-r">
                    {fmt(data.totals.openingDebit)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono border-r">
                    {fmt(data.totals.openingCredit)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono border-r">
                    {fmt(data.totals.periodDebit)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono border-r">
                    {fmt(data.totals.periodCredit)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono border-r">
                    {fmt(data.totals.closingDebit)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {fmt(data.totals.closingCredit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
