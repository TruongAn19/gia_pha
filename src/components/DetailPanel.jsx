import {
  getAncestors,
  deriveYears,
  getLifespan,
  normalizeDeathAnniversary,
} from '../data/genealogy'
import { currentLunarYear } from '../data/lunar'
import Icon from './ui/Icon'
import EmptyState from './ui/EmptyState'

/**
 * Panel hồ sơ bên phải (frame lxflc / Ms8gu): các thẻ
 *  - Thông tin chung (label/value + fallback "Chưa xác định"/"Chưa áp dụng")
 *  - Quan hệ trực hệ (thân phụ)
 * (Phối ngẫu đã bỏ — thông tin vợ nằm trong Tiểu sử.)
 * Yêu cầu: đã gọi loadMembers() trước đó.
 *
 * props: member (object từ genealogy), curLunarYear (mặc định năm âm lịch hiện tại)
 */
export default function DetailPanel({ member, curLunarYear = currentLunarYear(), onOpenMember }) {
  if (!member) {
    return (
      <div className="rounded-card border border-hairline bg-card p-5">
        <EmptyState icon="users" title="Chưa chọn thành viên" description="Chọn một người để xem hồ sơ." />
      </div>
    )
  }

  const dy = deriveYears(member)
  const life = getLifespan(dy, curLunarYear)
  const da = normalizeDeathAnniversary(member.death_anniversary)
  const father = getAncestors(member.id_temp)[0] || null
  const deceased = !dy.isLost && (dy.isDeceased || dy.death_lunar_year != null || dy.longevity != null)

  const branch = /con tr[ưươ]ởng|con c[ảa]\b|tr[ưươ]ởng nam/i.test(member.details || '')
    ? 'Dòng trưởng'
    : /con th[ứư]/i.test(member.details || '')
      ? 'Dòng thứ'
      : 'Chưa rõ'

  return (
    <div className="flex flex-col gap-4">
      {/* Thông tin chung */}
      <Card title="Thông tin chung" icon="grid">
        <Row label="Đời thứ" value={member.generation != null ? `${member.generation}` : '—'} />
        <Row label="Chi nhánh" value={branch} muted={branch === 'Chưa rõ'} />
        <Row {...rowProps('Ngày giỗ', da?.display, deceased, 'Chưa rõ')} />
        <Row label="Năm sinh" value={dy.birth_lunar_year ?? 'Chưa xác định'} muted={dy.birth_lunar_year == null} />
        <Row
          label="Năm mất"
          value={dy.death_lunar_year ?? (deceased ? 'Chưa xác định' : 'Chưa áp dụng')}
          muted={dy.death_lunar_year == null}
        />
        <Row
          label={life.label}
          value={typeof life.value === 'number' ? `${life.value} tuổi` : life.value}
          muted={typeof life.value !== 'number'}
        />
        {!deceased && !dy.isLost && (
          <div className="mt-3 flex items-start gap-2 rounded-btn bg-muted px-3 py-2.5 text-xs text-fg-2">
            <Icon name="grid" size={14} className="mt-0.5 flex-shrink-0 text-fg-inv-2" />
            Thông tin giỗ chạp chỉ áp dụng cho thành viên đã khuất.
          </div>
        )}
      </Card>

      {/* Quan hệ trực hệ */}
      <Card title="Quan hệ trực hệ" icon="tree">
        {father ? (
          <button
            onClick={() => onOpenMember?.(father.id_temp)}
            className="flex w-full items-center gap-3 rounded-card border border-hairline bg-surface px-3 py-2.5 text-left transition hover:border-accent-soft"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-inverse font-han text-sm text-fg-inv">
              吳
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">Thân phụ</div>
              <div className="truncate text-[15px] text-fg">
                {father.name} · Đời {father.generation}
              </div>
            </div>
            <Icon name="chevron" size={18} className="text-fg-2" />
          </button>
        ) : (
          <div className="py-2 text-[15px] italic text-fg-inv-2">Gốc dòng họ — không có thân phụ trong gia phả.</div>
        )}
      </Card>
    </div>
  )
}

function rowProps(label, value, deceased, fallback) {
  if (value != null && value !== '') return { label, value }
  return { label, value: deceased ? fallback : 'Chưa áp dụng', muted: true }
}

function Card({ title, icon, children }) {
  return (
    <section className="rounded-card border border-hairline bg-card p-5">
      <h3 className="flex items-center gap-2 font-heading text-lg text-fg">
        {icon && <Icon name={icon} size={18} className="text-accent" />}
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Row({ label, value, muted = false }) {
  return (
    <div className="border-t border-hairline py-2.5 first:border-t-0 first:pt-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-2">{label}</div>
      <div className={`mt-0.5 text-[15px] ${muted ? 'italic text-fg-inv-2' : 'text-fg'}`}>{value}</div>
    </div>
  )
}
