import { useEffect, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import { Member, AuthUser } from './types';

// Components
import BottomNav, { TabId } from './components/BottomNav';
import BottomSheet from './components/BottomSheet';
import MemberBottomSheet from './components/MemberBottomSheet';
import MemberForm from './components/MemberForm';
import StatsPanel from './components/StatsPanel';
import MemorialPage from './components/MemorialPage';
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Tabs
import TreeTab from './tabs/TreeTab';
import DirectoryTab from './tabs/DirectoryTab';
import EventsTab from './tabs/EventsTab';
import SettingsTab from './tabs/SettingsTab';

const ADMIN_EMAILS = ['letinhclover@gmail.com'];

// Slide animation variants
const tabVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '40%' : '-40%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? '40%' : '-40%', opacity: 0 }),
};

const TAB_ORDER: TabId[] = ['tree', 'directory', 'events', 'settings'];

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation
  const [activeTab, setActiveTab] = useState<TabId>('tree');
  const [prevTab, setPrevTab] = useState<TabId>('tree');
  const direction = TAB_ORDER.indexOf(activeTab) - TAB_ORDER.indexOf(prevTab);

  // UI state
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [filterGen, setFilterGen] = useState<number | 'all'>('all');
  const [showStats, setShowStats] = useState(false);
  const [showMemorial, setShowMemorial] = useState(false);
  const [adminToast, setAdminToast] = useState('');

  const isAdmin = ADMIN_EMAILS.includes(user?.email || '');

  // Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      const prev = user;
      setUser(u ? { uid: u.uid, email: u.email, displayName: u.displayName } : null);
      if (u && !prev && ADMIN_EMAILS.includes(u.email || '')) {
        setAdminToast('✅ Đăng nhập thành công! Vào tab Phả Hệ để thêm thành viên.');
        setTimeout(() => setAdminToast(''), 4000);
      }
      setLoading(false);
    });
  }, []);

  // Load members
  const loadMembers = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'members'));
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Member[]);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { if (!loading) loadMembers(); }, [loading]);

  // Tab change with direction
  const handleTabChange = (tab: TabId) => {
    setPrevTab(activeTab);
    setActiveTab(tab);
  };

  // CRUD
  const handleSave = async (memberData: Partial<Member>) => {
    const payload = { ...memberData };
    const id = payload.id;
    delete (payload as any).id;

    let savedId = id;
    if (id) {
      await updateDoc(doc(db, 'members', id), payload);
    } else {
      const ref = await addDoc(collection(db, 'members'), { ...payload, createdAt: new Date().toISOString() });
      savedId = ref.id;
    }

    // Cập nhật vợ/chồng 2 chiều
    if (payload.spouseId && savedId) {
      try { await updateDoc(doc(db, 'members', payload.spouseId), { spouseId: savedId }); } catch {}
    }
    // Xóa liên kết cũ nếu đổi vợ/chồng
    const prev = members.find(m => m.id === id);
    if (prev?.spouseId && prev.spouseId !== payload.spouseId) {
      try { await updateDoc(doc(db, 'members', prev.spouseId), { spouseId: null }); } catch {}
    }

    await loadMembers();
    setIsFormOpen(false);
    setEditingMember(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xác nhận xóa thành viên này?')) return;
    const member = members.find(m => m.id === id);
    if (member?.spouseId) {
      try { await updateDoc(doc(db, 'members', member.spouseId), { spouseId: null }); } catch {}
    }
    await deleteDoc(doc(db, 'members', id));
    setViewingMember(null);
    await loadMembers();
  };

  const handleEdit = (member: Member) => {
    setViewingMember(null);
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleNodeClick = (member: Member) => {
    setViewingMember(member);
  };

  // Loading screen
  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #800000 0%, #2D0000 100%)' }}>
      <div className="text-center text-white px-8">
        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="text-7xl mb-6">🏛️</motion.div>
        <h1 className="text-2xl font-black tracking-tight">Gia Phả Dòng Họ Lê</h1>
        <p className="text-sm mt-2 opacity-60">Truyền thống · Đoàn kết · Phát triển</p>
        <div className="mt-8 flex justify-center gap-1.5">
          {[0,1,2].map(i => (
            <motion.div key={i} className="w-2 h-2 bg-yellow-400 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.3 }}/>
          ))}
        </div>
      </div>
    </div>
  );

  const maxGen = Math.max(...members.map(m => m.generation), 1);

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top Header ── */}
      <div className="flex-shrink-0 safe-top" style={{ background: 'linear-gradient(135deg, #800000 0%, #5C0000 100%)' }}>
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Logo */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base shadow-inner flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #B8860B, #8B6914)', fontFamily: 'serif' }}>
            Lê
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-sm leading-tight">Gia Phả Dòng Họ Lê</h1>
            <p className="text-yellow-400 text-xs opacity-80">{members.length} thành viên · {maxGen} đời</p>
          </div>

          {/* Filter đời (chỉ hiện ở tab tree) */}
          {activeTab === 'tree' && (
            <select value={filterGen}
              onChange={e => setFilterGen(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="bg-black bg-opacity-25 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none border border-white border-opacity-20 flex-shrink-0">
              <option value="all">Tất cả đời</option>
              {Array.from({ length: maxGen }, (_, i) => i + 1).map(g => (
                <option key={g} value={g}>Đời {g}</option>
              ))}
            </select>
          )}

          {/* Admin badge */}
          {isAdmin && (
            <div className="flex-shrink-0 bg-yellow-500 text-black text-xs font-black px-2 py-1 rounded-full">
              ADMIN
            </div>
          )}
        </div>
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {adminToast && (
          <motion.div
            initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
            className="fixed top-16 left-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-center"
          >
            {adminToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={tabVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.8 }}
            className="absolute inset-0"
          >
            {activeTab === 'tree' && (
              <TreeTab
                members={members}
                filterGen={filterGen}
                isAdmin={isAdmin}
                onNodeClick={handleNodeClick}
                onAddMember={() => { setEditingMember(null); setIsFormOpen(true); }}
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
                user={user}
                isAdmin={isAdmin}
                members={members}
                adminEmails={ADMIN_EMAILS}
                onShowStats={() => setShowStats(true)}
                onShowMemorial={() => setShowMemorial(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom Navigation ── */}
      <BottomNav active={activeTab} onChange={handleTabChange} />

      {/* ── Bottom Sheet: Xem chi tiết thành viên ── */}
      <BottomSheet isOpen={!!viewingMember} onClose={() => setViewingMember(null)} height="90vh">
        {viewingMember && (
          <MemberBottomSheet
            member={viewingMember}
            members={members}
            onClose={() => setViewingMember(null)}
            onEdit={handleEdit}
            isAdmin={isAdmin}
          />
        )}
      </BottomSheet>

      {/* ── Bottom Sheet: Form thêm/sửa ── */}
      <BottomSheet isOpen={isAdmin && isFormOpen} onClose={() => { setIsFormOpen(false); setEditingMember(null); }} height="95vh">
        {isAdmin && (
          <MemberForm
            isOpen={isFormOpen}
            onClose={() => { setIsFormOpen(false); setEditingMember(null); }}
            onSave={handleSave}
            onDelete={handleDelete}
            members={members}
            editingMember={editingMember}
            isAdmin={isAdmin}
          />
        )}
      </BottomSheet>

      {/* ── Modals phụ ── */}
      {showStats && <StatsPanel members={members} onClose={() => setShowStats(false)} />}
      {showMemorial && (
        <MemorialPage
          members={members}
          onClose={() => setShowMemorial(false)}
          onViewMember={m => { setViewingMember(m); setShowMemorial(false); }}
        />
      )}

      <PWAInstallPrompt />
    </div>
  );
}
