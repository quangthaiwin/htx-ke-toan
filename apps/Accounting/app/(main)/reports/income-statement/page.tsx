"use client";

import { useState } from "react";

interface IncomeData {
  periodStart: string;
  periodEnd: string;
  grossRevenue: number;
  revenueDeductions: number;
  netRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  financialIncome: number;
  financialExpenses: number;
  sellingExpenses: number;
  adminExpenses: number;
  operatingProfit: number;
  otherIncome: number;
  otherExpenses: number;
  otherProfit: number;
  profitBeforeTax: number;
  citExpense: number;
  netProfit: number;
}

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n));

export default function IncomeStatementPage() {
  const now = new Date();
  const [fromDate, setFromDate] = useState(`${now.getFullYear()}-01-01`);
  const [toDate, setToDate] = useState(now.toISOString().split("T")[0]);
  const [data, setData] = useState<IncomeData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports/income-statement?from=${fromDate}&to=${toDate}`,
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
        Báo cáo kết quả HĐKD (B02-DN)
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
      </div>

      {data && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl print:border-0 print:p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="text-left py-2 font-semibold text-gray-900">
                  Chỉ tiêu
                </th>
                <th className="text-right py-2 font-semibold text-gray-900 w-40">
                  Số tiền (VND)
                </th>
              </tr>
            </thead>
            <tbody>
              <Row
                label="1. Doanh thu bán hàng và cung cấp dịch vụ"
                value={data.grossRevenue}
              />
              <Row
                label="2. Các khoản giảm trừ doanh thu"
                value={data.revenueDeductions}
                indent
              />
              <Row
                label="3. Doanh thu thuần (= 1 - 2)"
                value={data.netRevenue}
                bold
              />
              <Row label="4. Giá vốn hàng bán" value={data.costOfGoodsSold} />
              <Row
                label="5. Lợi nhuận gộp (= 3 - 4)"
                value={data.grossProfit}
                bold
              />
              <Row
                label="6. Doanh thu hoạt động tài chính"
                value={data.financialIncome}
              />
              <Row
                label="7. Chi phí tài chính"
                value={data.financialExpenses}
              />
              <Row label="8. Chi phí bán hàng" value={data.sellingExpenses} />
              <Row
                label="9. Chi phí quản lý doanh nghiệp"
                value={data.adminExpenses}
              />
              <Row
                label="10. Lợi nhuận thuần từ HĐKD (= 5+6-7-8-9)"
                value={data.operatingProfit}
                bold
              />
              <Row label="11. Thu nhập khác" value={data.otherIncome} />
              <Row label="12. Chi phí khác" value={data.otherExpenses} />
              <Row
                label="13. Lợi nhuận khác (= 11 - 12)"
                value={data.otherProfit}
              />
              <Row
                label="14. Tổng lợi nhuận trước thuế (= 10 + 13)"
                value={data.profitBeforeTax}
                bold
              />
              <Row label="15. Chi phí thuế TNDN" value={data.citExpense} />
              <Row
                label="16. Lợi nhuận sau thuế (= 14 - 15)"
                value={data.netProfit}
                bold
                highlight
              />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  indent,
  highlight,
}: {
  label: string;
  value: number;
  bold?: boolean;
  indent?: boolean;
  highlight?: boolean;
}) {
  return (
    <tr className={`border-b border-gray-100 ${highlight ? "bg-blue-50" : ""}`}>
      <td
        className={`py-2 ${bold ? "font-semibold" : ""} ${indent ? "pl-4" : ""}`}
      >
        {label}
      </td>
      <td
        className={`py-2 text-right font-mono tabular-nums ${bold ? "font-semibold" : ""} ${value < 0 ? "text-red-600" : ""}`}
      >
        {fmt(value)}
      </td>
    </tr>
  );
}
