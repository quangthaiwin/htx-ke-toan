# /deploy-vercel — Deploy Accounting App to Vercel

## Mô tả

Deploy app Accounting (monorepo) lên Vercel production. Bao gồm build, set env vars, và verify.

## Prerequisites

- Vercel CLI: `npm i -g vercel`
- Đã login: `vercel whoami`
- Project đã link: `.vercel/project.json` tồn tại

## Commands

### 1. Check trạng thái hiện tại

```bash
# Verify login
npx vercel whoami

# Check project link
cat .vercel/project.json

# List deployments
npx vercel ls
```

### 2. Build local (test trước khi deploy)

```bash
cd apps/Accounting
../../node_modules/.bin/next build
```

### 3. Set Environment Variables (production)

```bash
cd apps/Accounting
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "https://obbyzzcjmiavnvymfjac.supabase.co"
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "<anon-key>"
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "<service-role-key>"
npx vercel env add DATABASE_URL production <<< "<connection-string-port-6543>"
npx vercel env add DIRECT_URL production <<< "<connection-string-port-5432>"
npx vercel env add NEXTAUTH_SECRET production <<< "<generated-secret>"
npx vercel env add TENANT_ID production <<< "HTX_DEFAULT"
```

### 4. Deploy production

```bash
# Từ root monorepo
npx vercel --prod
```

### 5. Set root directory (nếu chưa set)

```bash
# Lấy token
VERCEL_TOKEN=$(node -e "const fs=require('fs');const p=require('os').homedir()+'/AppData/Roaming/com.vercel.cli/Data/auth.json';const a=JSON.parse(fs.readFileSync(p,'utf8'));console.log(a.token)")

# Set root directory via API
curl -s -X PATCH "https://api.vercel.com/v9/projects/<PROJECT_ID>" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rootDirectory":"apps/Accounting"}'
```

### 6. Đổi tên project / URL

```bash
# Rename project
npx vercel project rename <old-name> <new-name>

# Set alias mới
npx vercel alias set <deployment-url> <new-name>.vercel.app

# Xóa alias cũ
echo "y" | npx vercel alias rm <old-alias>.vercel.app
```

### 7. Verify deployment

```bash
# Inspect
npx vercel inspect <deployment-url>

# List env vars
npx vercel env ls

# Check domains
npx vercel domains ls
```

## Lưu ý quan trọng

- **Monorepo**: Install command phải là `cd ../.. && npm install --legacy-peer-deps`
- **Root directory**: Phải set = `apps/Accounting` trên Vercel project settings
- **Build command**: `npx prisma generate && next build`
- **Vercel auth file (Windows)**: `~/AppData/Roaming/com.vercel.cli/Data/auth.json`
- **Project ID hiện tại**: `prj_QYy74xlBG9obP5k89fr7YQLmgucg`
- **URL production**: https://htx-ke-toan.vercel.app
