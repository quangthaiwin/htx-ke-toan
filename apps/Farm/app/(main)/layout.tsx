import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className="w-56 flex-col fixed inset-y-0 left-0 z-10 hidden md:flex"
        style={{ backgroundColor: "#1B2B4B" }}
      >
        <div
          className="px-4 py-5"
          style={{ borderBottom: "1px solid #243560" }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🦐</span>
            <div>
              <div
                className="text-sm font-bold leading-tight"
                style={{ color: "#C9A84C" }}
              >
                HTX Farm
              </div>
              <div
                className="text-xs leading-tight"
                style={{ color: "#F5EDD6", opacity: 0.7 }}
              >
                Nuôi Tôm
              </div>
            </div>
          </div>
        </div>

        <FarmNav />

        <div className="px-4 py-3" style={{ borderTop: "1px solid #243560" }}>
          <p className="text-xs truncate" style={{ color: "#6B7A9F" }}>
            {user.email}
          </p>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-xs mt-0.5 hover:opacity-80 transition-opacity"
              style={{ color: "#C9A84C" }}
            >
              Đăng xuất
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 md:ml-56 min-h-screen p-6">{children}</main>
    </div>
  );
}

function FarmNav() {
  const items = [
    { href: "/farm", icon: "📊", label: "Dashboard" },
    { href: "/farm/issue", icon: "📦", label: "Xuất kho" },
    { href: "/farm/transfer", icon: "🔄", label: "San tôm" },
    { href: "/farm/purchase", icon: "🛒", label: "Mua hàng" },
    { href: "/farm/crops", icon: "🌊", label: "Vụ nuôi" },
    { href: "/farm/lots", icon: "🏪", label: "Tồn kho" },
    { href: "/farm/suppliers", icon: "💰", label: "NCC / Công nợ" },
    { href: "/farm/harvest", icon: "🎣", label: "Thu hoạch" },
    { href: "/farm/reports", icon: "📋", label: "Báo cáo" },
  ];

  return (
    <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors"
          style={{ color: "#B8C4D8" }}
        >
          <span className="text-base leading-none">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
