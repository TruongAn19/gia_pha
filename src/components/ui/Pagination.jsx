import Icon from './Icon'

// Danh sách số trang có "…" khi nhiều trang
function pageList(page, pageCount) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const out = [1]
  if (page > 3) out.push('…')
  for (let i = Math.max(2, page - 1); i <= Math.min(pageCount - 1, page + 1); i++) out.push(i)
  if (page < pageCount - 2) out.push('…')
  out.push(pageCount)
  return out
}

/**
 * Thanh phân trang dùng chung.
 * props: page (1-based), pageCount, total, unit, onChange(p)
 */
export default function Pagination({ page, pageCount, total, unit = 'mục', onChange }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-4 py-3">
      <span className="text-sm text-fg-2">
        Trang <b className="text-fg">{Math.min(page, Math.max(pageCount, 1))}</b>/{Math.max(pageCount, 1)}
        {total != null && ` · ${total} ${unit}`}
      </span>
      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-btn border border-hairline text-fg-2 hover:bg-muted disabled:opacity-40"
            aria-label="Trang trước"
          >
            <Icon name="chevron" size={16} className="rotate-180" />
          </button>
          {pageList(page, pageCount).map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="px-1 text-fg-2">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p)}
                className={`h-8 min-w-8 rounded-btn px-2 text-sm transition ${
                  p === page ? 'bg-accent font-semibold text-fg-inv' : 'border border-hairline text-fg-2 hover:bg-muted'
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => onChange(page + 1)}
            disabled={page >= pageCount}
            className="flex h-8 w-8 items-center justify-center rounded-btn border border-hairline text-fg-2 hover:bg-muted disabled:opacity-40"
            aria-label="Trang sau"
          >
            <Icon name="chevron" size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
