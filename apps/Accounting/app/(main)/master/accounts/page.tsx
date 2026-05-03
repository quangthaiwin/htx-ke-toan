import { PrismaClient } from "@prisma/client";
import SeedButton from "./seed-button";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

const TYPE_LABEL: Record<string, string> = {
  ASSET: "Tài sản",
  LIABILITY: "Nợ phải trả",
  EQUITY: "Vốn CSH",
  REVENUE: "Doanh thu",
  EXPENSE: "Chi phí",
  CONTRA_ASSET: "Tài sản điều chỉnh",
  CONTRA_REVENUE: "Giảm trừ DT",
};

const GROUP_LABEL: Record<string, string> = {
  GROUP_1: "Loại 1 — Tài sản ngắn hạn",
  GROUP_2: "Loại 2 — Tài sản dài hạn",
  GROUP_3: "Loại 3 — Nợ phải trả",
  GROUP_4: "Loại 4 — Vốn CSH",
  GROUP_5: "Loại 5 — Doanh thu",
  GROUP_6: "Loại 6 — Chi phí SXKD",
  GROUP_7: "Loại 7 — Thu nhập khác",
  GROUP_8: "Loại 8 — Chi phí khác",
  GROUP_9: "Loại 9 — Kết quả KD",
};

export default async function AccountsPage() {
  const accounts = await prisma.account.findMany({
    where: { tenantId: TENANT_ID, isActive: true },
    orderBy: [{ accountGroup: "asc" }, { accountNumber: "asc" }],
  });
  await prisma.$disconnect();

  const groups = [...new Set(accounts.map((a) => a.accountGroup))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Hệ thống tài khoản
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {accounts.length > 0
              ? `${accounts.length} tài khoản — Thông tư 200/2014/TT-BTC`
              : 'Chưa có tài khoản. Nhấn "Khởi tạo TT200" để nạp dữ liệu.'}
          </p>
        </div>
        <SeedButton hasAccounts={accounts.length > 0} />
      </div>

      {accounts.length > 0 && (
        <div className="space-y-4">
          {groups.map((group) => {
            const groupAccounts = accounts.filter(
              (a) => a.accountGroup === group,
            );
            return (
              <div
                key={group}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {GROUP_LABEL[group] ?? group}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-24">
                        Số TK
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Tên tài khoản
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-32 hidden md:table-cell">
                        Loại
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 w-28 hidden lg:table-cell">
                        Số dư
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {groupAccounts.map((acc) => (
                      <tr
                        key={acc.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          <span
                            className="font-mono text-xs font-semibold text-blue-700"
                            style={{ paddingLeft: `${(acc.level - 1) * 12}px` }}
                          >
                            {acc.accountNumber}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={
                              acc.level === 1
                                ? "font-medium text-gray-900"
                                : "text-gray-700"
                            }
                            style={{ paddingLeft: `${(acc.level - 1) * 12}px` }}
                          >
                            {acc.name}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 hidden md:table-cell">
                          <span className="text-xs text-gray-500">
                            {TYPE_LABEL[acc.accountType] ?? acc.accountType}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right hidden lg:table-cell">
                          <span className="text-xs font-mono text-gray-600">
                            {Number(acc.currentBalance).toLocaleString("vi-VN")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
