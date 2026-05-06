"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function LotsPage() {
  const { data: warehouses } = useSWR("/api/farm/warehouses", fetcher);

  const now = new Date();
  const warn7d = new Date(now.getTime() + 7 * 86400000);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Tồn kho & Lot</h1>

      {warehouses?.map((wh: any) => (
        <div key={wh.id}>
          <h2 className="text-lg font-semibold mb-2">
            {wh.name}
            <span className="text-xs text-slate-500 ml-2 font-normal">
              {wh.type === "MAIN" ? "Kho chính" : "Kho tạm"}
            </span>
          </h2>

          {wh.lots?.length === 0 ? (
            <div className="text-sm text-slate-400 italic">
              Không có hàng tồn
            </div>
          ) : (
            <div className="space-y-2">
              {wh.lots?.map((lot: any) => {
                const expiry = new Date(lot.expiryDate);
                const isExpired = expiry < now;
                const isExpiring = !isExpired && expiry < warn7d;

                return (
                  <div
                    key={lot.id}
                    className="bg-white border rounded-lg p-3 flex justify-between items-center"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {lot.product?.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        Lot {lot.lotNumber} · Giá{" "}
                        {Number(lot.unitCost).toLocaleString()}đ/
                        {lot.product?.secondaryUnit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-medium">
                        {Number(lot.qtyOnHand).toLocaleString()}{" "}
                        {lot.product?.secondaryUnit}
                      </div>
                      <div
                        className={`text-xs ${isExpired ? "text-red-600 font-medium" : isExpiring ? "text-amber-600" : "text-slate-400"}`}
                      >
                        HSD {expiry.toLocaleDateString("vi")}
                        {isExpired && " ⛔ Hết hạn"}
                        {isExpiring && " ⚠️ Sắp hết hạn"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
