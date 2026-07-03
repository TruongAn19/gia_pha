import { useEffect, useState } from 'react'
import Icon from './ui/Icon'
import Field from './ui/Field'
import { deriveYears, normalizeDeathAnniversary } from '../data/genealogy'

const EMPTY = {
  name: '',
  han_name: '',
  birth_year: '',
  gender: 'Nam',
  status: 'alive', // 'alive' | 'dead_year' (đã mất, biết năm) | 'dead_unknown' (đã mất, chưa rõ năm)
  death_year: '',
  death_anniversary: '',
  grave: '',
  details: '',
}

const STATUS_OPTIONS = [
  { value: 'alive', label: 'Còn sống' },
  { value: 'dead_year', label: 'Đã mất — biết năm mất' },
  { value: 'dead_unknown', label: 'Đã mất — chưa rõ năm' },
]

/**
 * Modal Thêm / Sửa thành viên (frame FVXRc + biến thể Sửa).
 *  - Đời thứ TỰ ĐỘNG KHOÁ = đời cha + 1 (khi có thân phụ).
 *  - Năm sinh + Năm mất; "Năm mất để trống = đang sống" (quyết định trạng thái).
 *
 * props: open, mode 'add'|'edit', parent (mode add), member (mode edit),
 *        onClose, onSubmit(payload)
 */
export default function AddEditModal({ open, mode, parent, member, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY)
  const [err, setErr] = useState('')

  // đời khoá: add -> cha+1 (nếu có cha); edit -> đời hiện tại
  const lockedGen =
    mode === 'add'
      ? parent?.generation != null
        ? parent.generation + 1
        : null
      : (member?.generation ?? null)

  useEffect(() => {
    if (!open) return
    setErr('')
    if (mode === 'edit' && member) {
      // Suy ra năm sinh/mất từ details nếu bản ghi cũ chưa có cột riêng
      const dy = deriveYears(member)
      const da = normalizeDeathAnniversary(member.death_anniversary)
      const deathYear = String(member.death_year || dy.death_lunar_year || '')
      // trạng thái ban đầu: đã mất+có năm / đã mất+chưa rõ năm / còn sống
      const status = dy.isDeceased ? (deathYear ? 'dead_year' : 'dead_unknown') : 'alive'
      setForm({
        name: member.name || '',
        han_name: member.han_name || '',
        birth_year: String(member.birth_year || dy.birth_lunar_year || ''),
        gender: member.gender || (/\bThị\b/i.test(member.name || '') ? 'Nữ' : 'Nam'),
        status,
        death_year: deathYear,
        // điền ngày giỗ dạng gọn (dd-mm) nếu dò được, ngược lại giữ nguyên
        death_anniversary: da?.date || member.death_anniversary || '',
        grave: member.grave || '',
        details: member.details || '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [open, mode, member])

  // đóng bằng Esc
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setErr('Vui lòng nhập Họ và tên.')
      return
    }
    const gen =
      lockedGen != null ? lockedGen : form.__gen ? parseInt(form.__gen, 10) : null
    const deceased = form.status !== 'alive'
    onSubmit({
      name: form.name.trim(),
      han_name: form.han_name.trim() || null,
      generation: gen,
      birth_year: form.birth_year.trim() || null,
      // cờ trạng thái tường minh
      is_deceased: deceased,
      // năm mất chỉ lưu khi "đã mất — biết năm"
      death_year: form.status === 'dead_year' ? form.death_year.trim() || null : null,
      gender: form.gender,
      // giỗ/mộ chỉ áp dụng cho người đã mất
      death_anniversary: deceased ? form.death_anniversary.trim() || null : null,
      grave: deceased ? form.grave.trim() || null : null,
      details: form.details || '',
      ...(mode === 'add' ? { parent_id_temp: parent?.id_temp ?? null } : {}),
    })
  }

  const title = mode === 'add' ? 'Thêm thành viên mới' : 'Chỉnh sửa thành viên'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-card shadow-modal sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thanh kéo (mobile) */}
        <div className="flex justify-center pt-2 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-hairline" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-3 border-b border-hairline px-6 py-4 sm:py-5">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-accent text-fg-inv">
            <Icon name="users" size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="font-heading text-2xl text-fg">{title}</h2>
            <p className="text-sm text-fg-2">
              {mode === 'add'
                ? 'Người con sẽ được nối vào thân phụ đã chọn.'
                : 'Cập nhật thông tin thành viên.'}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-fg-2 hover:bg-muted" aria-label="Đóng">
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Thân cuộn */}
        <form onSubmit={submit} className="gp-scroll flex-1 overflow-y-auto px-6 py-5">
          {/* Banner thân phụ (mode add) */}
          {mode === 'add' && parent && (
            <div className="mb-5 flex flex-wrap items-center gap-3 rounded-card border border-accent/40 bg-muted px-4 py-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-inverse font-han text-fg-inv">
                吳
              </span>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-2">Thêm hậu duệ cho</div>
                <div className="font-medium text-fg">
                  {parent.name} · Đời thứ {parent.generation}
                </div>
              </div>
              <span className="ml-auto rounded-full border border-hairline bg-card px-3 py-1 text-xs text-fg-2">
                ↳ Con thuộc Đời {lockedGen}
              </span>
            </div>
          )}

          {/* THÔNG TIN CƠ BẢN */}
          <SectionLabel>Thông tin cơ bản</SectionLabel>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Họ và tên *" value={form.name} onChange={set('name')} placeholder="Ví dụ: Ngô Bá Đạt" />
            <Field label="Tên Hán tự" value={form.han_name} onChange={set('han_name')} placeholder="吳 …" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Năm sinh" value={form.birth_year} onChange={set('birth_year')} placeholder="Ví dụ: 1850" />
            <Field
              label="Đời thứ (tự động)"
              value={lockedGen != null ? `Đời thứ ${lockedGen}` : 'Chưa rõ (chọn thân phụ)'}
              locked
            />
            <Field
              label="Giới tính"
              as="select"
              value={form.gender}
              onChange={set('gender')}
              options={[{ value: 'Nam', label: 'Nam' }, { value: 'Nữ', label: 'Nữ' }]}
            />
          </div>

          {/* TÌNH TRẠNG */}
          <SectionLabel className="mt-6">Tình trạng</SectionLabel>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {STATUS_OPTIONS.map((o) => {
              const active = form.status === o.value
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, status: o.value }))}
                  className={`flex items-center gap-2 rounded-btn border px-3 py-2.5 text-left text-sm transition ${
                    active ? 'border-accent bg-accent-soft/30 font-medium text-fg' : 'border-hairline bg-card text-fg-2 hover:bg-muted'
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${
                      active ? 'border-accent' : 'border-hairline'
                    }`}
                  >
                    {active && <span className="h-2 w-2 rounded-full bg-accent" />}
                  </span>
                  {o.label}
                </button>
              )
            })}
          </div>

          {/* AN TÁNG & GIỖ CHẠP — chỉ khi đã mất */}
          {form.status !== 'alive' && (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {form.status === 'dead_year' && (
                <Field label="Năm mất" value={form.death_year} onChange={set('death_year')} placeholder="Ví dụ: 1825" />
              )}
              <Field label="Ngày giỗ (Âm lịch)" value={form.death_anniversary} onChange={set('death_anniversary')} placeholder="Ví dụ: 25-08" />
              <Field label="Mộ phần" value={form.grave} onChange={set('grave')} placeholder="Nơi an táng…" />
            </div>
          )}

          {/* TIỂU SỬ */}
          <SectionLabel className="mt-6">Tiểu sử &amp; ghi chú</SectionLabel>
          <div className="mt-3">
            <Field
              as="textarea"
              label=""
              rows={5}
              value={form.details}
              onChange={set('details')}
              placeholder="Tên thụy/tự, công trạng, thông tin phối ngẫu, danh sách các con, nơi an táng…"
            />
          </div>

          {err && <div className="mt-4 rounded-btn bg-danger/10 px-3 py-2 text-sm text-danger">{err}</div>}
        </form>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-hairline px-6 py-4">
          <span className="text-xs text-fg-2">Trường có dấu * là bắt buộc</span>
          <div className="ml-auto flex gap-2">
            <button onClick={onClose} className="rounded-btn border border-hairline px-5 py-2 text-sm font-medium text-fg-2 hover:bg-muted">
              Hủy
            </button>
            <button onClick={submit} className="flex items-center gap-2 rounded-btn bg-accent px-5 py-2 text-sm font-semibold text-fg-inv hover:brightness-110">
              <Icon name="doc" size={16} />
              {mode === 'add' ? 'Lưu thành viên' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children, className = '' }) {
  return (
    <div className={`text-[11px] font-semibold uppercase tracking-[0.14em] text-accent ${className}`}>{children}</div>
  )
}
