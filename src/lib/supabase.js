import { createClient } from '@supabase/supabase-js'

// Chuẩn hoá URL: supabase-js cần URL gốc (https://xxx.supabase.co),
// nó tự thêm '/rest/v1/'. Nếu .env lỡ kèm '/rest/v1' thì cắt bỏ.
function normalizeUrl(raw) {
  if (!raw) return raw
  let url = raw.trim().replace(/\/+$/, '')
  if (url.endsWith('/rest/v1')) url = url.slice(0, -'/rest/v1'.length)
  return url
}

const SUPABASE_URL = normalizeUrl(import.meta.env.VITE_SUPABASE_URL)
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Lỗi cấu hình rõ ràng ngay khi khởi động
  console.error(
    '[supabase] Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY trong .env'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Tên bucket lưu ảnh chân dung
export const AVATAR_BUCKET = 'avatars'
