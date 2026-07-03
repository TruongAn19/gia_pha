import { useEffect, useMemo, useRef, useState } from 'react'
import members from '../../members.json'
import { loadMembers } from '../data/genealogy'
import { buildAgenda, solarToLunar } from '../data/events'
import { fmtSolar, weekdayName } from '../data/lunar'
import Icon from '../components/ui/Icon'
import Pagination from '../components/ui/Pagination'
import AddEventModal from '../components/AddEventModal'

loadMembers(members) // idempotent

const PAGE_SIZE = 6
const KIND = {
  ancestor: { label: 'Giỗ Tổ (đời đầu)', dot: 'bg-amber-500' },
  king: { label: 'Giỗ Vua Ngô Quyền', dot: 'bg-red-600' },
  thanhminh: { label: 'Tết Thanh Minh', dot: 'bg-emerald-500' },
  event: { label: 'Sự kiện dòng họ', dot: 'bg-sky-500' },
}
const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function metaOf(it) {
  if (it.kind === 'event') return [it.category || 'Sự kiện họ', it.place].filter(Boolean).join(' · ')
  if (it.kind === 'ancestor') return `Thủy tổ · Đời ${it.generation}`
  return it.subtitle || ''
}

export default function EventsPage({ onOpenProfile, canEdit = false, dataVersion = 0 }) {
  const today = useMemo(() => new Date(), [])
  const [bump, setBump] = useState(0)
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)

  const [selectedId, setSelectedId] = useState(null)
  const bannerRef = useRef(null)

  const agenda = useMemo(() => buildAgenda(today), [today, bump, dataVersion])
  const nearest = agenda[0] || null
  // Banner hiển thị dịp đang chọn (mặc định = gần nhất)
  const featured = agenda.find((a) => a.id === selectedId) || nearest

  const pageCount = Math.max(1, Math.ceil(agenda.length / PAGE_SIZE))
  useEffect(() => setPage((p) => Math.min(p, pageCount)), [pageCount])
  const pageRows = agenda.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Lịch tháng: mặc định nhảy tới tháng có giỗ gần nhất
  const [view, setView] = useState(() => {
    const d = agenda[0]?.solar || new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const shiftMonth = (delta) =>
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })

  // Bấm 1 dịp -> banner + lịch tháng nhảy theo dịp đó
  const selectEvent = (it) => {
    setSelectedId(it.id)
    setView({ y: it.solar.getFullYear(), m: it.solar.getMonth() })
    bannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const tl = solarToLunar(today)
  const isNearest = featured && nearest && featured.id === nearest.id

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex flex-wrap items-start gap-3 px-5 pt-5 md:px-8 md:pt-7">
        <div className="mr-auto">
          <h1 className="font-heading text-2xl text-fg md:text-3xl">Sự kiện &amp; Giỗ chạp</h1>
          <p className="mt-1 text-sm text-fg-2">Lịch giỗ chạp và sự kiện dòng họ · tính theo âm lịch</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-hairline bg-card px-3 py-1.5 text-xs text-fg-2 sm:flex">
            <Icon name="clock" size={14} /> Hôm nay · {fmtSolar(today)} ({tl.day}/{tl.month} ÂL)
          </span>
          {canEdit && (
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-btn bg-accent px-4 py-2 text-sm font-medium text-fg-inv hover:brightness-110"
            >
              <Icon name="plus" size={16} /> <span className="hidden sm:inline">Thêm sự kiện</span>
            </button>
          )}
        </div>
      </header>

      <div className="gp-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-24 pt-4 md:px-8 md:pb-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          {/* Cột trái */}
          <div className="min-w-0 space-y-5">
            {/* Giỗ nổi bật */}
            {featured && (
              <div ref={bannerRef} className="scroll-mt-4 overflow-hidden rounded-card bg-inverse p-5 text-fg-inv md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300">
                    <Icon name="flame" size={13} /> {isNearest ? 'Sắp tới gần nhất' : 'Đang xem'}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                    {featured.days <= 0 ? 'Hôm nay' : `Còn ${featured.days} ngày`}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white/10 font-han text-2xl">
                    吳
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-heading text-xl md:text-2xl">{featured.title}</h2>
                    <p className="mt-1 text-sm text-fg-inv-2">
                      {metaOf(featured)}
                      {featured.solarTerm
                        ? ' · Tiết Thanh Minh'
                        : ` · Ngày ${featured.lunar.day} tháng ${featured.lunar.month} (Âm lịch)`}{' '}
                      · ≈ {weekdayName(featured.solar)}, {fmtSolar(featured.solar)}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <ReminderButton item={featured} inverse />
                  {featured.memberId && (
                    <button
                      onClick={() => onOpenProfile?.(featured.memberId)}
                      className="rounded-btn bg-white px-4 py-2 text-sm font-medium text-fg hover:brightness-95"
                    >
                      Xem hồ sơ
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Lịch sắp tới */}
            <div className="overflow-hidden rounded-card border border-hairline bg-card">
              <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
                <span className="flex items-center gap-2 font-heading text-lg text-fg">
                  <Icon name="calendar" size={18} className="text-accent" /> Danh sách sự kiện &amp; giỗ
                </span>
                <span className="text-xs text-fg-2">{agenda.length} dịp</span>
              </div>
              {pageRows.length === 0 ? (
                <div className="p-10 text-center text-sm text-fg-2">Chưa có sự kiện nào.</div>
              ) : (
                pageRows.map((it) => (
                  <AgendaRow
                    key={it.id}
                    it={it}
                    selected={featured && it.id === featured.id}
                    nearest={nearest && it.id === nearest.id}
                    onSelect={() => selectEvent(it)}
                  />
                ))
              )}
              <Pagination page={page} pageCount={pageCount} total={agenda.length} unit="dịp" onChange={setPage} />
            </div>
          </div>

          {/* Cột phải: lịch tháng + chú thích */}
          <div className="space-y-5">
            <CalendarCard
              view={view}
              onShift={shiftMonth}
              agenda={agenda}
              today={today}
              onPick={selectEvent}
              selectedId={featured?.id}
            />
            <Legend />
          </div>
        </div>
      </div>

      <AddEventModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={() => {
          setAddOpen(false)
          setBump((b) => b + 1)
        }}
      />
    </div>
  )
}

function AgendaRow({ it, onSelect, selected = false, nearest = false }) {
  const k = KIND[it.kind]
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect?.())}
      className={`flex cursor-pointer items-center gap-3 border-b border-hairline px-4 py-3 last:border-b-0 hover:bg-muted/50 ${
        selected ? 'bg-accent/5 ring-1 ring-inset ring-accent/40' : ''
      }`}
    >
      <span className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-btn bg-muted">
        <span className="text-base font-bold leading-none text-fg">{it.badge.big}</span>
        <span className="mt-0.5 text-[10px] leading-none text-fg-2">{it.badge.small}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-semibold text-fg">{it.title}</span>
          {nearest && (
            <span className="flex-shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-fg-inv">Gần nhất</span>
          )}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-fg-2">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${k.dot}`} />
          {metaOf(it)} · ≈ {fmtSolar(it.solar)}
        </span>
      </span>
      <span className="flex flex-shrink-0 items-center gap-2">
        <span className="hidden text-xs text-fg-2 sm:inline">{it.days <= 0 ? 'Hôm nay' : `còn ${it.days} ngày`}</span>
        <ReminderButton item={it} />
      </span>
    </div>
  )
}

// "Nhắc tôi" — tạo file .ics tải về (nhắc lịch trên máy người dùng)
function ReminderButton({ item, inverse = false }) {
  const download = () => {
    const d = item.solar
    const p = (n) => String(n).padStart(2, '0')
    const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Gia pha Ngo toc//VN',
      'BEGIN:VEVENT',
      `UID:${item.id}@giapha`,
      `DTSTART;VALUE=DATE:${stamp}`,
      `SUMMARY:${item.title}`,
      `DESCRIPTION:${metaOf(item)} (${item.lunar.day}/${item.lunar.month} ÂL)`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${item.title}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        download()
      }}
      title="Nhắc tôi (tải lịch .ics)"
      className={
        inverse
          ? 'flex items-center gap-1.5 rounded-btn border border-white/25 px-4 py-2 text-sm font-medium hover:bg-white/10'
          : 'flex h-8 w-8 items-center justify-center rounded-btn border border-hairline text-fg-2 hover:bg-muted'
      }
    >
      <Icon name="bell" size={inverse ? 16 : 15} />
      {inverse && 'Nhắc tôi'}
    </button>
  )
}

function CalendarCard({ view, onShift, agenda, today, onPick, selectedId }) {
  const { y, m } = view
  const first = new Date(y, m, 1)
  const startOffset = (first.getDay() + 6) % 7 // thứ 2 đầu tuần
  const daysInMonth = new Date(y, m + 1, 0).getDate()

  // đánh dấu ngày có sự kiện trong tháng đang xem
  const marks = new Map() // day -> kind (ưu tiên ancestor)
  const dayItem = new Map() // day -> item (để bấm chọn)
  const monthItems = []
  for (const it of agenda) {
    if (it.solar.getFullYear() === y && it.solar.getMonth() === m) {
      const day = it.solar.getDate()
      const cur = marks.get(day)
      if (!cur || it.kind === 'ancestor') marks.set(day, it.kind)
      if (!dayItem.has(day)) dayItem.set(day, it)
      monthItems.push(it)
    }
  }
  monthItems.sort((a, b) => a.solar - b.solar)
  const isToday = (d) => today.getFullYear() === y && today.getMonth() === m && today.getDate() === d

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="rounded-card border border-hairline bg-card p-4">
      <div className="flex items-center justify-between">
        <button onClick={() => onShift(-1)} className="flex h-8 w-8 items-center justify-center rounded-btn border border-hairline text-fg-2 hover:bg-muted">
          <Icon name="chevron" size={16} className="rotate-180" />
        </button>
        <span className="font-heading text-base text-fg">Tháng {m + 1} · {y}</span>
        <button onClick={() => onShift(1)} className="flex h-8 w-8 items-center justify-center rounded-btn border border-hairline text-fg-2 hover:bg-muted">
          <Icon name="chevron" size={16} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-fg-2">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1">{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((d, i) => {
          if (d == null) return <span key={`e${i}`} />
          const kind = marks.get(d)
          const it = dayItem.get(d)
          const isSel = it && it.id === selectedId
          const cls = `relative flex h-9 items-center justify-center rounded-btn ${
            isToday(d)
              ? 'bg-accent font-semibold text-fg-inv'
              : isSel
                ? 'bg-accent/15 font-semibold text-fg ring-1 ring-inset ring-accent/50'
                : kind
                  ? 'bg-muted font-medium text-fg'
                  : 'text-fg-2'
          }`
          const dot = kind && !isToday(d) && <span className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${KIND[kind].dot}`} />
          return it ? (
            <button key={d} onClick={() => onPick?.(it)} title={it.title} className={`${cls} cursor-pointer hover:brightness-95`}>
              {d}
              {dot}
            </button>
          ) : (
            <span key={d} className={cls}>
              {d}
              {dot}
            </span>
          )
        })}
      </div>

      {monthItems.length > 0 && (
        <div className="mt-3 space-y-1 border-t border-hairline pt-3 text-xs text-fg-2">
          {monthItems.slice(0, 4).map((it) => (
            <button key={it.id} onClick={() => onPick?.(it)} className="flex w-full items-center gap-1.5 text-left hover:text-fg">
              <span className={`inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${KIND[it.kind].dot}`} />
              <span className="truncate">
                {fmtSolar(it.solar).slice(0, 5)}: {it.title} ({it.lunar.day}/{it.lunar.month} ÂL)
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Legend() {
  return (
    <div className="rounded-card border border-hairline bg-card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-2">Chú thích</div>
      <div className="mt-3 space-y-2 text-sm text-fg">
        {Object.values(KIND).map((k) => (
          <div key={k.label} className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${k.dot}`} />
            {k.label}
          </div>
        ))}
      </div>
      <p className="mt-3 border-t border-hairline pt-3 text-xs text-fg-2">
        Ngày giỗ tính theo âm lịch, tự động quy đổi sang dương lịch mỗi năm.
      </p>
    </div>
  )
}
