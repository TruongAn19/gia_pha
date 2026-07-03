import { useEffect, useState } from 'react'

const EMPTY = {
  name: '',
  han_name: '',
  generation: '',
  death_anniversary: '',
  grave: '',
  details: '',
  photo_url: '',
}

/**
 * Drawer quản trị trượt từ phải. 2 chế độ: 'add' (thêm con) và 'edit' (sửa).
 *
 * props:
 *  - open: boolean
 *  - mode: 'add' | 'edit'
 *  - member: object|null         (mode edit: dữ liệu hiện tại)
 *  - parent: object|null         (mode add: cha đã chọn)
 *  - onClose()
 *  - onSave(payload)             -> Promise   (insert hoặc update)
 *  - onDelete(id)                -> Promise   (chỉ mode edit)
 *  - uploadAvatar(file)          -> Promise<url>
 */
export default function AdminPanel({
  open,
  mode,
  member,
  parent,
  onClose,
  onSave,
  onDelete,
  onAfterAdd,
  uploadAvatar,
}) {
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const [saved, setSaved] = useState(false) // hiện "✓ Đã lưu" sau khi lưu thành công

  // Nạp dữ liệu mỗi khi mở / đổi mode / đổi đối tượng
  useEffect(() => {
    if (!open) return
    setErr('')
    setConfirmDel(false)
    setSaved(false)
    if (mode === 'edit' && member) {
      setForm({
        name: member.name || '',
        han_name: member.han_name || '',
        generation: member.generation ?? '',
        death_anniversary: member.death_anniversary || '',
        grave: member.grave || '',
        details: member.details || '',
        photo_url: member.photo_url || '',
      })
    } else if (mode === 'add') {
      setForm({
        ...EMPTY,
        // đời con = đời cha + 1 (nếu biết)
        generation: parent?.generation != null ? parent.generation + 1 : '',
      })
    }
  }, [open, mode, member, parent])

  // Khi người dùng bắt đầu sửa lại thì ẩn thông báo "Đã lưu"
  const setField = (k) => (e) => {
    setSaved(false)
    setForm((f) => ({ ...f, [k]: e.target.value }))
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setErr('')
    try {
      const url = await uploadAvatar(file)
      setForm((f) => ({ ...f, photo_url: url }))
    } catch (e2) {
      setErr('Upload ảnh thất bại: ' + (e2.message || e2))
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setErr('')
    if (!form.name.trim()) {
      setErr('Họ tên là bắt buộc')
      return
    }
    setBusy(true)
    try {
      // Chuẩn hoá payload: chuỗi rỗng -> null, generation -> int|null
      const payload = {
        name: form.name.trim(),
        han_name: form.han_name.trim() || null,
        generation:
          form.generation === '' || form.generation === null
            ? null
            : parseInt(form.generation, 10),
        death_anniversary: form.death_anniversary.trim() || null,
        grave: form.grave.trim() || null,
        details: form.details || null,
        photo_url: form.photo_url || null,
      }
      if (mode === 'add') {
        payload.parent_id = parent?.id || null
      }
      const savedMember = await onSave(payload)
      setSaved(true)
      // KHÔNG đóng drawer nữa (giữ chỗ đang sửa). Nếu vừa THÊM thì chuyển panel
      // sang chế độ SỬA người vừa tạo để lần lưu sau là cập nhật, không tạo trùng.
      if (mode === 'add' && savedMember && onAfterAdd) {
        onAfterAdd(savedMember)
      }
    } catch (e2) {
      setErr('Lưu thất bại: ' + (e2.message || e2))
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    setBusy(true)
    setErr('')
    try {
      await onDelete(member.id)
      onClose()
    } catch (e2) {
      setErr('Xoá thất bại: ' + (e2.message || e2))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* Lớp phủ mờ khi drawer mở */}
      {open && <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />}

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md transform flex-col border-l-2 border-gp-gold bg-gp-cream shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Header drawer */}
        <div className="flex items-center justify-between bg-gp-red px-5 py-4 text-gp-cream">
          <h2 className="text-lg font-bold text-gp-gold">
            {mode === 'add' ? 'Thêm thành viên' : 'Chỉnh sửa thành viên'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/20"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {mode === 'add' && parent && (
          <div className="bg-gp-gold/20 px-5 py-2 text-sm text-gp-brown">
            Thêm con cho: <span className="font-semibold">{parent.name}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="gp-scroll flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <Field label="Họ tên *">
            <input
              value={form.name}
              onChange={setField('name')}
              className="gp-input"
              placeholder="Ngô Văn A"
              required
            />
          </Field>

          <Field label="Tên chữ Hán">
            <input
              value={form.han_name}
              onChange={setField('han_name')}
              className="gp-input"
              placeholder="吴文 A"
            />
          </Field>

          <Field label="Đời thứ *">
            <input
              type="number"
              value={form.generation}
              onChange={setField('generation')}
              className="gp-input"
              min="1"
              max="30"
            />
          </Field>

          <Field label="Ngày giỗ">
            <input
              value={form.death_anniversary}
              onChange={setField('death_anniversary')}
              className="gp-input"
              placeholder="19 tháng Giêng (Âm lịch)"
            />
          </Field>

          <Field label="Nơi để mộ">
            <input
              value={form.grave}
              onChange={setField('grave')}
              className="gp-input"
              placeholder="Xứ Đồng Chua…"
            />
          </Field>

          <Field label="Chi tiết (chánh thất, các con, tiểu sử…)">
            <textarea
              value={form.details}
              onChange={setField('details')}
              rows={8}
              className="gp-input resize-y"
              placeholder="Nhập tự do, xuống dòng tuỳ ý…"
            />
          </Field>

          <Field label="Ảnh chân dung">
            <div className="flex items-center gap-3">
              {form.photo_url && (
                <img
                  src={form.photo_url}
                  alt="avatar"
                  className="h-14 w-14 rounded-full border border-gp-brown/40 object-cover"
                />
              )}
              <input type="file" accept="image/*" onChange={handleUpload} className="text-xs" />
              {uploading && <span className="text-xs text-gp-brown">Đang tải…</span>}
            </div>
          </Field>

          {err && <div className="rounded bg-red-100 px-3 py-2 text-sm text-gp-red">{err}</div>}
        </form>

        {/* Footer hành động */}
        <div className="space-y-2 border-t border-gp-brown/20 px-5 py-4">
          {saved && (
            <div className="flex items-center justify-between rounded bg-green-100 px-3 py-2 text-sm text-green-700">
              <span>✓ Đã lưu</span>
              <button onClick={onClose} className="font-medium underline">
                Đóng
              </button>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={busy}
            className="w-full rounded bg-gp-red py-2 font-semibold text-gp-gold transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? 'Đang lưu…' : saved ? 'Lưu lại' : 'Lưu'}
          </button>

          {mode === 'edit' && (
            <>
              {!confirmDel ? (
                <button
                  onClick={() => setConfirmDel(true)}
                  disabled={busy}
                  className="w-full rounded border border-red-600 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Xóa thành viên
                </button>
              ) : (
                <div className="rounded border border-red-600 bg-red-50 p-3 text-sm">
                  <div className="mb-2 text-red-700">
                    Xoá <b>{member?.name}</b>? Các con (nếu có) sẽ được gỡ liên kết cha.
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      disabled={busy}
                      className="flex-1 rounded bg-red-600 py-1.5 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      Xác nhận xóa
                    </button>
                    <button
                      onClick={() => setConfirmDel(false)}
                      className="flex-1 rounded border border-gp-brown/40 py-1.5"
                    >
                      Huỷ
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* style helper cho input (đặt inline để khỏi tách file css) */}
      <style>{`
        .gp-input {
          width: 100%;
          border: 1px solid rgba(139,69,19,0.4);
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 14px;
          background: #fff;
        }
        .gp-input:focus { outline: none; border-color: #C0392B; }
      `}</style>
    </>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gp-brown">{label}</span>
      {children}
    </label>
  )
}
