import { describe, it, expect } from "vitest";
import {
  validateJournalEntry,
  calculateTotals,
  generateEntryNumber,
  getJournalTypePrefix,
  calculateAccountBalance,
  buildTrialBalance,
  createReversalEntry,
  convertToBaseCurrency,
  formatVND,
  numberToVietnameseWords,
  generateClosingEntries,
  type GLJournalEntry,
  type GLJournalLine,
} from "./index";
import Decimal from "decimal.js";

// ==================== validateJournalEntry ====================

describe("validateJournalEntry", () => {
  const validEntry: GLJournalEntry = {
    entryDate: new Date("2026-05-01"),
    journalType: "GENERAL",
    source: "MANUAL",
    description: "Thu tiền mặt từ khách hàng",
    lines: [
      { accountId: "acc-1111", debitAmount: 1000000, creditAmount: 0 },
      { accountId: "acc-131", debitAmount: 0, creditAmount: 1000000 },
    ],
  };

  it("chấp nhận bút toán hợp lệ (debit = credit)", () => {
    const result = validateJournalEntry(validEntry);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("từ chối bút toán chỉ có 1 dòng", () => {
    const entry: GLJournalEntry = {
      ...validEntry,
      lines: [{ accountId: "acc-1111", debitAmount: 1000000, creditAmount: 0 }],
    };
    const result = validateJournalEntry(entry);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("ít nhất 2 dòng");
  });

  it("từ chối khi thiếu ngày", () => {
    const entry = { ...validEntry, entryDate: null as unknown as Date };
    const result = validateJournalEntry(entry);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining("ngày"));
  });

  it("từ chối khi thiếu diễn giải", () => {
    const entry = { ...validEntry, description: "" };
    const result = validateJournalEntry(entry);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining("diễn giải"));
  });

  it("từ chối khi dòng không có tài khoản", () => {
    const entry: GLJournalEntry = {
      ...validEntry,
      lines: [
        { accountId: "", debitAmount: 1000000, creditAmount: 0 },
        { accountId: "acc-131", debitAmount: 0, creditAmount: 1000000 },
      ],
    };
    const result = validateJournalEntry(entry);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining("tài khoản"));
  });

  it("từ chối số tiền Nợ âm", () => {
    const entry: GLJournalEntry = {
      ...validEntry,
      lines: [
        { accountId: "acc-1111", debitAmount: -100, creditAmount: 0 },
        { accountId: "acc-131", debitAmount: 0, creditAmount: 100 },
      ],
    };
    const result = validateJournalEntry(entry);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining("không được âm"),
    );
  });

  it("từ chối dòng vừa có Nợ vừa có Có", () => {
    const entry: GLJournalEntry = {
      ...validEntry,
      lines: [
        { accountId: "acc-1111", debitAmount: 500, creditAmount: 500 },
        { accountId: "acc-131", debitAmount: 0, creditAmount: 1000000 },
      ],
    };
    const result = validateJournalEntry(entry);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining("vừa Nợ vừa Có"),
    );
  });

  it("từ chối dòng cả Nợ lẫn Có đều bằng 0", () => {
    const entry: GLJournalEntry = {
      ...validEntry,
      lines: [
        { accountId: "acc-1111", debitAmount: 0, creditAmount: 0 },
        { accountId: "acc-131", debitAmount: 0, creditAmount: 1000000 },
      ],
    };
    const result = validateJournalEntry(entry);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining("Phải có Nợ hoặc Có"),
    );
  });

  it("từ chối khi tổng Nợ ≠ tổng Có", () => {
    const entry: GLJournalEntry = {
      ...validEntry,
      lines: [
        { accountId: "acc-1111", debitAmount: 1000000, creditAmount: 0 },
        { accountId: "acc-131", debitAmount: 0, creditAmount: 999999 },
      ],
    };
    const result = validateJournalEntry(entry);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining("Tổng Nợ"));
  });

  it("xử lý đúng bút toán phức hợp (nhiều dòng)", () => {
    const entry: GLJournalEntry = {
      ...validEntry,
      lines: [
        { accountId: "acc-1111", debitAmount: 5000000, creditAmount: 0 },
        { accountId: "acc-131", debitAmount: 0, creditAmount: 3000000 },
        { accountId: "acc-511", debitAmount: 0, creditAmount: 2000000 },
      ],
    };
    const result = validateJournalEntry(entry);
    expect(result.valid).toBe(true);
  });

  it("xử lý chính xác số thập phân (0.1 + 0.2)", () => {
    // Decimal.js phải xử lý đúng, không bị floating point error
    const entry: GLJournalEntry = {
      ...validEntry,
      lines: [
        { accountId: "acc-1111", debitAmount: 0.1, creditAmount: 0 },
        { accountId: "acc-1121", debitAmount: 0.2, creditAmount: 0 },
        { accountId: "acc-131", debitAmount: 0, creditAmount: 0.3 },
      ],
    };
    const result = validateJournalEntry(entry);
    expect(result.valid).toBe(true);
  });
});

// ==================== calculateTotals ====================

describe("calculateTotals", () => {
  it("tính đúng tổng Nợ/Có", () => {
    const lines: GLJournalLine[] = [
      { accountId: "a", debitAmount: 1500000, creditAmount: 0 },
      { accountId: "b", debitAmount: 0, creditAmount: 1000000 },
      { accountId: "c", debitAmount: 0, creditAmount: 500000 },
    ];
    const result = calculateTotals(lines);
    expect(result.totalDebit.toNumber()).toBe(1500000);
    expect(result.totalCredit.toNumber()).toBe(1500000);
    expect(result.isBalanced).toBe(true);
  });

  it("phát hiện mất cân đối", () => {
    const lines: GLJournalLine[] = [
      { accountId: "a", debitAmount: 100, creditAmount: 0 },
      { accountId: "b", debitAmount: 0, creditAmount: 99 },
    ];
    const result = calculateTotals(lines);
    expect(result.isBalanced).toBe(false);
  });

  it("xử lý mảng rỗng", () => {
    const result = calculateTotals([]);
    expect(result.totalDebit.toNumber()).toBe(0);
    expect(result.totalCredit.toNumber()).toBe(0);
    expect(result.isBalanced).toBe(true);
  });
});

// ==================== generateEntryNumber ====================

describe("generateEntryNumber", () => {
  it("format đúng JV-YYYY-NNNNNN", () => {
    expect(generateEntryNumber(2026, 1)).toBe("JV-2026-000001");
    expect(generateEntryNumber(2026, 123)).toBe("JV-2026-000123");
    expect(generateEntryNumber(2026, 999999)).toBe("JV-2026-999999");
  });

  it("dùng prefix tùy chỉnh", () => {
    expect(generateEntryNumber(2026, 5, "PT")).toBe("PT-2026-000005");
    expect(generateEntryNumber(2026, 42, "PC")).toBe("PC-2026-000042");
  });
});

// ==================== getJournalTypePrefix ====================

describe("getJournalTypePrefix", () => {
  it("trả về PT cho phiếu thu", () => {
    expect(getJournalTypePrefix("CASH_RECEIPT")).toBe("PT");
  });

  it("trả về PC cho phiếu chi", () => {
    expect(getJournalTypePrefix("CASH_PAYMENT")).toBe("PC");
  });

  it("trả về JV cho loại không xác định", () => {
    expect(getJournalTypePrefix("UNKNOWN_TYPE")).toBe("JV");
  });
});

// ==================== calculateAccountBalance ====================

describe("calculateAccountBalance", () => {
  it("tài khoản bên Nợ: balance = debit - credit", () => {
    const balance = calculateAccountBalance(5000000, 3000000, "DEBIT");
    expect(balance.toNumber()).toBe(2000000);
  });

  it("tài khoản bên Có: balance = credit - debit", () => {
    const balance = calculateAccountBalance(1000000, 4000000, "CREDIT");
    expect(balance.toNumber()).toBe(3000000);
  });

  it("trả về số âm khi ngược chiều", () => {
    const balance = calculateAccountBalance(1000000, 5000000, "DEBIT");
    expect(balance.toNumber()).toBe(-4000000);
  });
});

// ==================== createReversalEntry ====================

describe("createReversalEntry", () => {
  it("đảo Nợ/Có trên tất cả dòng", () => {
    const original = {
      id: "entry-001",
      entryDate: new Date("2026-05-01"),
      journalType: "CASH_RECEIPT",
      source: "MANUAL",
      description: "Thu tiền KH",
      lines: [
        { accountId: "acc-1111", debitAmount: 2000000, creditAmount: 0 },
        { accountId: "acc-131", debitAmount: 0, creditAmount: 2000000 },
      ],
    };
    const reversal = createReversalEntry(original, new Date("2026-05-02"));
    expect(reversal.journalType).toBe("REVERSAL");
    expect(reversal.lines[0].debitAmount).toBe(0);
    expect(reversal.lines[0].creditAmount).toBe(2000000);
    expect(reversal.lines[1].debitAmount).toBe(2000000);
    expect(reversal.lines[1].creditAmount).toBe(0);
  });

  it("bút toán đảo vẫn cân đối", () => {
    const original = {
      id: "entry-002",
      entryDate: new Date("2026-05-01"),
      journalType: "GENERAL",
      source: "MANUAL",
      description: "Test",
      lines: [
        { accountId: "a", debitAmount: 100, creditAmount: 0 },
        { accountId: "b", debitAmount: 0, creditAmount: 100 },
      ],
    };
    const reversal = createReversalEntry(original, new Date("2026-05-02"));
    const totals = calculateTotals(reversal.lines);
    expect(totals.isBalanced).toBe(true);
  });
});

// ==================== convertToBaseCurrency ====================

describe("convertToBaseCurrency", () => {
  it("chuyển đổi USD → VND", () => {
    const result = convertToBaseCurrency(100, 25000);
    expect(result.toNumber()).toBe(2500000);
  });

  it("tỷ giá 1 giữ nguyên giá trị", () => {
    const result = convertToBaseCurrency(1500000, 1);
    expect(result.toNumber()).toBe(1500000);
  });
});

// ==================== formatVND ====================

describe("formatVND", () => {
  it("format số VND có dấu phân cách", () => {
    const result = formatVND(15000000);
    expect(result).toContain("15");
    expect(result).toContain("000");
    expect(result).toContain("000");
  });

  it("format Decimal instance", () => {
    const result = formatVND(new Decimal(2500000));
    expect(result).toContain("2");
    expect(result).toContain("500");
  });
});

// ==================== numberToVietnameseWords ====================

describe("numberToVietnameseWords", () => {
  it("trả về 'Không đồng' cho 0", () => {
    expect(numberToVietnameseWords(0)).toBe("Không đồng");
  });

  it("đọc đúng hàng đơn vị", () => {
    expect(numberToVietnameseWords(5)).toBe("Năm đồng");
  });

  it("đọc đúng hàng nghìn", () => {
    const result = numberToVietnameseWords(15000);
    expect(result.toLowerCase()).toContain("mười lăm");
    expect(result.toLowerCase()).toContain("nghìn");
    expect(result).toContain("đồng");
  });

  it("đọc đúng hàng triệu", () => {
    const result = numberToVietnameseWords(1500000);
    expect(result).toContain("triệu");
    expect(result).toContain("đồng");
  });

  it("đọc đúng số lớn (tỷ)", () => {
    const result = numberToVietnameseWords(2000000000);
    expect(result).toContain("tỷ");
    expect(result).toContain("đồng");
  });

  it("đọc đúng 'mốt' thay vì 'một' sau mươi", () => {
    const result = numberToVietnameseWords(21000);
    expect(result).toContain("mốt");
  });

  it("xử lý số âm", () => {
    const result = numberToVietnameseWords(-100000);
    expect(result).toContain("Âm");
    expect(result).toContain("đồng");
  });
});

// ==================== generateClosingEntries ====================

describe("generateClosingEntries", () => {
  it("tạo bút toán kết chuyển đúng cho lãi", () => {
    const entries = generateClosingEntries(
      [{ accountId: "acc-511", balance: 10000000 }],
      [{ accountId: "acc-642", balance: 6000000 }],
      "acc-911",
      "acc-4212",
    );
    // 3 bút toán: kết chuyển doanh thu, chi phí, lãi/lỗ
    expect(entries).toHaveLength(3);

    // Bút toán 1: Dr 511 / Cr 911
    expect(entries[0].journalType).toBe("CLOSING");
    expect(entries[0].lines).toHaveLength(2);

    // Bút toán 3: lãi = 10M - 6M = 4M → Dr 911 / Cr 4212
    const profitEntry = entries[2];
    expect(profitEntry.lines[1].creditAmount).toBe(4000000);
  });

  it("trả về mảng rỗng khi không có doanh thu/chi phí", () => {
    const entries = generateClosingEntries([], [], "acc-911", "acc-4212");
    expect(entries).toHaveLength(0);
  });

  it("bỏ qua tài khoản có số dư = 0", () => {
    const entries = generateClosingEntries(
      [
        { accountId: "acc-511", balance: 5000000 },
        { accountId: "acc-515", balance: 0 },
      ],
      [{ accountId: "acc-642", balance: 3000000 }],
      "acc-911",
      "acc-4212",
    );
    // Doanh thu chỉ có 1 dòng (bỏ 515 vì balance=0) + 1 dòng 911
    expect(entries[0].lines).toHaveLength(2);
  });
});
