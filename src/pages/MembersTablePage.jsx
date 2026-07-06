import { useEffect, useMemo, useState } from 'react'
import {
  allMembers,
  getChildren,
  getChildrenInfo,
  getAncestors,
  searchMembers,
  deriveYears,
  normalizeDeathAnniversary,
} from '../data/genealogy'
import Icon from '../components/ui/Icon'
import Badge from '../components/ui/Badge'
import Pagination from '../components/ui/Pagination'

const PAGE_SIZE = 20

function statusOf(m) {
  const dy = deriveYears(m)
  if (dy.isLost) return 'lost'
  if (dy.isDeceased || dy.death_lunar_year != null || dy.longevity != null) return 'dead'
  return 'alive'
}
const STATUS = {
  alive: { label: 'Đang sống', tone: 'alive' },
  dead: { label: 'Đã mất', tone: 'muted' },
  lost: { label: 'Thất lạc', tone: 'danger' },
}

// lớp chiều rộng cột — dùng chung header và row để thẳng hàng
const COL = {
  name: 'flex min-w-0 flex-1 items-center gap-3',
  gen: 'w-[88px] shrink-0',
  father: 'hidden w-[176px] shrink-0 lg:block',
  giỗ: 'hidden w-[132px] shrink-0 xl:block',
  status: 'w-[120px] shrink-0',
  kids: 'hidden w-[80px] shrink-0 text-center sm:block',
  act: 'flex w-[84px] shrink-0 justify-end gap-1',
}

export default function MembersTablePage({ onOpenProfile, onAdd, onEdit, dataVersion = 0 }) {
  const [q, setQ] = useState('')
  const [genFilter, setGenFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort] = useState('gen')
  const [page, setPage] = useState(1)

  const statusMap = useMemo(() => {
    if (statusFilter === 'all') return null
    const map = new Map()
    for (const m of allMembers()) map.set(m.id_temp, statusOf(m))
    return map
  }, [statusFilter, dataVersion])

  const rows = useMemo(() => {
    const query = q.trim()
    let list = allMembers()
    if (query) {
      const named = new Set(searchMembers(query).map((m) => m.id_temp))
      const isNum = /^\d+$/.test(query)
      list = list.filter((m) => named.has(m.id_temp) || (isNum && String(m.generation) === query))
    }
    if (genFilter !== 'all') list = list.filter((m) => Number(m.generation) === Number(genFilter))
    if (statusFilter !== 'all') list = list.filter((m) => statusMap.get(m.id_temp) === statusFilter)

    const arr = list.slice()
    if (sort === 'name') arr.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    else if (sort === 'children')
      arr.sort((a, b) => getChildren(b.id_temp).length - getChildren(a.id_temp).length)
    else arr.sort((a, b) => (a.generation || 0) - (b.generation || 0) || a.name.localeCompare(b.name, 'vi'))
    return arr
  }, [q, genFilter, statusFilter, sort, statusMap, dataVersion])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  // đổi bộ lọc/tìm kiếm/sắp xếp -> về trang 1
  useEffect(() => setPage(1), [q, genFilter, statusFilter, sort])
  // kẹp trang trong khoảng hợp lệ khi dữ liệu đổi
  useEffect(() => setPage((p) => Math.min(p, pageCount)), [pageCount])

  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex h-full flex-col">
      {/* Header trang */}
      <header className="flex flex-wrap items-start gap-3 px-5 pt-5 md:px-8 md:pt-7">
        <div className="mr-auto">
          <h1 className="font-heading text-2xl text-fg md:text-3xl">Thành viên dòng họ Ngô</h1>
          <p className="mt-1 text-sm text-fg-2">Danh bạ toàn bộ thành viên · tìm kiếm, lọc và sắp xếp</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Icon name="grid" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên, đời…"
              className="w-full rounded-full border border-hairline bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
            />
          </div>
          {onAdd && (
            <button
              onClick={() => onAdd(null)}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-btn bg-accent px-4 py-2 text-sm font-medium text-fg-inv hover:brightness-110"
            >
              <span className="text-base leading-none">+</span>
              <span className="hidden sm:inline">Thêm thành viên</span>
            </button>
          )}
        </div>
      </header>

      {/* Toolbar lọc/sắp xếp */}
      <div className="flex flex-wrap items-center gap-2 px-5 py-4 md:px-8">
        <FilterSelect label="Đời" value={genFilter} onChange={setGenFilter}
          options={[{ value: 'all', label: 'Tất cả' }, ...Array.from({ length: 14 }, (_, i) => ({ value: i + 1, label: `Đời ${i + 1}` }))]} />
        <FilterSelect label="Tình trạng" value={statusFilter} onChange={setStatusFilter}
          options={[{ value: 'all', label: 'Tất cả' }, { value: 'alive', label: 'Đang sống' }, { value: 'dead', label: 'Đã mất' }, { value: 'lost', label: 'Thất lạc' }]} />
        <FilterSelect label="Sắp xếp" value={sort} onChange={setSort}
          options={[{ value: 'gen', label: 'Theo đời' }, { value: 'name', label: 'Theo tên' }, { value: 'children', label: 'Theo số con' }]} />
        <span className="ml-auto text-sm text-fg-2">{rows.length} thành viên</span>
      </div>

      {/* Bảng */}
      <div className="flex min-h-0 flex-1 flex-col px-5 pb-24 md:px-8 md:pb-6">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-card border border-hairline bg-card">
          {/* Header cột */}
          <div className="flex shrink-0 items-center gap-2 border-b border-hairline px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-2">
            <span className={COL.name}>Thành viên</span>
            <span className={COL.gen}>Đời</span>
            <span className={COL.father}>Thân phụ</span>
            <span className={COL.giỗ}>Ngày giỗ</span>
            <span className={COL.status}>Tình trạng</span>
            <span className={COL.kids}>Số con</span>
            <span className={COL.act} />
          </div>

          {/* Danh sách (trang hiện tại) */}
          <div className="gp-scroll min-h-0 flex-1 overflow-y-auto">
            {pageRows.length === 0 ? (
              <div className="p-10 text-center text-sm text-fg-2">Không tìm thấy thành viên phù hợp.</div>
            ) : (
              pageRows.map((m) => (
                <Row
                  key={m.id_temp}
                  m={m}
                  onOpen={() => onOpenProfile?.(m.id_temp)}
                  onEdit={onEdit ? () => onEdit(m) : null}
                />
              ))
            )}
          </div>

          {/* Phân trang */}
          <Pagination page={page} pageCount={pageCount} total={rows.length} unit="thành viên" onChange={setPage} />
        </div>
      </div>
    </div>
  )
}

function Row({ m, onOpen, onEdit }) {
  const father = getAncestors(m.id_temp)[0]
  const da = normalizeDeathAnniversary(m.death_anniversary)
  const st = STATUS[statusOf(m)]
  const ci = getChildrenInfo(m.id_temp)
  const fatherText = m.parent_id_temp == null ? '— (Thủy tổ)' : father ? father.name : '— (chưa rõ)'

  return (
    <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5 hover:bg-muted/50">
      <div className={COL.name}>
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-inverse font-han text-base text-fg-inv">
          吳
        </span>
        <span className="min-w-0">
          <button onClick={onOpen} className="block truncate text-left font-semibold text-fg hover:text-accent">
            {m.name}
          </button>
          {m.han_name ? (
            <span className="block font-han text-sm text-fg-2">{m.han_name}</span>
          ) : (
            <span className="block text-xs italic text-fg-inv-2">Chưa có tên Hán</span>
          )}
        </span>
      </div>
      <div className={COL.gen}>
        <Badge>Đời {m.generation}</Badge>
      </div>
      <div className={`${COL.father} truncate text-sm text-fg-2`}>{fatherText}</div>
      <div className={`${COL.giỗ} text-sm text-fg-2`}>{da ? `${da.date} (ÂL)` : '—'}</div>
      <div className={COL.status}>
        <Badge tone={st.tone} dot>
          {st.label}
        </Badge>
      </div>
      <div className={`${COL.kids} text-sm`}>
        {getChildren(m.id_temp).length > 0 ? (
          <span className="font-medium text-fg">
            {getChildren(m.id_temp).length}
            {ci.daughterNote ? (
              <span className="ml-0.5 text-xs font-normal text-fg-inv-2">+{ci.daughtersText - ci.recordDaughters}</span>
            ) : null}
          </span>
        ) : (
          <span className="italic text-fg-inv-2">Chưa có</span>
        )}
      </div>
      <div className={COL.act}>
        <button onClick={onOpen} className="flex h-8 w-8 items-center justify-center rounded-btn border border-hairline text-fg-2 hover:bg-muted" title="Xem hồ sơ">
          <Icon name="doc" size={15} />
        </button>
        {onEdit && (
          <button onClick={onEdit} className="flex h-8 w-8 items-center justify-center rounded-btn border border-hairline text-fg-2 hover:bg-muted" title="Chỉnh sửa">
            <Icon name="edit" size={15} />
          </button>
        )}
      </div>
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => {
          const v = e.target.value
          onChange(v === 'all' || isNaN(+v) ? v : +v)
        }}
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
