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

    router.push("/");
    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#F0F2F8" }}
    >
      <div className="w-full max-w-sm">
        {/* Card */}
        <div
          className="rounded-2xl shadow-lg overflow-hidden"
          style={{ backgroundColor: "#1B2B4B" }}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <div className="flex justify-center mb-4">
              <svg
                width="56"
                height="56"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  width="32"
                  height="32"
                  rx="10"
                  fill="#C9A84C"
                  fillOpacity="0.15"
                />
                <line
                  x1="16"
                  y1="26"
                  x2="16"
                  y2="10"
                  stroke="#C9A84C"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
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
                <ellipse cx="16" cy="10" rx="1.8" ry="2.8" fill="#C9A84C" />
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
            </div>
            <h1 className="text-xl font-bold" style={{ color: "#C9A84C" }}>
              HTX Farm-Kế Toán
            </h1>
            <p className="text-xs mt-1" style={{ color: "#6B7A9F" }}>
              Đăng nhập để tiếp tục
            </p>
          </div>

          {/* Form */}
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
                  className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none transition-colors"
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
                  className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none transition-colors"
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
                className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={{ backgroundColor: "#C9A84C", color: "#1B2B4B" }}
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "#6B7A9F" }}>
          HTX Farm-Kế Toán · VAS TT200
        </p>
      </div>
    </div>
  );
}
