"use client";

import { useState } from "react";

interface BalanceSheetData {
  reportDate: string;
  currentAssets: {
    cashAndEquivalents: number;
    shortTermInvestments: number;
    shortTermReceivables: number;
    inventories: number;
    otherCurrentAssets: number;
    totalCurrentAssets: number;
  };
  nonCurrentAssets: {
    fixedAssets: number;
    investmentProperty: number;
    longTermInvestments: number;
    otherNonCurrentAssets: number;
    totalNonCurrentAssets: number;
  };
  totalAssets: number;
  liabilities: {
    currentLiabilities: number;
    nonCurrentLiabilities: number;
    totalLiabilities: number;
  };
  equity: {
    ownersEquity: number;
    reserves: number;
    retainedEarnings: number;
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n));

export default function BalanceSheetPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/balance-sheet?date=${date}`);
      const json = await res.json();
      setData(json.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Bảng cân đối kế toán (B01-DN)
      </h1>

      <div className="flex items-end gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày báo cáo
          </label>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
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
        <div className="bg-white border border-gray-200 rounded-lg p-6 print:border-0 print:p-0">
          {!data.isBalanced && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
              Cảnh báo: Bảng CĐKT chưa cân! (Tài sản: {fmt(data.totalAssets)} |
              Nguồn vốn: {fmt(data.totalLiabilitiesAndEquity)})
            </div>
          )}

          <div className="grid grid-cols-2 gap-8">
            {/* TÀI SẢN */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
                TÀI SẢN
              </h2>

              <h3 className="text-sm font-semibold text-gray-700 mt-3 mb-2">
                A. TÀI SẢN NGẮN HẠN
              </h3>
              <ReportRow
                label="I. Tiền và tương đương tiền"
                value={data.currentAssets.cashAndEquivalents}
              />
              <ReportRow
                label="II. Đầu tư tài chính ngắn hạn"
                value={data.currentAssets.shortTermInvestments}
              />
              <ReportRow
                label="III. Các khoản phải thu ngắn hạn"
                value={data.currentAssets.shortTermReceivables}
              />
              <ReportRow
                label="IV. Hàng tồn kho"
                value={data.currentAssets.inventories}
              />
              <ReportRow
                label="V. Tài sản ngắn hạn khác"
                value={data.currentAssets.otherCurrentAssets}
              />
              <ReportRow
                label="Tổng TSNH"
                value={data.currentAssets.totalCurrentAssets}
                bold
              />

              <h3 className="text-sm font-semibold text-gray-700 mt-4 mb-2">
                B. TÀI SẢN DÀI HẠN
              </h3>
              <ReportRow
                label="I. Tài sản cố định"
                value={data.nonCurrentAssets.fixedAssets}
              />
              <ReportRow
                label="II. Bất động sản đầu tư"
                value={data.nonCurrentAssets.investmentProperty}
              />
              <ReportRow
                label="III. Đầu tư tài chính dài hạn"
                value={data.nonCurrentAssets.longTermInvestments}
              />
              <ReportRow
                label="IV. Tài sản dài hạn khác"
                value={data.nonCurrentAssets.otherNonCurrentAssets}
              />
              <ReportRow
                label="Tổng TSDH"
                value={data.nonCurrentAssets.totalNonCurrentAssets}
                bold
              />

              <div className="mt-4 pt-2 border-t-2 border-gray-800">
                <ReportRow
                  label="TỔNG CỘNG TÀI SẢN"
                  value={data.totalAssets}
                  bold
                />
              </div>
            </div>

            {/* NGUỒN VỐN */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
                NGUỒN VỐN
              </h2>

              <h3 className="text-sm font-semibold text-gray-700 mt-3 mb-2">
                C. NỢ PHẢI TRẢ
              </h3>
              <ReportRow
                label="I. Nợ ngắn hạn"
                value={data.liabilities.currentLiabilities}
              />
              <ReportRow
                label="II. Nợ dài hạn"
                value={data.liabilities.nonCurrentLiabilities}
              />
              <ReportRow
                label="Tổng nợ phải trả"
                value={data.liabilities.totalLiabilities}
                bold
              />

              <h3 className="text-sm font-semibold text-gray-700 mt-4 mb-2">
                D. VỐN CHỦ SỞ HỮU
              </h3>
              <ReportRow
                label="I. Vốn đầu tư của CSH"
                value={data.equity.ownersEquity}
              />
              <ReportRow label="II. Các quỹ" value={data.equity.reserves} />
              <ReportRow
                label="III. Lợi nhuận chưa phân phối"
                value={data.equity.retainedEarnings}
              />
              <ReportRow
                label="Tổng vốn CSH"
                value={data.equity.totalEquity}
                bold
              />

              <div className="mt-4 pt-2 border-t-2 border-gray-800">
                <ReportRow
                  label="TỔNG NGUỒN VỐN"
                  value={data.totalLiabilitiesAndEquity}
                  bold
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between py-1 text-sm ${bold ? "font-semibold" : ""}`}
    >
      <span className="text-gray-700">{label}</span>
      <span className="font-mono tabular-nums">{fmt(value)}</span>
    </div>
  );
}
