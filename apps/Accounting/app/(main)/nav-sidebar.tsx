"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { label: string; href: string };
type NavGroup = { group: string; icon: string; items: NavItem[] };
type NavSingle = { label: string; href: string; icon: string };
type NavEntry = NavSingle | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "group" in entry;
}

const NAV: NavEntry[] = [
  { label: "Tổng quan", href: "/dashboard", icon: "📊" },
  {
    group: "Tiền mặt & Ngân hàng",
    icon: "💵",
    items: [
      { label: "Phiếu thu", href: "/cash/receipts" },
      { label: "Phiếu chi", href: "/cash/payments" },
    ],
  },
  {
    group: "Bán hàng",
    icon: "💼",
    items: [
      { label: "Hóa đơn bán ra", href: "/sales/invoices" },
      { label: "Thu tiền khách hàng", href: "/sales/receipts" },
    ],
  },
  {
    group: "Mua hàng",
    icon: "🛒",
    items: [
      { label: "Hóa đơn mua vào", href: "/purchases/invoices" },
      { label: "Thanh toán NCC", href: "/purchases/payments" },
    ],
  },
  {
    group: "Báo cáo",
    icon: "📈",
    items: [
      { label: "Bảng CĐKT", href: "/reports/balance-sheet" },
      { label: "KQHĐKD", href: "/reports/income-statement" },
      { label: "Lưu chuyển TT", href: "/reports/cash-flow" },
      { label: "Sổ cái", href: "/reports/general-ledger" },
    ],
  },
  {
    group: "Thuế",
    icon: "🧾",
    items: [{ label: "Tờ khai GTGT", href: "/tax/vat" }],
  },
  {
    group: "Danh mục",
    icon: "⚙️",
    items: [
      { label: "Hệ thống tài khoản", href: "/master/accounts" },
      { label: "Khách hàng / NCC", href: "/master/counterparties" },
    ],
  },
];

export function NavSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard")
      return pathname === "/dashboard" || pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
      {NAV.map((entry) => {
        if (!isGroup(entry)) {
          return (
            <Link
              key={entry.href}
              href={entry.href}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                isActive(entry.href)
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-base leading-none">{entry.icon}</span>
              {entry.label}
            </Link>
          );
        }

        const groupActive = entry.items.some((i) => isActive(i.href));

        return (
          <div key={entry.group}>
            <div
              className={`flex items-center gap-2.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide mt-3 mb-0.5 ${
                groupActive ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <span className="text-sm leading-none">{entry.icon}</span>
              {entry.group}
            </div>
            {entry.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 pl-8 pr-3 py-1.5 text-sm rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        );
      })}
    </nav>
  );
}
