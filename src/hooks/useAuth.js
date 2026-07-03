import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Email/username admin lấy từ .env
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL
const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || 'admin'
const LOCAL_SESSION_KEY = 'giapha_admin_session'

/**
 * Hook quản lý phiên đăng nhập admin qua bảng users tự tạo.
 */
export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Kiểm tra localStorage khi khởi động
    const stored = localStorage.getItem(LOCAL_SESSION_KEY)
    if (stored) {
      try {
        setSession(JSON.parse(stored))
      } catch (e) {
        localStorage.removeItem(LOCAL_SESSION_KEY)
      }
    }
    setLoading(false)
  }, [])

  /**
   * Đăng nhập. Trả về { error } nếu sai.
   * @param {string} username - tên hiển thị
   * @param {string} password
   */
  const signIn = useCallback(async (username, password) => {
    const inputUsername = username ? username.trim() : '';
    if (ADMIN_USERNAME && inputUsername !== ADMIN_USERNAME && inputUsername !== ADMIN_EMAIL) {
      return { error: { message: 'Sai thông tin đăng nhập' } }
    }
    
    // Truy vấn vào bảng users tự tạo
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', ADMIN_EMAIL)
      .eq('password', password)
      .single()
      
    if (error || !data) {
      return { error: { message: 'Mật khẩu không chính xác hoặc tài khoản không tồn tại' } }
    }

    const fakeSession = { user: data }
    setSession(fakeSession)
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(fakeSession))

    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    setSession(null)
    localStorage.removeItem(LOCAL_SESSION_KEY)
  }, [])

  return {
    session,
    isAdmin: !!session,
    loading,
    signIn,
    signOut,
    adminUsername: ADMIN_USERNAME,
  }
}
