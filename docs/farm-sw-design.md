# Module Nuôi Tôm — Software Design Specs

## 1. ERD (Entity Relationship Diagram)

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│ FarmProduct │────<│  FarmLot    │>────│FarmWarehouse │
│─────────────│     │─────────────│     │──────────────│
│ id          │     │ id          │     │ id           │
│ code        │     │ lotNumber   │     │ code         │
│ name        │     │ poCode      │     │ name         │
│ category    │     │ mfgDate     │     │ type (MAIN/  │
│ primaryUnit │     │ expiryDate  │     │   WORKING)   │
│ secondaryUnit│    │ qtyOnHand   │     └──────────────┘
│ conversionRate│   │ unitCost    │            │
└─────────────┘     │ warehouseId │            │
                    │ status      │     ┌──────────────┐
                    └─────────────┘     │StockTransfer │
                                        │──────────────│
                                        │ fromWhId     │
                                        │ toWhId       │
                                        │ lotId        │
                                        │ quantity     │
                                        └──────────────┘

┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│ CropCycle   │────<│ CropPhase   │────<│PondAssignment│
│─────────────│     │─────────────│     │──────────────│
│ id          │     │ id          │     │ id           │
│ code        │     │ cropCycleId │     │ phaseId      │
│ name        │     │ phaseNumber │     │ pondId       │
│ startDate   │     │ name        │     │ shrimpCount  │
│ endDate     │     │ startDate   │     │ status       │
│ status      │     │ seedCostPU  │     └──────┬───────┘
└─────────────┘     └─────────────┘            │
                          │                     │
                    ┌─────┴──────┐        ┌────┴────────┐
                    │PondTransfer│        │PondCostEntry │
                    │────────────│        │─────────────│
                    │fromPhaseId │        │assignmentId │
                    │toPhaseId   │        │costType     │
                    │shrimpCount │        │amount       │
                    │costPerUnit │        │transactionDate│
                    │status      │        └─────────────┘
                    └────────────┘              ↑
                                               │
┌─────────┐     ┌───────────────┐     ┌───────┴───────┐
│  Pond   │────>│PondAssignment │────<│MaterialIssue  │
│─────────│     │ (above)       │     │───────────────│
│ id      │     └───────────────┘     │ assignmentId  │
│ code    │                           │ productId     │
│ name    │     ┌───────────────┐     │ lotId         │
│ areaM2  │     │MortalityRecord│     │ quantity      │
└─────────┘     │───────────────│     │ unitCost      │
                │ assignmentId  │     │ totalCost     │
                │ count         │     └───────────────┘
                │ recordDate    │
                │ cause         │
                └───────────────┘

┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Supplier   │────<│PurchaseOrder│────<│ GoodsReceipt │
│─────────────│     │─────────────│     │──────────────│
│ id          │     │ id          │     │ poId         │
│ code        │     │ supplierId  │     │ status       │
│ name        │     │ prId        │     │ receivedBy   │
│ phone       │     │ status      │     │ lines[]      │
└──────┬──────┘     │ lines[]     │     └──────────────┘
       │            │ totalAmount │
       │            └─────────────┘
       │                  ↑
┌──────┴──────┐     ┌─────┴───────┐
│  APEntry    │     │PurchaseReq  │
│─────────────│     │─────────────│
│ supplierId  │     │ code        │
│ type        │     │ status      │
│ amount      │     │ requestedBy │
│ balance     │     │ approvedBy  │
│ dueDate     │     │ lines[]     │
│ status      │     └─────────────┘
│ payments[]  │
└─────────────┘
       │
┌──────┴──────┐
│  Payment    │
│─────────────│
│ apEntryId   │
│ amount      │
│ payDate     │
│ method      │
│ approvedBy  │
└─────────────┘

┌──────────────┐
│HarvestRecord │
│──────────────│
│ cropCycleId  │
│ assignmentId │
│ weightKg     │
│ sizePerKg    │
│ buyerName    │
│ pricePerKg   │
│ totalRevenue │
└──────────────┘
```

## 2. Sequence Diagrams

### 2.1 Purchasing Flow (PR → PO → GRN → AP)

```
Worker          Manager         Purchaser       System          Warehouse
  │                │                │              │                │
  │─── Tạo PR ───────────────────────────────────>│                │
  │                │                │              │ PR (DRAFT)     │
  │─── Submit ───────────────────────────────────>│                │
  │                │                │              │ PR (SUBMITTED) │
  │                │                │              │                │
  │                │<── Notify: PR chờ duyệt ─────│                │
  │                │─── Duyệt PR ────────────────>│                │
  │                │                │              │ PR (APPROVED)  │
  │                │                │              │                │
  │                │                │<── Notify ───│                │
  │                │                │── Tạo PO ──>│                │
  │                │                │  (có thể     │ PO (DRAFT)     │
  │                │                │  sửa SL/giá) │                │
  │                │                │── Gửi NCC ─>│ PO (SENT)      │
  │                │                │              │                │
  │                │                │              │ ... NCC giao ..│
  │                │                │              │                │
  │                │                │              │                │── Nhận hàng
  │                │                │              │<───── GRN ─────│ (check SL)
  │                │                │              │ GRN (RECEIVED) │
  │                │                │              │                │
  │                │                │              │── Tạo Lot ────>│ (auto)
  │                │                │              │── Tạo AP ─────>│ (auto)
  │                │                │              │ APEntry(ACCRUED)│
  │                │                │              │                │
```

### 2.2 Material Issue (Xuất kho cho ao)

```
Worker          System          Warehouse(DB)
  │                │                │
  │── Chọn vật tư ─>│               │
  │                │── Query tồn ──>│
  │                │<── Lots(FEFO) ─│
  │<── Hiện lots ──│                │
  │                │                │
  │── Chọn ao + SL ─>│             │
  │   (1 hoặc nhiều) │             │
  │                │── Validate: ──>│
  │                │  - Tồn đủ?     │
  │                │  - Lot hết hạn?│
  │                │  - UoM convert │
  │                │                │
  │                │<── OK ─────────│
  │── Confirm ────>│                │
  │                │── Transaction:─│
  │                │  1. Trừ lot.qtyOnHand
  │                │  2. Tạo MaterialIssue (per ao)
  │                │  3. Tạo PondCostEntry (per ao)
  │                │     costType = product.category
  │                │     amount = qty × unitCost
  │                │                │
  │<── Success ────│                │
```

### 2.3 San tôm (Transfer - Split)

```
Manager         Owner           System
  │                │                │
  │── Chọn phase nguồn ──────────>│
  │                │                │── Tính tổng CP phase
  │                │                │── Tính số tôm sống
  │                │                │── costPerUnit = CP/tôm
  │<── Hiện cost calc ────────────│
  │                │                │
  │── Nhập ao đích + số tôm ────>│
  │── Submit (DRAFT) ────────────>│
  │                │                │ PondTransfer(DRAFT)
  │                │                │
  │                │<── Notify: cần duyệt ──│
  │                │── Review cost ──────────>│
  │                │── Approve ──────────────>│
  │                │                │ PondTransfer(CONFIRMED)
  │                │                │
  │                │                │── Transaction:
  │                │                │  1. Close fromAssignment (TRANSFERRED)
  │                │                │  2. Create toAssignment per ao đích
  │                │                │     shrimpCount = số chuyển
  │                │                │  3. Create PondCostEntry(SEED)
  │                │                │     per ao = shrimpCount × costPerUnit
  │                │                │  4. Set toPhase.seedCostPerUnit
  │                │                │
```

### 2.4 GRN → Kho Chính → Kho Tạm → Xuất Ao

```
Purchaser       System          KhoChính        KhoTạm          Ao
  │                │                │              │              │
  │── GRN confirm ─>│              │              │              │
  │                │── Tạo Lot ───>│              │              │
  │                │  (25 KG,      │              │              │
  │                │   unitCost=14k)│              │              │
  │                │                │              │              │
  │    ... later ...               │              │              │
  │                │                │              │              │
  Worker:          │                │              │              │
  │── Chuyển kho ──>│              │              │              │
  │  (1 BAO=25KG)  │── Transfer ──>│              │              │
  │                │  lot.whId=Main │── Move ────>│              │
  │                │                │ qtyOnHand-25 │ qtyOnHand+25 │
  │                │                │              │              │
  │    ... daily ...               │              │              │
  │                │                │              │              │
  │── Xuất ao 1: 8kg ────────────────────────────>│              │
  │                │                │              │ qty-8        │
  │                │── MaterialIssue ──────────────────────────>│ +8kg CP
  │                │── PondCostEntry(FEED, 8×14k=112k) ────────>│
  │                │                │              │              │
  │── Xuất ao 2: 5kg ────────────────────────────>│              │
  │                │                │              │ qty-5        │
  │                │── MaterialIssue ──────────────────────────>│ +5kg CP
  │                │                │              │              │
```

### 2.5 AP Payment Flow

```
System          Owner           Supplier
  │                │                │
  │ GRN confirmed  │                │
  │── APEntry(ACCRUED, 6tr) ───────>│
  │                │                │
  │ ... Invoice arrives ...         │
  │                │                │
  │── Đối chiếu: PO vs GRN vs Invoice ──>│
  │── APEntry(CONFIRMED) ──────────>│
  │                │                │
  │ ... Cuối tháng ...              │
  │── Notify: nợ NCC Minh Phú 12.5tr ──>│
  │                │                │
  │                │── Approve payment ──>│
  │                │   (gom: 3 đơn = 12.5tr)
  │── Payment(12.5tr) ─────────────────────────>│
  │── APEntry.balance = 0 ─────────>│
  │── APEntry.status = PAID ───────>│
  │                │                │
  │ ... Trả hàng ...               │
  │── PurchaseReturn (2kg hư) ─────>│
  │── CreditNote (2×14k=28k) ─────>│<──────────│
  │── Cấn trừ vào nợ kỳ sau ──────>│
```

### 2.6 Harvest & Close Crop

```
Worker          Owner           System
  │                │                │
  │── Ghi thu hoạch ─────────────>│
  │  (Ao 2, 800kg, 120k/kg)       │ HarvestRecord
  │                │                │ revenue = 96,000,000
  │                │                │
  │── Ghi thu lần 2 ─────────────>│
  │  (Ao 2, 500kg, 135k/kg)       │ revenue += 67,500,000
  │                │                │
  │   ... all ao thu xong ...      │
  │                │                │
  │                │<── Gợi ý: "Tất cả ao đã thu, kết vụ?" ──│
  │                │── Confirm kết vụ ───────────>│
  │                │                │── Close all assignments
  │                │                │── CropCycle.status = HARVESTED
  │                │                │── Generate P&L report:
  │                │                │   DT: 313.5tr
  │                │                │   CP: 202.7tr
  │                │                │   Lãi: 110.8tr
  │                │<── Báo cáo kết vụ ──────────│
```

## 3. API Specs

### 3.1 Crop Management

```typescript
// GET /api/farm/crops
Response: { crops: CropCycle[] }

// POST /api/farm/crops
Body: { code, name, startDate }
Response: { crop: CropCycle }

// POST /api/farm/crops/:id/phases
Body: { name, startDate }
Response: { phase: CropPhase }

// POST /api/farm/crops/:id/close
Response: { crop: CropCycle, report: { totalRevenue, totalCost, profit } }
```

### 3.2 Pond Assignment

```typescript
// POST /api/farm/phases/:phaseId/assign
Body: { pondId, shrimpCount, startDate }
Response: { assignment: PondAssignment }

// POST /api/farm/mortality
Body: { assignmentId, count, recordDate, cause? }
Response: { record: MortalityRecord, newShrimpCount: number }
```

### 3.3 Material Issue

```typescript
// GET /api/farm/inventory/available?warehouseType=WORKING
Response: { items: { product, lots: { lotId, qty, expiryDate, unitCost }[] }[] }

// POST /api/farm/issue
Body: {
  productId: string
  issueDate: string
  issuedBy?: string
  allocations: {
    assignmentId: string
    quantity: number
    unit: "primary" | "secondary"  // system converts
  }[]
  notes?: string
}
Response: {
  issues: MaterialIssue[]     // 1 per ao
  costEntries: PondCostEntry[] // 1 per ao
  lotsUsed: { lotId, qtyDeducted }[]  // FEFO order
}

// Error cases:
// 400: { error: "INSUFFICIENT_STOCK", available: number }
// 400: { error: "LOT_EXPIRED", lotId, expiryDate }
```

### 3.4 Stock Transfer (Kho chính → Kho tạm)

```typescript
// POST /api/farm/stock/transfer
Body: {
  fromWarehouseId: string;
  toWarehouseId: string;
  lotId: string;
  quantity: number; // secondary unit
}
Response: {
  transfer: StockTransfer;
}
```

### 3.5 Pond Transfer (San tôm)

```typescript
// GET /api/farm/transfer/calculate?phaseId=xxx
Response: {
  totalCost: number
  totalShrimp: number
  costPerUnit: number  // = totalCost / totalShrimp
  assignments: { assignmentId, pondCode, shrimpCount, totalCost }[]
}

// POST /api/farm/transfer
Body: {
  fromPhaseId: string
  toPhase: { name: string, startDate: string }
  allocations: { pondId: string, shrimpCount: number }[]
  notes?: string
}
Response: { transfer: PondTransfer, status: "DRAFT" }

// POST /api/farm/transfer/:id/approve
Response: { transfer: PondTransfer, newPhase: CropPhase, assignments: PondAssignment[] }
```

### 3.6 Cost Dashboard

```typescript
// GET /api/farm/cost/:assignmentId
Response: {
  assignment: { pondCode, shrimpCount, startDate }
  costs: {
    feed: number
    medicine: number
    mineral: number
    probiotic: number
    chemical: number
    seed: number
    labor: number
    energy: number
    depreciation: number
    repair: number
    other: number
    total: number
    perShrimp: number  // total / shrimpCount
  }
}

// GET /api/farm/cost/summary?cropCycleId=xxx
Response: {
  ponds: {
    assignmentId: string
    pondCode: string
    shrimpCount: number
    costs: { [PondCostType]: number }
    total: number
    perShrimp: number
    revenue: number  // from harvests
    profit: number
  }[]
  totals: { totalCost, totalRevenue, totalProfit }
}
```

### 3.7 Purchasing

```typescript
// POST /api/farm/purchase/pr
Body: { lines: { productId, quantity, unit, notes? }[], notes? }
Response: { pr: PurchaseRequest }

// POST /api/farm/purchase/pr/:id/approve
Response: { pr: PurchaseRequest }

// POST /api/farm/purchase/pr/:id/reject
Body: { reason: string }
Response: { pr: PurchaseRequest }

// POST /api/farm/purchase/po
Body: {
  prId?: string
  supplierId: string
  expectedDate?: string
  paymentTerms?: string
  lines: { productId, quantity, unit, unitPrice }[]
}
Response: { po: PurchaseOrder }

// POST /api/farm/purchase/po/:id/send
Response: { po: PurchaseOrder }  // status → SENT

// POST /api/farm/purchase/grn
Body: {
  poId: string
  receivedAt: string
  receivedBy?: string
  lines: { productId, qtyReceived, unit, mfgDate, expiryDate }[]
  warehouseId: string
}
Response: {
  grn: GoodsReceipt
  lots: FarmLot[]  // auto-created
  apEntry: APEntry // auto-created (ACCRUED)
}
```

### 3.8 AP & Payments

```typescript
// GET /api/farm/suppliers/:id/balance
Response: {
  supplier: Supplier
  totalOwed: number
  aging: { current: number, days30: number, days60: number, days90: number, over90: number }
  entries: APEntry[]
}

// POST /api/farm/payment
Body: {
  supplierId: string
  apEntryIds: string[]  // gom nhiều entry
  amount: number
  payDate: string
  method: "CASH" | "TRANSFER"
  notes?: string
}
Response: { payment: Payment, updatedEntries: APEntry[] }

// POST /api/farm/purchase/return
Body: { poId, lines: { productId, quantity, reason }[] }
Response: { creditNote: APEntry(CREDIT_NOTE) }
```

### 3.9 Harvest

```typescript
// POST /api/farm/harvest
Body: {
  cropCycleId: string
  assignmentId: string
  harvestDate: string
  weightKg: number
  sizePerKg: number
  buyerName: string
  pricePerKg: number
  paymentStatus: "RECEIVED" | "PENDING"
  notes?: string
}
Response: { harvest: HarvestRecord, totalRevenue: number }
```

### 3.10 Lots & Expiry

```typescript
// GET /api/farm/lots/expiring?days=7
Response: {
  lots: { lot: FarmLot, product: FarmProduct, daysUntilExpiry: number }[]
}

// POST /api/farm/lots/:id/override-expiry
// (Owner only — xuất lot hết hạn)
Body: { reason: string }
Response: { allowed: true }
```

## 4. Frontend Architecture

### 4.1 Component Tree

```
app/(main)/farm/
├── layout.tsx              ← Farm layout with sidebar nav
├── page.tsx                ← Dashboard (server component)
├── crops/
│   ├── page.tsx            ← List crops
│   ├── [id]/page.tsx       ← Crop detail (phases, assignments)
│   └── new/page.tsx        ← Create crop form
├── ponds/
│   ├── page.tsx            ← List ponds
│   └── [id]/page.tsx       ← Pond detail + cost history
├── issue/
│   ├── page.tsx            ← List issues
│   └── new/page.tsx        ← Issue form (multi-ao)
├── transfer/
│   ├── page.tsx            ← List transfers
│   ├── split/page.tsx      ← Split form
│   └── merge/page.tsx      ← Merge form
├── purchase/
│   ├── page.tsx            ← PR list
│   ├── pr/new/page.tsx     ← Create PR
│   ├── po/page.tsx         ← PO list
│   ├── po/[id]/page.tsx    ← PO detail
│   └── grn/[poId]/page.tsx ← GRN form
├── inventory/
│   ├── page.tsx            ← Stock levels
│   ├── lots/page.tsx       ← Lot management
│   └── transfer/page.tsx   ← Stock transfer form
├── suppliers/
│   ├── page.tsx            ← Supplier list + aging
│   └── [id]/page.tsx       ← Supplier detail + history
├── harvest/
│   └── page.tsx            ← Harvest records
├── reports/
│   ├── page.tsx            ← Report selector
│   ├── cost/page.tsx       ← CP comparison
│   ├── pnl/page.tsx        ← Profit/Loss
│   └── inventory/page.tsx  ← XNT report
└── settings/
    ├── products/page.tsx   ← Product master
    └── users/page.tsx      ← User/role management
```

### 4.2 State Management

```
SWR (useSWR) cho data fetching:
- /api/farm/cost/summary      → dashboard
- /api/farm/inventory/available → issue form
- /api/farm/lots/expiring      → alerts

React Context:
- FarmContext: currentCropCycle, currentPhase (selected filter)
- AuthContext: currentUser, role, permissions

No global state manager needed (SWR + Context đủ dùng)
```

### 4.3 Key Shared Components

```
components/farm/
├── CostTable.tsx           ← Bảng CP realtime (reusable: dashboard + reports)
├── CostChart.tsx           ← Stacked bar chart (Recharts)
├── LotPicker.tsx           ← FEFO lot selection UI
├── UomInput.tsx            ← Input with unit selector (auto convert)
├── PondSelector.tsx        ← Multi-select ao with quantity per ao
├── ApprovalBadge.tsx       ← Status badge (DRAFT/SUBMITTED/APPROVED/...)
├── ApprovalActions.tsx     ← Approve/Reject buttons (role-aware)
├── CropTimeline.tsx        ← Visual timeline of phases
└── ExpiryAlert.tsx         ← Lot expiry warning banner
```

### 4.4 Routing & Permissions

```typescript
// middleware: check role before rendering pages
const ROUTE_PERMISSIONS = {
  "/farm/purchase/pr/new": ["WORKER", "PURCHASER", "MANAGER", "OWNER"],
  "/farm/purchase/pr/approve": ["MANAGER", "OWNER"],
  "/farm/purchase/po": ["PURCHASER", "MANAGER", "OWNER"],
  "/farm/issue/new": ["WORKER", "MANAGER", "OWNER"],
  "/farm/transfer": ["MANAGER", "OWNER"],
  "/farm/suppliers": ["MANAGER", "OWNER"],
  "/farm/reports": ["MANAGER", "OWNER"],
  "/farm/settings": ["OWNER"],
};
```

## 5. Workflow State Machines

### 5.1 Purchase Request

```
          ┌──────────┐
          │  DRAFT   │ ← tạo mới
          └────┬─────┘
               │ submit
          ┌────▼─────┐
          │SUBMITTED │ ← chờ duyệt
          └────┬─────┘
          ┌────┴────┐
     ┌────▼───┐ ┌───▼────┐
     │APPROVED│ │REJECTED│ → quay về DRAFT (sửa + submit lại)
     └────────┘ └────────┘
```

### 5.2 Purchase Order

```
     ┌──────┐
     │DRAFT │ ← từ PR hoặc tạo trực tiếp
     └──┬───┘
        │ approve (Owner)
     ┌──▼─────┐
     │APPROVED│
     └──┬─────┘
        │ send to supplier
     ┌──▼──┐
     │SENT │ ← đang chờ NCC giao
     └──┬──┘
        │ receive (partial or full)
     ┌──▼──────┐
     │RECEIVED │ ← đã nhận hàng (có thể partial)
     └──┬──────┘
        │ all lines fulfilled
     ┌──▼────────┐
     │COMPLETED  │
     └───────────┘
```

### 5.3 Pond Transfer

```
     ┌──────┐
     │DRAFT │ ← Manager tạo
     └──┬───┘
        │ submit to Owner
     ┌──▼────────┐
     │CONFIRMED  │ ← Owner approve → execute transaction
     └───────────┘
```

### 5.4 AP Entry Lifecycle

```
     ┌───────┐
     │ACCRUED│ ← auto khi GRN confirm
     └──┬────┘
        │ invoice matched
     ┌──▼───────┐
     │CONFIRMED │
     └──┬───────┘
        │ partial payment
     ┌──▼─────┐
     │PARTIAL │ ← balance > 0
     └──┬─────┘
        │ final payment (balance = 0)
     ┌──▼──┐
     │PAID │
     └─────┘

     Parallel: if overdue
     ┌───────┐
     │OVERDUE│ ← dueDate < today && balance > 0
     └───────┘
```

### 5.5 Crop Cycle

```
     ┌──────┐
     │ACTIVE│ ← vụ đang nuôi
     └──┬───┘
        │ Owner confirms close (all ao harvested)
     ┌──▼───────┐
     │HARVESTED │ ← generate P&L report
     └──────────┘

        │ (or) cancel before harvest
     ┌──▼───────┐
     │CANCELLED │
     └──────────┘
```

## 6. Technical Decisions

| Quyết định                               | Lý do                                                     |
| ---------------------------------------- | --------------------------------------------------------- |
| Tồn kho tính theo đơn vị nhỏ (secondary) | Đảm bảo chính xác khi xuất lẻ                             |
| FEFO picking tự động                     | Giảm rủi ro hàng hết hạn, user không cần nhớ              |
| Kho tạm (WORKING) riêng biệt             | Đúng tồn kho chính (đã xuất nguyên bao) + track lẻ cho ao |
| PondCostEntry auto-create khi xuất       | Không bỏ sót, realtime CP                                 |
| seedCostPerUnit lưu trên CropPhase       | Cache tránh re-calculate; audit trail                     |
| Lot number auto = PO code + seq          | Truy xuất nguồn gốc nhanh                                 |
| SWR (not Redux)                          | App đơn giản, SWR + Context đủ                            |
| Server Components cho dashboard          | Tốc độ load, SEO không cần                                |
| Prisma transactions cho san tôm          | Atomic: close phase + create assignments + cost entries   |

## 7. File Structure

```
apps/Accounting/
├── prisma/
│   └── schema.prisma          ← Thêm farm models
├── src/lib/farm/
│   ├── cost-engine.ts         ← calculatePondCost, calculateSeedCost
│   ├── material-issue.ts      ← issueMaterial, pickLotsFEFO, convertUom
│   ├── lot-service.ts         ← checkExpiry, getExpiringLots
│   ├── transfer-service.ts    ← splitTransfer, mergeTransfer
│   ├── ap-service.ts          ← createAPEntry, processPayment, createCreditNote
│   ├── purchasing-service.ts  ← createPR, approvePR, createPO, receiveGRN
│   └── permissions.ts         ← checkPermission(role, action)
├── app/(main)/farm/           ← UI pages (see 4.1)
└── app/api/farm/              ← API routes (see section 3)
```
