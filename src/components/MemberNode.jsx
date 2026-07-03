import { NODE_W, NODE_H } from '../lib/treeLayout'

/**
 * Một ô người trên cây. Render bên trong <foreignObject> của SVG.
 *
 * props:
 *  - node: {id, member, hasChildren, collapsed, childCount}
 *  - isAdmin
 *  - isHighlighted   (khớp tìm kiếm)
 *  - isDimmed        (không thuộc đời đang lọc)
 *  - showToggle      (hiện nút mở/gập nhánh)
 *  - onSelect(member)
 *  - onEdit(member)
 *  - onAdd(member)
 *  - onToggle(id)
 */
export default function MemberNode({
  node,
  isAdmin,
  isHighlighted,
  isDimmed,
  showToggle,
  onSelect,
  onEdit,
  onAdd,
  onToggle,
}) {
  const { member } = node

  return (
    <div
      className="relative select-none"
      style={{ width: NODE_W, height: NODE_H, opacity: isDimmed ? 0.25 : 1 }}
    >
      {/* Thân ô — bấm mở modal */}
      <button
        onClick={() => onSelect(member)}
        className="group flex h-full w-full flex-col items-center justify-center rounded px-2 text-center shadow-node transition"
        style={{
          background: '#C0392B',
          color: '#F0C040',
          border: isHighlighted ? '2px solid #fff' : '1px solid #F0C040',
          boxShadow: isHighlighted
            ? '0 0 0 3px rgba(240,192,64,0.9), 0 2px 6px rgba(0,0,0,0.3)'
            : undefined,
        }}
        title={member.name}
      >
        <span className="line-clamp-2 text-[13px] font-bold leading-tight">{member.name}</span>
        {member.generation != null && (
          <span className="text-[10px] text-gp-gold/70">Đời {member.generation}</span>
        )}
        {member.death_anniversary && (
          <span className="mt-0.5 flex items-center gap-0.5 text-[9px] text-gp-gold/80">
            <span aria-hidden>🕯️</span>
            <span className="max-w-[120px] truncate">{member.death_anniversary}</span>
          </span>
        )}
      </button>

      {/* Nút admin: sửa (góc trên phải) */}
      {isAdmin && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit(member)
          }}
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-gp-brown bg-gp-cream text-xs shadow hover:bg-white"
          title="Sửa thông tin"
        >
          ✏️
        </button>
      )}

      {/* Nút admin: thêm con (góc dưới giữa) */}
      {isAdmin && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAdd(member)
          }}
          className="absolute -bottom-2 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-gp-brown bg-gp-cream text-xs shadow hover:bg-white"
          title="Thêm con"
        >
          ➕
        </button>
      )}

      {/* Nút mở/gập nhánh (chế độ thu gọn) */}
      {showToggle && node.hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle(node.id)
          }}
          className="absolute -bottom-3 right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border border-gp-gold bg-gp-brown px-1 text-[10px] font-bold text-gp-gold shadow hover:brightness-110"
          title={node.collapsed ? 'Mở rộng nhánh' : 'Thu gọn nhánh'}
        >
          {node.collapsed ? `+${node.childCount}` : '−'}
        </button>
      )}
    </div>
  )
}
