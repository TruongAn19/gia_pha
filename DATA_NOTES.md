# DATA_NOTES — `members.json`

> Tài liệu cho người/AI lập trình (Claude Code). `members.json` là dữ liệu thật,
> nguồn **OCR từ gia phả scan** → **bẩn**. Đọc kỹ trước khi viết UI.

## 1. Tổng quan (số liệu thực tế)

| Trường | Tình trạng |
|---|---|
| Tổng bản ghi | **487** thành viên |
| Gốc (`parent_id_temp = null`) | **1** → cây liền mạch, một gốc |
| `han_name` | **481/487 = null** (chỉ ~6 đời đầu có) |
| `death_anniversary` | **362 null**; **90** bản lẫn chữ "Mộ…"; nhiều bản bị **cắt cụt** `"24-08 (Âm"` |
| `grave` | **478/487 = null** |
| Có vợ thứ (`thứ thất` trong `details`) | **29** (đa thê) |
| `photo_url` | **tất cả null** |

## 2. Schema & khóa

Mỗi object:
```
id_temp, name, han_name, generation,
death_anniversary, grave, details, photo_url, parent_id_temp
```

- **Khóa là `id_temp`** (chuỗi slug). **KHÔNG dùng `name`** làm khóa — 487 người trùng tên rất nhiều.
- Cây dựng từ **`parent_id_temp`** (gốc = `null`). Đề phòng **orphan**: `parent_id_temp` trỏ tới id không tồn tại → gom vào nhóm "Chưa rõ thân phụ", đừng để crash.
- `generation` (số nguyên) chỉ dùng để hiển thị/sort, không thay cho quan hệ cha-con.

## 3. Dữ liệu bẩn — CẢNH BÁO

- **`death_anniversary` bẩn**: bị cắt `"(Âm"` (mất "lịch)") và **lẫn mộ phần** vào (vd `"29-05 (Âm lịch). Mộ ở xứ Đồng"`). Phần đuôi thường tràn sang `details`.
  → Chỉ lấy **token ngày ở đầu** (regex `^\d{1,2}-\S+`), hiển thị kèm `"(Âm lịch)"`. Phần còn lại coi như ghi chú/mộ, **đừng tin cả chuỗi**.
- **`grave`, `han_name`, `death_anniversary` phần lớn null** → fallback:
  - `grave` → "Chưa rõ" (mộ thật thường nằm trong `details`)
  - `han_name` → "Chưa có tên Hán"; **monogram luôn dùng chữ họ 吳**
  - `death_anniversary` null → ẩn / "Chưa rõ"
- **`details` là free-text OCR** có lỗi ngắt câu (vd "Chua, hình con Mộc" bị tách).
  → **HIỂN THỊ NGUYÊN VĂN**: render đúng từng chữ, **giữ ngắt dòng `\n`** (CSS `white-space: pre-line`), trong khối "Ghi chép trong gia phả". **TUYỆT ĐỐI KHÔNG** tóm tắt / diễn giải / thêm chữ / cắt câu (lỗi đã gặp: tự thêm "(1825)", "kế tục hương hỏa…"). Nguyên văn là nguồn chuẩn.
  → Việc **dò MỀM** (dưới) chỉ để tạo **chip/nhãn bổ trợ** (thụy/tự, phối ngẫu, hưởng thọ…), **KHÔNG thay thế** nguyên văn và không được coi là dữ liệu chắc chắn. **Đừng parse cứng.** Cấu trúc mềm để dò:
  - Tên thụy/tự: trong ngoặc ở đầu chuỗi — `(Tên thụy: …)`, `(Tự …)`
  - Vợ: `"Bà chánh thất:"`, **`"Bà thứ thất:"` = đa thê** (29 người)
  - Con: `"Các con: NN con trai … NN con gái …"` (số kiểu `01, 02…`)
  - Hưởng thọ: `"thọ N tuổi"` / `"Hưởng thọ N tuổi"`
- **Số con: đếm từ liên kết `parent_id_temp`**, **KHÔNG** từ `details`.
  Con gái thường **không có record riêng** (lấy chồng → không chép tiếp) ⇒ số con record **ít hơn** số ghi trong `details`. Hiển thị số record; có thể chú thêm "+N con gái (theo gia phả)".

## 4. Lịch & Tuổi / Hưởng thọ — TÍNH THEO ÂM LỊCH (tuổi ta)

Gia phả ghi theo **âm lịch + niên hiệu + can chi**. Tuổi là **tuổi ta** (tính cả năm sinh ⇒ `+1`), KHÔNG phải tuổi tây.

**Công thức**
- Hưởng thọ = `năm mất(âm) − năm sinh(âm) + 1`
- Tuổi (đang sống) = `năm âm hiện tại − năm sinh(âm) + 1`

`+1` để khớp với các số `"thọ N tuổi"` đã ghi sẵn (cũng là tuổi ta).

**Bảng quyết định** (trigger = có **năm mất** hay chưa)

| Điều kiện | Hiển thị |
|---|---|
| Chưa có năm mất + có năm sinh | **Tuổi: `năm âm hiện tại − năm sinh + 1`** (tự động) |
| Chưa có năm mất + không năm sinh | **Tuổi: Chưa xác định** |
| Có năm mất + có năm sinh | **Hưởng thọ: `năm mất − năm sinh + 1`** (tự động) |
| Có năm mất + không năm sinh + có "thọ N tuổi" | **Hưởng thọ: `N`** |
| Có năm mất + không có gì | **Hưởng thọ: Chưa xác định** |

(`ngày giỗ` cũng là dấu hiệu "đã mất" nếu thiếu năm mất.)

**Hàm tham chiếu**
```js
// *_lunar_year: số năm âm đã quy đổi; longevity: số "thọ N tuổi" dò từ details (hoặc null)
// curLunarYear: lấy từ thư viện âm lịch theo hôm nay (UTC+7)
function getLifespan(m, curLunarYear) {
  const b = m.birth_lunar_year, d = m.death_lunar_year, tho = m.longevity;
  if (!d) {                                   // đang sống
    return b ? { label: "Tuổi", value: curLunarYear - b + 1 }
             : { label: "Tuổi", value: "Chưa xác định" };
  }
  if (b)         return { label: "Hưởng thọ", value: d - b + 1 };
  if (tho != null) return { label: "Hưởng thọ", value: tho };
  return { label: "Hưởng thọ", value: "Chưa xác định" };
}
```

**Quy đổi sang số năm âm** (cần module riêng):
- **Niên hiệu** → `năm = năm_bắt_đầu + (thứ − 1)`:
  ```
  Gia Long 1802 · Minh Mạng 1820 · Thiệu Trị 1841 · Tự Đức 1848 ·
  Hiệp Hòa 1883 · Kiến Phúc 1884 · Hàm Nghi 1885 · Đồng Khánh 1886 ·
  Thành Thái 1889 · Duy Tân 1907 · Khải Định 1916 · Bảo Đại 1926
  ```
  VD: "Minh Mạng thứ 6" = 1820 + 5 = **1825**.
- **Can chi** (Giáp Tý…Quý Mão, vòng 60 năm): một tên ứng nhiều năm cách nhau 60 → **chọn đúng thế kỷ theo đời/ngữ cảnh cha-con**.
- **Lưu cả 2**: text gốc (`birth_raw`) + số quy đổi (`birth_lunar_year`) để vừa hiển thị vừa tính.
- **Năm âm hiện tại**: thư viện âm lịch VN (thuật toán **Hồ Ngọc Đức**, npm `vietnamese-lunar-calendar` / `amlich`), **UTC+7**; **chưa qua Tết** thì vẫn là năm trước.

> Mức chính xác: tính theo **năm âm + 1** là đủ và đúng quy ước gia phả (không cần so tháng/ngày âm).
> Dữ liệu cũ ghi niên hiệu như "Minh Mạng thứ 6" thì **quy đổi** (không để nguyên text rồi bỏ tính).

> ⚠️ Hiện `members.json` **chưa có cột `birth_*`/`death_*`** (chỉ có `death_anniversary` âm + "thọ N tuổi" rải trong `details`).
> ⇒ Logic trên áp dụng ngay cho **thành viên nhập mới** (form có ô Năm sinh); 487 bản ghi cũ phần lớn rơi vào "Chưa xác định" cho tới khi bổ sung năm.

## 5. Trạng thái rỗng / fallback hiển thị (đồng nhất toàn app)

| Trường hợp | Hiển thị |
|---|---|
| Không áp dụng (giỗ/mộ với người đang sống) | "Chưa áp dụng" + ghi chú lý do |
| Thiếu dữ liệu (null) | "Chưa cập nhật" / "Chưa rõ" + nút **+ Thêm** |
| Danh sách rỗng (con cái, phối ngẫu) | Empty state: icon + câu giải thích + nút hành động |
| Số đếm = 0 | "Chưa có" (đừng hiện "0") |
| Thành viên thất lạc (`details` ghi "không thấy tin tức"…) | nhãn "Thất lạc" |

## 6. Hiệu năng (487 node, 6+ đời)

- **Đừng render cả cây đồ họa** một lúc → **lazy-expand** nhánh (chỉ dựng con khi mở).
- Bảng danh bạ: **virtualize / phân trang**.
- Tìm kiếm: **bỏ dấu** (diacritic-insensitive) để gõ "ngo ba dat" vẫn ra "Ngô Bá Đạt".

## 7. Yêu cầu kỹ thuật

Viết **module data riêng** (vd `src/data/genealogy.js`):
- `loadMembers()`, `byId(id)`, `getChildren(id)`, `getAncestors(id)`, `getRoots()`, `groupByGeneration()`
- `normalizeDeathAnniversary(raw)`, `parseDetails(text)` (dò mềm: thụy/tự, vợ, con, hưởng thọ)
- `toLunarYear(raw)` (niên hiệu / can chi / số), `getLifespan(m, curLunarYear)`
- Tìm kiếm bỏ dấu, đếm số con từ `parent_id_temp`

**TEST với vài `id_temp` thật trước khi dựng UI**, gợi ý:
- `ngo-phuc-khang` (gốc, đời 1, có Hán tự)
- `ngo-ba-dat` (đời 4, "thọ 74 tuổi", "Minh Mạng thứ 6", nhiều con)
- `ngo-kieu` (đời 6, **đa thê**: chánh thất + thứ thất)
- `ngo-nghiem` (đời 6, **thất lạc** — "không thấy tin tức")

## 8. Quyết định bổ sung (chốt sau Bước 1)

**8.1. "Thất lạc" là một tầng trạng thái riêng, ƯU TIÊN cao nhất**
- Thứ tự xác định trạng thái: `isLost` → **"Thất lạc"** › có năm mất/giỗ → **"Đã mất"** › còn lại → **"Đang sống"**.
- Khi `isLost = true`: **KHÔNG** tính/hiện hưởng thọ; ô tuổi = "Không rõ"; gắn badge **"Thất lạc"**.
- Vẫn cho xem hậu duệ nếu gia phả có ghi (thất lạc ≠ tuyệt tự).
- `getLifespan` nên nhận biết `isLost` và trả `{ label: "Tình trạng", value: "Thất lạc" }` thay vì nhánh hưởng thọ.

**8.2. Số con: tin RECORD, chú thích mềm, KHÔNG cảnh báo người xem**
- Số con hiển thị + dùng cho cây = **đếm từ `parent_id_temp`** (nguồn sự thật).
- Nếu `details` ghi NHIỀU HƠN record → thêm dòng mềm: **"+N con gái (theo gia phả, chưa có hồ sơ)"** (con gái thường không được chép tiếp).
- Cờ "Cần bổ sung" chỉ bật **MỘT CHIỀU**: `dataQuality.missingSonRecords = (recordSons < sonsText)` — tức gia phả nhắc con trai mà **chưa có hồ sơ** (actionable). Dùng ở màn quản trị / danh sách "Cần bổ sung". **KHÔNG** popup ở giao diện người xem thường.
- **KHÔNG** bật cờ actionable khi `recordSons > sonsText` (vd `ngo-kieu`: record 3 > details 2): đây là do **`details` OCR đếm thiếu** (§3 — details không đáng tin), record mới đúng → không có gì để bổ sung. Nếu muốn lưu lại, dùng cờ riêng **ưu tiên thấp** `dataQuality.detailsCountUnreliable` (tùy chọn), đừng gộp vào `missingSonRecords`.