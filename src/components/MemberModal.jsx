import { useEffect } from 'react'

/**
 * Modal chi tiết 1 thành viên.
 *
 * props:
 *  - member: object | null
 *  - onClose()
 */
export default function MemberModal({ member, onClose }) {
  // Đóng bằng phím Esc
  useEffect(() => {
    if (!member) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [member, onClose])

  if (!member) return null

  const initial = (member.name || '?').trim().charAt(0).toUpperCase()

  return (
    // Lớp phủ — bấm ra ngoài để đóng
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border-2 border-gp-gold bg-gp-cream shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="relative flex items-center gap-4 bg-gp-red p-5 text-gp-cream">
          {/* Ảnh chân dung hoặc avatar chữ cái đầu */}
          {member.photo_url ? (
            <img
              src={member.photo_url}
              alt={member.name}
              className="h-20 w-20 flex-shrink-0 rounded-full border-2 border-gp-gold object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border-2 border-gp-gold bg-gp-red text-3xl font-bold text-gp-gold">
              {initial}
            </div>
          )}

          <div className="min-w-0">
            <h2 className="truncate text-2xl font-bold text-gp-gold">{member.name}</h2>
            {member.han_name && (
              <div className="text-lg font-medium text-red-200">{member.han_name}</div>
            )}
            {member.generation != null && (
              <span className="mt-1 inline-block rounded-full bg-gp-gold px-3 py-0.5 text-xs font-semibold text-gp-red">
                Đời thứ {member.generation}
              </span>
            )}
          </div>

          {/* Nút đóng */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-gp-cream/80 transition hover:bg-black/20 hover:text-white"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* THÔNG TIN */}
        <div className="space-y-2 px-5 py-4 text-sm">
          {member.death_anniversary && (
            <div className="flex items-start gap-2">
              <span aria-hidden>🕯️</span>
              <span>
                <span className="font-semibold text-gp-brown">Ngày giỗ: </span>
                {member.death_anniversary}
              </span>
            </div>
          )}
          {member.grave && (
            <div className="flex items-start gap-2">
              <span aria-hidden>⚰️</span>
              <span>
                <span className="font-semibold text-gp-brown">Nơi để mộ: </span>
                {member.grave}
              </span>
            </div>
          )}
        </div>

        {/* CHI TIẾT (text thô, giữ xuống dòng) */}
        {member.details && (
          <div className="border-t border-gp-brown/20 px-5 py-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gp-brown/70">
              Chi tiết
            </div>
            <div className="gp-scroll max-h-64 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-gp-brown/90">
              {member.details}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
