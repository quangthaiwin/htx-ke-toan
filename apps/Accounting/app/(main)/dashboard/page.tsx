import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

function fmt(n: number) {
  if (n === 0) return "0 ₫";
  return n.toLocaleString("vi-VN") + " ₫";
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("vi-VN");
}

export default async function DashboardPage() {
  // Load all journal lines to compute balances — sequential for pgbouncer
  const cashLines = await prisma.journalLine.findMany({
    where: {
      tenantId: TENANT_ID,
      journalEntry: { status: "POSTED" },
      account: { accountNumber: { in: ["1111", "1121"] } },
    },
    select: { debitAmount: true, creditAmount: true },
  });

  const arLines = await prisma.journalLine.findMany({
    where: {
      tenantId: TENANT_ID,
      journalEntry: { status: "POSTED" },
      account: { accountNumber: "131" },
    },
    select: { debitAmount: true, creditAmount: true },
  });

  const apLines = await prisma.journalLine.findMany({
    where: {
      tenantId: TENANT_ID,
      journalEntry: { status: "POSTED" },
      account: { accountNumber: "331" },
    },
    select: { debitAmount: true, creditAmount: true },
  });

  const revenueLines = await prisma.journalLine.findMany({
    where: {
      tenantId: TENANT_ID,
      journalEntry: { status: "POSTED" },
      account: { accountNumber: { startsWith: "511" } },
    },
    select: { creditAmount: true },
  });

  const recentEntries = await prisma.journalEntry.findMany({
    where: { tenantId: TENANT_ID },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      entryNumber: true,
      entryDate: true,
      description: true,
      totalDebit: true,
      status: true,
      journalType: true,
    },
  });

  const draftCount = await prisma.journalEntry.count({
    where: { tenantId: TENANT_ID, status: "DRAFT" },
  });

  // Compute balances
  const sumDebit = (lines: { debitAmount: unknown }[]) =>
    lines.reduce((s, l) => s + Number(l.debitAmount), 0);
  const sumCredit = (lines: { creditAmount: unknown }[]) =>
    lines.reduce((s, l) => s + Number(l.creditAmount), 0);

  const cashBalance = sumDebit(cashLines) - sumCredit(cashLines);
  const arBalance = sumDebit(arLines) - sumCredit(arLines);
  const apBalance = sumCredit(apLines) - sumDebit(apLines); // TK 331 credit-normal: Cr - Dr = số nợ NCC
  const revenue = sumCredit(revenueLines);

  const kpis = [
    {
      label: "Tiền mặt & Ngân hàng",
      value: cashBalance,
      sub: "TK 1111 + 1121",
      color: "text-blue-700",
      bg: "bg-blue-50",
      href: "/cash/receipts",
    },
    {
      label: "Phải thu (AR)",
      value: arBalance,
      sub: "TK 131",
      color: "text-green-700",
      bg: "bg-green-50",
      href: "/sales/invoices",
    },
    {
      label: "Phải trả (AP)",
      value: apBalance,
      sub: "TK 331",
      color: "text-orange-700",
      bg: "bg-orange-50",
      href: "/purchases/invoices",
    },
    {
      label: "Doanh thu",
      value: revenue,
      sub: "TK 511 — lũy kế",
      color: "text-purple-700",
      bg: "bg-purple-50",
      href: "/reports/income-statement",
    },
  ];

  function journalTypeLabel(type: string) {
    const map: Record<string, string> = {
      CASH_RECEIPT: "Phiếu thu",
      CASH_PAYMENT: "Phiếu chi",
      SALES_INVOICE: "Hóa đơn BH",
      PURCHASE_INVOICE: "Hóa đơn MH",
      GENERAL: "Bút toán",
    };
    return map[type] ?? type;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Tổng quan</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Số liệu từ các bút toán đã ghi sổ
        </p>
      </div>

      {draftCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <span className="text-amber-600 text-sm font-medium">
            Có {draftCount} chứng từ nháp chưa ghi sổ
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className={`${k.bg} rounded-xl p-5 hover:opacity-90 transition-opacity`}
          >
            <p className="text-xs font-medium text-gray-500 mb-1">{k.label}</p>
            <p className={`text-xl font-bold font-mono ${k.color}`}>
              {fmt(k.value)}
            </p>
            <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
          </Link>
        ))}
      </div>

      {/* Recent entries */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Chứng từ gần nhất
          </h2>
        </div>
        {recentEntries.length === 0 ? (
          <p className="text-center py-12 text-gray-400 text-sm">
            Chưa có chứng từ nào. Bắt đầu bằng cách tạo phiếu thu.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Số CT
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Loại
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Ngày
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Nội dung
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Số tiền
                </th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  TT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentEntries.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-blue-700 font-semibold">
                    {e.entryNumber}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">
                    {journalTypeLabel(e.journalType)}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">
                    {fmtDate(e.entryDate)}
                  </td>
                  <td className="px-4 py-2.5 text-gray-800 max-w-xs truncate">
                    {e.description}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium text-gray-900">
                    {fmt(Number(e.totalDebit))}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        e.status === "POSTED"
                          ? "bg-green-100 text-green-700"
                          : e.status === "REVERSED"
                            ? "bg-red-100 text-red-600"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {e.status === "POSTED"
                        ? "Ghi sổ"
                        : e.status === "REVERSED"
                          ? "Hủy"
                          : "Nháp"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
