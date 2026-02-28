import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase';
import { Member, AuthUser } from './types';

import BottomNav, { TabId } from './components/BottomNav';
import BottomSheet from './components/BottomSheet';
import MemberBottomSheet from './components/MemberBottomSheet';
import MemberForm from './components/MemberForm';
import StatsPanel from './components/StatsPanel';
import MemorialPage from './components/MemorialPage';
import GraveMap from './components/GraveMap';
import PWAInstallPrompt from './components/PWAInstallPrompt';

import TreeTab from './tabs/TreeTab';
import DirectoryTab from './tabs/DirectoryTab';
import EventsTab from './tabs/EventsTab';
import SettingsTab from './tabs/SettingsTab';

const ADMIN_EMAILS = ['letinhclover@gmail.com'];
const TAB_ORDER: TabId[] = ['tree', 'directory', 'events', 'settings'];

const tabVariants = {
  enter: (d: number) => ({ x: d > 0 ? '35%' : '-35%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (d: number) => ({ x: d < 0 ? '35%' : '-35%', opacity: 0 }),
};

// ── Toast types ───────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';
interface Toast { msg: string; type: ToastType }

const TOAST_COLORS: Record<ToastType, string> = {
  success: '#16a34a',
  error:   '#DC2626',
  info:    '#2563EB',
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

  // ── Toast ───────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = useCallback((msg: string, type: ToastType = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Dark mode — lưu localStorage ────────────────────────────────────────
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try { return localStorage.getItem('darkMode') === 'true'; } catch { return false; }
  });
  const toggleDark = useCallback(() => {
    setDarkMode(d => {
      const next = !d;
      try { localStorage.setItem('darkMode', String(next)); } catch {}
      showToast(next ? '🌙 Đã bật chế độ tối' : '☀️ Đã bật chế độ sáng', 'info');
      return next;
    });
  }, [showToast]);

  const isAdmin   = ADMIN_EMAILS.includes(user?.email || '');
  const direction = TAB_ORDER.indexOf(activeTab) - TAB_ORDER.indexOf(prevTab);

  // ── Auth ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let prevUser: any = null;
    return onAuthStateChanged(auth, u => {
      if (u && !prevUser && ADMIN_EMAILS.includes(u.email || ''))
        showToast('✅ Đăng nhập thành công!', 'success');
      prevUser = u;
      setUser(u ? { uid: u.uid, email: u.email, displayName: u.displayName } : null);
      setLoading(false);
    });
  }, []);

  // ── Load members ─────────────────────────────────────────────────────────
  const loadMembers = useCallback(async () => {
    const snap = await getDocs(collection(db, 'members'));
    setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Member[]);
  }, []);
  useEffect(() => { if (!loading) loadMembers(); }, [loading]);

  const handleTabChange = (tab: TabId) => { setPrevTab(activeTab); setActiveTab(tab); };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleSave = async (memberData: Partial<Member>) => {
    try {
      const payload = { ...memberData };
      const id = payload.id;
      delete (payload as any).id;
      let savedId = id;

      if (id) {
        await updateDoc(doc(db, 'members', id), payload);
        setMembers(prev => prev.map(m => m.id === id ? { ...m, ...payload, id } as Member : m));
        showToast('✅ Đã cập nhật thông tin thành viên!', 'success');
      } else {
        const ref = await addDoc(collection(db, 'members'), { ...payload, createdAt: new Date().toISOString() });
        savedId = ref.id;
        setMembers(prev => [...prev, { ...payload, id: savedId } as Member]);
        showToast('✅ Đã thêm thành viên mới!', 'success');
      }

      // Đồng bộ vợ/chồng 2 chiều
      if (payload.spouseId && savedId) {
        try {
          await updateDoc(doc(db, 'members', payload.spouseId), { spouseId: savedId });
          setMembers(prev => prev.map(m => m.id === payload.spouseId ? { ...m, spouseId: savedId } : m));
        } catch {}
      }
      const prev = members.find(m => m.id === id);
      if (prev?.spouseId && prev.spouseId !== payload.spouseId) {
        try {
          await updateDoc(doc(db, 'members', prev.spouseId), { spouseId: null });
          setMembers(prev2 => prev2.map(m => m.id === prev.spouseId ? { ...m, spouseId: null } : m));
        } catch {}
      }
      loadMembers();
      setIsFormOpen(false);
      setEditingMember(null);
    } catch {
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
      await loadMembers();
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
        if (m.id) {
          const { id, ...payload } = m as any;
          try { await updateDoc(doc(db, 'members', id), payload); }
          catch { await addDoc(collection(db, 'members'), { ...payload, createdAt: new Date().toISOString() }); }
        } else {
          const { id: _id, ...payload } = m as any;
          await addDoc(collection(db, 'members'), { ...payload, createdAt: new Date().toISOString() });
        }
      }
      await loadMembers();
      showToast(`✅ Đã nhập ${data.length} thành viên!`, 'success');
    } catch {
      showToast('❌ Lỗi khi nhập Excel!', 'error');
    }
  };

  // ── Theme colors ──────────────────────────────────────────────────────────
  const appBg     = darkMode ? '#0f1724' : '#F8F9FA';
  const headerBg  = darkMode
    ? 'linear-gradient(135deg, #1a0a0a 0%, #2d1010 100%)'
    : 'linear-gradient(135deg, #800000 0%, #5C0000 100%)';
  const subText   = darkMode ? '#fbbf24cc' : undefined;

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center"
      style={{ background: darkMode ? '#0f1724' : 'linear-gradient(160deg, #800000 0%, #2D0000 100%)' }}>
      <div className="text-center text-white px-8">
        <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 2 }}
          className="text-7xl mb-6">🏛️</motion.div>
        <h1 className="text-2xl font-black tracking-tight">Gia Phả Dòng Họ Lê</h1>
        <p className="text-sm mt-2 opacity-60">Truyền thống · Đoàn kết · Phát triển</p>
        <div className="mt-8 flex justify-center gap-1.5">
          {[0,1,2].map(i => (
            <motion.div key={i} className="w-2 h-2 bg-yellow-400 rounded-full"
              animate={{ opacity: [0.3,1,0.3] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.3 }} />
          ))}
        </div>
      </div>
    </div>
  );

  const maxGen = Math.max(...members.map(m => m.generation), 1);

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: appBg, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex-shrink-0 safe-top" style={{ background: headerBg }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #B8860B, #8B6914)', fontFamily: 'serif', fontSize: 16 }}>
            Lê
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-sm leading-tight">Gia Phả Dòng Họ Lê</h1>
            <p className="text-xs opacity-80" style={{ color: subText ?? '#fbbf24' }}>
              {members.length} thành viên · {maxGen} đời
            </p>
          </div>

          {/* Filter đời — chỉ hiện khi đang ở tab cây */}
          {activeTab === 'tree' && (
            <select value={filterGen}
              onChange={e => setFilterGen(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="text-xs rounded-lg px-2 py-1.5 focus:outline-none flex-shrink-0"
              style={{
                background: 'rgba(0,0,0,0.3)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
              <option value="all">Tất cả đời</option>
              {Array.from({ length: maxGen }, (_, i) => i + 1).map(g => (
                <option key={g} value={g}>Đời {g}</option>
              ))}
            </select>
          )}

          {isAdmin && (
            <div className="flex-shrink-0 bg-yellow-400 text-black text-xs font-black px-2 py-0.5 rounded-full">
              ADMIN
            </div>
          )}
        </div>
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.msg}
            initial={{ y: -60, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="fixed top-20 left-4 right-4 z-[100] px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-center text-white"
            style={{ background: TOAST_COLORS[toast.type] }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tabs ── */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={activeTab} custom={direction} variants={tabVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.8 }}
            className="absolute inset-0">

            {activeTab === 'tree' && (
              <TreeTab
                members={members}
                filterGen={filterGen}
                isAdmin={isAdmin}
                onNodeClick={setViewingMember}
                onAddMember={() => { setEditingMember(null); setIsFormOpen(true); }}
                darkMode={darkMode}
                onToggleDark={toggleDark}
              />
            )}
            {activeTab === 'directory' && (
              <DirectoryTab members={members} onSelectMember={setViewingMember} />
            )}
            {activeTab === 'events' && (
              <EventsTab members={members} onSelectMember={setViewingMember} />
            )}
            {activeTab === 'settings' && (
              <SettingsTab
                user={user} isAdmin={isAdmin} members={members}
                adminEmails={ADMIN_EMAILS}
                onShowStats={() => setShowStats(true)}
                onShowMemorial={() => setShowMemorial(true)}
                onShowGraveMap={() => setShowGraveMap(true)}
                onImportMembers={handleImportMembers}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom Nav ── */}
      <BottomNav active={activeTab} onChange={handleTabChange} darkMode={darkMode} />

      {/* ── Sheet: Chi tiết thành viên ── */}
      <BottomSheet isOpen={!!viewingMember} onClose={() => setViewingMember(null)} height="90vh">
        {viewingMember && (
          <MemberBottomSheet
            member={viewingMember} members={members}
            onClose={() => setViewingMember(null)}
            onEdit={handleEdit} isAdmin={isAdmin}
          />
        )}
      </BottomSheet>

      {/* ── Sheet: Form thêm/sửa ── */}
      <BottomSheet isOpen={isAdmin && isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingMember(null); }} height="95vh">
        {isAdmin && (
          <MemberForm isOpen={isFormOpen}
            onClose={() => { setIsFormOpen(false); setEditingMember(null); }}
            onSave={handleSave} onDelete={handleDelete}
            members={members} editingMember={editingMember} isAdmin={isAdmin} />
        )}
      </BottomSheet>

      {/* ── Sheet: Bản đồ mộ phần ── */}
      <BottomSheet isOpen={showGraveMap} onClose={() => setShowGraveMap(false)} height="90vh">
        <GraveMap members={members} onClose={() => setShowGraveMap(false)}
          onViewMember={m => { setViewingMember(m); setShowGraveMap(false); }} />
      </BottomSheet>

      {showStats    && <StatsPanel members={members} onClose={() => setShowStats(false)} />}
      {showMemorial && (
        <MemorialPage members={members} onClose={() => setShowMemorial(false)}
          onViewMember={m => { setViewingMember(m); setShowMemorial(false); }} />
      )}

      <PWAInstallPrompt />
    </div>
  );
}
