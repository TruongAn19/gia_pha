import { deriveYears, getLifespan, normalizeDeathAnniversary } from '../data/genealogy'
import Icon from './ui/Icon'
import Badge from './ui/Badge'

/**
 * Panel hồ sơ xem nhanh bên phải trang Cây gia phả (frame MawBI):
 * monogram 吳 + tên + chip đời/chi nhánh + dòng tóm tắt + vài dòng key/value
 * + Tiểu sử + nút "Xem chi tiết". Dùng genealogy.js.
 *
 * props: member, onClose, onViewDetail(member), onEdit(member), curLunarYear
 */
export default function MemberPreviewPanel({ member, onClose, onViewDetail, onEdit, onAddChild, curLunarYear = 2025 }) {
  if (!member) return null

  const dy = deriveYears(member)
  const life = getLifespan(dy, curLunarYear)
  const da = normalizeDeathAnniversary(member.death_anniversary)
  const deceased = !dy.isLost && (dy.isDeceased || dy.death_lunar_year != null || dy.longevity != null)

  const branch = /con tr[ưươ]ởng|con c[ảa]\b|tr[ưươ]ởng nam/i.test(member.details || '')
    ? 'Dòng trưởng'
    : /con th[ứư]/i.test(member.details || '')
      ? 'Dòng thứ'
      : null

  // Dòng tóm tắt dưới tên (theo trạng thái: Thất lạc › Đã mất › Đang sống)
  let summary
  if (dy.isLost) {
    summary = 'Thất lạc — chưa rõ thông tin'
  } else if (deceased) {
    summary =
      [
        typeof life.value === 'number' ? `${life.label} ${life.value} tuổi` : null,
        dy.death_lunar_year ? `mất năm ${dy.death_lunar_year}` : null,
      ]
        .filter(Boolean)
        .join(' · ') || 'Đã mất · chưa rõ năm'
  } else {
    // đang sống
    summary = typeof life.value === 'number' ? `Đang sống · ${life.value} tuổi` : 'Đang sống'
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-2">
          Hồ sơ thành viên
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-fg-2 hover:bg-muted"
            aria-label="Đóng"
          >
            <Icon name="close" size={18} />
          </button>
        )}
      </div>

      {/* Thân cuộn */}
      <div className="gp-scroll flex-1 overflow-y-auto px-5">
        {/* Monogram + tên */}
        <div className="flex flex-col items-center pt-2 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent font-han text-3xl text-fg-inv">
            吳
          </div>
          <h2 className="mt-3 font-heading text-2xl text-fg">{member.name}</h2>
          {member.han_name && <div className="font-han text-base text-fg-2">{member.han_name}</div>}
          <div className="mt-2">
            <Badge tone="accent-soft">
              Đời thứ {member.generation}
              {branch ? ` · ${branch}` : ''}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-fg-2">{summary}</p>
        </div>

        <hr className="my-4 border-hairline" />

        {/* Key/value gọn (phối ngẫu/số con/mộ phần đã bỏ — xem Tiểu sử ở hồ sơ đầy đủ) */}
        {deceased && (
          <dl className="flex flex-col gap-3">
            <KV icon="flame" label="Ngày giỗ" value={da?.display} fallback="Chưa rõ" />
          </dl>
        )}

        <div className="h-4" />
      </div>

      {/* Footer hành động */}
      <div className="flex items-center gap-2 border-t border-hairline px-5 py-4">
        <button
          onClick={() => onViewDetail?.(member)}
          className="flex flex-1 items-center justify-center gap-2 rounded-btn bg-accent py-2.5 font-medium text-fg-inv transition hover:brightness-110"
        >
          <Icon name="doc" size={18} />
          Xem chi tiết
        </button>
        {onAddChild && (
          <button
            onClick={() => onAddChild(member)}
            className="flex h-11 w-11 items-center justify-center rounded-btn border border-hairline text-fg-2 hover:bg-muted"
            aria-label="Thêm con"
            title="Thêm con"
          >
            <span className="text-lg leading-none">+</span>
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(member)}
            className="flex h-11 w-11 items-center justify-center rounded-btn border border-hairline text-fg-2 hover:bg-muted"
            aria-label="Chỉnh sửa"
          >
            <Icon name="edit" size={18} />
          </button>
        )}
      </div>
    </div>
  )
}

function KV({ icon, label, value, fallback }) {
  const empty = value == null || value === ''
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-sm text-fg-2">
        <Icon name={icon} size={17} className="text-fg-inv-2" />
        {label}
      </span>
      <span className={`text-right text-sm ${empty ? 'italic text-fg-inv-2' : 'font-medium text-fg'}`}>
        {empty ? fallback : value}
      </span>
    </div>
  )
}
