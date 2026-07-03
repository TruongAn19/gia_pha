import {
  byId,
  getAncestors,
  getChildren,
  deriveYears,
  normalizeDeathAnniversary,
} from '../data/genealogy'
import Icon from './ui/Icon'

function statusOf(m) {
  const dy = deriveYears(m)
  if (dy.isLost) return 'lost'
  if (dy.isDeceased || dy.death_lunar_year != null || dy.longevity != null) return 'dead'
  return 'alive'
}
const DOT = { alive: '#3E6B4F', dead: '#C4BCA6', lost: '#9B4A3A' }

function meta(m) {
  const da = normalizeDeathAnniversary(m.death_anniversary)
  const isRoot = m.parent_id_temp == null
  return [`Đời ${m.generation}`, isRoot ? 'Thủy tổ' : null, da ? `Giỗ ${da.date}` : null]
    .filter(Boolean)
    .join(' · ')
}

/**
 * Sơ đồ phả hệ cho MOBILE (frame uvJKT): dòng trực hệ dọc
 * (tổ tiên đời trên → người đang xem → con + "cùng đời").
 * props: focusId, onFocus(id), onOpenProfile(id)
 */
export default function MobileLineage({ focusId, onFocus, onOpenProfile }) {
  const focus = byId(focusId)
  if (!focus) return null

  const ancestors = getAncestors(focusId).slice().reverse() // gốc -> gần nhất
  const parent = getAncestors(focusId)[0] || null
  const siblings = parent ? getChildren(parent.id_temp).filter((s) => s.id_temp !== focusId) : []
  const children = getChildren(focusId)

  return (
    <div className="gp-scroll min-h-0 flex-1 overflow-y-auto rounded-card border border-hairline bg-card p-4">
      {ancestors.length > 0 && (
        <Pill icon="chevron" rotate>
          Tổ tiên đời trên
        </Pill>
      )}

      {/* Chuỗi tổ tiên */}
      {ancestors.map((a) => (
        <div key={a.id_temp}>
          <Card m={a} onClick={() => onFocus?.(a.id_temp)} />
          <Connector />
        </div>
      ))}

      {/* Người đang xem */}
      <Card m={focus} focus onClick={() => onOpenProfile?.(focusId)} />

      {/* Cùng đời */}
      {siblings.length > 0 && (
        <div className="my-2 flex flex-wrap justify-center gap-1.5">
          <span className="text-xs text-fg-2">Cùng đời:</span>
          {siblings.map((s) => (
            <button key={s.id_temp} onClick={() => onFocus?.(s.id_temp)} className="text-xs font-medium text-accent hover:underline">
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Con */}
      {children.length > 0 ? (
        <>
          <Connector />
          <div className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
            {children.length} người con · Đời thứ {(focus.generation ?? 0) + 1}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {children.map((c) => (
              <Card key={c.id_temp} m={c} compact onClick={() => onFocus?.(c.id_temp)} />
            ))}
          </div>
        </>
      ) : (
        <div className="mt-3 text-center text-xs italic text-fg-inv-2">Chưa ghi nhận người con.</div>
      )}
    </div>
  )
}

function Connector() {
  return <div className="mx-auto h-4 w-px bg-accent-soft" />
}

function Pill({ children }) {
  return (
    <div className="mb-3 flex justify-center">
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-fg-2">
        <Icon name="chevron" size={12} className="-rotate-90" />
        {children}
      </span>
    </div>
  )
}

function Card({ m, focus = false, compact = false, onClick }) {
  const st = statusOf(m)
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-card border px-3 py-2.5 text-left transition ${
        focus ? 'border-accent bg-[#FBF6EA]' : 'border-hairline bg-card active:bg-muted'
      }`}
    >
      <span
        className={`relative flex flex-shrink-0 items-center justify-center rounded-full font-han ${
          compact ? 'h-8 w-8 text-sm' : 'h-11 w-11 text-base'
        } ${focus ? 'bg-accent text-fg-inv' : 'bg-inverse text-fg-inv'}`}
      >
        吳
        <span className="absolute -right-0 -top-0 h-2.5 w-2.5 rounded-full border-2 border-card" style={{ background: DOT[st] }} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate font-semibold text-fg ${compact ? 'text-sm' : ''}`}>{m.name}</span>
        <span className="block truncate text-[11px] text-fg-2">{meta(m)}</span>
      </span>
      {focus && <Icon name="chevron" size={16} className="text-fg-2" />}
    </button>
  )
}
