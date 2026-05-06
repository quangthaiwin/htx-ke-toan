# Module Nuôi Tôm — Thiết kế chi tiết

## Trạng thái thảo luận

| #   | Phần                                 | Trạng thái |
| --- | ------------------------------------ | ---------- |
| 1   | Cấu trúc vụ nuôi (Crop > Phase > Ao) | ✅ Đã chốt |
| 2   | Quy trình Mua hàng (Purchasing)      | ✅ Đã chốt |
| 3   | Quy trình Kho (Warehouse & Lot)      | ✅ Đã chốt |
| 4   | Xuất kho cho Ao (Material Issue)     | ✅ Đã chốt |
| 5   | San tôm & Cascading Cost             | ✅ Đã chốt |
| 6   | Công nợ NCC (AP)                     | ✅ Đã chốt |
| 7   | Thu hoạch & Kết vụ                   | ✅ Đã chốt |
| 8   | Phê duyệt & Quyền                    | ✅ Đã chốt |
| 9   | Dashboard & Báo cáo                  | ✅ Đã chốt |

---

## 1. Cấu trúc Vụ nuôi

### Đề xuất: 3 cấp

```
Vụ nuôi (CropCycle)
  └── Phase (CropPhase)
        └── Ao (PondAssignment)
```

### Ví dụ thực tế:

```
VU-2026-01 "Vụ 1/2026" (01/03 - 15/07)
├── Phase 1 "Ương" (01/03 - 15/04)
│   └── Ao 1 (ao ương): 500,000 con
├── Phase 2 "Nuôi thương phẩm" (16/04 - 30/06)
│   ├── Ao 2: 200,000 con (san từ Ao 1)
│   ├── Ao 3: 150,000 con (san từ Ao 1)
│   └── Ao 4: 100,000 con (san từ Ao 1)
└── Phase 3 "Nuôi lớn" (01/07 - 15/07)
    ├── Ao 2: giữ nguyên
    ├── Ao 5: 80,000 con (san từ Ao 3)
    └── Ao 6: 60,000 con (san từ Ao 3)
```

### ✅ Đã chốt:

- **3 cấp** đúng: Vụ > Phase > Ao
- **Số tôm**: cập nhật cả hai — mortality hàng ngày + san tôm/thu hoạch
- **Quy mô**: 5-9 ao, tối đa 3 phase (có vụ chỉ 1-2 phase)
- **Ao linh hoạt**: ao nào cũng có thể ương hoặc nuôi tùy vụ → Pond model không có field "loại", mục đích do PondAssignment quyết định

---

## 2. Quy trình Mua hàng

### ✅ Đã chốt:

**Flow:**

```
Tạo đơn (PR) → Manager duyệt → Chuyển mua hàng (PO) → NCC giao hàng (GRN) → Ghi nợ
```

**Chi tiết:**

| Bước               | Chứng từ              | Trạng thái                      | Ai làm        |
| ------------------ | --------------------- | ------------------------------- | ------------- |
| 1. Tạo yêu cầu mua | Purchase Request (PR) | DRAFT → SUBMITTED               | Nhân viên     |
| 2. Manager duyệt   | PR                    | SUBMITTED → APPROVED / REJECTED | Manager       |
| 3. Chuyển thành PO | Purchase Order        | APPROVED → SENT_TO_SUPPLIER     | Nhân viên mua |
| 4. NCC giao hàng   | Goods Receipt (GRN)   | PENDING → RECEIVED              | Thủ kho       |
| 5. Ghi nợ          | AP Entry              | OPEN                            | System (auto) |

**Đặc biệt:**

- Khi chuyển PR → PO, có thể thay đổi số lượng/giá (PO ≠ PR ban đầu)
- PR bị reject → quay lại DRAFT, nhân viên sửa rồi submit lại
- NCC cố định (3-5), không cần module so giá (RFQ)
- Nhiều cấp phê duyệt: nhân viên yêu cầu → manager duyệt

**Không cần:**

- RFQ (báo giá) — NCC quen, giá đã biết
- 3-way match phức tạp — tin tưởng NCC, chỉ kiểm số lượng khi nhận

## 3. Quy trình Kho

### ✅ Đã chốt:

**Cấu trúc kho:**

- **Kho chính**: nhận hàng từ NCC, lưu trữ toàn bộ
- **Kho tạm (Working Stock)**: nhận từ kho chính, dùng dần cho ao
  - Use case: 1 bao/chai lớn → chuyển sang kho tạm → xuất dần cho các ao mỗi ngày
  - Đảm bảo: tồn kho chính chính xác (đã xuất nguyên bao) + ghi nhận đúng lượng nhỏ cho ao

**Phân loại sản phẩm (cả 2 kho):**

- Thức ăn
- Thuốc trộn
- Khoáng tạt
- Vi sinh
- Hóa chất

**Flow kho:**

```
NCC giao → Nhập Kho Chính (gán lô) → Chuyển sang Kho Tạm (nguyên bao/chai) → Xuất dần cho ao
```

**Lô & Hạn dùng:**

- Số lô tự động sinh (dựa theo mã đơn hàng + auto increment)
- Bắt buộc nhập: ngày sản xuất, ngày hết hạn
- Xuất theo FEFO (hết hạn sớm xuất trước)

**Xuất kho:**

- Tự do, ghi lại sau (không cần quy trình duyệt)
- Nhân viên ghi: ao nào, vật tư gì, bao nhiêu
- System auto tính giá vốn → ghi CP cho ao

**Kiểm kê:**

- Định kỳ tháng/quý
- So sánh tồn hệ thống vs thực tế → điều chỉnh chênh lệch

**Đặc biệt — Kho tạm flow:**

```
Kho chính: Bao thức ăn 25kg (Lô #L001)
    ↓ Chuyển kho tạm (Stock Transfer): 1 bao = 25kg
Kho tạm: 25kg
    ↓ Xuất cho Ao 1: 8kg (ngày 1)
    ↓ Xuất cho Ao 2: 5kg (ngày 1)
    ↓ Xuất cho Ao 1: 7kg (ngày 2)
    ↓ Xuất cho Ao 3: 5kg (ngày 2)
Kho tạm: 0kg (hết → lấy bao mới từ kho chính)
```

## 4. Xuất kho cho Ao

### ✅ Đã chốt:

**Ghi nhận:** Linh hoạt — ghi ngay tại ao hoặc cuối ngày nhập batch đều OK.

**2 mode xuất:**

- Mode 1: Xuất riêng cho 1 ao (chọn ao → chọn vật tư → số lượng)
- Mode 2: Xuất chia nhiều ao (chọn vật tư → nhập số lượng cho từng ao)

**Đơn vị kép (UoM conversion):**

- Mỗi sản phẩm có 2 đơn vị: đơn vị lớn (mua) + đơn vị nhỏ (dùng)
- Quy cách chuyển đổi: VD 1 BAO = 25 KG, 1 CHAI = 500 ML
- Nhập/xuất dùng đơn vị nào cũng được → system tự quy đổi về đơn vị nhỏ để tính tồn + CP

**VD:**

```
Sản phẩm: Thức ăn Grobest #2
  Đơn vị lớn: BAO
  Đơn vị nhỏ: KG
  Quy cách: 1 BAO = 25 KG
  Giá mua: 350,000đ/BAO = 14,000đ/KG

Xuất cho Ao 1: 8 KG → CP = 8 × 14,000 = 112,000đ
Xuất cho Ao 2: 0.5 BAO → quy đổi = 12.5 KG → CP = 12.5 × 14,000 = 175,000đ
```

**Flow:**

```
Chọn "Xuất kho" → Chọn vật tư → System hiện tồn (kho tạm) + lot (FEFO)
→ Nhập số lượng (đơn vị nào cũng được) → Chọn ao (1 hoặc nhiều)
→ Confirm → Auto ghi PondCostEntry cho mỗi ao
```

## 5. San tôm & Cascading Cost

### ✅ Đã chốt:

**San tôm — hỗ trợ cả Split và Merge:**

- Split: 1 ao → chia ra nhiều ao (phổ biến: ao ương → nhiều ao nuôi)
- Merge: nhiều ao → gộp vào 1 ao (gộp ao ít tôm)

**Công thức CP kế thừa:**

```
seedCostPerUnit (phase mới) = Tổng CP phase trước / Số tôm sống cuối phase trước
```

Khi san tôm sang phase mới:

- Mỗi ao đích nhận X con → CP đầu vào ao đó = X × seedCostPerUnit

**Loại chi phí tích lũy cho ao (PondCostType):**

| Loại         | Mô tả             | Nguồn ghi nhận             |
| ------------ | ----------------- | -------------------------- |
| FEED         | Thức ăn           | Auto từ xuất kho           |
| MEDICINE     | Thuốc trộn        | Auto từ xuất kho           |
| MINERAL      | Khoáng tạt        | Auto từ xuất kho           |
| PROBIOTIC    | Vi sinh           | Auto từ xuất kho           |
| CHEMICAL     | Hóa chất          | Auto từ xuất kho           |
| SEED         | Con giống đầu vào | Auto khi san tôm/mua giống |
| LABOR        | Công nhật         | Nhập tay                   |
| ENERGY       | Điện, nhiên liệu  | Nhập tay                   |
| DEPRECIATION | Khấu hao ao       | Auto phân bổ hàng tháng    |
| REPAIR       | Sửa chữa hư hỏng  | Nhập tay                   |
| OTHER        | Khác              | Nhập tay                   |

**Ví dụ cascading cost:**

```
Phase 1 (Ương) — Ao 1:
  Con giống: 500,000 con × 60đ = 30,000,000đ
  Thức ăn: 15,000,000đ
  Thuốc + vi sinh: 5,000,000đ
  Công nhật: 3,000,000đ
  Điện: 2,000,000đ
  ─────────────────────────
  Tổng CP Phase 1: 55,000,000đ
  Tôm sống cuối phase: 400,000 con
  → seedCostPerUnit = 55,000,000 / 400,000 = 137.5đ/con

Phase 2 — San tôm:
  Ao 2: 150,000 con → CP giống = 150,000 × 137.5 = 20,625,000đ
  Ao 3: 130,000 con → CP giống = 130,000 × 137.5 = 17,875,000đ
  Ao 4: 120,000 con → CP giống = 120,000 × 137.5 = 16,500,000đ
```

**Merge case:**

```
Ao 3 (50,000 con, tổng CP = 25 triệu) + Ao 4 (40,000 con, tổng CP = 20 triệu)
  → Gộp vào Ao 5: 90,000 con
  → CP giống Ao 5 = (25tr + 20tr) / 90,000 = 500đ/con × 90,000 = 45,000,000đ
```

## 6. Công nợ NCC (AP)

### ✅ Đã chốt:

**Ghi nợ — 2 bước:**

1. Nợ tạm (Accrued): auto khi nhận hàng (GRN) → ghi nợ theo giá PO
2. Đối chiếu: khi nhận hóa đơn NCC → so khớp với nợ tạm → chuyển thành nợ chính thức

**Thanh toán — 3 kiểu:**

- Gom nợ trả định kỳ (phổ biến nhất): cuối tháng trả tổng cho NCC
- Trả trước 100%: trả cho đơn cụ thể trước khi nhận hàng (prepayment)
- Trả từng phần (partial): trả trước 1 phần, còn lại gom

**Trả lại hàng (Return):**

- Trả 1 phần hàng → tạo Purchase Return
- Số tiền hoàn → cấn trừ vào tổng công nợ NCC (debit note)
- Tồn kho giảm tương ứng

**Flow:**

```
GRN confirm → Nợ tạm (ACCRUED)
  → Nhận hóa đơn → Đối chiếu → Nợ chính thức (CONFIRMED)
  → Thanh toán (1 lần / gom / partial) → PAID
  → Trả hàng (nếu có) → Cấn trừ (CREDIT_NOTE)
```

**Báo cáo:**

- Công nợ theo NCC + aging (0-30, 31-60, 61-90, >90 ngày)
- Lịch sử giao dịch (mua, trả, thanh toán)
- Cảnh báo nợ quá hạn

## 7. Thu hoạch & Kết vụ

### ✅ Đã chốt:

**Thu hoạch:**

- Tùy ao: có ao thu gọn 1 lần, có ao tỉa nhiều lần
- Mỗi lần thu = 1 Harvest Record: ao, ngày, kg, size tôm, người mua, giá/kg
- Bán tại ao cho thương lái → nhận tiền ngay (không cần quản lý AR phức tạp)

**Harvest Record:**

```
Ao 2 — Lần thu 1 (tỉa):
  Ngày: 15/06/2026
  Sản lượng: 800 kg
  Size: 40 con/kg
  Người mua: Anh Tâm (thương lái)
  Giá: 120,000đ/kg
  Thành tiền: 96,000,000đ
  Thanh toán: Nhận ngay / Nợ 3 ngày
```

**Kết vụ:**

- System gợi ý khi tất cả ao đã thu hoạch xong
- Chủ trại confirm → close crop
- Khi kết vụ: tính tổng doanh thu vs tổng CP → lãi/lỗ toàn vụ + theo ao

**Báo cáo kết vụ:**

```
VU-2026-01: Tổng doanh thu / Tổng CP / Lãi-lỗ
├── Ao 2: DT 150tr / CP 95tr / Lãi 55tr ✅
├── Ao 3: DT 120tr / CP 110tr / Lãi 10tr ⚠️
└── Ao 4: DT 80tr / CP 90tr / Lỗ -10tr ❌
```

## 8. Phê duyệt & Quyền

### ✅ Đã chốt:

**Roles:**

| Role      | Mô tả                  | Quyền chính                                             |
| --------- | ---------------------- | ------------------------------------------------------- |
| OWNER     | Chủ trại (Admin)       | Duyệt tất cả, xem báo cáo, thanh toán, kết vụ, cấu hình |
| MANAGER   | Quản lý                | Duyệt PR, quản lý kho, xem báo cáo, san tôm (đề xuất)   |
| PURCHASER | Nhân viên mua hàng     | Tạo PR, chuyển PO, theo dõi đơn, nhận hàng              |
| WORKER    | Nhân viên / Quản lý ao | Ghi xuất vật tư, báo mortality, ghi thu hoạch           |

**Approval Matrix:**

| Hành động                  | WORKER | PURCHASER | MANAGER | OWNER |
| -------------------------- | ------ | --------- | ------- | ----- |
| Tạo PR                     | ✅     | ✅        | ✅      | ✅    |
| Duyệt PR                   | ❌     | ❌        | ✅      | ✅    |
| Tạo/gửi PO                 | ❌     | ✅        | ✅      | ✅    |
| Nhận hàng (GRN)            | ❌     | ✅        | ✅      | ✅    |
| Xuất kho (ghi lại)         | ✅     | ❌        | ✅      | ✅    |
| Báo mortality              | ✅     | ❌        | ✅      | ✅    |
| San tôm (đề xuất)          | ❌     | ❌        | ✅      | ✅    |
| San tôm (duyệt)            | ❌     | ❌        | ❌      | ✅    |
| Thanh toán NCC             | ❌     | ❌        | ❌      | ✅    |
| Kết vụ                     | ❌     | ❌        | ❌      | ✅    |
| Kiểm kê (phát động)        | ❌     | ❌        | ✅      | ✅    |
| Kiểm kê (duyệt chênh lệch) | ❌     | ❌        | ❌      | ✅    |
| Xem báo cáo CP             | ❌     | ❌        | ✅      | ✅    |
| Xem công nợ                | ❌     | ❌        | ✅      | ✅    |

## 9. Dashboard & Báo cáo

### ✅ Đã chốt:

**Dashboard chính (trang /farm):**

| Widget               | Mô tả                                                                      | Ưu tiên |
| -------------------- | -------------------------------------------------------------------------- | ------- |
| CP realtime theo ao  | Bảng: mỗi ao 1 dòng, cột CP + cost/con + so sánh                           | P0      |
| Biểu đồ CP phân loại | Stacked bar: thức ăn / thuốc / khoáng / vi sinh / hóa chất / khác — mỗi ao | P0      |
| Tồn kho + cảnh báo   | Tồn theo loại + badge lot sắp hết hạn                                      | P1      |
| Công nợ + đơn hàng   | Tổng nợ NCC + đơn hàng đang chờ giao                                       | P1      |
| Tình trạng ao        | Số tôm, tỷ lệ sống, ngày nuôi, dự kiến thu                                 | P1      |

**Báo cáo:**

| Báo cáo          | Nội dung                                                  |
| ---------------- | --------------------------------------------------------- |
| So sánh CP ao/vụ | Bảng pivot: ao × loại CP, so sánh giữa vụ trước vs vụ này |
| Lãi/lỗ kết vụ    | Doanh thu (harvest) − Tổng CP, chi tiết theo ao           |
| Báo cáo kho      | Xuất-nhập-tồn theo vật tư, theo lot, theo thời gian       |
| Báo cáo mua hàng | Tổng mua theo NCC, theo loại vật tư, theo thời gian       |

**Biểu đồ CP phân loại (core feature):**

```
         Ao 1      Ao 2      Ao 3      Ao 4
    ┌─────────┬─────────┬─────────┬─────────┐
    │ Thức ăn │ Thức ăn │ Thức ăn │ Thức ăn │ ← lớn nhất
    │─────────│─────────│─────────│─────────│
    │ Khoáng  │ Khoáng  │ Thuốc   │ Khoáng  │
    │─────────│─────────│─────────│─────────│
    │ Vi sinh │ Thuốc   │ Vi sinh │ Vi sinh │
    │─────────│─────────│─────────│─────────│
    │ Khác    │ Khác    │ Khác    │ Khác    │
    └─────────┴─────────┴─────────┴─────────┘
```
