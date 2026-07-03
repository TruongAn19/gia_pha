import { useEffect, useState } from 'react'
import Icon from './ui/Icon'
import { addArticle, updateArticle, uploadArticleImage, CATEGORIES } from '../data/articles'

const EMPTY = { title: '', category: 'Tư liệu', author: 'Ban biên tập', excerpt: '', body: '', cover: '' }

export default function PostArticleModal({ open, onClose, onSaved, article }) {
  const [f, setF] = useState(EMPTY)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (open) {
      if (article) {
        setF({
          title: article.title || '',
          category: article.category || 'Tư liệu',
          author: article.author || 'Ban biên tập',
          excerpt: article.excerpt || '',
          body: (article.body || []).map((b) => b.text).join('\n\n'),
          cover: article.cover || '',
        })
      } else {
        setF(EMPTY)
      }
    }
  }, [open, article])

  if (!open) return null

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const onPickCover = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // cho phép chọn lại cùng file
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadArticleImage(file)
      setF((s) => ({ ...s, cover: url }))
    } catch (err) {
      alert('Tải ảnh thất bại: ' + (err?.message || err))
    } finally {
      setUploading(false)
    }
  }
  const save = async (status) => {
    if (!f.title.trim()) return
    if (article) {
      await updateArticle(article.id, { ...f, status })
    } else {
      await addArticle({ ...f, status })
    }
    onSaved?.()
  }

  const isEdit = !!article

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-4xl flex-col overflow-hidden bg-card shadow-xl sm:max-h-[90vh] sm:rounded-card"
      >
        {/* Thanh trên */}
        <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
          <div>
            <h2 className="font-heading text-lg text-fg">{isEdit ? 'Sửa bài viết' : 'Đăng bài viết'}</h2>
            <p className="text-xs text-fg-2">Ban biên tập · nội dung hiển thị cho mọi thành viên</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => save('draft')} className="rounded-btn border border-hairline px-3 py-1.5 text-sm text-fg-2 hover:bg-muted">
              Lưu nháp
            </button>
            <button onClick={() => save('public')} className="rounded-btn bg-accent px-4 py-1.5 text-sm font-medium text-fg-inv hover:brightness-110">
              {isEdit ? 'Cập nhật' : 'Đăng bài'}
            </button>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-btn text-fg-2 hover:bg-muted">
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>

        <div className="gp-scroll grid flex-1 gap-5 overflow-y-auto p-5 md:grid-cols-[1fr_260px]">
          {/* Nội dung chính */}
          <div className="min-w-0 space-y-4">
            <label className="relative flex h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-card border-2 border-dashed border-hairline text-fg-2 hover:border-accent">
              {f.cover ? (
                <>
                  <img src={f.cover} alt="Ảnh bìa" className="absolute inset-0 h-full w-full object-cover" />
                  <span className="absolute bottom-2 right-2 rounded-btn bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                    Đổi ảnh
                  </span>
                </>
              ) : uploading ? (
                <span className="text-sm font-medium">Đang tải ảnh…</span>
              ) : (
                <>
                  <Icon name="images" size={26} />
                  <span className="mt-2 text-sm font-medium">Tải ảnh bìa</span>
                  <span className="text-xs">Bấm để chọn · JPG, PNG</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={onPickCover} disabled={uploading} className="hidden" />
            </label>
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
