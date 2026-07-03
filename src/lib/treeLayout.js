import * as d3 from 'd3'

// Kích thước mỗi ô node và khoảng cách giữa các node
export const NODE_W = 140
export const NODE_H = 70
export const H_GAP = 28 // khoảng cách ngang giữa 2 ô anh em
export const V_GAP = 70 // khoảng cách dọc giữa 2 đời

// Số đời hiển thị mặc định ở chế độ thu gọn (tính theo depth của cây)
export const DEFAULT_DEPTH = 3

const ROOT_ID = '__virtual_root__'

/**
 * Bỏ dấu tiếng Việt + lowercase để tìm kiếm không phân biệt dấu.
 */
export function normalizeText(s) {
  return (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
}

/**
 * Dựng cây (forest) từ mảng phẳng `members`.
 * Vì nhiều member có parent_id = null (hoặc trỏ tới cha không tồn tại),
 * ta gắn tất cả "gốc" vào một node ảo ROOT để d3.hierarchy có 1 gốc duy nhất.
 *
 * @returns {object} dữ liệu cây dạng {id, member, children:[...]}
 */
export function buildTreeData(members) {
  const byId = new Map()
  members.forEach((m) => {
    byId.set(m.id, { id: m.id, member: m, children: [] })
  })

  const roots = []
  members.forEach((m) => {
    const node = byId.get(m.id)
    const parent = m.parent_id ? byId.get(m.parent_id) : null
    if (parent) {
      parent.children.push(node)
    } else {
      // parent_id null HOẶC trỏ tới cha không có trong tập dữ liệu -> coi là gốc
      roots.push(node)
    }
  })

  // Sắp xếp con: theo đời rồi theo tên cho ổn định
  const sortRec = (node) => {
    node.children.sort((a, b) => {
      const ga = a.member.generation ?? 999
      const gb = b.member.generation ?? 999
      if (ga !== gb) return ga - gb
      return (a.member.name || '').localeCompare(b.member.name || '', 'vi')
    })
    node.children.forEach(sortRec)
  }

  const rootData = { id: ROOT_ID, member: null, children: roots }
  sortRec(rootData)
  return rootData
}

/**
 * Tính layout cây top-down bằng d3.tree.
 *
 * @param {object} rootData  - dữ liệu cây từ buildTreeData
 * @param {object} opts
 * @param {'collapsed'|'full'} opts.viewMode
 * @param {Set<string>} opts.expanded - các node id được mở thêm (chế độ thu gọn)
 * @returns {{nodes:Array, links:Array, bounds:object, nodesById:Map}}
 */
export function computeLayout(rootData, { viewMode = 'collapsed', expanded = new Set() } = {}) {
  const root = d3.hierarchy(rootData)

  // Áp dụng thu gọn: ở chế độ collapsed, node có depth >= DEFAULT_DEPTH
  // sẽ bị gập (children -> _children) trừ khi được người dùng mở (expanded).
  if (viewMode === 'collapsed') {
    root.eachBefore((node) => {
      if (node.depth === 0) return // node ảo luôn mở
      const shouldExpand = node.depth < DEFAULT_DEPTH || expanded.has(node.data.id)
      if (!shouldExpand && node.children) {
        node._children = node.children
        node.children = null
      }
    })
  }

  // d3.tree với nodeSize -> tự giãn theo số node, không bị bó trong khung cố định
  const layout = d3.tree().nodeSize([NODE_W + H_GAP, NODE_H + V_GAP])
  layout(root)

  // QUAN TRỌNG: tung độ (y) xếp theo ĐỜI (generation), KHÔNG theo depth.
  // Nhờ vậy mỗi hàng = một đời; nhánh mồ côi (vd đời 9) nằm đúng hàng đời 9
  // và lộ rõ là không có đường nối lên đời 8. d3.tree vẫn lo phần hoành độ (x).
  const ROW = NODE_H + V_GAP
  const rowY = (d) =>
    (d.data.member && d.data.member.generation != null ? d.data.member.generation : d.depth) * ROW

  // Bỏ node ảo (depth 0) khi xuất ra
  const allNodes = root.descendants().filter((d) => d.depth > 0)
  const nodes = allNodes.map((d) => ({
    id: d.data.id,
    member: d.data.member,
    x: d.x,
    y: rowY(d),
    depth: d.depth,
    hasChildren: !!(d.children || d._children),
    collapsed: !!d._children,
    childCount: (d.children ? d.children.length : 0) || (d._children ? d._children.length : 0),
  }))

  // Bỏ các link nối từ node ảo tới các gốc thật (không vẽ)
  const links = root
    .links()
    .filter((l) => l.source.depth > 0)
    .map((l) => ({
      id: `${l.source.data.id}->${l.target.data.id}`,
      source: { x: l.source.x, y: rowY(l.source) },
      target: { x: l.target.x, y: rowY(l.target) },
    }))

  // Tính biên để căn giữa khi khởi tạo
  let minX = Infinity
  let maxX = -Infinity
  let maxY = 0
  nodes.forEach((n) => {
    minX = Math.min(minX, n.x)
    maxX = Math.max(maxX, n.x)
    maxY = Math.max(maxY, n.y)
  })
  if (!isFinite(minX)) {
    minX = 0
    maxX = 0
  }

  const nodesById = new Map(nodes.map((n) => [n.id, n]))
  const bounds = { minX, maxX, maxY, width: maxX - minX, midX: (minX + maxX) / 2 }

  return { nodes, links, bounds, nodesById }
}

/**
 * Generator vẽ đường nối dọc (cong mềm) giữa 2 node.
 */
export const linkPath = d3
  .linkVertical()
  .x((d) => d.x)
  .y((d) => d.y)
