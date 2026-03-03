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

const SUPER_ADMIN_EMAILS = ['letinhclover@gmail.com'];
const EDITOR_EMAILS      = ['quanlylegia2026@gmail.com'];
const ALL_AUTH_EMAILS    = [...SUPER_ADMIN_EMAILS, ...EDITOR_EMAILS];
const TAB_ORDER: TabId[] = ['tree', 'directory', 'events', 'settings'];

const tabVariants = {
  enter:  (d: number) => ({ x: d > 0 ? '35%' : '-35%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d: number) => ({ x: d < 0 ? '35%' : '-35%', opacity: 0 }),
};

type ToastType = 'success' | 'error' | 'info';
interface Toast { msg: string; type: ToastType }
const TOAST_COLORS: Record<ToastType, string> = {
  success: '#16a34a', error: '#DC2626', info: '#2563EB',
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
    setTimeout(() => setToast(null), 3000);
  }, []);

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

  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user?.email || '');
  const isEditor     = EDITOR_EMAILS.includes(user?.email || '');
  const canEdit      = isSuperAdmin || isEditor;
  const isAdmin      = isSuperAdmin;
  const direction    = TAB_ORDER.indexOf(activeTab) - TAB_ORDER.indexOf(prevTab);

  useEffect(() => {
    let prevUser: any = null;
    return onAuthStateChanged(auth, u => {
      if (u && !prevUser && ALL_AUTH_EMAILS.includes(u.email || ''))
        showToast('✅ Đăng nhập thành công!', 'success');
      prevUser = u;
      setUser(u ? { uid: u.uid, email: u.email, displayName: u.displayName } : null);
      setLoading(false);
    });
  }, []);

  const loadMembers = useCallback(async () => {
    const snap = await getDocs(collection(db, 'members'));
    setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Member[]);
  }, []);
  useEffect(() => { if (!loading) loadMembers(); }, [loading]);

  const handleTabChange = (tab: TabId) => { setPrevTab(activeTab); setActiveTab(tab); };

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
        const ref = await addDoc(collection(db, 'members'), { ...payload, createdAt: new Date().toISOString() });
        savedId = ref.id;
        setMembers(prev => [...prev, { ...payload, id: savedId } as Member]);
        showToast('✅ Đã thêm thành viên mới!', 'success');
      }
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
          setMembers(p2 => p2.map(m => m.id === prev.spouseId ? { ...m, spouseId: null } : m));
        } catch {}
      }
      setIsFormOpen(false); setEditingMember(null);
    } catch (e) { console.error(e); showToast('❌ Lỗi khi lưu!', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xác nhận xóa thành viên này?')) return;
    try {
      const member = members.find(m => m.id === id);
      if (member?.spouseId) {
        try { await updateDoc(doc(db,
