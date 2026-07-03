import Icon from './Icon'

/**
 * Trạng thái rỗng (DESIGN_NOTES §5 / frame Ms8gu): icon tròn + tiêu đề + mô tả
 * + nút hành động "+ ...". Dùng cho danh sách con/phối ngẫu rỗng…
 */
export default function EmptyState({
  icon = 'users',
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6' : 'py-10'}`}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-fg-inv-2">
        <Icon name={icon} size={24} />
      </div>
      <div className="mt-3 font-medium text-fg">{title}</div>
      {description && <p className="mt-1 max-w-xs text-sm text-fg-2">{description}</p>}
      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 rounded-btn border border-hairline bg-card px-4 py-2 text-sm font-medium text-accent transition hover:bg-muted"
        >
          <span className="text-base leading-none">+</span>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
