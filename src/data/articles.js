/**
 * Bài viết & Tư liệu ("Lịch sử dòng họ") — kho nội dung do Ban biên tập đăng.
 * Lưu localStorage; khởi tạo từ dữ liệu mẫu trong thiết kế.
 */
const KEY = 'gp_articles_v1'

export const CATEGORIES = ['Tư liệu', 'Hồi ký', 'Lịch sử', 'Phong tục', 'Tin tức']

// block: {type:'lead'|'h2'|'p'|'quote'|'caption', text}
const SEED = [
  {
    id: 'a-khanh-thanh',
    title: 'Lễ khánh thành Nhà thờ Họ Ngô — Phú Cốc',
    category: 'Tư liệu',
    author: 'Ban biên tập',
    date: '2026-06-20',
    pinned: true,
    status: 'public',
    excerpt:
      'Sau nhiều năm chung sức, Nhà thờ Họ đã được khánh thành cùng dịp hoàn thành cuốn gia phả — dấu mốc thiêng liêng của gia tộc.',
    body: [
      { type: 'lead', text: 'Sau nhiều năm chung sức, Nhà thờ Họ Ngô tại Phú Cốc đã được khánh thành — cùng dịp hoàn thành cuốn gia phả nối tiếp.' },
      { type: 'p', text: 'Đây là dấu mốc thiêng liêng, nơi con cháu bốn phương hội tụ mỗi dịp giỗ Tổ, tưởng nhớ công đức Tổ tiên và gắn kết tình thân trong gia tộc.' },
    ],
  },
  {
    id: 'a-hanh-trinh-300',
    title: 'Hành trình hơn 300 năm khai cơ lập nghiệp',
    category: 'Lịch sử',
    author: 'Ban biên tập',
    date: '2026-06-10',
    pinned: false,
    status: 'public',
    excerpt: 'Từ đời vua Lê Hy Tông, cụ Thủy tổ Ngô Phúc Khang đến vùng đất Phú Cốc khai hoang, lập nền dựng nhà.',
    body: [
      { type: 'lead', text: 'Từ một cụ Thủy tổ đến vùng đất Phú Cốc khai hoang, dòng họ Ngô đã trải qua hơn ba thế kỷ dựng xây và tiếp nối.' },
      {
        type: 'p',
        text: 'Kể từ ngày cụ Ngô Phúc Khang, Thủy tổ của họ Ngô Phú Cốc, đến vùng đất này khoảng đời vua Lê Hy Tông (1681–1705); khai phá đất hoang, cuốc đất, lập nền, dựng nhà, gieo lúa trồng khoai, sinh con đẻ cháu… đến nay đã là 14 đời, hậu duệ đã có tới mấy trăm hộ gia đình.',
      },
      { type: 'h2', text: 'Mở đất, lập làng' },
      {
        type: 'p',
        text: 'Theo thời gian, một số dòng họ cũng tụ cư về đây, cùng với họ Ngô chung sức đồng lòng xây dựng nên làng Phú Liễn xưa — làng Phú Cốc ngày nay, có truyền thống văn hóa và trù phú như hiện tại.',
      },
      { type: 'quote', text: '“Hữu khai tất tiên” — con cháu được như ngày hôm nay là nhờ sự mở mang, dạy giỗ, phúc ấm của Tổ tiên.' },
      { type: 'caption', text: 'Nhà thờ Họ Ngô tại Phú Cốc — nơi con cháu hội tụ mỗi dịp giỗ Tổ.' },
      {
        type: 'p',
        text: 'Trải hơn 300 năm qua bao biến động “bãi bể, nương dâu”, dòng họ vẫn không ngừng phát triển. Người họ Ngô luôn giữ nếp đoàn kết, trọng đạo lý, hiếu nghĩa, cần cù và trọng chữ nghĩa — xem việc vun đắp nhân tài là vượng khí của dòng họ.',
      },
    ],
  },
  {
    id: 'a-the-long-1983',
    title: 'Cụ Ngô Thế Lộng và lần nối tiếp gia phả 1983',
    category: 'Hồi ký',
    author: 'Ngô Hữu Tình',
    date: '2026-06-02',
    pinned: false,
    status: 'public',
    excerpt: 'Những trăn trở và tâm huyết giữ gìn phả hệ qua lời kể của cụ đời thứ X.',
    body: [
      { type: 'lead', text: 'Những trăn trở và tâm huyết giữ gìn phả hệ qua lời kể của cụ đời thứ X.' },
      { type: 'p', text: 'Năm 1983, giữa bộn bề khó khăn, cụ Ngô Thế Lộng đã đứng ra chắp nối những trang gia phả còn dang dở, ghi lại tên tuổi và công đức của các bậc tiền nhân cho con cháu đời sau.' },
    ],
  },
  {
    id: 'a-13-liet-sy',
    title: 'Tưởng nhớ 13 liệt sỹ của dòng họ',
    category: 'Tư liệu',
    author: 'Ban biên tập',
    date: '2026-05-28',
    pinned: false,
    status: 'public',
    excerpt: 'Danh sách và tiểu sử các liệt sỹ đã anh dũng hy sinh qua bốn đời của gia tộc.',
    body: [
      { type: 'lead', text: 'Danh sách và tiểu sử các liệt sỹ đã anh dũng hy sinh qua bốn đời của gia tộc.' },
      { type: 'p', text: 'Dòng họ Ngô tự hào có 13 người con ưu tú đã hiến dâng tuổi xuân cho Tổ quốc. Tên tuổi các anh mãi được khắc ghi trong tâm khảm con cháu.' },
    ],
  },
  {
    id: 'a-tuc-gio-to',
    title: 'Tục giỗ Tổ ngày 19 tháng Giêng',
    category: 'Phong tục',
    author: 'Ngô Văn An',
    date: '2026-05-15',
    pinned: false,
    status: 'public',
    excerpt: 'Nghi thức, ý nghĩa và cách tổ chức giỗ Tổ hằng năm tại Nhà thờ Họ.',
    body: [
      { type: 'lead', text: 'Nghi thức, ý nghĩa và cách tổ chức giỗ Tổ hằng năm tại Nhà thờ Họ.' },
      { type: 'p', text: 'Hằng năm cứ đến ngày 19 tháng Giêng âm lịch, con cháu họ Ngô lại tề tựu về Nhà thờ Họ để dâng hương tưởng nhớ Thủy tổ và các bậc tiền nhân.' },
    ],
  },
]

let store = null
function load() {
  if (store) return store
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(KEY)
    store = raw ? JSON.parse(raw) : SEED.slice()
  } catch {
    store = SEED.slice()
  }
  return store
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    /* ignore */
  }
}

const byNewest = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)

export function allArticles() {
  return load().filter((a) => a.status !== 'draft').slice().sort(byNewest)
}
export function getArticle(id) {
  return load().find((a) => a.id === id) || null
}
export function getPinned() {
  return allArticles().find((a) => a.pinned) || null
}
export function addArticle(data) {
  load()
  const paras = String(data.body || '')
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean)
  const item = {
    id: `a-${Date.now().toString(36)}`,
    title: data.title?.trim() || 'Bài viết chưa đặt tên',
    category: data.category || 'Tư liệu',
    author: data.author?.trim() || 'Ban biên tập',
    date: data.date || new Date().toISOString().slice(0, 10),
    pinned: false,
    status: data.status === 'draft' ? 'draft' : 'public',
    excerpt: data.excerpt?.trim() || paras[0]?.slice(0, 160) || '',
    body: paras.map((text, i) => ({ type: i === 0 ? 'lead' : 'p', text })),
  }
  store.unshift(item)
  persist()
  return item
}

// đọc ~200 từ/phút
export function readMinutes(a) {
  const words = (a.body || []).reduce((n, b) => n + (b.text || '').split(/\s+/).length, 0)
  return Math.max(1, Math.round(words / 200))
}

export function fmtDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
