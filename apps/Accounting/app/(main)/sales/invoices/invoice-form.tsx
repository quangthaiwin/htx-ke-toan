"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VNDInput } from "@/components/ui/vnd-input";

interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export function SalesInvoiceForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    invoiceDate: new Date().toISOString().split("T")[0],
    customerName: "",
    customerTaxCode: "",
    customerAddress: "",
    description: "",
  });
  const [lines, setLines] = useState<InvoiceLine[]>([
    { description: "", quantity: 1, unitPrice: 0, vatRate: 0.1 },
  ]);

  const addLine = () => {
    setLines([
      ...lines,
      { description: "", quantity: 1, unitPrice: 0, vatRate: 0.1 },
    ]);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (
    idx: number,
    field: keyof InvoiceLine,
    value: string | number,
  ) => {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };
    setLines(updated);
  };

  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const totalVat = lines.reduce(
    (sum, l) => sum + l.quantity * l.unitPrice * l.vatRate,
    0,
  );
  const totalAmount = subtotal + totalVat;

  const handleSubmit = async (post: boolean) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ar/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, lines, post }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Lỗi khi tạo hóa đơn");
        return;
      }
      router.refresh();
      // Reset form
      setForm({
        invoiceDate: new Date().toISOString().split("T")[0],
        customerName: "",
        customerTaxCode: "",
        customerAddress: "",
        description: "",
      });
      setLines([{ description: "", quantity: 1, unitPrice: 0, vatRate: 0.1 }]);
    } catch {
      setError("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Tạo hóa đơn bán ra
      </h2>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày hóa đơn <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={form.invoiceDate}
            onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Khách hàng <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Tên khách hàng"
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            MST khách hàng
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Mã số thuế"
            value={form.customerTaxCode}
            onChange={(e) =>
              setForm({ ...form, customerTaxCode: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Địa chỉ
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Địa chỉ"
            value={form.customerAddress}
            onChange={(e) =>
              setForm({ ...form, customerAddress: e.target.value })
            }
          />
        </div>
      </div>

      {/* Bảng hàng hóa */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Hàng hóa / Dịch vụ
          </label>
          <button
            type="button"
            onClick={addLine}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Thêm dòng
          </button>
        </div>
        <table className="w-full text-sm border border-gray-200 rounded-md">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600">
                Tên HH/DV
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 w-20">
                SL
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 w-36">
                Đơn giá
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 w-20">
                VAT%
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 w-36">
                Thành tiền
              </th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="border-t border-gray-100">
                <td className="px-2 py-1">
                  <input
                    type="text"
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                    placeholder="Mô tả"
                    value={line.description}
                    onChange={(e) =>
                      updateLine(idx, "description", e.target.value)
                    }
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-right"
                    min="1"
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(idx, "quantity", Number(e.target.value))
                    }
                  />
                </td>
                <td className="px-2 py-1">
                  <VNDInput
                    value={line.unitPrice}
                    onChange={(v) => updateLine(idx, "unitPrice", v)}
                  />
                </td>
                <td className="px-2 py-1">
                  <select
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                    value={line.vatRate}
                    onChange={(e) =>
                      updateLine(idx, "vatRate", Number(e.target.value))
                    }
                  >
                    <option value={0.1}>10%</option>
                    <option value={0.08}>8%</option>
                    <option value={0.05}>5%</option>
                    <option value={0}>0%</option>
                  </select>
                </td>
                <td className="px-2 py-1 text-right font-mono text-sm">
                  {new Intl.NumberFormat("vi-VN").format(
                    line.quantity * line.unitPrice * (1 + line.vatRate),
                  )}
                </td>
                <td className="px-1">
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="text-red-400 hover:text-red-600 text-lg"
                    >
                      &times;
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tổng cộng */}
      <div className="flex justify-end mb-6">
        <div className="w-72 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Tiền hàng:</span>
            <span className="font-mono">
              {new Intl.NumberFormat("vi-VN").format(subtotal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Thuế GTGT:</span>
            <span className="font-mono">
              {new Intl.NumberFormat("vi-VN").format(totalVat)}
            </span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-1">
            <span>Tổng cộng:</span>
            <span className="font-mono">
              {new Intl.NumberFormat("vi-VN").format(totalAmount)} VND
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50"
          style={{ backgroundColor: "#1B2B4B" }}
        >
          {loading ? "Đang xử lý..." : "Ghi sổ"}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
        >
          Lưu nháp
        </button>
      </div>
    </div>
  );
}
