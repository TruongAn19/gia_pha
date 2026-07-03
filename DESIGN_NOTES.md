# DESIGN_NOTES — UI (Bước 2)

> Nguồn thiết kế: **`pencil-new.pen`** (Pencil MCP). Đọc thẳng frame qua
> `get_editor_state` → `export_html` / `export_nodes` theo **id** hoặc **tên frame** bên dưới.
> ĐỪNG đoán/chế lại UI — bám sát thiết kế. Logic dữ liệu xem `DATA_NOTES.md` + dùng `src/data/genealogy.js`.

## 1. Design tokens (set CSS variables / Tailwind theme)

**Màu**
```
surface          #F5F2E9   nền trang
surface-card     #FFFFFF   thẻ/panel
surface-inverse  #2D2926   sidebar tối, monogram
surface-muted    #EDE9DC   chip/nền phụ, hover
fg               #2D2926   chữ chính
fg-secondary     #5E5954   chữ phụ
fg-inverse       #F5F2E9   chữ trên nền tối
fg-inverse-muted #A8A296   chữ mờ / placeholder / "Chưa xác định"
border           #DCD8CB   viền hairline
accent           #7D6B3D   nâu vàng — hành động chính + thương hiệu
accent-soft      #C4BCA6   đường nối cây, avatar phụ
danger           #9B4A3A   xoá / cảnh báo
(xanh "còn sống": #3E6B4F nền #E4EDE5 / chữ #2F5640)
```

**Font** — Playfair Display (tiêu đề) · Inter (nội dung) · Noto Serif SC (chữ Hán 吳/吴伯达).
**Bo góc** — thẻ 12–16 · nút/ô input 8 · chip/pill = nửa chiều cao. **Hầu như không dùng shadow** (trừ tab bar mobile + modal).

## 2. Component dùng lại (đã có trong file → tách thành React component)

| Component | id | Vai trò |
|---|---|---|
| **Sidebar** | `Y3sP8` | Điều hướng desktop; mục active đổi theo trang |
| **Thẻ thành viên** | `QkSvr` | Card node trên cây Sơ đồ (avatar 吳 + tên + giỗ) |
| **Field** | `LDeTr` | Ô nhập form (label + box; biến thể select/locked) |
| **Mobile Status Bar** | `lUnpd` | Thanh giờ/pin trên cùng các màn mobile |

Nên tách thêm (ad-hoc trong thiết kế): `Badge`/chip đời, `EmptyState`, `MemberRow` (outline), `DetailPanel` (panel hồ sơ phải), `BottomTabBar`, `BottomSheet`.

## 3. Bản đồ màn hình (tên frame chính xác để export)

### Desktop
| Tên frame | id | Mục đích | Dùng data (genealogy.js) |
|---|---|---|---|
| `Gia Phả - Tổng quan` | `Qz5jt` | Trang chủ/landing: hero + thống kê + **"Phần mở đầu"** (lời tựa) + **"Bài văn tế Tiên Tổ"** (canh giữa, trang trọng) | thống kê tổng hợp; **toàn văn lời tựa + văn tế ở `foreword.md`** (nguyên văn), render `white-space: pre-line` |
| `Gia Phả - Cây gia phả (Sơ đồ)` | `bi8Au` | Cây phả hệ đồ hoạ + panel hồ sơ phải; có bộ chuyển Sơ đồ/Danh sách | `getRoots`, `getChildren`, `byId`, `getLifespan` |
| `Gia Phả - Cây gia phả (Danh sách)` | `MawBI` | Outline mở/gập theo nhánh + panel hồ sơ phải | `getChildren` (lazy), `getAncestors`, `byId` |
| `Gia Phả - Thành viên (Bảng)` | `mbtMN` | Danh bạ phẳng: tìm kiếm/lọc/sắp xếp + bảng + **phân trang** (20 dòng/trang · 487 · 25 trang) | `searchMembers`, `groupByGeneration`, `getChildrenInfo`; phân trang client hoặc server-side |
| `Gia Phả - Hồ sơ thành viên` | `lxflc` | Hồ sơ người đã mất (Ngô Bá Đạt) | `byId`, `getLifespan`, `getChildrenInfo`, `getAncestors`, `parseDetails` |
| `Gia Phả - Hồ sơ (Đang sống)` | `Ms8gu` | Hồ sơ người đang sống + trạng thái rỗng ("Chưa áp dụng"/empty) | như trên |
| `Gia Phả - Bài viết & Tư liệu` | `kdOii` | Danh sách bài viết (bài ghim + lưới thẻ có ảnh bìa); dùng nav "Lịch sử dòng họ"; nút **"Đăng bài" chỉ admin** | nội dung bài viết (bảng riêng, KHÔNG từ members.json) |
| `Gia Phả - Đăng bài viết` | `jHYff` | **Trình soạn thảo (admin)**: ảnh bìa + tiêu đề + toolbar định dạng + nội dung; panel xuất bản (trạng thái Nháp/Công khai · chuyên mục · ảnh) | tạo bài viết |
| `Gia Phả - Chi tiết bài viết` | `NU6t2` | **Trang đọc bài viết** (cột 760px, serif): ảnh bìa · nhãn · tiêu đề · meta · lead · nội dung + tiểu mục + trích dẫn + ảnh tư liệu · hộp tác giả · bài viết khác | 1 bài viết |
| `Gia Phả - Sự kiện & Giỗ` | `N0sc7` | Lịch giỗ chạp & sự kiện (agenda): thẻ giỗ gần nhất + "Lịch sắp tới" + lịch tháng (dương, chấm ngày giỗ) + chú thích | tổng hợp `death_anniversary` (âm→dương qua lib âm lịch), sort theo "còn N ngày"; Giỗ Tổ ưu tiên |
| `Gia Phả - Modal Lời tựa` | `T6hguV` | Modal đọc **toàn văn lời tựa** (nền Tổng quan mờ, thân cuộn `clip`) | nội dung từ `foreword.md` |
| `Gia Phả - Modal Thêm thành viên` | `FVXRc` | Form thêm (chọn thân phụ trên cây → Đời tự động khoá, ô Năm sinh) | `byId` (thân phụ), tạo bản ghi |
| `Gia Phả - Modal Chỉnh sửa` | `bbDv0` | Form sửa (điền sẵn; Năm sinh/Năm mất có thể "Chưa xác định") | `byId` |

### Mobile (390px)
| Tên frame | id | Mục đích |
|---|---|---|
| `Mobile - Tổng quan` | `m7ajU4` | Hero + thống kê 2×2 + "Phần mở đầu" + bottom tab bar |
| `Mobile - Cây gia phả (Danh sách)` | `X3Emgp` | Outline + bottom tab bar |
| `Mobile - Cây gia phả (Sơ đồ)` | `uvJKT` | Lineage dọc (gốc→nhánh→người chọn) + tab bar |
| `Mobile - Hồ sơ thành viên` | `ZfAu0` | Hồ sơ cuộn dọc + CTA "Xem trên cây" |
| `Mobile - Thêm thành viên` | `BIUUu` | Bottom sheet form (trên nền danh sách mờ) |
| `Mobile - Chỉnh sửa thành viên` | `V8plF` | Bottom sheet form, điền sẵn |
| `Mobile - Lời tựa (toàn văn)` | `f88Az` | Trang đọc toàn màn (app bar back/share + thân cuộn); nội dung từ `foreword.md` |

> Chưa có trong thiết kế (dựng mới khi tới): **Màn "Cần bổ sung"** (dùng `dataQuality.missingSonRecords`, 20 thành viên) · Mobile cho tab Thành viên/Tổng quan.

## 4. Quy tắc UX phải giữ (chốt ở các bước trước)

- **Bộ chuyển chế độ `Sơ đồ / Danh sách`** thuộc trang **Cây gia phả** (KHÔNG có "Theo đời"). Hai chế độ **dùng chung khung** (header + bộ chuyển + panel hồ sơ phải), chỉ khác phần giữa.
- **Tìm kiếm + nút "Thêm thành viên"** chỉ ở trang **Thành viên** (đã bỏ khỏi trang Cây gia phả).
- **Thêm thành viên**: chọn thân phụ **trên cây** rồi bấm thêm → popup hiện sẵn thân phụ, **Đời thứ tự động khoá** (đời cha +1). Form có ô **Năm sinh** (mục Thông tin cơ bản) và ô **Năm mất** (mục An táng & Giỗ chạp). **Năm mất để trống = đang sống** → quyết định trạng thái & cách hiển thị tuổi/hưởng thọ (xem DATA_NOTES §4).
- **Tuổi/Hưởng thọ**: theo `getLifespan` (âm lịch, tuổi ta). Thiếu năm → "Chưa xác định".
- **Trạng thái** ưu tiên: **Thất lạc** › Đã mất › Đang sống (xem DATA_NOTES §8.1).
- **Trạng thái rỗng**: "Chưa áp dụng" (giỗ/mộ người sống) · "Chưa cập nhật/Chưa rõ" + nút **+ Thêm** · empty state cho danh sách rỗng · "Chưa có" thay vì "0".
- **Monogram** luôn dùng chữ họ **吳** (vì 481/487 thiếu Hán tự).
- **Bài viết & Tư liệu**: chỉ **admin** được đăng/sửa (nút "Đăng bài", trình soạn thảo). Thành viên thường chỉ đọc. Bài viết là **nội dung riêng** (tiêu đề, ảnh bìa, nội dung, chuyên mục, tác giả, ngày, trạng thái Nháp/Công khai) — KHÔNG lấy từ `members.json`.
- **Hồ sơ — mục "Tiểu sử"** (đồng bộ theo code `ProfilePage.jsx`): hiển thị `details` **NGUYÊN VĂN**, chữ thường (font body), `white-space: pre-line` để giữ ngắt dòng. **KHÔNG diễn giải/tóm tắt/thêm chữ** (xem DATA_NOTES §3). *(Trước đây dùng khối "Ghi chép trong gia phả" serif — đã bỏ.)*
- **Hồ sơ — bố cục (khớp code):** cột trái = Hero + **2 thẻ thống kê** (đã mất: Ngày giỗ · Năm mất; đang sống: Năm sinh · Tình trạng) + Tiểu sử + Hậu duệ. Cột phải (`DetailPanel`) = **2 thẻ**: Thông tin chung (Đời · Chi nhánh · Ngày giỗ · Năm sinh · Năm mất · Hưởng thọ/Tuổi; đang sống thêm ghi chú "giỗ chạp chỉ áp dụng người đã khuất") + Quan hệ trực hệ (thân phụ). **KHÔNG có thẻ Phối ngẫu, KHÔNG có dòng Mộ phần** (thông tin vợ/mộ nằm trong Tiểu sử).

## 5. Thứ tự dựng đề xuất

1. **Tokens + khung chung**: CSS variables/Tailwind, layout Sidebar + content, `BottomTabBar` (mobile).
2. **Component nền**: `MemberRow`, `Badge`, `EmptyState`, `Field`, `DetailPanel`.
3. **Cây gia phả — Danh sách (outline)** `MawBI` — trung tâm điều hướng, test **lazy-expand** với 487 node.
4. **Hồ sơ thành viên** `lxflc` (+ biến thể đang sống `Ms8gu`) — mở từ outline/panel.
5. **Thành viên (Bảng)** `mbtMN` — virtualize + tìm kiếm bỏ dấu.
6. **Modal Thêm/Sửa** `FVXRc` / `tJlEd`.
7. **Cây gia phả — Sơ đồ** `bi8Au` — KHÓ NHẤT (vẽ đường nối). Cân nhắc `d3-hierarchy`/`react-flow`; lazy theo nhánh.
8. **Responsive mobile** — theo 5 frame `Mobile - …`.
9. **Màn "Cần bổ sung"** (admin) — dùng cờ chất lượng dữ liệu.

> Sau MỖI màn: chạy app cho chủ dự án xem rồi mới đi tiếp. Bám design tokens, không tự chế màu.