import { useEffect, useState } from 'react'
import Icon from './ui/Icon'
import Field from './ui/Field'

/**
 * Đăng nhập quản trị (1 role admin). Username -> ánh xạ email trong useAuth.
 * props: open, onClose, onSignIn(username,password)=>{error}, adminUsername
 */
export default function LoginModal({ open, onClose, onSignIn, adminUsername }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setErr('')
      setPassword('')
      setUsername(adminUsername || '')
    }
  }, [open, adminUsername])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    const { error } = await onSignIn(username, password)
    setBusy(false)
    if (error) setErr(error.message || 'Sai thông tin đăng nhập')
    else onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        className="w-full max-w-sm overflow-hidden rounded-card bg-card shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-hairline px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-han text-fg-inv">吳</span>
          <div>
            <h2 className="font-heading text-xl text-fg">Đăng nhập quản trị</h2>
            <p className="text-xs text-fg-2">Chỉ dành cho quản trị viên dòng họ</p>
          </div>
          <button type="button" onClick={onClose} className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-fg-2 hover:bg-muted" aria-label="Đóng">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5 py-5">
          <Field label="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={adminUsername} />
          <Field label="Mật khẩu" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          {err && <div className="rounded-btn bg-danger/10 px-3 py-2 text-sm text-danger">{err}</div>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-hairline px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-btn border border-hairline px-4 py-2 text-sm font-medium text-fg-2 hover:bg-muted">
            Hủy
          </button>
          <button type="submit" disabled={busy} className="rounded-btn bg-accent px-5 py-2 text-sm font-semibold text-fg-inv hover:brightness-110 disabled:opacity-60">
            {busy ? 'Đang kiểm tra…' : 'Đăng nhập'}
          </button>
        </div>
      </form>
    </div>
  )
}
