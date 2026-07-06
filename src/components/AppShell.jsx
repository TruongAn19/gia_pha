import { useEffect, useMemo, useState } from 'react'
import Sidebar from './Sidebar'
import BottomTabBar from './BottomTabBar'
import TreeListPage from '../pages/TreeListPage'
import MembersTablePage from '../pages/MembersTablePage'
import ProfilePage from '../pages/ProfilePage'
import MissingDataPage from '../pages/MissingDataPage'
import OverviewPage from '../pages/OverviewPage'
import EventsPage from '../pages/EventsPage'
import ArticlesPage from '../pages/ArticlesPage'
import AddEditModal from './AddEditModal'
import LoginModal from './LoginModal'
import Icon from './ui/Icon'
import { useAuth } from '../hooks/useAuth'
import { useMembers } from '../hooks/useMembers'
import { loadMembers, allMembers, getChildrenInfo } from '../data/genealogy'
import { NAV_TITLE } from './nav'

// Cột thật trong bảng members (Supabase) — chỉ ghi các field này.
const MEMBER_COLUMNS = [
  'name',
  'han_name',
  'generation',
  'death_anniversary',
  'grave',
  'details',
  'photo_url',
  'is_deceased',
  'birth_year',
  'death_year',
  'gender',
]

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value)
}

/**
 * Khung giao diện chung: Sidebar (desktop) / BottomTabBar (mobile) + nội dung.
 * Quản lý: điều hướng, mở Hồ sơ đầy đủ, và Modal Thêm/Sửa.
 */
export default function AppShell() {
  const { isAdmin, signIn, signOut, adminUsername } = useAuth()
  const {
    members: dbMembers,
    loading: membersLoading,
    error: membersError,
    addMember: sbAddMember,
    updateMember: sbUpdateMember,
  } = useMembers()
  const [active, setActive] = useState(() => {
    try {
      return localStorage.getItem('activeTab') || 'tree'
    } catch {
      return 'tree'
    }
  })
  const [profileId, setProfileId] = useState(() => {
    try {
      return localStorage.getItem('profileId') || null
    } catch {
      return null
    }
  })

  // Ghi nhớ vị trí điều hướng để F5 vẫn ở đúng trang / hồ sơ đang xem
  useEffect(() => {
    try {
      localStorage.setItem('activeTab', active)
    } catch {
      /* ignore */
    }
  }, [active])
  useEffect(() => {
    try {
      if (profileId) localStorage.setItem('profileId', profileId)
      else localStorage.removeItem('profileId')
    } catch {
      /* ignore */
    }
  }, [profileId])
  const [treeFocus, setTreeFocus] = useState(null) // mở cây tại 1 người (từ "Xem trên cây")
  const [modal, setModal] = useState(null) // {mode:'add'|'edit', parent, member}
  const [loginOpen, setLoginOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem('sidebarCollapsed') === '1'
  )
  const toggleSidebar = () =>
    setSidebarCollapsed((v) => {
      const next = !v
      try {
        localStorage.setItem('sidebarCollapsed', next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  const [dataVersion, setDataVersion] = useState(0) // bump để làm mới UI sau khi sửa data

  // Nạp dữ liệu từ Supabase vào store dùng chung (genealogy) mà mọi trang đang đọc.
  // Map id -> id_temp, parent_id -> parent_id_temp cho khớp các hàm hiện có.
  useEffect(() => {
    if (membersLoading) return
    if (membersError || !dbMembers.length) return
    loadMembers(dbMembers.map((m) => ({ ...m, id_temp: m.id, parent_id_temp: m.parent_id })))
    // Bỏ hồ sơ đang mở nếu id không còn khớp dữ liệu Supabase
    setProfileId((pid) => (pid && !dbMembers.some((m) => m.id === pid) ? null : pid))
    setDataVersion((v) => v + 1)
  }, [dbMembers, membersLoading, membersError])

  const go = (key) => {
    setProfileId(null)
    setActive(key)
  }
  const viewOnTree = (id) => {
    setProfileId(null)
    setTreeFocus(id)
    setActive('tree')
  }
  const openAdd = (parent = null) => setModal({ mode: 'add', parent, member: null })
  const openEdit = (member) => setModal({ mode: 'edit', parent: null, member })
  const closeModal = () => setModal(null)

  const handleSubmit = async (payload) => {
    // Chỉ gửi các cột có thật trong bảng members
    const row = {}
    for (const k of MEMBER_COLUMNS) if (payload[k] !== undefined) row[k] = payload[k]
    try {
      if (modal.mode === 'add') {
        const parentId = modal.parent?.id ?? payload.parent_id_temp ?? null
        if (parentId && !isUuid(parentId)) {
          throw new Error('Khong the luu: than phu chua co UUID Supabase.')
        }
        row.parent_id = parentId
        await sbAddMember(row)
      } else {
        const memberId = modal.member?.id ?? modal.member?.id_temp
        if (!isUuid(memberId)) {
          throw new Error('Khong the luu: thanh vien nay chua co UUID Supabase.')
        }
        await sbUpdateMember(memberId, row)
      }
    } catch (e) {
      alert('Lưu thất bại: ' + (e?.message || e))
      return
    }
    closeModal()
    // store + dataVersion tự cập nhật qua effect [dbMembers] ở trên
  }

  // CHỈ admin mới có onAdd/onEdit -> component ẩn nút Thêm/Sửa khi thiếu handler
  const canWriteMembers = isAdmin && !membersLoading && !membersError && dbMembers.length > 0
  const adminHandlers = canWriteMembers ? { onAdd: openAdd, onEdit: openEdit } : {}
  const pageProps = { onOpenProfile: setProfileId, ...adminHandlers }

  // LỐI VÀO ĐĂNG NHẬP ẨN — người xem không thấy nút nào.
  // Chỉ người có tài khoản biết: mở bằng URL bí mật (#quantri) hoặc phím Ctrl+Shift+L.
  useEffect(() => {
    const SECRET = ['#quantri', '#admin', '#dangnhap']
    const checkHash = () => {
      if (SECRET.includes(window.location.hash.toLowerCase())) {
        setLoginOpen(true)
        // xoá hash để URL sạch, không lưu vết
        history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
        e.preventDefault()
        setLoginOpen(true)
      }
    }
    checkHash()
    window.addEventListener('hashchange', checkHash)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('hashchange', checkHash)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  // đếm "Cần bổ sung" cho badge sidebar (tính lại sau mỗi lần sửa data)
  const missingCount = useMemo(
    () => allMembers().filter((m) => getChildrenInfo(m.id_temp).dataQuality.missingSonRecords).length,
    [dataVersion]
  )

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface text-fg">
      <div className="hidden md:block">
        <Sidebar
          active={active}
          onNavigate={go}
          badges={{ missing: missingCount }}
          isAdmin={isAdmin}
          onLogout={signOut}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      </div>

      <main className="relative min-h-0 flex-1 overflow-hidden">
        {/* Cây gia phả: LUÔN mounted, chỉ ẩn/hiện -> giữ nguyên cuộn + nhánh đang mở */}
        <div className={!profileId && active === 'tree' ? 'h-full' : 'hidden'}>
          <TreeListPage focusId={treeFocus} dataVersion={dataVersion} {...pageProps} />
        </div>

        {profileId ? (
          <ProfilePage
            key={`p-${profileId}-${dataVersion}`}
            memberId={profileId}
            onBack={() => setProfileId(null)}
            onOpenProfile={setProfileId}
            onViewOnTree={viewOnTree}
            {...adminHandlers}
          />
        ) : active === 'overview' ? (
          <OverviewPage dataVersion={dataVersion} />
        ) : active === 'members' ? (
          <MembersTablePage dataVersion={dataVersion} {...pageProps} />
        ) : active === 'events' ? (
          <EventsPage onOpenProfile={setProfileId} canEdit={isAdmin} dataVersion={dataVersion} />
        ) : active === 'history' ? (
          <ArticlesPage canEdit={isAdmin} dataVersion={dataVersion} />
        ) : active === 'missing' && isAdmin ? (
          <MissingDataPage key={`x-${dataVersion}`} onOpenProfile={setProfileId} onAdd={adminHandlers.onAdd} />
        ) : active !== 'tree' ? (
          <PlaceholderScreen title={NAV_TITLE[active]} />
        ) : null}
      </main>

      <div className="md:hidden">
        <BottomTabBar active={active} onNavigate={go} />
      </div>

      {/* Mobile: CHỈ admin mới thấy nút Đăng xuất (người xem không thấy gì) */}
      {isAdmin && (
        <button
          onClick={signOut}
          className="fixed right-3 z-40 flex items-center gap-1.5 rounded-full border border-hairline bg-card/95 px-3 py-1.5 text-xs font-medium text-fg-2 shadow-sm md:hidden"
          style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <Icon name="close" size={14} /> Đăng xuất
        </button>
      )}

      <AddEditModal
        open={!!modal}
        mode={modal?.mode}
        parent={modal?.parent}
        member={modal?.member}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSignIn={signIn} adminUsername={adminUsername} />
    </div>
  )
}

function PlaceholderScreen({ title }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted font-han text-2xl text-accent">
        吳
      </div>
      <h1 className="mt-5 font-heading text-3xl text-fg">{title}</h1>
      <p className="mt-2 max-w-md text-fg-2">Màn này sẽ được dựng ở các bước sau (DESIGN_NOTES §5).</p>
      <div className="h-24 md:hidden" />
    </div>
  )
}
