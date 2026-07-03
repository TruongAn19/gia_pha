import { useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useMembers } from '../hooks/useMembers'
import FamilyTree from '../components/FamilyTree'
import MemberList from '../components/MemberList'
import MemberModal from '../components/MemberModal'
import AdminPanel from '../components/AdminPanel'
import LoginPopup from '../components/LoginPopup'

export default function Home() {
  const { isAdmin, signIn, signOut, adminUsername } = useAuth()
  const {
    members,
    loading,
    error,
    addMember,
    updateMember,
    deleteMember,
    uploadAvatar,
  } = useMembers()

  // Trạng thái giao diện
  // displayMode: 'tree' (cây D3) | 'list' (danh sách dọc). Mặc định Danh sách trên mobile.
  const [displayMode, setDisplayMode] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'list' : 'tree'
  )
  const [viewMode, setViewMode] = useState('collapsed') // 'collapsed' | 'full' (cho chế độ Cây)
  const [search, setSearch] = useState('')
  const [genFilter, setGenFilter] = useState('all')
  const [selected, setSelected] = useState(null) // member cho modal
  const [admin, setAdmin] = useState({ open: false, mode: 'add', member: null, parent: null })

  // Danh sách các đời có trong dữ liệu (cho dropdown)
  const generations = useMemo(() => {
    const set = new Set()
    members.forEach((m) => m.generation != null && set.add(m.generation))
    return [...set].sort((a, b) => a - b)
  }, [members])

  // Handlers admin
  const openAdd = (parent) => setAdmin({ open: true, mode: 'add', member: null, parent })
  const openEdit = (member) => setAdmin({ open: true, mode: 'edit', member, parent: null })
  const closeAdmin = () => setAdmin((a) => ({ ...a, open: false }))

  const handleSave = async (payload) => {
    // trả về bản ghi đã lưu để AdminPanel biết (vd chuyển Thêm -> Sửa)
    if (admin.mode === 'add') return await addMember(payload)
    return await updateMember(admin.member.id, payload)
  }
  // Sau khi THÊM xong: chuyển drawer sang SỬA người vừa tạo (không đóng, không tạo trùng)
  const handleAfterAdd = (savedMember) =>
    setAdmin({ open: true, mode: 'edit', member: savedMember, parent: null })

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-gp-cream">
      {/* ===== Header: thanh công cụ flex-wrap, tự xuống dòng nên KHÔNG đè nhau ===== */}
      <header className="z-20 flex flex-wrap items-center gap-2 border-b border-gp-brown/20 bg-gp-cream/95 px-3 py-2 shadow-sm">
        {/* Tiêu đề */}
        <div className="mr-auto flex items-baseline gap-2">
          <h1 className="text-base font-bold text-gp-red md:text-xl">Gia phả họ Ngô</h1>
          <span className="hidden text-xs text-gp-brown/70 sm:inline">
            Lương Bằng · Kim Động · Hưng Yên
          </span>
        </div>

        {/* Tìm kiếm (chiếm cả hàng trên mobile) */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Tìm theo tên…"
          className="w-full rounded-full border border-gp-brown/40 bg-white px-4 py-1.5 text-sm shadow-sm focus:border-gp-red focus:outline-none sm:w-52"
        />

        {/* Lọc đời */}
        <select
          value={genFilter}
          onChange={(e) => setGenFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="rounded-full border border-gp-brown/40 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-gp-red focus:outline-none"
        >
          <option value="all">Tất cả các đời</option>
          {generations.map((g) => (
            <option key={g} value={g}>
              Đời {g}
            </option>
          ))}
        </select>

        {/* Toggle Cây / Danh sách */}
        <button
          onClick={() => setDisplayMode((d) => (d === 'tree' ? 'list' : 'tree'))}
          className="rounded-full border border-gp-brown/40 bg-white px-3 py-1.5 text-sm font-medium text-gp-brown shadow-sm hover:bg-gp-gold/10"
          title="Đổi cách hiển thị"
        >
          {displayMode === 'tree' ? '☰ Danh sách' : '🌳 Dạng cây'}
        </button>

        {/* Toggle thu gọn/toàn bộ — chỉ ở chế độ Cây */}
        {displayMode === 'tree' && (
          <button
            onClick={() => setViewMode((v) => (v === 'collapsed' ? 'full' : 'collapsed'))}
            className="rounded-full bg-gp-red px-3 py-1.5 text-sm font-semibold text-gp-gold shadow transition hover:brightness-110"
          >
            {viewMode === 'collapsed' ? 'Xem toàn bộ' : 'Thu gọn'}
          </button>
        )}

        {/* Đăng xuất */}
        {isAdmin && (
          <button
            onClick={signOut}
            className="rounded-full border border-gp-brown/40 bg-white px-3 py-1.5 text-sm text-gp-brown shadow-sm hover:bg-white"
          >
            Đăng xuất
          </button>
        )}
      </header>

      {/* ===== Vùng nội dung (Cây hoặc Danh sách) ===== */}
      <main className="relative min-h-0 flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center text-gp-brown">
            Đang tải gia phả…
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-gp-red">
            <div>Lỗi tải dữ liệu: {error}</div>
            <div className="text-xs text-gp-brown">Kiểm tra lại .env và kết nối Supabase.</div>
          </div>
        ) : members.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gp-brown">
            Chưa có dữ liệu thành viên.
          </div>
        ) : displayMode === 'list' ? (
          <MemberList
            members={members}
            isAdmin={isAdmin}
            searchTerm={search}
            generationFilter={genFilter}
            onSelect={setSelected}
            onEdit={openEdit}
            onAdd={openAdd}
          />
        ) : (
          <FamilyTree
            members={members}
            viewMode={viewMode}
            isAdmin={isAdmin}
            searchTerm={search}
            generationFilter={genFilter}
            onSelect={setSelected}
            onEdit={openEdit}
            onAdd={openAdd}
          />
        )}
      </main>

      {/* ===== Modal chi tiết ===== */}
      <MemberModal member={selected} onClose={() => setSelected(null)} />

      {/* ===== Drawer quản trị ===== */}
      <AdminPanel
        open={admin.open}
        mode={admin.mode}
        member={admin.member}
        parent={admin.parent}
        onClose={closeAdmin}
        onSave={handleSave}
        onDelete={deleteMember}
        onAfterAdd={handleAfterAdd}
        uploadAvatar={uploadAvatar}
      />

      {/* ===== Đăng nhập (chỉ hiện khi chưa đăng nhập) ===== */}
      {!isAdmin && <LoginPopup onSignIn={signIn} adminUsername={adminUsername} />}

      {/* Thống kê nhỏ góc dưới trái */}
      {!loading && !error && (
        <div className="absolute bottom-3 left-3 z-10 rounded bg-white/70 px-2 py-1 text-[11px] text-gp-brown shadow">
          {members.length} thành viên · {generations.length} đời
        </div>
      )}
    </div>
  )
}
