import { useMemo } from 'react'
import { allMembers, getChildrenInfo } from '../data/genealogy'
import Icon from '../components/ui/Icon'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

// Trích danh sách con trai gia phả ghi (đoạn "Các con … con trai", gộp dòng)
function sonsListText(details) {
  const d = (details || '').replace(/\s+/g, ' ')
  const i = d.indexOf('Các con')
  if (i < 0) return ''
  let seg = d.slice(i)
  const g = seg.indexOf('con gái')
  if (g !== -1) seg = seg.slice(0, g)
  return seg.replace(/^Các con\s*:?\s*/, '').trim()
}

/**
 * Màn quản trị "Cần bổ sung" — thành viên gia phả ghi có con trai nhưng
 * record còn thiếu (dataQuality.missingSonRecords). Dựng mới (không có trong .pen).
 * props: onOpenProfile(id), onAdd(member)
 */
export default function MissingDataPage({ onOpenProfile, onAdd }) {
  const rows = useMemo(() => {
    return allMembers()
      .map((m) => ({ m, ci: getChildrenInfo(m.id_temp) }))
      .filter(({ ci }) => ci.dataQuality.missingSonRecords)
      .map(({ m, ci }) => ({ m, ci, gap: (ci.sonsText ?? 0) - ci.recordSons }))
      .sort((a, b) => b.gap - a.gap || (a.m.generation || 0) - (b.m.generation || 0))
  }, [])

  return (
    <div className="flex h-full flex-col">
      <header className="px-5 pt-5 md:px-8 md:pt-7">
        <div className="flex items-center gap-2">
          <Icon name="alert" size={22} className="text-danger" />
          <h1 className="font-heading text-2xl text-fg md:text-3xl">Cần bổ sung</h1>
        </div>
        <p className="mt-1 text-sm text-fg-2">
          Gia phả ghi có con trai nhưng hồ sơ còn thiếu — đối chiếu bản gốc rồi thêm thành viên.
        </p>
      </header>

      <div className="gp-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-24 pt-4 md:px-8 md:pb-6">
        {rows.length === 0 ? (
          <EmptyState icon="users" title="Không có mục nào cần bổ sung" description="Mọi con trai theo gia phả đều đã có hồ sơ." />
        ) : (
          <div className="mx-auto max-w-4xl">
            <div className="mb-3 rounded-btn bg-muted px-4 py-2 text-sm text-fg-2">
              <b className="text-fg">{rows.length}</b> thành viên cần bổ sung con trai
            </div>
            <div className="flex flex-col gap-3">
              {rows.map(({ m, ci, gap }) => (
                <div key={m.id_temp} className="rounded-card border border-hairline bg-card p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-inverse font-han text-fg-inv">
                      吳
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => onOpenProfile?.(m.id_temp)} className="font-semibold text-fg hover:text-accent">
                          {m.name}
                        </button>
                        <Badge>Đời {m.generation}</Badge>
                        <Badge tone="danger">Thiếu {gap}</Badge>
                      </div>
                      <div className="mt-1 text-sm text-fg-2">
                        Gia phả ghi <b className="text-fg">{ci.sonsText}</b> con trai · đã có hồ sơ{' '}
                        <b className="text-fg">{ci.recordSons}</b>
                      </div>
                      {sonsListText(m.details) && (
                        <div className="mt-1.5 line-clamp-2 text-xs text-fg-inv-2">
                          Theo gia phả: {sonsListText(m.details)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row">
                      {onAdd && (
                        <button
                          onClick={() => onAdd(m)}
                          className="flex items-center justify-center gap-1.5 rounded-btn bg-accent px-3 py-2 text-sm font-medium text-fg-inv hover:brightness-110"
                        >
                          <span className="text-base leading-none">+</span> Thêm con
                        </button>
                      )}
                      <button
                        onClick={() => onOpenProfile?.(m.id_temp)}
                        className="flex items-center justify-center gap-1.5 rounded-btn border border-hairline px-3 py-2 text-sm text-fg-2 hover:bg-muted"
                      >
                        <Icon name="doc" size={15} /> Hồ sơ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
