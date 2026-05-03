import { PrismaClient } from "@prisma/client";
import PaymentForm from "./payment-form";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

function fmt(n: unknown) {
  return Number(n).toLocaleString("vi-VN") + " ₫";
}

export default async function CashPaymentsPage() {
  const [entries, accounts] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { tenantId: TENANT_ID, journalType: "CASH_PAYMENT" },
      orderBy: { entryDate: "desc" },
      take: 50,
    }),
    prisma.account.findMany({
      where: { tenantId: TENANT_ID, isActive: true },
      select: { accountNumber: true, name: true },
      orderBy: { accountNumber: "asc" },
    }),
  ]);
  await prisma.$disconnect();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Phiếu chi</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {entries.length} phiếu — Nợ 331/642 / Có 1111
          </p>
        </div>
      </div>

      <PaymentForm accounts={accounts} />

      {entries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Số phiếu
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Ngày
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Nội dung
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Số tiền
                </th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((e) => (
                <tr
                  key={e.id}
                  className={`hover:bg-gray-50 ${e.status === "DRAFT" ? "opacity-70" : ""}`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-orange-700 font-semibold">
                    {e.entryNumber}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(e.entryDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{e.description}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">
                    {fmt(e.totalCredit)}
                  </td>
                  <td className="px-4 py-3 text-center">
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
                        ? "Đã ghi sổ"
                        : e.status === "REVERSED"
                          ? "Đã đảo"
                          : "Nháp"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          Chưa có phiếu chi nào
        </div>
      )}
    </div>
  );
}
