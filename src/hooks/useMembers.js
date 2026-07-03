import { useEffect, useState, useCallback } from 'react'
import { supabase, AVATAR_BUCKET } from '../lib/supabase'

const PAGE = 1000 // Supabase trả tối đa 1000 dòng/req -> phân trang

/**
 * Hook tải toàn bộ members + các thao tác CRUD.
 *
 * Ghi chú thiết kế: dữ liệu ~1456 dòng đủ nhỏ để tải hết 1 lần (có phân trang),
 * rồi dựng cây phía client. Cách này đơn giản và đủ nhanh; việc "thu gọn/mở rộng"
 * được xử lý ở client (xem treeLayout.js) thay vì lazy-load từng nhánh từ server.
 */
export function useMembers() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let all = []
      let from = 0
      // Vòng lặp phân trang cho đến khi hết dữ liệu
      while (true) {
        const { data, error } = await supabase
          .from('members')
          .select(
            'id,name,han_name,generation,death_anniversary,grave,details,photo_url,parent_id'
          )
          .order('generation', { ascending: true })
          .order('name', { ascending: true })
          .range(from, from + PAGE - 1)
        if (error) throw error
        all = all.concat(data)
        if (data.length < PAGE) break
        from += PAGE
      }
      setMembers(all)
    } catch (e) {
      console.error('[useMembers] fetch error:', e)
      setError(e.message || 'Không tải được dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // --- CRUD ---------------------------------------------------------------

  /** Thêm thành viên mới. payload không chứa id. */
  const addMember = useCallback(
    async (payload) => {
      const { data, error } = await supabase
        .from('members')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      // Cập nhật TẠI CHỖ (không refetch toàn bộ -> không làm remount cây/danh sách,
      // giữ nguyên trạng thái mở nhánh + vị trí cuộn/zoom). buildTreeData tự sắp xếp
      // nên thứ tự trong mảng không quan trọng.
      setMembers((prev) => [...prev, data])
      return data
    },
    []
  )

  /** Cập nhật thành viên theo id. */
  const updateMember = useCallback(
    async (id, payload) => {
      const { data, error } = await supabase
        .from('members')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      // thay đúng 1 bản ghi trong state
      setMembers((prev) => prev.map((m) => (m.id === id ? data : m)))
      return data
    },
    []
  )

  /**
   * Xoá thành viên. Vì FK parent_id tham chiếu members(id) và không cascade,
   * trước tiên gỡ liên kết các con (đặt parent_id = null) để tránh vi phạm FK.
   */
  const deleteMember = useCallback(
    async (id) => {
      // 1) Gỡ cha cho các con trực tiếp
      const { error: e1 } = await supabase
        .from('members')
        .update({ parent_id: null })
        .eq('parent_id', id)
      if (e1) throw e1
      // 2) Xoá chính nó
      const { error: e2 } = await supabase.from('members').delete().eq('id', id)
      if (e2) throw e2
      // cập nhật tại chỗ: bỏ người bị xoá + gỡ cha cho các con của họ
      setMembers((prev) =>
        prev
          .filter((m) => m.id !== id)
          .map((m) => (m.parent_id === id ? { ...m, parent_id: null } : m))
      )
    },
    []
  )

  /** Upload ảnh chân dung lên Storage bucket "avatars", trả về public URL. */
  const uploadAvatar = useCallback(async (file) => {
    const ext = file.name.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
    return data.publicUrl
  }, [])

  return {
    members,
    loading,
    error,
    refetch: fetchAll,
    addMember,
    updateMember,
    deleteMember,
    uploadAvatar,
  }
}
