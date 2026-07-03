import { useEffect, useMemo, useRef } from 'react'
import * as d3 from 'd3'
import {
  getRoots,
  getChildren,
  deriveYears,
  normalizeDeathAnniversary,
} from '../data/genealogy'

const NW = 200 // chiều rộng thẻ
const NH = 64 // chiều cao thẻ
const HG = 28 // cách ngang
const VG = 56 // cách dọc
const PADB = 26 // chừa chỗ nút mở/gập dưới thẻ

// dựng cây CHỈ gồm nhánh đã mở (lazy)
function buildTree(expanded) {
  const { roots, orphans } = getRoots()
  const make = (m) => {
    const open = expanded.has(m.id_temp)
    const kids = getChildren(m.id_temp)
    return {
      id: m.id_temp,
      member: m,
      hasChildren: kids.length > 0,
      open,
      childCount: kids.length,
      children: open ? kids.map(make) : [],
    }
  }
  return { id: '__root__', member: null, children: [...roots, ...orphans].map(make) }
}

function statusOf(m) {
  const dy = deriveYears(m)
  if (dy.isLost) return 'lost'
  if (dy.isDeceased || dy.death_lunar_year != null || dy.longevity != null) return 'dead'
  return 'alive'
}
const DOT = { alive: '#3E6B4F', dead: '#C4BCA6', lost: '#9B4A3A' }

function metaOf(m) {
  const st = statusOf(m)
  const da = normalizeDeathAnniversary(m.death_anniversary)
  const isRoot = m.parent_id_temp == null
  if (st === 'lost') return 'Thất lạc'
  if (st === 'dead') {
    const g = da ? `Giỗ ${da.date} (ÂL)` : 'Đã mất'
    return isRoot ? `Thủy tổ · ${g}` : g
  }
  return isRoot ? 'Thủy tổ' : `Đời thứ ${m.generation}`
}

/**
 * Sơ đồ phả hệ top-down (frame bi8Au). Layout bằng d3-hierarchy, lazy theo nhánh.
 * props: expanded(Set), selectedId, onToggle(id), onSelect(id)
 */
export default function TreeDiagram({ expanded, selectedId, onToggle, onSelect }) {
  const wrapRef = useRef(null)
  const svgRef = useRef(null)
  const gRef = useRef(null)
  const zoomRef = useRef(null)
  const centeredRef = useRef(false)

  const { nodes, links } = useMemo(() => {
    const root = d3.hierarchy(buildTree(expanded))
    d3.tree().nodeSize([NW + HG, NH + VG])(root)
    const ns = root.descendants().filter((d) => d.depth > 0)
    const ls = root.links().filter((l) => l.source.depth > 0)
    return { nodes: ns, links: ls }
  }, [expanded])

  // zoom/pan (1 lần)
  useEffect(() => {
    const svg = d3.select(svgRef.current)
    const z = d3
      .zoom()
      .scaleExtent([0.15, 2.2])
      .on('zoom', (e) => d3.select(gRef.current).attr('transform', e.transform))
    svg.call(z).on('dblclick.zoom', null)
    zoomRef.current = z
  }, [])

  // căn giữa gốc lần đầu
  useEffect(() => {
    if (centeredRef.current || !nodes.length || !wrapRef.current) return
    centeredRef.current = true
    const w = wrapRef.current.clientWidth
    const rootX = nodes.find((n) => n.depth === 1)?.x ?? 0
    const t = d3.zoomIdentity.translate(w / 2 - rootX, 40).scale(0.85)
    d3.select(svgRef.current).call(zoomRef.current.transform, t)
  }, [nodes])

  const zoomBy = (k) =>
    d3.select(svgRef.current).transition().duration(150).call(zoomRef.current.scaleBy, k)

  const linkPath = (l) => {
    const sb = l.source.y + NH / 2
    const tt = l.target.y - NH / 2
    const mid = (sb + tt) / 2
    return `M${l.source.x},${sb} V${mid} H${l.target.x} V${tt}`
  }

  return (
    <div ref={wrapRef} className="relative min-h-0 flex-1 overflow-hidden rounded-card border border-hairline bg-card">
      {/* Điều khiển zoom */}
      <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-btn border border-hairline bg-card p-1 shadow-sm">
        <button onClick={() => zoomBy(0.8)} className="flex h-7 w-7 items-center justify-center rounded text-fg-2 hover:bg-muted" aria-label="Thu nhỏ">−</button>
        <button onClick={() => zoomBy(1.25)} className="flex h-7 w-7 items-center justify-center rounded text-fg-2 hover:bg-muted" aria-label="Phóng to">+</button>
      </div>

      <svg ref={svgRef} className="h-full w-full" style={{ cursor: 'grab', touchAction: 'none' }}>
        <g ref={gRef}>
          {/* đường nối vuông góc */}
          <g fill="none" stroke="#C4BCA6" strokeWidth={1.5}>
            {links.map((l) => (
              <path key={`${l.source.data.id}-${l.target.data.id}`} d={linkPath(l)} />
            ))}
          </g>

          {/* thẻ node */}
          {nodes.map((n) => {
            const m = n.data.member
            const selected = m.id_temp === selectedId
            const st = statusOf(m)
            return (
              <foreignObject
                key={n.data.id}
                x={n.x - NW / 2}
                y={n.y - NH / 2}
                width={NW}
                height={NH + PADB}
                style={{ overflow: 'visible' }}
              >
                <div
                  onClick={() => onSelect?.(m.id_temp)}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-card border px-3 transition ${
                    selected ? 'border-accent bg-[#FBF6EA]' : 'border-hairline bg-card hover:border-accent-soft'
                  }`}
                  style={{ width: NW, height: NH }}
                >
                  <span
                    className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-han text-base ${
                      selected ? 'bg-accent text-fg-inv' : 'bg-accent-soft/60 text-fg'
                    }`}
                  >
                    吳
                    <span
                      className="absolute -right-0 -top-0 h-2.5 w-2.5 rounded-full border-2 border-card"
                      style={{ background: DOT[st] }}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-fg">{m.name}</span>
                    <span className="block truncate text-[11px] text-fg-2">{metaOf(m)}</span>
                  </span>
                </div>

                {/* nút mở/gập nhánh (lazy) */}
                {n.data.hasChildren && (
                  <div className="flex justify-center" style={{ marginTop: 4 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggle?.(m.id_temp)
                      }}
                      className="flex h-5 min-w-[20px] items-center justify-center rounded-full border border-hairline bg-card px-1.5 text-[10px] font-medium text-fg-2 shadow-sm hover:bg-muted"
                      title={n.data.open ? 'Thu gọn' : 'Mở rộng'}
                    >
                      {n.data.open ? '−' : `+${n.data.childCount}`}
                    </button>
                  </div>
                )}
              </foreignObject>
            )
          })}
        </g>
      </svg>

      {/* Chú giải */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-surface/90 px-4 py-1.5 text-[11px] text-fg-2 shadow-sm">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: DOT.alive }} /> Còn sống</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: DOT.dead }} /> Đã mất</span>
        <span className="hidden sm:inline">· Kéo để di chuyển · Lăn để phóng to</span>
      </div>
    </div>
  )
}
