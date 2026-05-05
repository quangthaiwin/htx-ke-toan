import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

// ============================================================
// Dữ liệu Báo cáo KQKD HTX Farmext Aqua Cần Giờ
// Kỳ: 08/2025 - 02/2026
// 3 phân khu: Khu I (T8-T11/2025), Khu I (T12/25-T2/26), Khu II (T11/25-T2/26)
// ============================================================

interface KQKDLine {
  name: string;
  vasAccount: string; // Tài khoản VAS ánh xạ
  khu1_t8t11: number; // Khu I: T8-T11/2025
  khu1_t12t2: number; // Khu I: T12/25-T2/26
  khu2_t11t2: number; // Khu II: T11/25-T2/26
  note?: string;
}

// --- DOANH THU ---
const REVENUE_LINES: KQKDLine[] = [
  {
    name: "Doanh thu bán tôm",
    vasAccount: "5111", // Doanh thu bán hàng hóa
    khu1_t8t11: 626_935_425,
    khu1_t12t2: 24_656_584,
    khu2_t11t2: 45_380_000,
    note: "Thu tôm các đợt",
  },
  {
    name: "Doanh thu kinh doanh bảo lãnh (profit)",
    vasAccount: "515", // Doanh thu hoạt động tài chính
    khu1_t8t11: 0,
    khu1_t12t2: 49_079_750,
    khu2_t11t2: 0,
    note: "Profit đơn giống + CK ĐL",
  },
  {
    name: "Thu công nợ bảo lãnh",
    vasAccount: "515", // Doanh thu hoạt động tài chính
    khu1_t8t11: 241_012_950,
    khu1_t12t2: 0,
    khu2_t11t2: 0,
    note: "Farm Mật + ĐL Tuấn",
  },
];

// --- CHI PHÍ ---
const EXPENSE_LINES: KQKDLine[] = [
  {
    name: "Thức ăn",
    vasAccount: "621", // Chi phí nguyên liệu, vật liệu trực tiếp
    khu1_t8t11: 322_882_000,
    khu1_t12t2: 51_424_400,
    khu2_t11t2: 154_180_000,
    note: "Chưa trừ tồn kho",
  },
  {
    name: "Tôm thẻ giống",
    vasAccount: "621", // Chi phí nguyên liệu trực tiếp (con giống)
    khu1_t8t11: 88_515_000,
    khu1_t12t2: 0,
    khu2_t11t2: 50_000_000,
    note: "Giống tôm thẻ",
  },
  {
    name: "Thuốc, hóa chất",
    vasAccount: "6272", // Chi phí vật liệu (SX chung)
    khu1_t8t11: 501_626_753,
    khu1_t12t2: 231_550_896,
    khu2_t11t2: 263_641_255,
    note: "Chưa trừ tồn kho",
  },
  {
    name: "Nhân công, nhân viên (lương)",
    vasAccount: "622", // Chi phí nhân công trực tiếp
    khu1_t8t11: 215_067_927,
    khu1_t12t2: 159_513_889,
    khu2_t11t2: 0,
    note: "Lương nhân viên trang trại",
  },
  {
    name: "Tiền công nhật",
    vasAccount: "622", // Chi phí nhân công trực tiếp
    khu1_t8t11: 36_100_000,
    khu1_t12t2: 3_000_000,
    khu2_t11t2: 16_600_000,
    note: "Công nhật thuê ngoài",
  },
  {
    name: "Chi phí vận hành, nội bộ",
    vasAccount: "6278", // Chi phí bằng tiền khác (SX chung)
    khu1_t8t11: 121_821_199,
    khu1_t12t2: 91_443_443,
    khu2_t11t2: 3_545_000,
    note: "Tiền điện, nước, sinh hoạt...",
  },
  {
    name: "Xăng dầu, bảo trì hư hỏng",
    vasAccount: "6273", // Chi phí dụng cụ sản xuất
    khu1_t8t11: 20_939_000,
    khu1_t12t2: 665_000,
    khu2_t11t2: 135_000,
    note: "Xăng dầu vận hành + bảo trì",
  },
  {
    name: "Hạ tầng trang trại",
    vasAccount: "6274", // Chi phí khấu hao TSCĐ / hạ tầng
    khu1_t8t11: 30_986_600,
    khu1_t12t2: 23_895_000,
    khu2_t11t2: 142_530_000,
    note: "Khu II: 9 bộ dàn quạt Aqua Mina",
  },
  {
    name: "Dịch vụ Farmext LAB",
    vasAccount: "6277", // Chi phí dịch vụ mua ngoài
    khu1_t8t11: 39_542_300,
    khu1_t12t2: 15_289_000,
    khu2_t11t2: 44_662_000,
    note: "Xét nghiệm, phân tích mẫu",
  },
  {
    name: "Thiết bị IoTs",
    vasAccount: "6273", // Chi phí dụng cụ sản xuất (thiết bị nhỏ)
    khu1_t8t11: 12_654_000,
    khu1_t12t2: 0,
    khu2_t11t2: 79_227_000,
    note: "Cảm biến, thiết bị giám sát",
  },
  {
    name: "Phí vận chuyển",
    vasAccount: "641", // Chi phí bán hàng
    khu1_t8t11: 10_633_000,
    khu1_t12t2: 6_550_000,
    khu2_t11t2: 3_600_000,
    note: "Vận chuyển tôm, vật tư",
  },
  {
    name: "Mua hàng tại Farm",
    vasAccount: "6278", // Chi phí bằng tiền khác
    khu1_t8t11: 56_628_000,
    khu1_t12t2: 6_231_000,
    khu2_t11t2: 3_196_000,
    note: "Tỏi, muối, nghệ...",
  },
  {
    name: "Kinh doanh tài chính (mua nợ)",
    vasAccount: "635", // Chi phí tài chính
    khu1_t8t11: 300_267_950,
    khu1_t12t2: 85_500_000,
    khu2_t11t2: 0,
    note: "Bảo lãnh Farm Mật + ĐL Tuấn",
  },
];

// Mapping kỳ kế toán cho journal entries
const PERIODS = [
  {
    key: "khu1_t8t11" as const,
    label: "Khu I (T8-T11/2025)",
    entryDate: "2025-11-30", // Cuối kỳ
    postingDate: "2025-11-30",
    costCenter: "KHU_I",
  },
  {
    key: "khu1_t12t2" as const,
    label: "Khu I (T12/2025-T2/2026)",
    entryDate: "2026-02-28",
    postingDate: "2026-02-28",
    costCenter: "KHU_I",
  },
  {
    key: "khu2_t11t2" as const,
    label: "Khu II (T11/2025-T2/2026)",
    entryDate: "2026-02-28",
    postingDate: "2026-02-28",
    costCenter: "KHU_II",
  },
];

export async function POST() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_SEED !== "true"
  ) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Seed không khả dụng trong production" },
      { status: 403 },
    );
  }

  try {
    // Kiểm tra đã seed KQKD chưa
    const existingKQKD = await prisma.journalEntry.count({
      where: {
        tenantId: TENANT_ID,
        source: "IMPORT",
        description: { contains: "KQKD HTX Farmext" },
      },
    });

    if (existingKQKD > 0) {
      return NextResponse.json({
        message: `Đã tồn tại ${existingKQKD} bút toán KQKD. Bỏ qua seed.`,
        seeded: false,
      });
    }

    // Đảm bảo Chart of Accounts đã có
    const accountCount = await prisma.account.count({
      where: { tenantId: TENANT_ID },
    });
    if (accountCount === 0) {
      return NextResponse.json(
        {
          error: "Chưa có hệ thống tài khoản. Hãy chạy /api/seed trước.",
        },
        { status: 400 },
      );
    }

    // Lấy map tài khoản
    const accounts = await prisma.account.findMany({
      where: { tenantId: TENANT_ID },
      select: { id: true, accountNumber: true },
    });
    const accountMap = new Map(accounts.map((a) => [a.accountNumber, a.id]));

    // Đảm bảo TK 111 (Tiền mặt) tồn tại cho đối ứng
    const cashAccountId = accountMap.get("1111") || accountMap.get("111");
    if (!cashAccountId) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản tiền mặt (111/1111)" },
        { status: 400 },
      );
    }

    const results: { period: string; entries: number }[] = [];
    let entryCounter = 1;

    // Tạo Fiscal Year 2025-2026 nếu chưa có
    const fy2025 = await prisma.fiscalYear.upsert({
      where: { year_tenantId: { year: 2025, tenantId: TENANT_ID } },
      update: {},
      create: {
        year: 2025,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        isCurrent: false,
        status: "OPEN",
        tenantId: TENANT_ID,
      },
    });

    const fy2026 = await prisma.fiscalYear.upsert({
      where: { year_tenantId: { year: 2026, tenantId: TENANT_ID } },
      update: {},
      create: {
        year: 2026,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        isCurrent: true,
        status: "OPEN",
        tenantId: TENANT_ID,
      },
    });

    // Tạo journal entries cho từng kỳ
    for (const period of PERIODS) {
      const revenueLines = REVENUE_LINES.filter((r) => r[period.key] > 0);
      const expenseLines = EXPENSE_LINES.filter((e) => e[period.key] > 0);

      // --- BÚT TOÁN DOANH THU ---
      if (revenueLines.length > 0) {
        const totalRevenue = revenueLines.reduce(
          (sum, r) => sum + r[period.key],
          0,
        );

        const entryNumber = `JV-KQKD-${String(entryCounter++).padStart(4, "0")}`;

        const journalLines: {
          lineNumber: number;
          accountId: string;
          description: string;
          debitAmount: number;
          creditAmount: number;
          costCenterId: string;
          tenantId: string;
        }[] = [];

        // Nợ TK 111/112 (Tiền mặt / Ngân hàng) = Tổng doanh thu
        journalLines.push({
          lineNumber: 1,
          accountId: cashAccountId,
          description: `Thu tiền - ${period.label}`,
          debitAmount: totalRevenue,
          creditAmount: 0,
          costCenterId: period.costCenter,
          tenantId: TENANT_ID,
        });

        // Có các TK doanh thu chi tiết
        let lineNum = 2;
        for (const rev of revenueLines) {
          const accountId = accountMap.get(rev.vasAccount);
          if (!accountId) continue;

          journalLines.push({
            lineNumber: lineNum++,
            accountId,
            description: `${rev.name}${rev.note ? ` (${rev.note})` : ""}`,
            debitAmount: 0,
            creditAmount: rev[period.key],
            costCenterId: period.costCenter,
            tenantId: TENANT_ID,
          });
        }

        await prisma.journalEntry.create({
          data: {
            entryNumber,
            entryDate: new Date(period.entryDate),
            postingDate: new Date(period.postingDate),
            journalType: "GENERAL",
            source: "IMPORT",
            sourceModule: "kqkd_excel",
            sourceRef: `KQKD_HTX_Farmext_${period.key}`,
            description: `KQKD HTX Farmext - Doanh thu ${period.label}`,
            totalDebit: totalRevenue,
            totalCredit: totalRevenue,
            currency: "VND",
            status: "POSTED",
            postedBy: "system_seed",
            postedAt: new Date(),
            tags: ["KQKD", "HTX_Farmext", "seed", period.costCenter],
            tenantId: TENANT_ID,
            createdBy: "system_seed",
            lines: {
              create: journalLines,
            },
          },
        });
      }

      // --- BÚT TOÁN CHI PHÍ ---
      if (expenseLines.length > 0) {
        const totalExpense = expenseLines.reduce(
          (sum, e) => sum + e[period.key],
          0,
        );

        const entryNumber = `JV-KQKD-${String(entryCounter++).padStart(4, "0")}`;

        const journalLines: {
          lineNumber: number;
          accountId: string;
          description: string;
          debitAmount: number;
          creditAmount: number;
          costCenterId: string;
          tenantId: string;
        }[] = [];

        // Nợ các TK chi phí chi tiết
        let lineNum = 1;
        for (const exp of expenseLines) {
          const accountId = accountMap.get(exp.vasAccount);
          if (!accountId) continue;

          journalLines.push({
            lineNumber: lineNum++,
            accountId,
            description: `${exp.name}${exp.note ? ` (${exp.note})` : ""}`,
            debitAmount: exp[period.key],
            creditAmount: 0,
            costCenterId: period.costCenter,
            tenantId: TENANT_ID,
          });
        }

        // Có TK 111/112 (Tiền mặt) = Tổng chi phí
        journalLines.push({
          lineNumber: lineNum,
          accountId: cashAccountId,
          description: `Chi tiền - ${period.label}`,
          debitAmount: 0,
          creditAmount: totalExpense,
          costCenterId: period.costCenter,
          tenantId: TENANT_ID,
        });

        await prisma.journalEntry.create({
          data: {
            entryNumber,
            entryDate: new Date(period.entryDate),
            postingDate: new Date(period.postingDate),
            journalType: "GENERAL",
            source: "IMPORT",
            sourceModule: "kqkd_excel",
            sourceRef: `KQKD_HTX_Farmext_${period.key}`,
            description: `KQKD HTX Farmext - Chi phí ${period.label}`,
            totalDebit: totalExpense,
            totalCredit: totalExpense,
            currency: "VND",
            status: "POSTED",
            postedBy: "system_seed",
            postedAt: new Date(),
            tags: ["KQKD", "HTX_Farmext", "seed", period.costCenter],
            tenantId: TENANT_ID,
            createdBy: "system_seed",
            lines: {
              create: journalLines,
            },
          },
        });
      }

      results.push({
        period: period.label,
        entries:
          (revenueLines.length > 0 ? 1 : 0) + (expenseLines.length > 0 ? 1 : 0),
      });
    }

    // Cập nhật số dư tài khoản
    const allJournalLines = await prisma.journalLine.findMany({
      where: {
        tenantId: TENANT_ID,
        journalEntry: { source: "IMPORT", description: { contains: "KQKD" } },
      },
      select: { accountId: true, debitAmount: true, creditAmount: true },
    });

    // Tổng hợp theo accountId
    const balanceMap = new Map<string, { debit: number; credit: number }>();
    for (const line of allJournalLines) {
      const existing = balanceMap.get(line.accountId) || {
        debit: 0,
        credit: 0,
      };
      existing.debit += Number(line.debitAmount);
      existing.credit += Number(line.creditAmount);
      balanceMap.set(line.accountId, existing);
    }

    // Update currentBalance cho từng TK
    for (const [accountId, bal] of balanceMap) {
      const account = accounts.find((a) => a.id === accountId);
      if (!account) continue;

      // DEBIT accounts: balance = debit - credit
      // CREDIT accounts: balance = credit - debit
      const netBalance = bal.debit - bal.credit;
      await prisma.account.update({
        where: { id: accountId },
        data: { currentBalance: { increment: netBalance } },
      });
    }

    // Tổng kết
    const totalRevenue = REVENUE_LINES.reduce(
      (sum, r) => sum + r.khu1_t8t11 + r.khu1_t12t2 + r.khu2_t11t2,
      0,
    );
    const totalExpense = EXPENSE_LINES.reduce(
      (sum, e) => sum + e.khu1_t8t11 + e.khu1_t12t2 + e.khu2_t11t2,
      0,
    );

    return NextResponse.json({
      message: "Đã import dữ liệu KQKD HTX Farmext Aqua Cần Giờ thành công",
      seeded: true,
      summary: {
        source: "Bao_cao_KQKD_HTX_Farmext_Aqua_Can_Gio-chi tiêt.xlsx",
        period: "08/2025 - 02/2026",
        totalRevenue: totalRevenue.toLocaleString("vi-VN") + " VND",
        totalExpense: totalExpense.toLocaleString("vi-VN") + " VND",
        profitLoss:
          (totalRevenue - totalExpense).toLocaleString("vi-VN") + " VND",
        journalEntries: results.reduce((s, r) => s + r.entries, 0),
        breakdown: results,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Seed KQKD error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const count = await prisma.journalEntry.count({
      where: {
        tenantId: TENANT_ID,
        source: "IMPORT",
        description: { contains: "KQKD" },
      },
    });

    const entries = await prisma.journalEntry.findMany({
      where: {
        tenantId: TENANT_ID,
        source: "IMPORT",
        description: { contains: "KQKD" },
      },
      include: {
        lines: {
          include: { account: { select: { accountNumber: true, name: true } } },
        },
      },
      orderBy: { entryDate: "asc" },
    });

    return NextResponse.json({
      count,
      tenantId: TENANT_ID,
      entries: entries.map((e) => ({
        entryNumber: e.entryNumber,
        description: e.description,
        entryDate: e.entryDate,
        totalDebit: e.totalDebit,
        totalCredit: e.totalCredit,
        lines: e.lines.map((l) => ({
          account: `${l.account.accountNumber} - ${l.account.name}`,
          debit: Number(l.debitAmount),
          credit: Number(l.creditAmount),
          description: l.description,
        })),
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_SEED !== "true"
  ) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    // Xóa journal entries KQKD để có thể seed lại
    const deleted = await prisma.journalEntry.deleteMany({
      where: {
        tenantId: TENANT_ID,
        source: "IMPORT",
        description: { contains: "KQKD HTX Farmext" },
      },
    });

    return NextResponse.json({
      message: `Đã xóa ${deleted.count} bút toán KQKD`,
      deleted: deleted.count,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
