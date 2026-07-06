import { useEffect, useMemo, useState } from 'react'
import {
  allMembers,
  byId,
  getChildren,
  getAncestors,
  getRoots,
  groupByGeneration,
  normalizeDeathAnniversary,
  parseDetails,
  deriveYears,
} from '../data/genealogy'
import Icon from '../components/ui/Icon'
import MemberRow from '../components/MemberRow'
import MemberPreviewPanel from '../components/MemberPreviewPanel'
import TreeDiagram from '../components/TreeDiagram'
import MobileLineage from '../components/MobileLineage'
import { useMediaQuery } from '../hooks/useMediaQuery'

// ---- helpers ----
function statusOf(m) {
  const dy = deriveYears(m)
  if (dy.isLost) return 'lost'
  if (dy.isDeceased || dy.death_lunar_year != null || dy.longevity != null) return 'dead'
  return 'alive'
}
function rowMeta(m) {
  const da = normalizeDeathAnniversary(m.death_anniversary)
  if (!da) return null
  return da.note ? `${da.display} · ${da.note}` : da.display
}
const hasKids = (id) => getChildren(id).length > 0

// dựng danh sách node ĐANG HIỂN THỊ (lazy: chỉ đệ quy vào nhánh đã mở)
function buildVisible(rootIds, expanded) {
  const out = []
  const walk = (id, depth) => {
    const m = byId(id)
    if (!m) return
    out.push({ m, depth, hasChildren: hasKids(id), open: expanded.has(id) })
    if (expanded.has(id)) for (const k of getChildren(id)) walk(k.id_temp, depth + 1)
  }
  rootIds.forEach((r) => walk(r, 0))
  return out
}

export default function TreeListPage({ onOpenProfile, onAdd, onEdit, focusId, dataVersion = 0 }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [mode, setMode] = useState('diagram') // mặc định: Sơ đồ
  const rootIds = useMemo(() => getRoots().roots.map((r) => r.id_temp), [dataVersion])
  const total = allMembers().length
  const genCount = useMemo(
    () => [...groupByGeneration().keys()].filter((g) => g != null).length,
    [dataVersion]
  )

  // node chọn sẵn: focusId (từ "Xem trên cây") -> thành viên đầu tiên (thủy tổ)
  const initId = (focusId && byId(focusId) && focusId) || rootIds[0]
  const [selectedId, setSelectedId] = useState(initId)
  const [expanded, setExpanded] = useState(() => {
    const s = new Set(rootIds)
    if (byId(initId)) {
      s.add(initId)
      getAncestors(initId).forEach((a) => s.add(a.id_temp))
    }
    return s
  })

  useEffect(() => {
    const fallbackId = rootIds[0]
    if (!fallbackId) return
    if (!selectedId || !byId(selectedId)) {
      setSelectedId(fallbackId)
      setExpanded((prev) => new Set([...prev, fallbackId]))
    }
  }, [rootIds, selectedId])

  const [genFilter, setGenFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const filtering = genFilter !== 'all' || statusFilter !== 'all'

  // "Xem trên cây" (focusId đổi): chọn + mở nhánh tới người đó (instance bền vững)
  useEffect(() => {
    if (focusId && byId(focusId)) {
      setSelectedId(focusId)
      setExpanded((prev) => {
        const s = new Set(prev)
        s.add(focusId)
        getAncestors(focusId).forEach((a) => s.add(a.id_temp))
        return s
      })
    }
  }, [focusId])

  const toggleId = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const toggle = (m) => toggleId(m.id_temp)
  const expandAll = () =>
    setExpanded(new Set(allMembers().filter((m) => hasKids(m.id_temp)).map((m) => m.id_temp)))
  const collapseAll = () => setExpanded(new Set())

  // Bấm 1 dòng: desktop -> chọn (hiện panel phải); mobile -> mở thẳng hồ sơ
  const selectRow = (id) => (isDesktop ? setSelectedId(id) : onOpenProfile?.(id))

  // dữ liệu hiển thị: lọc -> danh sách phẳng; không lọc -> outline lazy
  const flatList = useMemo(() => {
    if (!filtering) return null
    let list = allMembers()
    if (genFilter !== 'all') list = list.filter((m) => Number(m.generation) === Number(genFilter))
    if (statusFilter !== 'all') list = list.filter((m) => statusOf(m) === statusFilter)
    return list
      .slice()
      .sort((a, b) => (a.generation || 0) - (b.generation || 0) || a.name.localeCompare(b.name, 'vi'))
  }, [filtering, genFilter, statusFilter, dataVersion])

  const visible = useMemo(
    () => (filtering ? null : buildVisible(rootIds, expanded)),
    [filtering, rootIds, expanded, dataVersion]
  )
  const resultCount = filtering ? flatList.length : total

  const selected = selectedId ? byId(selectedId) : null

  return (
    <div className="flex h-full flex-col">
      {/* Header trang */}
      <header className="px-5 pt-5 md:px-8 md:pt-7">
        <h1 className="font-heading text-2xl text-fg md:text-3xl">Cây gia phả dòng họ Ngô</h1>
        <p className="mt-1 text-sm text-fg-2">
          Chế độ {mode === 'list' ? 'danh sách' : 'sơ đồ'} · {total} thành viên · {genCount} đời đã ghi nhận
        </p>
      </header>

      {/* Thanh công cụ */}
      <div className="flex flex-wrap items-center gap-2 px-5 py-4 md:px-8">
        {/* Toggle Sơ đồ / Danh sách */}
        <div className="flex rounded-btn bg-muted p-1">
          <ToggleBtn icon="tree" label="Sơ đồ" active={mode === 'diagram'} onClick={() => setMode('diagram')} />
          <ToggleBtn icon="grid" label="Danh sách" active={mode === 'list'} onClick={() => setMode('list')} />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Đời"
            value={genFilter}
            onChange={setGenFilter}
            options={[{ value: 'all', label: 'Tất cả' }, ...Array.from({ length: 14 }, (_, i) => ({ value: i + 1, label: `Đời ${i + 1}` }))]}
          />
          <FilterSelect
            label="Tình trạng"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'Tất cả' },
              { value: 'alive', label: 'Đang sống' },
              { value: 'dead', label: 'Đã mất' },
              { value: 'lost', label: 'Thất lạc' },
            ]}
          />
          <span className="text-sm text-fg-2">{resultCount} kết quả</span>
        </div>
      </div>

      {/* Vùng giữa: nội dung (Sơ đồ hoặc Danh sách) + panel — chừa đáy cho tab bar mobile */}
      <div className="flex min-h-0 flex-1 gap-5 px-5 pb-24 md:px-8 md:pb-5">
        {mode === 'diagram' ? (
          /* ===== SƠ ĐỒ ===== desktop: cây ngang d3 · mobile: dòng trực hệ dọc */
          isDesktop ? (
            <TreeDiagram
              expanded={expanded}
              selectedId={selectedId}
              onToggle={toggleId}
              onSelect={setSelectedId}
            />
          ) : (
            <MobileLineage
              focusId={selectedId}
              onFocus={setSelectedId}
              onOpenProfile={(id) => onOpenProfile?.(id)}
            />
          )
        ) : (
          /* ===== DANH SÁCH (outline) ===== */
          <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-card border border-hairline bg-card">
            <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5 text-sm text-fg-2">
              <Icon name="tree" size={16} />
              <span className="hidden sm:inline">Bấm mũi tên để mở / gập từng nhánh</span>
              {!filtering && (
                <div className="ml-auto flex items-center gap-3">
                  <button onClick={collapseAll} className="hover:text-fg">Thu gọn tất cả</button>
                  <button onClick={expandAll} className="hover:text-fg">Mở tất cả</button>
                </div>
              )}
            </div>
            <div className="gp-scroll min-h-0 flex-1 overflow-y-auto p-2">
              {filtering ? (
                flatList.length === 0 ? (
                  <div className="p-8 text-center text-sm text-fg-2">Không có thành viên phù hợp bộ lọc.</div>
                ) : (
                  flatList.map((m) => (
                    <MemberRow
                      key={m.id_temp}
                      member={m}
                      depth={0}
                      active={m.id_temp === selectedId}
                      isLost={statusOf(m) === 'lost'}
                      meta={rowMeta(m)}
                      onSelect={() => selectRow(m.id_temp)}
                    />
                  ))
                )
              ) : (
                visible.map(({ m, depth, hasChildren, open }) => (
                  <MemberRow
                    key={m.id_temp}
                    member={m}
                    depth={depth}
                    hasChildren={hasChildren}
                    expanded={open}
                    active={m.id_temp === selectedId}
                    isLost={parseDetails(m.details).isLost}
                    meta={rowMeta(m)}
                    onToggle={toggle}
                    onSelect={() => selectRow(m.id_temp)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Panel hồ sơ phải — cả 2 chế độ (chỉ desktop ≥lg) */}
        {selected && (
          <aside className="hidden w-[360px] flex-shrink-0 rounded-card border border-hairline bg-card lg:block">
            <MemberPreviewPanel
              member={selected}
              onClose={() => setSelectedId(null)}
              onViewDetail={(mem) => onOpenProfile?.(mem.id_temp)}
              onEdit={onEdit ? (mem) => onEdit(mem) : undefined}
              onAddChild={onAdd ? (mem) => onAdd(mem) : undefined}
            />
          </aside>
        )}
      </div>
    </div>
  )
}

function ToggleBtn({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-btn px-4 py-2 text-sm transition ${
        active ? 'bg-card font-semibold text-fg shadow-sm' : 'text-fg-2 hover:text-fg'
      }`}
    >
      <Icon name={icon} size={18} />
      {label}
    </button>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value === 'all' ? 'all' : isNaN(+e.target.value) ? e.target.value : +e.target.value)}
        className="appearance-none rounded-full border border-hairline bg-card py-1.5 pl-3 pr-8 text-sm text-fg outline-none focus:border-accent"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {label}: {o.label}
          </option>
        ))}
      </select>
      <Icon name="chevron" size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-fg-2" />
    </div>
  )
}
