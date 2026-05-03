"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SeedButton({ hasAccounts }: { hasAccounts: boolean }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleSeed() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/seed", { method: "POST" });
    const data = await res.json();
    setMessage(data.message ?? data.error ?? "");
    setLoading(false);
    if (res.ok) router.refresh();
  }

  if (hasAccounts) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleSeed}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Đang khởi tạo..." : "Khởi tạo TT200"}
      </button>
      {message && <p className="text-xs text-gray-600">{message}</p>}
    </div>
  );
}
