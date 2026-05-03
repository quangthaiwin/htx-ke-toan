"use client";

import { useState, useRef, useEffect, useMemo } from "react";

interface Account {
  id: string;
  accountNumber: string;
  name: string;
  accountGroup?: string;
}

interface AccountComboboxProps {
  accounts: Account[];
  value: string;
  onChange: (accountId: string, accountNumber?: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  filterFn?: (account: Account) => boolean;
  className?: string;
}

export function AccountCombobox({
  accounts,
  value,
  onChange,
  placeholder = "Tìm tài khoản...",
  label,
  required,
  filterFn,
  className = "",
}: AccountComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredAccounts = useMemo(() => {
    let list = filterFn ? accounts.filter(filterFn) : accounts;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) => a.accountNumber.includes(q) || a.name.toLowerCase().includes(q),
      );
    }
    return list.slice(0, 50);
  }, [accounts, query, filterFn]);

  const selectedAccount = accounts.find((a) => a.id === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        listRef.current &&
        !listRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder}
        value={
          open
            ? query
            : selectedAccount
              ? `${selectedAccount.accountNumber} - ${selectedAccount.name}`
              : ""
        }
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
      />
      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg"
        >
          {filteredAccounts.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              Không tìm thấy tài khoản
            </div>
          ) : (
            filteredAccounts.map((account) => (
              <button
                key={account.id}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${
                  account.id === value ? "bg-blue-50 font-medium" : ""
                }`}
                onClick={() => {
                  onChange(account.id, account.accountNumber);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <span className="font-mono text-blue-700">
                  {account.accountNumber}
                </span>
                <span className="ml-2 text-gray-700">{account.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
