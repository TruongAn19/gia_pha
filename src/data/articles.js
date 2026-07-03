import { supabase, AVATAR_BUCKET } from '../lib/supabase'

export const CATEGORIES = ['Tư liệu', 'Hồi ký', 'Lịch sử', 'Phong tục', 'Tin tức']

/** Tải ảnh (ảnh bìa bài viết) lên Storage, trả về public URL. Dùng chung bucket "avatars", thư mục articles/. */
export async function uploadArticleImage(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `articles/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function fetchArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('date', { ascending: false })
  
  if (error) {
    console.error('Lỗi khi tải bài viết:', error)
    return []
  }
  return data || []
}

export async function addArticle(data) {
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
    cover: data.cover || null,
    excerpt: data.excerpt?.trim() || paras[0]?.slice(0, 160) || '',
    body: paras.map((text, i) => ({ type: i === 0 ? 'lead' : 'p', text })),
  }

  const { error } = await supabase.from('articles').insert([item])
  if (error) {
    console.error('Lỗi khi thêm bài viết:', error)
    return null
  }
  return item
}

export async function updateArticle(id, data) {
  const paras = String(data.body || '')
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean)
    
  const updated = {
    title: data.title?.trim() || 'Bài viết chưa đặt tên',
    category: data.category || 'Tư liệu',
    author: data.author?.trim() || 'Ban biên tập',
    status: data.status === 'draft' ? 'draft' : 'public',
    cover: data.cover || null,
    excerpt: data.excerpt?.trim() || paras[0]?.slice(0, 160) || '',
    body: paras.map((text, i) => ({ type: i === 0 ? 'lead' : 'p', text })),
  }

  const { error } = await supabase.from('articles').update(updated).eq('id', id)
  if (error) {
    console.error('Lỗi khi cập nhật bài viết:', error)
    return null
  }
  return updated
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
