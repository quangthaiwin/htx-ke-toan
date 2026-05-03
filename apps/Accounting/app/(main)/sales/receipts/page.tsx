import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

export default async function SalesReceiptsPage() {
  const invoices = await prisma.aRInvoice.findMany({
    where: { tenantId: TENANT_ID, status: "SENT", remainingAmount: { gt: 0 } },
    orderBy: { invoiceDate: "desc" },
  });
  await prisma.$disconnect();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Thu tiền khách hàng
      </h1>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-sm text-gray-600 mb-4">
          Chọn hóa đơn để thu tiền. Hệ thống sẽ tự tạo phiếu thu tương ứng.
        </p>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Không có hóa đơn nào cần thu tiền</p>
            <p className="text-sm mt-1">
              Tạo hóa đơn bán ra trước, sau đó thu tiền tại đây
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Số HĐ
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Khách hàng
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Tổng tiền
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Còn nợ
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-2 font-mono text-blue-700">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-4 py-2">{inv.customerName}</td>
                  <td className="px-4 py-2 text-right font-mono">
                    {new Intl.NumberFormat("vi-VN").format(
                      Number(inv.totalAmount),
                    )}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-red-600">
                    {new Intl.NumberFormat("vi-VN").format(
                      Number(inv.remainingAmount),
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <a
                      href={`/cash/receipts?ref=${inv.id}&amount=${inv.remainingAmount}&desc=Thu+tiền+${inv.customerName}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Thu tiền
                    </a>
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
