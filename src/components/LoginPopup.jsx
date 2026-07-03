import { useEffect, useRef, useState } from 'react'

/**
 * Nút "⚙ Quản trị" mờ ở góc dưới phải. Bấm mở popup đăng nhập tại chỗ.
 *
 * props:
 *  - onSignIn(username, password) => Promise<{error}>
 *  - adminUsername: gợi ý username hiển thị
 */
export default function LoginPopup({ onSignIn, adminUsername }) {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState(adminUsername || '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const popupRef = useRef(null)

  // Bấm ra ngoài popup thì đóng
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error } = await onSignIn(username, password)
    setBusy(false)
    if (error) {
      setError('Sai thông tin đăng nhập')
    } else {
      setOpen(false)
      setPassword('')
    }
  }

  return (
    <div ref={popupRef} className="fixed bottom-4 right-4 z-40">
      {open && (
        <form
          onSubmit={handleSubmit}
          className="mb-2 w-64 rounded-lg border-2 border-gp-gold bg-gp-cream p-4 shadow-xl"
        >
          <div className="mb-3 text-sm font-semibold text-gp-red">Đăng nhập quản trị</div>

          <label className="mb-1 block text-xs text-gp-brown">Tên đăng nhập</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            className="mb-2 w-full rounded border border-gp-brown/40 px-2 py-1 text-sm focus:border-gp-red focus:outline-none"
            placeholder={adminUsername}
          />

          <label className="mb-1 block text-xs text-gp-brown">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-2 w-full rounded border border-gp-brown/40 px-2 py-1 text-sm focus:border-gp-red focus:outline-none"
            placeholder="••••••••"
          />

          {error && <div className="mb-2 text-xs text-gp-red">{error}</div>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded bg-gp-red py-1.5 text-sm font-semibold text-gp-gold transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? 'Đang kiểm tra…' : 'Đăng nhập'}
          </button>
        </form>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="ml-auto block text-xs text-gp-brown/50 transition hover:text-gp-brown"
        title="Khu vực quản trị"
      >
        ⚙ Quản trị
      </button>
    </div>
  )
}
