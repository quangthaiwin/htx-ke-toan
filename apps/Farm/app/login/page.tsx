"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email hoặc mật khẩu không đúng");
      setLoading(false);
      return;
    }

    router.push("/farm");
    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#F0F2F8" }}
    >
      <div className="w-full max-w-sm">
        <div
          className="rounded-2xl shadow-lg overflow-hidden"
          style={{ backgroundColor: "#1B2B4B" }}
        >
          <div className="px-8 pt-8 pb-6 text-center">
            <span className="text-5xl">🦐</span>
            <h1 className="text-xl font-bold mt-3" style={{ color: "#C9A84C" }}>
              HTX Farm
            </h1>
            <p className="text-xs mt-1" style={{ color: "#6B7A9F" }}>
              Quản lý Trại Nuôi Tôm
            </p>
          </div>

          <div className="px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "#B8C4D8" }}
                >
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
                  style={{
                    backgroundColor: "#243560",
                    border: "1px solid #2E4080",
                    color: "#F0F2F8",
                  }}
                  placeholder="ketoan@htx.vn"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "#B8C4D8" }}
                >
                  Mật khẩu
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
                  style={{
                    backgroundColor: "#243560",
                    border: "1px solid #2E4080",
                    color: "#F0F2F8",
                  }}
                />
              </div>
              {error && (
                <p
                  className="text-xs rounded-lg px-3 py-2"
                  style={{
                    backgroundColor: "rgba(220,38,38,0.15)",
                    color: "#FCA5A5",
                  }}
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "#C9A84C", color: "#1B2B4B" }}
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
