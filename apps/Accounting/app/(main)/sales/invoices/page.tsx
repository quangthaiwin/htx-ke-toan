import { PrismaClient } from "@prisma/client";
import { SalesInvoiceForm } from "./invoice-form";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

export default async function SalesInvoicesPage() {
  const invoices = await prisma.aRInvoice.findMany({
    where: { tenantId: TENANT_ID },
    orderBy: { invoiceDate: "desc" },
    take: 50,
  });
  await prisma.$disconnect();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Hóa đơn bán ra</h1>
      <SalesInvoiceForm />

      {invoices.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-1">Chưa có hóa đơn nào</p>
          <p className="text-sm">Tạo hóa đơn đầu tiên ở form bên trên</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Số HĐ
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Ngày
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Khách hàng
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Tổng tiền
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">
                  Trạng thái
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
                  <td className="px-4 py-2 text-gray-700">
                    {new Date(inv.invoiceDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    {inv.customerName}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {new Intl.NumberFormat("vi-VN").format(
                      Number(inv.totalAmount),
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                        inv.status === "SENT"
                          ? "bg-green-100 text-green-700"
                          : inv.status === "CANCELLED"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {inv.status === "SENT"
                        ? "Đã ghi sổ"
                        : inv.status === "CANCELLED"
                          ? "Đã hủy"
                          : "Nháp"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
