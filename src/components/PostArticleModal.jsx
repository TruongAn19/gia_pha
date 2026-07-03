import { useEffect, useState } from 'react'
import Icon from './ui/Icon'
import { addArticle, CATEGORIES } from '../data/articles'

const EMPTY = { title: '', category: 'Tư liệu', author: 'Ban biên tập', excerpt: '', body: '' }

export default function PostArticleModal({ open, onClose, onSaved }) {
  const [f, setF] = useState(EMPTY)
  useEffect(() => {
    if (open) setF(EMPTY)
  }, [open])
  if (!open) return null

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const save = (status) => {
    if (!f.title.trim()) return
    addArticle({ ...f, status })
    onSaved?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-4xl flex-col overflow-hidden bg-card shadow-xl sm:max-h-[90vh] sm:rounded-card"
      >
        {/* Thanh trên */}
        <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
          <div>
            <h2 className="font-heading text-lg text-fg">Đăng bài viết</h2>
            <p className="text-xs text-fg-2">Ban biên tập · nội dung hiển thị cho mọi thành viên</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => save('draft')} className="rounded-btn border border-hairline px-3 py-1.5 text-sm text-fg-2 hover:bg-muted">
              Lưu nháp
            </button>
            <button onClick={() => save('public')} className="rounded-btn bg-accent px-4 py-1.5 text-sm font-medium text-fg-inv hover:brightness-110">
              Đăng bài
            </button>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-btn text-fg-2 hover:bg-muted">
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>

        <div className="gp-scroll grid flex-1 gap-5 overflow-y-auto p-5 md:grid-cols-[1fr_260px]">
          {/* Nội dung chính */}
          <div className="min-w-0 space-y-4">
            <div className="flex h-32 flex-col items-center justify-center rounded-card border-2 border-dashed border-hairline text-fg-2">
              <Icon name="images" size={26} />
              <span className="mt-2 text-sm font-medium">Tải ảnh bìa</span>
              <span className="text-xs">Kéo thả ảnh vào đây hoặc bấm để chọn · JPG, PNG</span>
            </div>
            <input
              value={f.title}
              onChange={set('title')}
              autoFocus
              placeholder="Tiêu đề bài viết…"
              className="w-full rounded-btn border border-hairline bg-surface px-3 py-2.5 font-heading text-xl text-fg outline-none focus:border-accent"
            />
            <textarea
              value={f.excerpt}
              onChange={set('excerpt')}
              rows={2}
              placeholder="Tóm tắt ngắn (hiển thị ở danh sách)…"
              className="w-full resize-none rounded-btn border border-hairline bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent"
            />
            <textarea
              value={f.body}
              onChange={set('body')}
              rows={12}
              placeholder="Viết nội dung bài viết ở đây… Ngăn cách các đoạn bằng một dòng trống."
              className="w-full resize-y rounded-btn border border-hairline bg-surface px-3 py-3 text-sm leading-relaxed text-fg outline-none focus:border-accent"
            />
          </div>

          {/* Cột phải */}
          <div className="space-y-4">
            <div className="rounded-card border border-hairline p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-2">Chuyên mục</div>
              <select value={f.category} onChange={set('category')} className="mt-2 w-full rounded-btn border border-hairline bg-surface px-3 py-2 text-sm outline-none focus:border-accent">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="rounded-card border border-hairline p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-2">Tác giả</div>
              <input value={f.author} onChange={set('author')} className="mt-2 w-full rounded-btn border border-hairline bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
            </div>
            <p className="rounded-card bg-muted/50 p-3 text-xs text-fg-2">
              Bấm <b>Đăng bài</b> để công khai cho mọi thành viên, hoặc <b>Lưu nháp</b> để cất giữ riêng.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
