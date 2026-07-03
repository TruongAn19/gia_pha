import { useEffect } from 'react'
import Icon from './ui/Icon'

/**
 * Modal "Lời tựa (toàn văn)" (frame T6hguV / mobile f88Az).
 * props: open, onClose, paragraphs (mảng đoạn văn)
 */
export default function LoiTuaModal({ open, onClose, paragraphs = [] }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-card shadow-modal sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-hairline" />
        </div>

        <div className="flex items-center gap-3 border-b border-hairline px-6 py-4">
          <Icon name="book" size={22} className="text-accent" />
          <div>
            <h2 className="font-heading text-xl text-fg">Lời tựa gia phả</h2>
            <p className="text-xs text-fg-2">Nối tiếp ông, cha biên gia phả · 2020</p>
          </div>
          <button onClick={onClose} className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-fg-2 hover:bg-muted" aria-label="Đóng">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="gp-scroll flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto flex max-w-prose flex-col gap-4 font-serif text-[16px] leading-[29px] text-fg">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="mt-6 text-right text-sm italic text-fg-2">
            Ngày 15 tháng 8 năm 2020 — Kính tựa
          </div>
        </div>
      </div>
    </div>
  )
}
