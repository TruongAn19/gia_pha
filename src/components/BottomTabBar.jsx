import Icon from './ui/Icon'
import { TAB_NAV } from './nav'

/**
 * Thanh tab dưới (mobile) — thiết kế X3Emgp.
 * Thẻ trắng bo góc + đổ bóng (một trong số ít chỗ dùng shadow). Tab active nền tan.
 */
export default function BottomTabBar({ active, onNavigate }) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-card bg-card px-2 py-2 shadow-tabbar">
      {TAB_NAV.map((tab) => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            onClick={() => onNavigate(tab.key)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-btn py-1.5 text-[11px] transition ${
              isActive ? 'bg-accent-soft/40 font-semibold text-accent' : 'text-fg-2'
            }`}
          >
            <Icon name={tab.icon} size={22} strokeWidth={isActive ? 2 : 1.7} />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
