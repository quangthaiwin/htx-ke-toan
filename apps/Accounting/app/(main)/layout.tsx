import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NavSidebar } from "./nav-sidebar";

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
        className="w-56 flex flex-col fixed inset-y-0 left-0 z-10"
        style={{ backgroundColor: "#1B2B4B" }}
      >
        {/* Logo */}
        <div
          className="px-4 py-5"
          style={{ borderBottom: "1px solid #243560" }}
        >
          <div className="flex items-center gap-2.5">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                width="32"
                height="32"
                rx="8"
                fill="#C9A84C"
                fillOpacity="0.15"
              />
              {/* Rice stalk */}
              <line
                x1="16"
                y1="26"
                x2="16"
                y2="10"
                stroke="#C9A84C"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Grains left */}
              <ellipse
                cx="12.5"
                cy="13"
                rx="2.5"
                ry="1.4"
                fill="#C9A84C"
                transform="rotate(-20 12.5 13)"
              />
              <ellipse
                cx="12"
                cy="16.5"
                rx="2.5"
                ry="1.4"
                fill="#C9A84C"
                transform="rotate(-15 12 16.5)"
              />
              <ellipse
                cx="12.5"
                cy="20"
                rx="2.5"
                ry="1.4"
                fill="#C9A84C"
                transform="rotate(-10 12.5 20)"
              />
              {/* Grains right */}
              <ellipse
                cx="19.5"
                cy="13"
                rx="2.5"
                ry="1.4"
                fill="#C9A84C"
                transform="rotate(20 19.5 13)"
              />
              <ellipse
                cx="20"
                cy="16.5"
                rx="2.5"
                ry="1.4"
                fill="#C9A84C"
                transform="rotate(15 20 16.5)"
              />
              <ellipse
                cx="19.5"
                cy="20"
                rx="2.5"
                ry="1.4"
                fill="#C9A84C"
                transform="rotate(10 19.5 20)"
              />
              {/* Top grain */}
              <ellipse cx="16" cy="10" rx="1.8" ry="2.8" fill="#C9A84C" />
              {/* Ledger lines — accounting symbol */}
              <line
                x1="8"
                y1="28"
                x2="24"
                y2="28"
                stroke="#C9A84C"
                strokeWidth="1"
                strokeLinecap="round"
                strokeOpacity="0.6"
              />
            </svg>
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
                Kế Toán
              </div>
            </div>
          </div>
        </div>

        <NavSidebar />

        {/* User footer */}
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

      <main className="flex-1 ml-56 min-h-screen p-6">{children}</main>
    </div>
  );
}
