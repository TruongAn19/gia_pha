import {
  byId,
  getChildren,
  getChildrenInfo,
  getLifespan,
  parseDetails,
  deriveYears,
  normalizeDeathAnniversary,
} from '../data/genealogy'
import Icon from '../components/ui/Icon'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import DetailPanel from '../components/DetailPanel'

const isDaughter = (m) => /\bThị\b/i.test(m.name || '')
const branchOf = (text) =>
  /con tr[ưươ]ởng|con c[ảa]\b|tr[ưươ]ởng nam/i.test(text || '')
    ? 'Dòng trưởng'
    : /con th[ứư]/i.test(text || '')
      ? 'Dòng thứ'
      : null

/**
 * Hồ sơ thành viên đầy đủ (frame lxflc + biến thể đang sống Ms8gu).
 * props: memberId, onBack, onOpenProfile(id), curLunarYear
 */
export default function ProfilePage({ memberId, onBack, onOpenProfile, onEdit, onAdd, onViewOnTree, curLunarYear = 2025 }) {
  const m = byId(memberId)
  if (!m) {
    return (
      <div className="flex h-full items-center justify-center text-fg-2">Không tìm thấy thành viên.</div>
    )
  }

  const dy = deriveYears(m)
  const life = getLifespan(dy, curLunarYear)
  const da = normalizeDeathAnniversary(m.death_anniversary)
  const parsed = parseDetails(m.details)
  const ci = getChildrenInfo(memberId)
  const deceased = !dy.isLost && (dy.isDeceased || dy.death_lunar_year != null || dy.longevity != null)
  const branch = branchOf(m.details)

  const kids = getChildren(memberId)
  const sons = kids.filter((k) => !isDaughter(k))
  const daughters = kids.filter(isDaughter)

  // chips hero
  const chips = []
  if (branch) chips.push(<Badge key="b" tone="accent-soft">{branch === 'Dòng trưởng' ? 'Con trưởng' : 'Con thứ'}</Badge>)
  if (dy.isLost) chips.push(<Badge key="s" tone="danger">Thất lạc</Badge>)
  else if (deceased)
    chips.push(
      <Badge key="s" tone="muted">
        {typeof life.value === 'number' ? `Hưởng thọ ${life.value} tuổi` : 'Đã mất'}
      </Badge>
    )
  else {
    chips.push(<Badge key="s" tone="alive" dot>Đang sống</Badge>)
    if (typeof life.value === 'number') chips.push(<Badge key="a" tone="muted">{life.value} tuổi</Badge>)
  }

  // stat cards theo trạng thái
  const stats = deceased
    ? [
        { icon: 'flame', label: 'Ngày giỗ', ...val(da?.display, 'Chưa rõ') },
        { icon: 'doc', label: 'Năm mất', ...val(dy.death_lunar_year, 'Chưa xác định') },
      ]
    : [
        { icon: 'doc', label: 'Năm sinh', ...val(dy.birth_lunar_year, 'Chưa xác định') },
        {
          icon: 'heart',
          label: 'Tình trạng',
          value: dy.isLost ? 'Thất lạc' : 'Đang sống',
          tone: dy.isLost ? 'muted' : 'alive',
        },
      ]

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-hairline px-5 py-3 md:px-8">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-fg-2 hover:text-fg">
          <span className="flex h-8 w-8 items-center justify-center rounded-btn border border-hairline">
            <Icon name="chevron" size={16} className="rotate-180" />
          </span>
          <span className="hidden sm:inline">Cây gia phả</span>
        </button>
        <span className="text-fg-inv-2">›</span>
        <span className="text-sm font-medium text-fg">Hồ sơ thành viên</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="hidden items-center gap-2 rounded-btn border border-hairline px-3 py-2 text-sm text-fg-2 hover:bg-muted sm:flex"
          >
            <Icon name="doc" size={16} /> In hồ sơ
          </button>
          {onEdit && (
            <button onClick={() => onEdit(m)} className="flex items-center gap-2 rounded-btn bg-accent px-4 py-2 text-sm font-medium text-fg-inv hover:brightness-110">
              <Icon name="edit" size={16} /> Chỉnh sửa
            </button>
          )}
        </div>
      </div>

      {/* Nội dung cuộn (chừa đáy cho tab bar mobile) */}
      <div className="gp-scroll min-h-0 flex-1 overflow-y-auto px-5 py-6 pb-28 md:px-8 lg:pb-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 lg:flex-row">
          {/* Cột trái */}
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            {/* Hero */}
            <div className="flex items-start gap-5 rounded-card border border-hairline bg-card p-6">
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-inverse font-han text-3xl text-fg-inv">
                吳
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                  Đời thứ {m.generation}
                  {branch ? ` · ${branch}` : ''}
                </div>
                <h1 className="mt-1 font-heading text-4xl leading-tight text-fg">{m.name}</h1>
                {m.han_name ? (
                  <div className="font-han text-xl text-fg-2">{m.han_name}</div>
                ) : (
                  <div className="text-sm italic text-fg-inv-2">
                    Tên Hán tự chưa cập nhật <button className="not-italic text-accent">+ Thêm</button>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">{chips}</div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="flex flex-col gap-4 sm:flex-row">
              {stats.map((s) => (
                <StatCard key={s.label} {...s} />
              ))}
            </div>

            {/* Tiểu sử */}
            {m.details && (
              <SectionCard title="Tiểu sử" icon="doc">
                <div className="font-serif text-[20px] leading-[1.8] text-fg">
                  {m.details.split('\n').map((line, i) => (
                    <p key={i} className="mb-3 last:mb-0">
                      {line}
                    </p>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Hậu duệ */}
            <SectionCard
              title="Hậu duệ"
              icon="users"
              right={ci.recordCount > 0 ? `${ci.recordCount} người con · Đời thứ ${(m.generation ?? 0) + 1}` : 'Chưa có'}
            >
              {ci.recordCount === 0 && !ci.daughterNote ? (
                <EmptyState
                  icon="users"
                  title="Chưa có người con nào được ghi nhận"
                  description="Khi thành viên có con cháu, hãy bổ sung để nối tiếp phả hệ dòng họ."
                  actionLabel={onAdd ? 'Thêm người con' : undefined}
                  onAction={onAdd ? () => onAdd(m) : undefined}
                />
              ) : (
                <div className="flex flex-col gap-4">
                  {sons.length > 0 && (
                    <div>
                      <SubLabel>Con trai — kế tự</SubLabel>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {sons.map((s) => (
                          <button
                            key={s.id_temp}
                            onClick={() => onOpenProfile?.(s.id_temp)}
                            className="flex items-center gap-3 rounded-card border border-hairline bg-surface px-3 py-2.5 text-left transition hover:border-accent-soft"
                          >
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-han text-sm text-fg-inv">
                              吳
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium text-fg">{s.name}</span>
                              <span className="text-xs text-fg-2">Đời thứ {s.generation}</span>
                            </span>
                            <Icon name="chevron" size={16} className="text-fg-2" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {(daughters.length > 0 || ci.daughterNote) && (
                    <div>
                      <SubLabel>Con gái — xuất giá</SubLabel>
                      <div className="flex flex-wrap gap-2">
                        {daughters.map((d) => (
                          <span key={d.id_temp} className="rounded-full bg-muted px-3 py-1 text-sm text-fg-2">
                            {d.name}
                          </span>
                        ))}
                      </div>
                      {ci.daughterNote && <p className="mt-2 text-xs italic text-fg-inv-2">{ci.daughterNote}</p>}
                    </div>
                  )}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Cột phải: DetailPanel (3 thẻ) */}
          <aside className="w-full flex-shrink-0 lg:w-[340px]">
            <DetailPanel member={m} curLunarYear={curLunarYear} onOpenMember={onOpenProfile} />
          </aside>
        </div>

        {/* CTA mobile: xem trên cây */}
        <button
          onClick={() => onViewOnTree?.(memberId)}
          className="mx-auto mt-5 flex w-full max-w-6xl items-center justify-center gap-2 rounded-btn bg-accent py-3 font-semibold text-fg-inv hover:brightness-110 lg:hidden"
        >
          <Icon name="tree" size={18} /> Xem trên cây gia phả
        </button>
      </div>
    </div>
  )
}

function val(value, fallback) {
  const empty = value == null || value === ''
  return { value: empty ? fallback : value, tone: empty ? 'muted' : undefined }
}

function StatCard({ icon, label, value, tone }) {
  return (
    <div className="flex-1 rounded-card border border-hairline bg-card p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-2">
        <Icon name={icon} size={15} /> {label}
      </div>
      <div
        className={`mt-1.5 text-lg ${
          tone === 'alive' ? 'text-alive-fg' : tone === 'muted' ? 'italic text-fg-inv-2' : 'text-fg'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function SectionCard({ title, icon, right, children }) {
  return (
    <section className="rounded-card border border-hairline bg-card p-6">
      <div className="flex items-center gap-2">
        <h2 className="flex items-center gap-2 font-heading text-xl text-fg">
          {icon && <Icon name={icon} size={18} className="text-accent" />}
          {title}
        </h2>
        {right && <span className="ml-auto text-sm text-fg-2">{right}</span>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function SubLabel({ children }) {
  return (
    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-2">{children}</div>
  )
}
