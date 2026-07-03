// Bộ icon line tối giản (inline SVG) — không thêm thư viện ngoài.
// stroke = currentColor để theo màu chữ; dùng cho Sidebar + BottomTabBar.

const PATHS = {
  // Tổng quan (lưới)
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  // Cây gia phả / Phả hệ (sơ đồ nhánh)
  tree: (
    <>
      <rect x="9" y="3" width="6" height="5" rx="1.5" />
      <rect x="3" y="16" width="6" height="5" rx="1.5" />
      <rect x="15" y="16" width="6" height="5" rx="1.5" />
      <path d="M12 8v4M6 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
    </>
  ),
  // Thành viên (nhóm người)
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.4M17.5 20a5.2 5.2 0 0 0-3-4.7" />
    </>
  ),
  // Sự kiện & Giỗ (lịch)
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </>
  ),
  // Album ảnh
  images: (
    <>
      <rect x="6" y="6" width="15" height="12" rx="2.5" />
      <path d="M6 6 4 8v9a2 2 0 0 0 2 2h11" opacity="0.6" />
      <circle cx="11" cy="10.5" r="1.5" />
      <path d="m9 16 3.5-3.5L21 18" />
    </>
  ),
  // Lịch sử dòng họ (sách mở)
  book: (
    <>
      <path d="M12 6.5C10.5 5 8 4.5 4 5v13c4-.5 6.5 0 8 1.5 1.5-1.5 4-2 8-1.5V5c-4-.5-6.5 0-8 1.5Z" />
      <path d="M12 6.5v13" />
    </>
  ),
  // Trang chủ (mobile Tổng quan)
  home: (
    <>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  // Ngày giỗ (nến/lửa)
  flame: (
    <>
      <path d="M12 3c2.2 2.8 3.6 4.6 3.6 6.9a3.6 3.6 0 0 1-7.2 0c0-1.2.5-2.3 1.4-3.4" />
      <path d="M12 13.5c.9.9 1.3 1.7 1.3 2.5a1.3 1.3 0 0 1-2.6 0c0-.5.2-1 .6-1.5" opacity="0.7" />
    </>
  ),
  // Mộ phần
  pin: (
    <>
      <path d="M12 21s6-5 6-10a6 6 0 0 0-12 0c0 5 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.2" />
    </>
  ),
  heart: <path d="M12 20s-7-4.6-7-9.6A3.9 3.9 0 0 1 12 7a3.9 3.9 0 0 1 7-2.6c0 5-7 9.6-7 9.6Z" />,
  // Xem chi tiết (văn bản)
  doc: (
    <>
      <path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </>
  ),
  edit: <path d="M14 5.5 18.5 10 8 20.5l-4.5 1 1-4.5L14 5.5ZM13 6.5 17.5 11" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  // Số đời (lớp chồng)
  layers: (
    <>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="M3 12l9 5 9-5M3 16l9 5 9-5" opacity="0.7" />
    </>
  ),
  // Năm truyền thừa (đồng hồ cát)
  hourglass: <path d="M6 3h12M6 21h12M8 3v3.5l4 3.5 4-3.5V3M8 21v-3.5l4-3.5 4 3.5V21" />,
  // Liệt sỹ (khiên)
  shield: <path d="M12 3 5 6v5.5c0 4 3 6.8 7 8 4-1.2 7-4 7-8V6l-7-3Z" />,
  // Cảnh báo / cần bổ sung
  alert: (
    <>
      <path d="M12 3.2 2.6 20h18.8L12 3.2Z" />
      <path d="M12 9.5v4.5M12 17h.01" />
    </>
  ),
  // Nút đóng/mở thanh bên (panel-left) — ô vuông bo góc + cột trái
  panel: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="M8.75 4.5v15" />
      <rect x="4.6" y="6.3" width="2.3" height="11.4" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  // Chevron phải
  chevron: <path d="m9 6 6 6-6 6" />,
  // Chuông nhắc
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 1.5 6.5 1.5 6.5h-15S6 14 6 9Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  // Tìm kiếm
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  // Chia sẻ
  share: (
    <>
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="18" cy="6" r="2.4" />
      <circle cx="18" cy="18" r="2.4" />
      <path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" />
    </>
  ),
  // Nhãn/chuyên mục
  tag: (
    <>
      <path d="M3.5 12.5 11 5h6a2 2 0 0 1 2 2v6l-7.5 7.5a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8Z" />
      <circle cx="15" cy="9" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  // Đồng hồ
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  // Dấu cộng
  plus: <path d="M12 5v14M5 12h14" />,
  // Mở rộng (toàn màn)
  expand: <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />,
}

export default function Icon({ name, size = 22, className = '', strokeWidth = 1.7 }) {
  const inner = PATHS[name]
  if (!inner) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {inner}
    </svg>
  )
}
