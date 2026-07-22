# Gia phả dòng họ Ngô

Ứng dụng React/Vite để xem, tra cứu và quản trị dữ liệu gia phả dòng họ Ngô. Giao diện gồm cây phả hệ, danh bạ thành viên, hồ sơ chi tiết, lịch giỗ chạp/sự kiện và mục bài viết tư liệu.

## Công nghệ

- React 18 + Vite
- Tailwind CSS cho design tokens và layout
- D3 cho sơ đồ cây phả hệ
- Supabase cho dữ liệu thành viên, sự kiện, bài viết và storage ảnh

## Cài đặt

```bash
npm install
```

Tạo file `.env` từ `.env.example`, rồi cấu hình các biến frontend:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_EMAIL=admin@example.com
VITE_ADMIN_USERNAME=admin
```

Lưu ý: frontend chỉ nên dùng anon key. Không đưa service role key vào bundle frontend hoặc commit lên repo.

## Scripts

```bash
npm run dev      # chạy Vite dev server
npm run build    # build production
npm run preview  # preview bản build
npm run lint     # sanity check source và cấu trúc project
npm run test     # kiểm chứng nhanh module genealogy
npm run check    # lint + test + build
```

## Cấu trúc chính

- `src/components`: shell, navigation, modal và các component UI dùng chung
- `src/pages`: các màn hình chính như cây phả hệ, danh sách thành viên, hồ sơ, sự kiện, bài viết
- `src/data`: xử lý dữ liệu gia phả, âm lịch, sự kiện và bài viết
- `src/hooks`: hooks cho Supabase members, auth và media query
- `scripts`: script vận hành dữ liệu và sanity check
- `members.json`: dữ liệu gia phả OCR/import ban đầu dùng cho kiểm chứng local

## Kiểm chứng dữ liệu

`npm run test` chạy `src/data/genealogy.test.mjs`, nạp `members.json`, kiểm tra các helper quan trọng như:

- dựng index thành viên và quan hệ cha/con
- tìm kiếm bỏ dấu tiếng Việt
- chuẩn hóa ngày giỗ
- suy luận năm sinh, năm mất, tình trạng thất lạc
- phát hiện hồ sơ cần bổ sung theo số con trai trong gia phả

Script test sẽ trả exit code khác 0 nếu một kiểm chứng thất bại, nên có thể dùng trong CI.

## Ghi chú vận hành

Ứng dụng tải toàn bộ bảng `members` từ Supabase theo phân trang, sau đó dựng index client-side trong `src/data/genealogy.js`. Cách này phù hợp với quy mô vài trăm đến vài nghìn thành viên và giúp thao tác mở nhánh, lọc, tìm kiếm phản hồi nhanh.

Các màn hình chính phụ thuộc vào việc `AppShell` nạp dữ liệu thành công. Khi Supabase đang tải, lỗi hoặc bảng `members` trống, shell sẽ hiển thị trạng thái rõ ràng thay vì render cây rỗng.
