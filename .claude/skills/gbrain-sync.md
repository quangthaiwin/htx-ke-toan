# /gbrain-sync — Đồng bộ repo context vào GBrain

## Mô tả

Phân tích repo và lưu context vào GBrain MCP cho cross-session knowledge.

## Commands

### 1. Kiểm tra GBrain status

```bash
~/.bun/bin/gbrain --version
~/.bun/bin/gbrain doctor
```

### 2. Init database (nếu cần)

```bash
~/.bun/bin/gbrain init --force
```

### 3. MCP Tools (dùng trong Claude Code)

```
mcp__gbrain__get_stats          — Xem thống kê brain
mcp__gbrain__put_page           — Tạo/update page
mcp__gbrain__add_link           — Tạo link giữa pages
mcp__gbrain__query              — Tìm kiếm hybrid
mcp__gbrain__list_pages         — Liệt kê pages
mcp__gbrain__get_page           — Đọc page theo slug
mcp__gbrain__traverse_graph     — Duyệt graph
```

### 4. Pages structure cho VietERP

```
vieterp-overview    (project)  — Tổng quan platform
├── app-accounting  (module)   — Kế toán app
├── app-hrm         (module)   — Nhân sự app
├── app-mrp         (module)   — Sản xuất app
├── app-pm          (module)   — Quản lý dự án
├── database-schema (reference)— 980 Prisma models
├── shared-packages (reference)— 6 packages dùng chung
└── infra-deployment(reference)— Docker, K8s, CI/CD
```

### 5. Tạo page mới

```markdown
---
title: Page Title
type: module|reference|project
tags: [tag1, tag2]
---

# Content here
```

### 6. Link pages

```
mcp__gbrain__add_link(from: "parent-slug", to: "child-slug", link_type: "contains")
```

## Lưu ý

- GBrain MCP server cần restart session nếu vừa init lại database
- PGLite local tại: ~/.gbrain/brain.pglite
- Config: ~/.gbrain/config.json
