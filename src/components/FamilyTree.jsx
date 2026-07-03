import { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import {
  buildTreeData,
  computeLayout,
  linkPath,
  normalizeText,
  NODE_W,
  NODE_H,
} from '../lib/treeLayout'
import MemberNode from './MemberNode'

const PAD = 16 // đệm quanh node để nút admin/toggle tràn ra không bị cắt

/**
 * Cây gia phả top-down bằng D3 + SVG, có zoom/pan, thu gọn/mở rộng, tìm kiếm.
 *
 * props:
 *  - members: array
 *  - viewMode: 'collapsed' | 'full'
 *  - isAdmin: bool
 *  - searchTerm: string
 *  - generationFilter: number | 'all'
 *  - onSelect/onEdit/onAdd(member)
 */
export default function FamilyTree({
  members,
  viewMode,
  isAdmin,
  searchTerm,
  generationFilter,
  onSelect,
  onEdit,
  onAdd,
}) {
  const wrapRef = useRef(null)
  const svgRef = useRef(null)
  const gRef = useRef(null)
  const zoomRef = useRef(null)
  const centeredKeyRef = useRef('')

  const [size, setSize] = useState({ width: 800, height: 600 })
  // Các node được mở thêm trong chế độ thu gọn
  const [expanded, setExpanded] = useState(() => new Set())

  // --- Đo kích thước khung -------------------------------------------------
  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      setSize({ width: r.width, height: r.height })
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  // --- Dựng dữ liệu cây + layout ------------------------------------------
  const treeData = useMemo(() => buildTreeData(members), [members])
  const { nodes, links, bounds, nodesById } = useMemo(
    () => computeLayout(treeData, { viewMode, expanded }),
    [treeData, viewMode, expanded]
  )

  // --- Thiết lập zoom/pan (1 lần) -----------------------------------------
  useEffect(() => {
    const svg = d3.select(svgRef.current)
    const zoom = d3
      .zoom()
      .scaleExtent([0.08, 2.5])
      .on('zoom', (event) => {
        d3.select(gRef.current).attr('transform', event.transform)
      })
    svg.call(zoom)
    // Tắt double-click-zoom mặc định để không khó chịu khi thao tác
    svg.on('dblclick.zoom', null)
    zoomRef.current = zoom
  }, [])

  const centerOn = (x, y, scale, duration = 450) => {
    if (!zoomRef.current || !svgRef.current) return
    const { width, height } = size
    const t = d3.zoomIdentity
      .translate(width / 2 - x * scale, Math.max(90, height / 3) - y * scale)
      .scale(scale)
    d3.select(svgRef.current).transition().duration(duration).call(zoomRef.current.transform, t)
  }

  // --- Căn giữa khi đổi chế độ xem hoặc lần đầu ----------------------------
  useEffect(() => {
    if (!nodes.length || !size.width) return
    const key = `${viewMode}-${size.width}x${size.height}`
    if (centeredKeyRef.current === key) return
    centeredKeyRef.current = key
    const scale = viewMode === 'full' ? 0.45 : 0.85
    centerOn(bounds.midX, 0, scale, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, size.width, size.height, nodes.length])

  // --- Tìm kiếm: highlight + auto scroll ----------------------------------
  const highlightIds = useMemo(() => {
    const term = normalizeText(searchTerm)
    if (!term) return new Set()
    const ids = new Set()
    nodes.forEach((n) => {
      if (normalizeText(n.member.name).includes(term)) ids.add(n.id)
    })
    return ids
  }, [searchTerm, nodes])

  useEffect(() => {
    if (!searchTerm) return
    // Tìm node khớp đầu tiên rồi cuộn tới
    const term = normalizeText(searchTerm)
    const target = nodes.find((n) => normalizeText(n.member.name).includes(term))
    if (target) {
      const cur = d3.zoomTransform(svgRef.current)
      const scale = Math.max(cur.k, 0.7)
      centerOn(target.x, target.y, scale)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, nodes])

  // --- Toggle mở/gập nhánh -------------------------------------------------
  const handleToggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isDimmed = (gen) =>
    generationFilter !== 'all' && Number(gen) !== Number(generationFilter)

  return (
    <div ref={wrapRef} className="gp-canvas-bg relative h-full w-full overflow-hidden">
      {/* touchAction:'none' để d3.zoom nhận cử chỉ chạm (kéo 1 ngón, chụm 2 ngón)
          trên mobile — nếu không, trình duyệt chiếm cử chỉ để cuộn trang. */}
      <svg ref={svgRef} className="h-full w-full" style={{ cursor: 'grab', touchAction: 'none' }}>
        <g ref={gRef}>
          {/* Đường nối */}
          <g fill="none" stroke="#8B4513" strokeWidth={1.5} strokeOpacity={0.7}>
            {links.map((l) => (
              <path key={l.id} d={linkPath({ source: l.source, target: l.target })} />
            ))}
          </g>

          {/* Các node */}
          {nodes.map((n) => (
            <foreignObject
              key={n.id}
              x={n.x - NODE_W / 2 - PAD}
              y={n.y - NODE_H / 2 - PAD}
              width={NODE_W + PAD * 2}
              height={NODE_H + PAD * 2}
              style={{ overflow: 'visible' }}
            >
              <div style={{ padding: PAD }}>
                <MemberNode
                  node={n}
                  isAdmin={isAdmin}
                  isHighlighted={highlightIds.has(n.id)}
                  isDimmed={isDimmed(n.member.generation)}
                  showToggle={viewMode === 'collapsed'}
                  onSelect={onSelect}
                  onEdit={onEdit}
                  onAdd={onAdd}
                  onToggle={handleToggle}
                />
              </div>
            </foreignObject>
          ))}
        </g>
      </svg>

      {/* Gợi ý thao tác */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-[11px] text-white">
        Kéo để di chuyển · Lăn chuột để phóng to/thu nhỏ
        {viewMode === 'collapsed' ? ' · Bấm nút +N để mở nhánh' : ''}
      </div>
    </div>
  )
}
