import { useEffect, useMemo, useState } from 'react'
import { allArticles, getArticle, getPinned, CATEGORIES, readMinutes, fmtDate } from '../data/articles'
import { removeDiacritics } from '../data/genealogy'
import Icon from '../components/ui/Icon'
import Pagination from '../components/ui/Pagination'
import PostArticleModal from '../components/PostArticleModal'

const PAGE_SIZE = 6
const TABS = ['Tất cả', ...CATEGORIES]

function Cover({ className = '', size = 22 }) {
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-inverse to-accent/70 text-fg-inv ${className}`}>
      <span className="font-han opacity-80" style={{ fontSize: size }}>吳</span>
    </div>
  )
}

export default function ArticlesPage({ canEdit = false, dataVersion = 0 }) {
  const [view, setView] = useState({ name: 'list' })
  const [postOpen, setPostOpen] = useState(false)
  const [bump, setBump] = useState(0)

  if (view.name === 'detail') {
    return (
      <>
        <ArticleDetail id={view.id} onBack={() => setView({ name: 'list' })} onOpen={(id) => setView({ name: 'detail', id })} canEdit={canEdit} v={bump} />
        <PostArticleModal open={postOpen} onClose={() => setPostOpen(false)} onSaved={() => { setPostOpen(false); setBump((b) => b + 1) }} />
      </>
    )
  }
  return (
    <>
      <ArticleList
        onOpen={(id) => setView({ name: 'detail', id })}
        onPost={() => setPostOpen(true)}
        canEdit={canEdit}
        v={bump + dataVersion}
      />
      <PostArticleModal open={postOpen} onClose={() => setPostOpen(false)} onSaved={() => { setPostOpen(false); setBump((b) => b + 1) }} />
    </>
  )
}

function ArticleList({ onOpen, onPost, canEdit, v }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Tất cả')
  const [page, setPage] = useState(1)

  const pinned = useMemo(() => getPinned(), [v])
  const filtered = useMemo(() => {
    const nq = removeDiacritics(q.trim().toLowerCase())
    let list = allArticles()
    if (cat !== 'Tất cả') list = list.filter((a) => a.category === cat)
    if (nq) list = list.filter((a) => removeDiacritics(`${a.title} ${a.excerpt}`.toLowerCase()).includes(nq))
    return list
  }, [q, cat, v])

  // Bài ghim chỉ hiện ở "Tất cả" + không tìm kiếm; khi đó loại nó khỏi lưới
  const showPinned = pinned && cat === 'Tất cả' && !q.trim()
  const grid = showPinned ? filtered.filter((a) => a.id !== pinned.id) : filtered

  const pageCount = Math.max(1, Math.ceil(grid.length / PAGE_SIZE))
  useEffect(() => setPage(1), [q, cat])
  useEffect(() => setPage((p) => Math.min(p, pageCount)), [pageCount])
  const pageRows = grid.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-start gap-3 px-5 pt-5 md:px-8 md:pt-7">
        <div className="mr-auto">
          <h1 className="font-heading text-2xl text-fg md:text-3xl">Bài viết &amp; Tư liệu</h1>
          <p className="mt-1 text-sm text-fg-2">Tư liệu, hồi ký và kỷ niệm của dòng họ · do Ban biên tập đăng</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm bài viết..."
              className="w-full rounded-full border border-hairline bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
            />
          </div>
          {canEdit && (
            <button onClick={onPost} className="flex items-center gap-1.5 whitespace-nowrap rounded-btn bg-accent px-4 py-2 text-sm font-medium text-fg-inv hover:brightness-110">
              <Icon name="plus" size={16} /> <span className="hidden sm:inline">Đăng bài</span>
            </button>
          )}
        </div>
      </header>

      {/* Tabs chuyên mục */}
      <div className="flex gap-1.5 overflow-x-auto px-5 py-4 md:px-8">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setCat(t)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition ${
              cat === t ? 'bg-accent font-medium text-fg-inv' : 'border border-hairline text-fg-2 hover:bg-muted'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="gp-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-24 md:px-8 md:pb-6">
        {/* Bài ghim */}
        {showPinned && (
          <button
            onClick={() => onOpen(pinned.id)}
            className="group mb-5 grid w-full overflow-hidden rounded-card border border-hairline bg-card text-left md:grid-cols-[300px_1fr]"
          >
            <Cover className="h-40 md:h-full" size={48} />
            <div className="p-5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                <Icon name="tag" size={13} /> Bài ghim · {pinned.category}
              </span>
              <h2 className="mt-2 font-heading text-xl text-fg group-hover:text-accent md:text-2xl">{pinned.title}</h2>
              <p className="mt-2 text-sm text-fg-2">{pinned.excerpt}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-fg-2">
                <span className="font-medium text-fg">{pinned.author}</span> · {fmtDate(pinned.date)}
              </div>
            </div>
          </button>
        )}

        {/* Lưới bài viết */}
        {pageRows.length === 0 ? (
          <div className="rounded-card border border-hairline bg-card p-10 text-center text-sm text-fg-2">
            Không tìm thấy bài viết phù hợp.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {pageRows.map((a) => (
              <button
                key={a.id}
                onClick={() => onOpen(a.id)}
                className="group flex flex-col overflow-hidden rounded-card border border-hairline bg-card text-left"
              >
                <Cover className="h-36" size={40} />
                <div className="flex flex-1 flex-col p-4">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
                    <Icon name="tag" size={12} /> {a.category}
                  </span>
                  <h3 className="mt-1.5 font-heading text-lg text-fg group-hover:text-accent">{a.title}</h3>
                  <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-fg-2">{a.excerpt}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-fg-2">
                    <span className="font-medium text-fg">{a.author}</span> · {fmtDate(a.date)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 overflow-hidden rounded-card border border-hairline bg-card">
          <Pagination page={page} pageCount={pageCount} total={grid.length} unit="bài viết" onChange={setPage} />
        </div>
      </div>
    </div>
  )
}

function ArticleDetail({ id, onBack, onOpen, canEdit, v }) {
  const a = useMemo(() => getArticle(id), [id, v])
  const others = useMemo(() => allArticles().filter((x) => x.id !== id).slice(0, 2), [id, v])
  if (!a) return <div className="p-10 text-center text-fg-2">Không tìm thấy bài viết.</div>

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: a.title })
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${a.title} — ${window.location.href}`)
        alert('Đã sao chép liên kết bài viết.')
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="gp-scroll h-full overflow-y-auto px-5 pb-24 pt-5 md:px-8 md:pb-10 md:pt-7">
      <div className="mx-auto max-w-3xl">
        {/* Thanh trên */}
        <div className="flex items-center gap-2 text-sm text-fg-2">
          <button onClick={onBack} className="flex items-center gap-1 hover:text-fg">
            <Icon name="chevron" size={15} className="rotate-180" /> Bài viết
          </button>
          <span>/</span>
          <span className="text-fg">{a.category}</span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={share} className="flex items-center gap-1.5 rounded-btn border border-hairline px-3 py-1.5 hover:bg-muted">
              <Icon name="share" size={14} /> Chia sẻ
            </button>
            {canEdit && (
              <button className="flex items-center gap-1.5 rounded-btn border border-hairline px-3 py-1.5 hover:bg-muted">
                <Icon name="edit" size={14} /> Sửa
              </button>
            )}
          </div>
        </div>

        <Cover className="mt-4 h-52 rounded-card md:h-64" size={64} />

        <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
          <Icon name="tag" size={13} /> {a.category}
        </span>
        <h1 className="mt-2 font-heading text-3xl leading-tight text-fg md:text-4xl">{a.title}</h1>
        <div className="mt-3 flex items-center gap-3 text-sm text-fg-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-inverse font-han text-sm text-fg-inv">吳</span>
          <span>
            <span className="font-medium text-fg">{a.author}</span>
            <br />
            {fmtDate(a.date)} · {readMinutes(a)} phút đọc
          </span>
        </div>

        {/* Nội dung */}
        <article className="mt-6 space-y-4">
          {a.body.map((b, i) => {
            if (b.type === 'lead') return <p key={i} className="font-serif text-lg leading-relaxed text-fg">{b.text}</p>
            if (b.type === 'h2') return <h2 key={i} className="pt-2 font-heading text-2xl text-fg">{b.text}</h2>
            if (b.type === 'quote')
              return (
                <blockquote key={i} className="border-l-4 border-accent bg-muted/50 px-5 py-4 font-serif text-lg italic text-fg">
                  {b.text}
                </blockquote>
              )
            if (b.type === 'caption')
              return (
                <figure key={i} className="my-2">
                  <Cover className="h-48 rounded-card" size={48} />
                  <figcaption className="mt-2 text-center text-xs italic text-fg-2">{b.text}</figcaption>
                </figure>
              )
            return <p key={i} className="leading-relaxed text-fg">{b.text}</p>
          })}
        </article>

        {/* Bài viết khác */}
        {others.length > 0 && (
          <div className="mt-8">
            <h3 className="font-heading text-xl text-fg">Bài viết khác</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {others.map((o) => (
                <button key={o.id} onClick={() => onOpen(o.id)} className="group flex flex-col overflow-hidden rounded-card border border-hairline bg-card text-left">
                  <Cover className="h-28" size={32} />
                  <div className="p-4">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">{o.category}</span>
                    <h4 className="mt-1 font-heading text-base text-fg group-hover:text-accent">{o.title}</h4>
                    <div className="mt-2 text-xs text-fg-2">{fmtDate(o.date)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
