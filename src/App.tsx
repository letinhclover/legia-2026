import { useEffect, useState, useCallback, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase';
import { Member, AuthUser } from './types';


import BottomNav, { TabId } from './components/BottomNav';
import BottomSheet from './components/BottomSheet';
const MemberBottomSheet = lazy(() => import('./components/MemberBottomSheet'));
const MemberForm = lazy(() => import('./components/MemberForm'));
const StatsPanel = lazy(() => import('./components/StatsPanel'));
const MemorialPage = lazy(() => import('./components/MemorialPage'));
const GraveMap = lazy(() => import('./components/GraveMap'));
import PWAInstallPrompt from './components/PWAInstallPrompt';
import NotificationBanner from './components/NotificationBanner';

const TreeTab = lazy(() => import('./tabs/TreeTab'));
const DirectoryTab = lazy(() => import('./tabs/DirectoryTab'));
const EventsTab = lazy(() => import('./tabs/EventsTab'));
const SettingsTab = lazy(() => import('./tabs/SettingsTab'));

const SUPER_ADMIN_EMAILS = ['letinhclover@gmail.com'];
const EDITOR_EMAILS      = ['quanlylegia2026@gmail.com'];
const ALL_AUTH_EMAILS    = [...SUPER_ADMIN_EMAILS, ...EDITOR_EMAILS];
const TAB_ORDER: TabId[] = ['tree', 'directory', 'events', 'settings'];

const tabVariants = {
  enter:  (d: number) => ({ x: d > 0 ? '30%' : '-30%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d: number) => ({ x: d < 0 ? '30%' : '-30%', opacity: 0 }),
};

type ToastType = 'success' | 'error' | 'info';
interface Toast { msg: string; type: ToastType }
const TOAST_COLORS: Record<ToastType, string> = {
  success: '#16a34a', error: '#DC2626', info: '#1D4ED8',
};

export default function App() {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('tree');
  const [prevTab, setPrevTab]     = useState<TabId>('tree');

  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [isFormOpen, setIsFormOpen]       = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [filterGen, setFilterGen]         = useState<number | 'all'>('all');
  const [showStats, setShowStats]         = useState(false);
  const [showMemorial, setShowMemorial]   = useState(false);
  const [showGraveMap, setShowGraveMap]   = useState(false);

  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = useCallback((msg: string, type: ToastType = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try { return localStorage.getItem('darkMode') === 'true'; } catch { return false; }
  });
  const toggleDark = useCallback(() => {
    setDarkMode(d => {
      const next = !d;
      try { localStorage.setItem('darkMode', String(next)); } catch {}
      showToast(next ? '🌙 Chế độ tối đã bật' : '☀️ Chế độ sáng đã bật', 'info');
      return next;
    });
  }, [showToast]);

  // ── Phân quyền ────────────────────────────────────────────────────────────
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user?.email ?? '');
  const isEditor     = EDITOR_EMAILS.includes(user?.email ?? '');
  const canEdit      = isSuperAdmin || isEditor;
  const isAdmin      = isSuperAdmin;
  const direction    = TAB_ORDER.indexOf(activeTab) - TAB_ORDER.indexOf(prevTab);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let prevUser: any = null;
    return onAuthStateChanged(auth, u => {
      const email = u?.email ?? '';
      if (u && !prevUser && ALL_AUTH_EMAILS.includes(email)) {
        const role = SUPER_ADMIN_EMAILS.includes(email) ? 'Super Admin' : 'Biên tập viên';
        showToast(`✅ Đăng nhập thành công (${role})`, 'success');
      }
      prevUser = u;
      setUser(u ? { uid: u.uid, email: u.email, displayName: u.displayName } : null);
      setLoading(false);
    });
  }, []);

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadMembers = useCallback(async () => {
    const snap = await getDocs(collection(db, 'members'));
    setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Member[]);
  }, []);
  useEffect(() => { if (!loading) loadMembers(); }, [loading]);

  // ── Deeplink: ?member=ID → tự động mở chi tiết thành viên ────────────────
  useEffect(() => {
    if (members.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const memberId = params.get('member');
    if (memberId) {
      const found = members.find(m => m.id === memberId);
      if (found) {
        setViewingMember(found);
        // Xóa param khỏi URL mà không reload trang
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [members]);

  const handleTabChange = (tab: TabId) => { setPrevTab(activeTab); setActiveTab(tab); };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleSave = async (memberData: Partial<Member>) => {
    try {
      const payload: any = { ...memberData };
      if (payload.birthYear)  payload.birthYear  = Number(payload.birthYear);
      if (payload.deathYear)  payload.deathYear  = Number(payload.deathYear);
      if (payload.generation) payload.generation = Number(payload.generation);

      const id = payload.id; delete payload.id;
      let savedId = id;

      if (id) {
        await updateDoc(doc(db, 'members', id), payload);
        setMembers(prev => prev.map(m => m.id === id ? { ...m, ...payload, id } as Member : m));
        showToast('✅ Đã cập nhật thành viên!', 'success');
      } else {
        const ref = await addDoc(collection(db, 'members'), {
          ...payload, createdAt: new Date().toISOString(),
        });
        savedId = ref.id;
        // Thêm thành viên mới vào state ngay lập tức để cây gia phả cập nhật
        setMembers(prev => [...prev, { ...payload, id: savedId, generation: Number(payload.generation || 1) } as Member]);
        showToast('✅ Đã thêm thành viên mới!', 'success');
      }

      // Đồng bộ vợ/chồng
      if (payload.spouseId && savedId) {
        try {
          await updateDoc(doc(db, 'members', payload.spouseId), { spouseId: savedId });
          setMembers(prev => prev.map(m =>
            m.id === payload.spouseId ? { ...m, spouseId: savedId } : m
          ));
        } catch {}
      }
      const prevM = members.find(m => m.id === id);
      if (prevM?.spouseId && prevM.spouseId !== payload.spouseId) {
        try {
          await updateDoc(doc(db, 'members', prevM.spouseId), { spouseId: null });
          setMembers(p2 => p2.map(m =>
            m.id === prevM.spouseId ? { ...m, spouseId: null } : m
          ));
        } catch {}
      }

      setIsFormOpen(false); setEditingMember(null);
    } catch (e) {
      console.error(e);
      showToast('❌ Lỗi khi lưu thông tin!', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xác nhận xóa thành viên này?')) return;
    try {
      const member = members.find(m => m.id === id);
      if (member?.spouseId) {
        try { await updateDoc(doc(db, 'members', member.spouseId), { spouseId: null }); } catch {}
      }
      await deleteDoc(doc(db, 'members', id));
      setViewingMember(null);
      setMembers(prev => prev.filter(m => m.id !== id));
      showToast('🗑️ Đã xóa thành viên', 'info');
    } catch {
      showToast('❌ Lỗi khi xóa!', 'error');
    }
  };

  const handleEdit = (member: Member) => {
    setViewingMember(null);
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleImportMembers = async (data: Partial<Member>[]) => {
    try {
      for (const m of data) {
        const payload: any = { ...m };
        if (payload.birthYear)  payload.birthYear  = Number(payload.birthYear);
        if (payload.generation) payload.generation = Number(payload.generation);
        if (payload.id) {
          const { id, ...rest } = payload;
          try { await updateDoc(doc(db, 'members', id), rest); }
          catch { await addDoc(collection(db, 'members'), { ...rest, createdAt: new Date().toISOString() }); }
        } else {
          await addDoc(collection(db, 'members'), { ...payload, createdAt: new Date().toISOString() });
        }
      }
      await loadMembers();
      showToast(`✅ Đã nhập ${data.length} thành viên!`, 'success');
    } catch {
      showToast('❌ Lỗi khi nhập dữ liệu!', 'error');
    }
  };

  // ── Theme ─────────────────────────────────────────────────────────────────
  const appBg    = darkMode ? '#111214' : '#f8fafc';
  const headerBg = darkMode
    ? 'linear-gradient(90deg, #1a0000 0%, #3d0020 100%)'
    : 'linear-gradient(90deg, #CC0000 0%, #dd2476 100%)';

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'linear-gradient(90deg, #CC0000 0%, #dd2476 100%)' }}>
      <div className="text-center text-white px-8">
        <motion.div
          animate={{ scale: [1, 1.07, 1] }}
          transition={{ repeat: Infinity, duration: 2.2 }}
          className="text-7xl mb-5"
        >🏛️</motion.div>
        <h1 className="text-2xl font-black" style={{ fontFamily: "'Roboto', sans-serif" }}>
          Gia Phả Dòng Họ Lê
        </h1>
        <p className="text-sm mt-2 opacity-60" style={{ fontFamily: "'Roboto', sans-serif" }}>
          Truyền thống · Đoàn kết · Phát triển
        </p>
        <motion.div
          className="mt-6 mx-auto rounded-full"
          style={{ width: 40, height: 3, background: 'rgba(255,255,255,0.3)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: '#D4AF37' }}
            animate={{ width: ['0%', '100%', '0%'] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </div>
  );

  const maxGen = members.length > 0 ? Math.max(...members.map(m => m.generation || 1)) : 1;

  return (
    <div className="fixed inset-0 flex flex-col"
      style={{ background: appBg, fontFamily: "'Roboto', sans-serif" }}>

      {/* ════ HEADER ════ */}
      <div className="flex-shrink-0 safe-top" style={{ background: headerBg }}>
        <div className="flex items-center gap-3 px-4" style={{ height: 58 }}>

          {/* Logo */}
          <div
            className="flex items-center justify-center rounded-xl font-black text-white flex-shrink-0"
            style={{
              width: 40, height: 40,
              background: 'rgba(0,0,0,0.25)',
              fontFamily: "'Roboto', sans-serif",
              fontSize: 17,
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              letterSpacing: '-1px',
            }}
          >
            Lê
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h1
              className="font-bold text-white leading-none"
              style={{
                fontFamily: "'Roboto', sans-serif",
                fontWeight: 900,
                fontSize: 15,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Gia Phả Dòng Họ Lê
            </h1>
            <p
              className="font-medium mt-0.5 leading-none"
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.75)',
                whiteSpace: 'nowrap',
                fontFamily: "'Roboto', sans-serif",
              }}
            >
              {members.length} thành viên · {maxGen} đời
            </p>
          </div>

          {/* Phần phải: filter + darkMode toggle + badge */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Filter đời — chỉ ở tab Tree */}
            {activeTab === 'tree' && (
              <select
                aria-label="Lọc theo đời"
                value={filterGen}
                onChange={e => setFilterGen(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                style={{
                  background: 'rgba(0,0,0,0.28)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.22)',
                  borderRadius: 10,
                  padding: '4px 8px',
                  fontSize: 11,
                  fontFamily: "'Roboto', sans-serif",
                  fontWeight: 600,
                  outline: 'none',
                  maxWidth: 92,
                }}
              >
                <option value="all">Tất cả đời</option>
                {Array.from({ length: maxGen }, (_, i) => i + 1).map(g => (
                  <option key={g} value={g}>Đời {g}</option>
                ))}
              </select>
            )}

            {/* ── NÚT DARK MODE — emoji thuần như HTML mẫu ── */}
            <button
              onClick={toggleDark}
              aria-label={darkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
              style={{
                background: 'none', border: 'none',
                color: '#fff', fontSize: 20,
                cursor: 'pointer', padding: '5px',
                lineHeight: 1,
              }}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* Badge phân quyền */}
            {canEdit && (
              <div
                className="font-black rounded-full flex-shrink-0"
                style={{
                  fontSize: 12,
                  padding: '3px 9px',
                  whiteSpace: 'nowrap',
                  ...(isSuperAdmin
                    ? { background: '#D4AF37', color: '#0b0b0b' }
                    : { background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }
                  ),
                }}
              >
                {isSuperAdmin ? '⭐ ADMIN' : '✏️ EDITOR'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.msg}
            initial={{ y: -56, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -56, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-20 left-4 right-4 z-[100] px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-center text-white"
            style={{
              background: TOAST_COLORS[toast.type],
              fontFamily: "'Roboto', sans-serif",
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Notification Banner — ngày giỗ / sinh nhật sắp tới ── */}
      <NotificationBanner
        members={members}
        darkMode={darkMode}
        onSelectMember={setViewingMember}
      />

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeTab} custom={direction} variants={tabVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', stiffness: 360, damping: 36, mass: 0.85 }}
            className="absolute inset-0"
          >
            {activeTab === 'tree' && (
              <TreeTab
                members={members} filterGen={filterGen}
                isAdmin={canEdit}
                onNodeClick={setViewingMember}
                onAddMember={canEdit ? () => { setEditingMember(null); setIsFormOpen(true); } : undefined}
                darkMode={darkMode}
                onRefresh={loadMembers}
              />
            )}
            {activeTab === 'directory' && (
              <DirectoryTab
                members={members}
                onSelectMember={setViewingMember}
                onEditMember={canEdit ? (m) => {
                  setEditingMember(m);
                  setIsFormOpen(true);
                } : undefined}
                onShowTree={(m) => {
                  // Chuyển sang tab Tree và highlight thành viên đó
                  handleTabChange('tree');
                  // Delay nhỏ để tab animation xong rồi mới mở detail
                  setTimeout(() => setViewingMember(m), 350);
                }}
                darkMode={darkMode}
              />
            )}
            {activeTab === 'events' && (
              <EventsTab members={members} onSelectMember={setViewingMember} darkMode={darkMode} />
            )}
            {activeTab === 'settings' && (
              <SettingsTab
                user={user} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin}
                canEdit={canEdit}
                members={members} adminEmails={ALL_AUTH_EMAILS}
                onShowStats={() => setShowStats(true)}
                onShowMemorial={() => setShowMemorial(true)}
                onShowGraveMap={() => setShowGraveMap(true)}
                onImportMembers={handleImportMembers}
                darkMode={darkMode}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom Nav ── */}
      <BottomNav active={activeTab} onChange={handleTabChange} darkMode={darkMode} />

      {/* ── Bottom Sheets ── */}
      <BottomSheet isOpen={!!viewingMember} onClose={() => setViewingMember(null)} height="90vh">
        {viewingMember && (
          <MemberBottomSheet
            member={viewingMember} members={members}
            onSelectMember={setViewingMember}
            onClose={() => setViewingMember(null)}
            onEdit={handleEdit} isAdmin={canEdit}
            darkMode={darkMode}
          />
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={canEdit && isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingMember(null); }}
        height="95vh"
      >
        {canEdit && (
          <MemberForm
            isOpen={isFormOpen}
            onClose={() => { setIsFormOpen(false); setEditingMember(null); }}
            onSave={handleSave} onDelete={handleDelete}
            members={members} editingMember={editingMember}
            isAdmin={canEdit} isSuperAdmin={isSuperAdmin}
            darkMode={darkMode}
          />
        )}
      </BottomSheet>

      <BottomSheet isOpen={showGraveMap} onClose={() => setShowGraveMap(false)} height="90vh">
        <GraveMap
          members={members} onClose={() => setShowGraveMap(false)}
          onViewMember={m => { setViewingMember(m); setShowGraveMap(false); }}
          darkMode={darkMode}
        />
      </BottomSheet>

      {showStats && (
        <StatsPanel members={members} onClose={() => setShowStats(false)} darkMode={darkMode} />
      )}
      {showMemorial && (
        <MemorialPage
          members={members} onClose={() => setShowMemorial(false)}
          onViewMember={m => { setViewingMember(m); setShowMemorial(false); }}
          darkMode={darkMode}
        />
      )}

      <PWAInstallPrompt />
    </div>
  );
}
