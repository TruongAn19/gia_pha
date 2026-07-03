import { useEffect, useState } from 'react'
import Icon from './ui/Icon'
import { addEvent } from '../data/events'

const CATEGORIES = ['Sự kiện họ', 'Giỗ chạp', 'Họp mặt', 'Khánh thành', 'Khác']
const monthLabel = (m) => (m === 1 ? 'Giêng' : m === 12 ? 'Chạp' : `Tháng ${m}`)

const EMPTY = { title: '', category: 'Sự kiện họ', place: '', lunarDay: 1, lunarMonth: 1 }

export default function AddEventModal({ open, onClose, onSubmit }) {
  const [f, setF] = useState(EMPTY)
  useEffect(() => {
    if (open) setF(EMPTY)
  }, [open])
  if (!open) return null

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const submit = (e) => {
    e.preventDefault()
    if (!f.title.trim()) return
    addEvent(f)
    onSubmit?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-t-card bg-card p-5 shadow-xl sm:rounded-card"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl text-fg">Thêm sự kiện dòng họ</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-btn text-fg-2 hover:bg-muted">
            <Icon name="close" size={18} />
          </button>
        </div>
        <p className="mt-1 text-xs text-fg-2">Nhập ngày theo âm lịch — hệ thống tự quy đổi dương lịch mỗi năm.</p>

        <label className="mt-4 block text-sm font-medium text-fg">Tên sự kiện</label>
        <input
          value={f.title}
          onChange={set('title')}
          autoFocus
          placeholder="VD: Họp mặt dòng họ đầu xuân"
          className="mt-1 w-full rounded-btn border border-hairline bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-fg">Ngày (ÂL)</label>
            <select value={f.lunarDay} onChange={set('lunarDay')} className="mt-1 w-full rounded-btn border border-hairline bg-surface px-3 py-2 text-sm outline-none focus:border-accent">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-fg">Tháng (ÂL)</label>
            <select value={f.lunarMonth} onChange={set('lunarMonth')} className="mt-1 w-full rounded-btn border border-hairline bg-surface px-3 py-2 text-sm outline-none focus:border-accent">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{monthLabel(m)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-fg">Chuyên mục</label>
            <select value={f.category} onChange={set('category')} className="mt-1 w-full rounded-btn border border-hairline bg-surface px-3 py-2 text-sm outline-none focus:border-accent">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-fg">Địa điểm</label>
            <input value={f.place} onChange={set('place')} placeholder="Nhà thờ Họ" className="mt-1 w-full rounded-btn border border-hairline bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-btn border border-hairline px-4 py-2 text-sm text-fg-2 hover:bg-muted">
            Huỷ
          </button>
          <button type="submit" className="rounded-btn bg-accent px-4 py-2 text-sm font-medium text-fg-inv hover:brightness-110">
            Thêm sự kiện
          </button>
        </div>
      </form>
    </div>
  )
}
