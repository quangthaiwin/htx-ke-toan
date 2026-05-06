"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/farm", icon: "📊", label: "Dashboard" },
  { href: "/farm/issue", icon: "📦", label: "Xuất kho" },
  { href: "/farm/transfer", icon: "🔄", label: "San tôm" },
  { href: "/farm/lots", icon: "🏪", label: "Kho" },
  { href: "/farm/purchase", icon: "🛒", label: "Mua hàng" },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-1 md:hidden z-50">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/farm"
            ? pathname === "/farm"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center py-1.5 px-2 min-w-[56px] ${active ? "text-rose-600" : "text-slate-400"}`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
