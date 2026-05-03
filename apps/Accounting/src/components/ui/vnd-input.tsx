"use client";

import { useState, useCallback } from "react";

interface VNDInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

function formatNumber(n: number): string {
  if (n === 0) return "";
  return new Intl.NumberFormat("vi-VN").format(n);
}

function parseVND(str: string): number {
  const cleaned = str.replace(/[.\s]/g, "").replace(/,/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

export function VNDInput({
  value,
  onChange,
  label,
  required,
  placeholder = "0",
  className = "",
}: VNDInputProps) {
  const [displayValue, setDisplayValue] = useState(
    value > 0 ? formatNumber(value) : "",
  );
  const [focused, setFocused] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Chỉ cho phép số và dấu chấm
      const cleaned = raw.replace(/[^0-9.]/g, "");
      const num = parseVND(cleaned);
      setDisplayValue(num > 0 ? formatNumber(num) : cleaned);
      onChange(num);
    },
    [onChange],
  );

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md text-sm text-right font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
          value={focused ? displayValue : value > 0 ? formatNumber(value) : ""}
          onChange={handleChange}
          onFocus={() => {
            setFocused(true);
            setDisplayValue(value > 0 ? formatNumber(value) : "");
          }}
          onBlur={() => setFocused(false)}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
          VND
        </span>
      </div>
    </div>
  );
}
