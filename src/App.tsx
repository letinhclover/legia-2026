import { useEffect, useState, useCallback } from 'react';
import ReactFlow, { Node, Edge, Controls, Background, useNodesState, useEdgesState, BackgroundVariant } from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { Plus, LogOut, LogIn, Bell, Shield, X, BarChart2, Search, Flame, Filter } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from './firebase';
import { Member, AuthUser } from './types';
import FamilyNode from './components/FamilyNode';
import MemberForm from './components/MemberForm';
import MemberDetail from './components/MemberDetail';
import StatsPanel from './components/StatsPanel';
import MemorialPage from './components/MemorialPage';
import SearchPanel from './components/SearchPanel';
import PWAInstallPrompt from './components/PWAInstallPrompt';

const nodeTypes = { familyNode: FamilyNode };
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
const ADMIN_EMAILS = ['letinhclover@gmail.com'];

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 120 });
  nodes.forEach(n => dagreGraph.setNode(n.id, { width: 240, height: 110 }));
  edges.forEach(e => dagreGraph.setEdge(e.source, e.target));
  dagre.layout(dagreGraph);
  return {
    nodes: nodes.map(n => {
      const p = dagreGraph.node(n.id);
      return { ...n, position: { x: p.x - 120, y: p.y - 55 } };
    }),
    edges,
  };
};

const getUpcomingEvents = (members: Member[]) => {
  const today = new Date();
  const upcoming: { name: string; event: string; days: number }[] = [];
  members.forEach(m => {
    if (m.birthDate) {
      const bd = new Date(m.birthDate);
      const thisYear = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
      const diff = Math.ceil((thisYear.getTime() - today.getTime()) / 86400000);
      if (diff >= 0 && diff <= 14) upcoming.push({ name: m.name, event: '🎂 Sinh nhật', days: diff });
    }
    if (m.deathDate) {
      const dd = new Date(m.deathDate);
      const thisYear = new Date(today.getFullYear(), dd.getMonth(), dd.getDate());
      const diff = Math.ceil((thisYear.getTime() - today.getTime()) / 86400000);
      if (diff >= 0 && diff <= 14) upcoming.push({ name: m.name, event: '🕯️ Ngày giỗ', days: diff });
    }
  });
  return upcoming.sort((a, b) => a.days - b.days);
};

// ── Modal đăng nhập Admin ──
function AdminLoginModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const r = await signInWithEmailAndPassword(auth, email, pw);
      if (!ADMIN_EMAILS.includes(r.user.email || '')) {
        await signOut(auth);
        setError('Tài khoản không có quyền quản trị');
      } else { onClose(); }
    } catch { setError('Email hoặc mật khẩu không đúng'); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#800000] to-[#A00000] text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2"><Shield size={18}/><span className="font-bold">Đăng nhập Quản trị</span></div>
          <button onClick={onClose} className="hover:bg-white hover:bg-opacity-20 rounded-full p-1"><X size={18}/></button>
        </div>
        <form onSubmit={handle} className="p-5 space-y-3">
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#800000] focus:outline-none text-sm"
            placeholder="Email quản trị" required autoFocus/>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#800000] focus:outline-none text-sm"
            placeholder="Mật khẩu" required/>
          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl">❌ {error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#800000] text-white py-2.5 rounded-xl font-bold hover:bg-[#600000] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            <LogIn size={18}/>{loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── App ──
function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [filterGen, setFilterGen] = useState<number | 'all'>('all');
  const [showEvents, setShowEvents] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showMemorial, setShowMemorial] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminToast, setAdminToast] = useState(false);

  const isAdmin = ADMIN_EMAILS.includes(user?.email || '');

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      const wasNull = !user;
      setUser(u ? { uid: u.uid, email: u.email, displayName: u.displayName } : null);
      if (u && wasNull && ADMIN_EMAILS.includes(u.email || '')) {
        setAdminToast(true);
        setTimeout(() => setAdminToast(false), 4000);
      }
      setLoading(false);
    });
  }, []);

  const buildGraph = useCallback((membersData: Member[], genFilter: number | 'all') => {
    const filtered = genFilter === 'all' ? membersData : membersData.filter(m => m.generation === genFilter);
    const filteredIds = new Set(filtered.map(m => m.id));

    const flowNodes: Node[] = filtered.map(m => ({
      id: m.id, type: 'familyNode', position: { x: 0, y: 0 },
      data: {
        ...m,
        spouseName: m.spouseId ? membersData.find(x => x.id === m.spouseId)?.name : undefined,
        onEdit: (member: Member) => setViewingMember(member),
      },
    }));

    const flowEdges: Edge[] = [];
    filtered.forEach(m => {
      if (m.fatherId && filteredIds.has(m.fatherId)) {
        flowEdges.push({ id: `f-${m.fatherId}-${m.id}`, source: m.fatherId, target: m.id, type: 'smoothstep', style: { stroke: '#800000', strokeWidth: 2.5 } });
      } else if (m.motherId && filteredIds.has(m.motherId) && !m.fatherId) {
        flowEdges.push({ id: `m-${m.motherId}-${m.id}`, source: m.motherId, target: m.id, type: 'smoothstep', style: { stroke: '#BE185D', strokeWidth: 2, strokeDasharray: '6,3' } });
      }
      if (m.spouseId && filteredIds.has(m.spouseId) && m.id < m.spouseId) {
        flowEdges.push({ id: `s-${m.id}-${m.spouseId}`, source: m.id, target: m.spouseId, type: 'straight', style: { stroke: '#B8860B', strokeWidth: 2, strokeDasharray: '4,4' }, label: '💑', labelStyle: { fontSize: 12 } });
      }
    });

    const { nodes: ln, edges: le } = getLayoutedElements(flowNodes, flowEdges);
    setNodes(ln); setEdges(le);
  }, []);

  const loadMembers = useCallback(async () => {
    const snap = await getDocs(collection(db, 'members'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Member[];
    setMembers(data);
    buildGraph(data, filterGen);
  }, [buildGraph, filterGen]);

  useEffect(() => { if (!loading) loadMembers(); }, [loading]);
  useEffect(() => { buildGraph(members, filterGen); }, [filterGen, members]);

  const handleSave = async (memberData: Partial<Member>) => {
    const payload = { ...memberData };
    const id = payload.id; delete (payload as any).id;

    // Nếu member có spouseId, cập nhật người kia luôn (2 chiều)
    if (id) {
      await updateDoc(doc(db, 'members', id), payload);
    } else {
      const ref = await addDoc(collection(db, 'members'), { ...payload, createdAt: new Date().toISOString() });
      id === undefined && (memberData.id = ref.id);
    }

    // Cập nhật vợ/chồng 2 chiều
    if (payload.spouseId) {
      const spouseRef = doc(db, 'members', payload.spouseId);
      await updateDoc(spouseRef, { spouseId: id || memberData.id });
    }
    // Nếu bỏ vợ/chồng, xóa ở người kia
    const prev = members.find(m => m.id === id);
    if (prev?.spouseId && prev.spouseId !== payload.spouseId) {
      await updateDoc(doc(db, 'members', prev.spouseId), { spouseId: null });
    }

    await loadMembers();
    setIsFormOpen(false); setEditingMember(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xác nhận xóa thành viên này?')) return;
    const member = members.find(m => m.id === id);
    if (member?.spouseId) await updateDoc(doc(db, 'members', member.spouseId), { spouseId: null });
    await deleteDoc(doc(db, 'members', id));
    setViewingMember(null);
    await loadMembers();
  };

  const handleEdit = (member: Member) => {
    setViewingMember(null); setEditingMember(member); setIsFormOpen(true);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #800000 0%, #4a0000 100%)' }}>
      <div className="text-center text-white">
        <div className="text-7xl mb-4 animate-pulse">🏛️</div>
        <div className="text-2xl font-bold">Gia Phả Dòng Họ Lê</div>
        <div className="text-sm opacity-70 mt-2">Truyền thống · Đoàn kết · Phát triển</div>
      </div>
    </div>
  );

  const maxGen = Math.max(...members.map(m => m.generation), 1);
  const upcoming = getUpcomingEvents(members);

  return (
    <div className="h-screen w-screen flex flex-col" style={{ background: '#FFF8E7' }}>

      {/* Toast admin */}
      {adminToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2 animate-bounce">
          ✅ Đăng nhập thành công! Nhấn <Plus size={16}/> để thêm thành viên
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex-shrink-0 z-10 shadow-lg" style={{ background: 'linear-gradient(135deg, #800000 0%, #6B0000 100%)' }}>
        <div className="px-3 py-2 flex items-center gap-2">

          {/* Logo & tên */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-yellow-600 flex items-center justify-center font-bold text-white text-lg shadow-inner">Lê</div>
            <div className="hidden sm:block">
              <div className="text-white font-bold text-sm leading-tight">Gia Phả Dòng Họ Lê</div>
              <div className="text-yellow-400 text-xs">{members.length} thành viên · {maxGen} đời</div>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Lọc đời */}
          <select value={filterGen} onChange={e => setFilterGen(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="bg-black bg-opacity-30 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none border border-white border-opacity-20">
            <option value="all">Tất cả đời</option>
            {Array.from({ length: maxGen }, (_, i) => i + 1).map(g => (
              <option key={g} value={g}>Đời {g}</option>
            ))}
          </select>

          {/* Nút chức năng */}
          {[
            { icon: <Search size={18}/>, onClick: () => setShowSearch(true), title: 'Tìm kiếm' },
            { icon: <BarChart2 size={18}/>, onClick: () => setShowStats(true), title: 'Thống kê' },
            { icon: <Flame size={18}/>, onClick: () => setShowMemorial(true), title: 'Tưởng nhớ' },
            {
              icon: <div className="relative"><Bell size={18}/>
                {upcoming.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">{upcoming.length}</span>}
              </div>,
              onClick: () => setShowEvents(!showEvents), title: 'Sự kiện'
            },
          ].map((btn, i) => (
            <button key={i} onClick={btn.onClick} title={btn.title}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 transition-colors">
              {btn.icon}
            </button>
          ))}

          {/* Admin */}
          {isAdmin ? (
            <div className="flex items-center gap-1">
              <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full font-bold hidden sm:inline">✏️ Admin</span>
              <button onClick={() => signOut(auth)} title="Đăng xuất"
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5">
                <LogOut size={18}/>
              </button>
            </div>
          ) : (
            <button onClick={() => setShowLoginModal(true)}
              className="bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg px-2.5 py-1.5 flex items-center gap-1 text-xs font-bold transition-colors shadow">
              <LogIn size={15}/><span>Quản trị</span>
            </button>
          )}
        </div>

        {/* Banner sự kiện */}
        {showEvents && upcoming.length > 0 && (
          <div className="bg-yellow-50 border-t border-yellow-200 px-3 py-2">
            <p className="text-xs font-bold text-yellow-800 mb-1">🔔 14 ngày tới:</p>
            <div className="flex flex-wrap gap-1.5">
              {upcoming.map((ev, i) => (
                <span key={i} className="bg-yellow-200 text-yellow-900 text-xs px-2 py-0.5 rounded-full">
                  {ev.event} <strong>{ev.name}</strong> {ev.days === 0 ? '(Hôm nay!)' : `(${ev.days} ngày)`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Cây phả hệ ── */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes} fitView minZoom={0.04} maxZoom={2}
          fitViewOptions={{ padding: 0.15 }}
        >
          <Controls className="bg-white rounded-xl shadow-lg" showInteractive={false}/>
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#C9A96E" opacity={0.4}/>
        </ReactFlow>
      </div>

      {/* ── FAB thêm (chỉ admin) ── */}
      {isAdmin && (
        <button onClick={() => { setEditingMember(null); setIsFormOpen(true); }}
          className="fixed bottom-6 right-4 text-white font-bold rounded-2xl shadow-2xl px-5 py-3.5 flex items-center gap-2 z-20 transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #B8860B, #8B6914)' }}>
          <Plus size={22} strokeWidth={3}/> Thêm thành viên
        </button>
      )}

      {/* ── Modals ── */}
      {viewingMember && (
        <MemberDetail member={viewingMember} members={members}
          onClose={() => setViewingMember(null)}
          onEdit={isAdmin ? handleEdit : () => {}}
          isAdmin={isAdmin} viewer={null}/>
      )}

      {isAdmin && (
        <MemberForm isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setEditingMember(null); }}
          onSave={handleSave} onDelete={handleDelete}
          members={members} editingMember={editingMember} isAdmin={isAdmin}/>
      )}

      {showStats && <StatsPanel members={members} onClose={() => setShowStats(false)}/>}

      {showMemorial && (
        <MemorialPage members={members} onClose={() => setShowMemorial(false)}
          onViewMember={(m) => { setViewingMember(m); setShowMemorial(false); }}/>
      )}

      {showSearch && (
        <SearchPanel members={members} onClose={() => setShowSearch(false)}
          onSelectMember={(m) => setViewingMember(m)}/>
      )}

      {showLoginModal && <AdminLoginModal onClose={() => setShowLoginModal(false)}/>}

      <PWAInstallPrompt/>
    </div>
  );
}

export default App;
