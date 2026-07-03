import { useEffect, useMemo, useRef, useState } from 'react'
import { buildTreeData, normalizeText } from '../lib/treeLayout'

/**
 * Giao diện DANH SÁCH / OUTLINE — tối ưu cho mobile (vuốt dọc 1 ngón).
 *
 * 3 chế độ hiển thị tự động:
 *  - Tìm kiếm có nội dung  -> danh sách phẳng các người khớp tên (toàn bộ đời)
 *  - Lọc theo đời          -> danh sách phẳng tất cả người thuộc đời đó
 *  - Mặc định              -> cây thư mục xổ dọc (bấm để mở/gập nhánh)
 *
 * props: members, isAdmin, searchTerm, generationFilter, onSelect, onEdit, onAdd
 */
export default function MemberList({
  members,
  isAdmin,
  searchTerm,
  generationFilter,
  onSelect,
  onEdit,
  onAdd,
}) {
  const rootData = useMemo(() => buildTreeData(members), [members])
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])

  const [expanded, setExpanded] = useState(() => new Set())
  const initRef = useRef(false)

  // Lần đầu có dữ liệu: mở sẵn các gốc để thấy ngay đời kế tiếp
  useEffect(() => {
    if (!initRef.current && rootData.children.length) {
      initRef.current = true
      setExpanded(new Set(rootData.children.map((r) => r.id)))
    }
  }, [rootData])

  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const mode = searchTerm
    ? 'search'
    : generationFilter !== 'all'
      ? 'gen'
      : 'tree'

  // --- Chế độ cây thư mục: làm phẳng các node đang hiển thị ----------------
  const treeRows = useMemo(() => {
    if (mode !== 'tree') return []
    const out = []
    const walk = (node, depth) => {
      for (const child of node.children) {
        const hasKids = child.children.length > 0
        const isExp = expanded.has(child.id)
        out.push({
          key: child.id,
          member: child.member,
          depth,
          hasChildren: hasKids,
          expanded: isExp,
          childCount: child.children.length,
        })
        if (hasKids && isExp) walk(child, depth + 1)
      }
    }
    walk(rootData, 0)
    return out
  }, [mode, rootData, expanded])

  // --- Chế độ tìm kiếm: danh sách phẳng khớp tên --------------------------
  const searchRows = useMemo(() => {
    if (mode !== 'search') return []
    const t = normalizeText(searchTerm)
    return members
      .filter((m) => normalizeText(m.name).includes(t))
      .sort((a, b) => (a.generation || 0) - (b.generation || 0) || a.name.localeCompare(b.name, 'vi'))
      .map((m) => ({ key: m.id, member: m, depth: 0, hasChildren: false }))
  }, [mode, searchTerm, members])

  // --- Chế độ lọc theo đời: danh sách phẳng cùng đời ----------------------
  const genRows = useMemo(() => {
    if (mode !== 'gen') return []
    return members
      .filter((m) => Number(m.generation) === Number(generationFilter))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      .map((m) => ({ key: m.id, member: m, depth: 0, hasChildren: false }))
  }, [mode, generationFilter, members])

  const rows = mode === 'search' ? searchRows : mode === 'gen' ? genRows : treeRows

  const heading =
    mode === 'search'
      ? `Kết quả tìm: ${rows.length} người`
      : mode === 'gen'
        ? `Đời ${generationFilter}: ${rows.length} người`
        : 'Cây thư mục — bấm để mở/gập nhánh'

  return (
    <div className="flex h-full flex-col bg-gp-cream">
      <div className="border-b border-gp-brown/15 px-4 py-2 text-xs font-medium text-gp-brown/70">
        {heading}
      </div>

      {/* Vùng cuộn dọc — touchAction mặc định cho phép vuốt dọc mượt trên mobile */}
      <div className="gp-scroll flex-1 overflow-y-auto overscroll-contain">
        {rows.length === 0 ? (
          <div className="p-6 text-center text-sm text-gp-brown/60">Không có dữ liệu phù hợp.</div>
        ) : (
          rows.map((r) => (
            <Row
              key={r.key}
              row={r}
              father={r.member.parent_id ? byId.get(r.member.parent_id) : null}
              showFather={mode !== 'tree'}
              isAdmin={isAdmin}
              onSelect={onSelect}
              onEdit={onEdit}
              onAdd={onAdd}
              onToggle={toggle}
            />
          ))
        )}
      </div>
    </div>
  )
}

function Row({ row, father, showFather, isAdmin, onSelect, onEdit, onAdd, onToggle }) {
  const { member, depth, hasChildren, expanded, childCount } = row
  return (
    <div
      className="flex items-center gap-1 border-b border-gp-brown/10 active:bg-gp-gold/10"
      style={{ paddingLeft: 8 + depth * 18 }}
    >
      {/* Chevron mở/gập (chỉ ở chế độ cây) */}
      {hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle(member.id)
          }}
          className="flex h-9 w-7 flex-shrink-0 items-center justify-center text-gp-red"
          title={expanded ? 'Thu gọn' : 'Mở rộng'}
        >
          <span className="text-xs">{expanded ? '▾' : '▸'}</span>
        </button>
      ) : (
        <span className="w-7 flex-shrink-0" />
      )}

      {/* Thân hàng — bấm mở modal */}
      <button
        onClick={() => onSelect(member)}
        className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-2 text-left"
      >
        <span className="min-w-0">
          <span className="text-sm font-semibold text-gp-brown">{member.name}</span>
          <span className="ml-2 text-[11px] text-gp-brown/50">Đời {member.generation}</span>
          {member.death_anniversary && (
            <span className="ml-2 text-[11px] text-gp-brown/60">
              🕯️ {member.death_anniversary}
            </span>
          )}
          {showFather && father && (
            <span className="block text-[11px] text-gp-brown/45">con cụ {father.name}</span>
          )}
        </span>
      </button>

      {/* Số con (chế độ cây) */}
      {hasChildren && (
        <span className="mr-1 flex-shrink-0 rounded-full bg-gp-brown/10 px-1.5 text-[10px] text-gp-brown/60">
          {childCount}
        </span>
      )}

      {/* Nút admin */}
      {isAdmin && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(member)
            }}
            className="flex h-9 w-8 flex-shrink-0 items-center justify-center text-sm"
            title="Sửa"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAdd(member)
            }}
            className="flex h-9 w-8 flex-shrink-0 items-center justify-center text-sm"
            title="Thêm con"
          >
            ➕
          </button>
        </>
      )}
    </div>
  )
}
