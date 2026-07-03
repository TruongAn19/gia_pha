import Icon from './ui/Icon'
import { SIDEBAR_NAV } from './nav'

/**
 * Sidebar điều hướng (desktop). Có thể THU GỌN thành rail chỉ-icon.
 * props: active, onNavigate, badges, isAdmin, onLogout, collapsed, onToggleCollapse
 */
export default function Sidebar({
  active,
  onNavigate,
  badges = {},
  isAdmin = false,
  onLogout,
  collapsed = false,
  onToggleCollapse,
}) {
  const items = SIDEBAR_NAV.filter((i) => i.key !== 'missing' || isAdmin)

  return (
    <aside
      className={`flex h-full flex-col bg-inverse py-5 text-fg-inv transition-[width] duration-200 ${
        collapsed ? 'w-[76px] items-center px-3' : 'w-64 px-4'
      }`}
    >
      {/* Brand + nút thu gọn */}
      <div className={`flex w-full items-center pb-6 ${collapsed ? 'flex-col gap-3' : 'gap-3 px-2'}`}>
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-accent font-han text-xl text-fg-inv">
          吳
        </div>
        {!collapsed && (
          <div className="mr-auto leading-tight">
            <div className="font-heading text-xl">Gia Phả</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-fg-inv-2">Ngô Tộc</div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-btn text-fg-inv-2 transition hover:bg-white/10 hover:text-fg-inv"
        >
          <Icon name="panel" size={18} className={collapsed ? '-scale-x-100' : ''} />
        </button>
      </div>

      {!collapsed && (
        <div className="px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-fg-inv-2">
          Điều hướng
        </div>
      )}

      <nav className="mt-2 flex w-full flex-col gap-1">
        {items.map((item) => {
          const isActive = item.key === active
          const badge = badges[item.key] > 0 ? badges[item.key] : null
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              title={collapsed ? item.label : undefined}
              className={`relative flex items-center rounded-btn transition ${
                collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5 text-[15px]'
              } ${isActive ? 'bg-accent font-semibold text-fg-inv' : 'text-fg-inv/85 hover:bg-white/5'}`}
            >
              <Icon name={item.icon} size={20} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && badge && (
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isActive ? 'bg-fg-inv/20 text-fg-inv' : 'bg-accent text-fg-inv'
                  }`}
                >
                  {badge}
                </span>
              )}
              {collapsed && badge && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent ring-2 ring-inverse" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Đáy: đăng xuất (admin) / nhãn tĩnh (người xem) */}
      {isAdmin ? (
        <button
          onClick={onLogout}
          title="Đăng xuất"
          className={`mt-auto flex items-center rounded-card bg-white/5 transition hover:bg-white/10 ${
            collapsed ? 'w-11 justify-center p-2.5' : 'w-full gap-3 px-3 py-3 text-left'
          }`}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent font-han text-fg-inv">
            吳
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-sm font-medium text-fg-inv">Quản trị viên</div>
                <div className="truncate text-xs text-fg-inv-2">Nhấn để đăng xuất</div>
              </div>
              <Icon name="close" size={18} className="text-fg-inv-2" />
            </>
          )}
        </button>
      ) : (
        <div
          className={`mt-auto flex items-center rounded-card bg-white/5 ${
            collapsed ? 'w-11 justify-center p-2.5' : 'w-full gap-3 px-3 py-3'
          }`}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted font-han text-fg">
            吳
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-medium text-fg-inv">Gia tộc họ Ngô</div>
              <div className="truncate text-xs text-fg-inv-2">Phú Cốc · Hưng Yên</div>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
