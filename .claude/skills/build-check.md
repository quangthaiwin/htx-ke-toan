# /build-check — Kiểm tra build Accounting app

## Mô tả

Chạy TypeScript check và Next.js build để phát hiện lỗi trước khi deploy.

## Commands

### 1. TypeScript check

```bash
cd apps/Accounting
npx tsc --noEmit
```

### 2. Full build (local)

```bash
cd apps/Accounting
../../node_modules/.bin/next build
```

### 3. Lint only

```bash
cd apps/Accounting
npx next lint
```

### 4. Test

```bash
cd apps/Accounting
npx vitest run
```

### 5. E2E test

```bash
cd apps/Accounting
npx playwright test
```

## Common errors & fixes

### Recharts Tooltip formatter type error

```typescript
// ❌ Lỗi: Type '(value: number) => ...' không assignable
formatter={(value: number) => fmtVND(value)}

// ✅ Fix: bỏ type annotation, cast trong body
formatter={(value) => fmtVND(value as number)}
```

### SWC dependencies warning

```
⚠ Found lockfile missing swc dependencies
```

→ Không blocking, chỉ warning. Build vẫn thành công.

### Monorepo workspace packages

Nếu lỗi "Cannot find module @vierp/...", check `next.config.js`:

```js
const nextConfig = {
  transpilePackages: [
    "@vierp/shared",
    "@vierp/database",
    "@vierp/auth",
    "@vierp/events",
  ],
};
```

## CI/CD checklist

- [ ] `tsc --noEmit` pass
- [ ] `next build` success
- [ ] No security vulnerabilities (critical)
- [ ] Env vars set on Vercel
- [ ] Prisma schema matches production DB
