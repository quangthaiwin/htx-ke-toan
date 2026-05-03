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
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-10">
        <div className="px-4 py-4 border-b border-gray-100">
          <span className="text-sm font-bold text-blue-700 tracking-wide">
            VietERP
          </span>
          <span className="text-xs text-gray-400 block">Kế toán HTX</span>
        </div>

        <NavSidebar />

        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-xs text-gray-500 hover:text-gray-700 mt-0.5"
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
