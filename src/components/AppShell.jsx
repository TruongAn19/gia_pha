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
import { addMember, updateMember, allMembers, getChildrenInfo } from '../data/genealogy'
import { NAV_TITLE } from './nav'

/**
 * Khung giao diện chung: Sidebar (desktop) / BottomTabBar (mobile) + nội dung.
 * Quản lý: điều hướng, mở Hồ sơ đầy đủ, và Modal Thêm/Sửa.
 */
export default function AppShell() {
  const { isAdmin, signIn, signOut, adminUsername } = useAuth()
  const [active, setActive] = useState('tree')
  const [profileId, setProfileId] = useState(null)
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

  const handleSubmit = (payload) => {
    if (modal.mode === 'add') {
      addMember(payload)
    } else {
      updateMember(modal.member.id_temp, payload)
    }
    closeModal()
    setDataVersion((v) => v + 1) // làm mới các trang
  }

  // CHỈ admin mới có onAdd/onEdit -> component ẩn nút Thêm/Sửa khi thiếu handler
  const adminHandlers = isAdmin ? { onAdd: openAdd, onEdit: openEdit } : {}
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
