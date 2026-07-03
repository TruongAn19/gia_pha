import Badge from './ui/Badge'
import Icon from './ui/Icon'

/**
 * Một dòng trong outline cây gia phả (frame MawBI / X3Emgp).
 * Thụt lề theo depth · chevron mở/gập · tên · chip "Đời N" · nhãn "Thất lạc".
 *
 * props: member, depth, hasChildren, expanded, active, isLost, meta,
 *        onToggle(member), onSelect(member)
 *   - meta: chuỗi ngày giỗ (+ mộ) hiện kèm icon nến (người đã mất, có ngày)
 */
export default function MemberRow({
  member,
  depth = 0,
  hasChildren = false,
  expanded = false,
  active = false,
  isLost = false,
  meta = null,
  onToggle,
  onSelect,
}) {
  return (
    <div
      className={`flex items-center gap-1 rounded-btn transition ${active ? 'bg-accent-soft/25' : 'hover:bg-muted/60'}`}
      style={{ paddingLeft: 8 + depth * 22 }}
    >
      {hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle?.(member)
          }}
          className={`flex h-9 w-7 flex-shrink-0 items-center justify-center ${active ? 'text-accent' : 'text-fg-2'}`}
          title={expanded ? 'Thu gọn' : 'Mở rộng'}
          aria-label={expanded ? 'Thu gọn' : 'Mở rộng'}
        >
          <Icon name="chevron" size={16} className={expanded ? 'rotate-90' : ''} />
        </button>
      ) : (
        <span className="w-7 flex-shrink-0" />
      )}

      <button
        onClick={() => onSelect?.(member)}
        className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-3 text-left"
      >
        <span className={`flex-shrink-0 truncate ${active ? 'font-bold' : 'font-semibold'} text-fg`}>
          {member.name}
        </span>
        <Badge>Đời {member.generation}</Badge>
        {isLost ? (
          <span className="truncate text-xs italic text-fg-inv-2">Thất lạc — chưa rõ thông tin</span>
        ) : meta ? (
          <span className="flex min-w-0 items-center gap-1 truncate text-xs text-fg-2">
            <Icon name="flame" size={13} className="flex-shrink-0 text-accent-soft" />
            <span className="truncate">{meta}</span>
          </span>
        ) : null}
      </button>
    </div>
  )
}
