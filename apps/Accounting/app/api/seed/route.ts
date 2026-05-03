import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { VAS_CHART_OF_ACCOUNTS } from "@/lib/vas/chart-of-accounts";

const prisma = new PrismaClient();

const TENANT_ID = process.env.TENANT_ID ?? "HTX_DEFAULT";

export async function POST() {
  try {
    const existing = await prisma.account.count({
      where: { tenantId: TENANT_ID },
    });
    if (existing > 0) {
      return NextResponse.json(
        {
          message: `Đã tồn tại ${existing} tài khoản. Bỏ qua seed.`,
          seeded: false,
        },
        { status: 200 },
      );
    }

    const ACCOUNTS_TO_SEED = VAS_CHART_OF_ACCOUNTS.filter(
      (a) => a.isSystemAccount,
    );

    // Pass 1: insert common accounts without parentId
    await prisma.account.createMany({
      data: ACCOUNTS_TO_SEED.map((acc) => ({
        accountNumber: acc.accountNumber,
        name: acc.name,
        nameEn: acc.nameEn,
        accountType: acc.accountType,
        accountGroup: acc.accountGroup as import("@prisma/client").AccountGroup,
        normalBalance: acc.normalBalance,
        level: acc.level,
        isSystemAccount: acc.isSystemAccount,
        tenantId: TENANT_ID,
      })),
      skipDuplicates: true,
    });

    // Pass 2: link parent accounts
    const allAccounts = await prisma.account.findMany({
      where: { tenantId: TENANT_ID },
      select: { id: true, accountNumber: true },
    });
    const byNumber = new Map(allAccounts.map((a) => [a.accountNumber, a.id]));

    // Sequential updates — pgbouncer connection_limit=1 cannot handle parallel queries
    for (const acc of ACCOUNTS_TO_SEED.filter((a) => a.parentAccount)) {
      const parentId = byNumber.get(acc.parentAccount!);
      if (!parentId) continue;
      await prisma.account.updateMany({
        where: { accountNumber: acc.accountNumber, tenantId: TENANT_ID },
        data: { parentId },
      });
    }

    return NextResponse.json({
      message: `Đã khởi tạo ${ACCOUNTS_TO_SEED.length} tài khoản TT200 (tài khoản phổ biến)`,
      seeded: true,
      count: ACCOUNTS_TO_SEED.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  const count = await prisma.account.count({ where: { tenantId: TENANT_ID } });
  await prisma.$disconnect();
  return NextResponse.json({ count, tenantId: TENANT_ID });
}
