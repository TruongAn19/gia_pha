// Cấu hình điều hướng dùng chung cho Sidebar (desktop) và BottomTabBar (mobile).
// key giống nhau giữa 2 nơi để đồng bộ trạng thái active.

// Sidebar (desktop) — 6 mục theo thiết kế Y3sP8
export const SIDEBAR_NAV = [
  { key: 'overview', label: 'Tổng quan', icon: 'grid' },
  { key: 'tree', label: 'Cây gia phả', icon: 'tree' },
  { key: 'members', label: 'Thành viên', icon: 'users' },
  { key: 'events', label: 'Sự kiện & Giỗ', icon: 'calendar' },
  { key: 'history', label: 'Lịch sử dòng họ', icon: 'book' },
  { key: 'missing', label: 'Cần bổ sung', icon: 'alert' },
]

// BottomTabBar (mobile) — 4 tab theo thiết kế X3Emgp ("Cây gia phả" -> "Phả hệ")
export const TAB_NAV = [
  { key: 'overview', label: 'Tổng quan', icon: 'home' },
  { key: 'tree', label: 'Phả hệ', icon: 'tree' },
  { key: 'members', label: 'Thành viên', icon: 'users' },
  { key: 'events', label: 'Sự kiện', icon: 'calendar' },
]

export const NAV_TITLE = {
  overview: 'Tổng quan',
  tree: 'Cây gia phả',
  members: 'Thành viên',
  events: 'Sự kiện & Giỗ',
  history: 'Lịch sử dòng họ',
  missing: 'Cần bổ sung',
}
