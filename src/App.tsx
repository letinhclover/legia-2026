import { useEffect, useState, useCallback } from 'react';
import ReactFlow, { Node, Edge, Controls, Background, useNodesState, useEdgesState, BackgroundVariant } from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { Plus, LogOut, LogIn, Search, Bell, Shield, X } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from './firebase';
import { Member, AuthUser } from './types';
import FamilyNode from './components/FamilyNode';
import MemberForm from './components/MemberForm';
import MemberDetail from './components/MemberDetail';

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
      if (diff >= 0 && diff <= 7) upcoming.push({ name: m.name, event: 'Sinh nhật', days: diff });
    }
    if (m.deathDate) {
      const dd = new Date(m.deathDate);
      const thisYear = new Date(today.getFullYear(), dd.getMonth(), dd.getDate());
      const diff = Math.ceil((thisYear.getTime() - today.getTime()) / 86400000);
      if (diff >= 0 && diff <= 7) upcoming.push({ name: m.name, event: 'Ngày giỗ', days: diff });
    }
  });
  return upcoming.sort((a, b) => a.days - b.days);
};

// ── Modal đăng nhập Admin ───────────────────────────────────────────────────
function AdminLoginModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (ADMIN_EMAILS.includes(result.user.email || '')) {
        onClose();
      } else {
        await signOut(auth);
        setError('Tài khoản này không có quyền quản trị');
      }
    } catch {
      setError('Email hoặc mật khẩu không đúng');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="bg-[#800000] text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={20} />
            <h3 className="font-bold text-lg">Đăng nhập Quản trị</h3>
          </div>
          <button onClick={onClose} className="hover:bg-[#600000] rounded-full p-1">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email quản trị</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#800000] focus:outline-none text-base"
              placeholder="email@gmail.com" required autoFocus />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#800000] focus:outline-none text-base"
              placeholder="••••••••" required />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              ❌ {error}
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-[#800000] text-white py-3 rounded-xl font-bold text-base hover:bg-[#600000] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            <LogIn size={20} />
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── App ─────────────────────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [search, setSearch] = useState('');
  const [showEvents, setShowEvents] = useState(false);
  const [filterGen, setFilterGen] = useState<number | 'all'>('all');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminBadge, setAdminBadge] = useState(false);

  const isAdmin = ADMIN_EMAILS.includes(user?.email || '');

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u ? { uid: u.uid, email: u.email, displayName: u.displayName } : null);
      setLoading(false);
    });
  }, []);

  // Hiệu ứng badge admin khi đăng nhập thành công
  useEffect(() => {
    if (isAdmin) {
      setAdminBadge(true);
      setTimeout(() => setAdminBadge(false), 3000);
    }
  }, [isAdmin]);

  const buildGraph = useCallback((membersData: Member[]) => {
    const filtered = membersData.filter(m => {
      const matchSearch = !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.tenHuy || '').toLowerCase().includes(search.toLowerCase());
      const matchGen = filterGen === 'all' || m.generation === filterGen;
      return matchSearch && matchGen;
    });

    const flowNodes: Node[] = filtered.map(m => ({
      id: m.id,
      type: 'familyNode',
      position: { x: 0, y: 0 },
      data: {
        ...m,
        spouseName: m.spouseId ? membersData.find(x => x.id === m.spouseId)?.name : undefined,
        onEdit: (member: Member) => setViewingMember(member),
      },
    }));

    const filteredIds = new Set(filtered.map(m => m.id));
    const flowEdges: Edge[] = [];

    filtered.forEach(m => {
      // Đường nối cha → con (đỏ đậm)
      if (m.fatherId && filteredIds.has(m.fatherId)) {
        flowEdges.push({
          id: `f-${m.fatherId}-${m.id}`,
          source: m.fatherId, target: m.id,
          type: 'smoothstep',
          style: { stroke: '#800000', strokeWidth: 2.5 }
        });
      }
      // Đường nối mẹ → con (hồng, nét đứt) nếu không có cha
      if (m.motherId && filteredIds.has(m.motherId) && !m.fatherId) {
        flowEdges.push({
          id: `m-${m.motherId}-${m.id}`,
          source: m.motherId, target: m.id,
          type: 'smoothstep',
          style: { stroke: '#BE185D', strokeWidth: 2, strokeDasharray: '6,3' }
        });
      }
      // Đường nối vợ chồng (vàng, ngang)
      if (m.spouseId && filteredIds.has(m.spouseId) && m.id < m.spouseId) {
        flowEdges.push({
          id: `s-${m.id}-${m.spouseId}`,
          source: m.id, target: m.spouseId,
          type: 'straight',
          style: { stroke: '#B8860B', strokeWidth: 2, strokeDasharray: '4,4' },
          label: '💑',
          labelStyle: { fontSize: 14 },
        });
      }
    });

    const { nodes: ln, edges: le } = getLayoutedElements(flowNodes, flowEdges);
    setNodes(ln);
    setEdges(le);
  }, [search, filterGen]);

  const loadMembers = useCallback(async () => {
    const snap = await getDocs(collection(db, 'members'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Member[];
    setMembers(data);
    buildGraph(data);
  }, [buildGraph]);

  useEffect(() => {
    if (!loading) loadMembers();
  }, [loading, loadMembers]);

  useEffect(() => {
    buildGraph(members);
  }, [search, filterGen, members, buildGraph]);

  const handleSave = async (memberData: Partial<Member>) => {
    const payload = { ...memberData };
    delete (payload as any).id;
    if (memberData.id) {
      await updateDoc(doc(db, 'members', memberData.id), payload);
    } else {
      await addDoc(collection(db, 'members'), { ...payload, createdAt: new Date().toISOString() });
    }
    await loadMembers();
    setIsFormOpen(false);
    setEditingMember(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xác nhận xóa thành viên này?')) return;
    await deleteDoc(doc(db, 'members', id));
    setViewingMember(null);
    await loadMembers();
  };

  const handleEdit = (member: Member) => {
    setViewingMember(null);
    setEditingMember(member);
    setIsFormOpen(true);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FFFDD0]">
      <div className="text-center">
        <div className="text-6xl mb-4">🏛️</div>
        <div className="text-[#800000] text-xl font-bold">Gia Phả Dòng Họ Lê</div>
        <div className="text-gray-500 text-sm mt-2">Đang tải...</div>
      </div>
    </div>
  );

  const maxGen = Math.max(...members.map(m => m.generation), 1);
  const upcomingEvents = getUpcomingEvents(members);

  return (
    <div className="h-screen w-screen bg-[#FFFDD0] flex flex-col">

      {/* ── Thông báo Admin đăng nhập thành công ── */}
      {adminBadge && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl font-bold text-sm animate-bounce">
          ✅ Đăng nhập thành công! Bạn có thể thêm/sửa dữ liệu
        </div>
      )}

      {/* ── Header ── */}
      <div className="bg-[#800000] text-white px-3 py-3 z-10 shadow-lg flex-shrink-0">
        <div className="flex items-center gap-2">

          {/* Tên & số thành viên */}
          <div className="flex-shrink-0 min-w-0">
            <h1 className="text-base font-bold leading-tight">🏛️ Họ Lê</h1>
            <p className="text-[#B8860B] text-xs">{members.length} thành viên</p>
          </div>

          {/* Tìm kiếm */}
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm tên..."
              className="w-full pl-7 pr-2 py-1.5 rounded-lg text-gray-800 text-sm focus:outline-none" />
          </div>

          {/* Lọc đời */}
          <select value={filterGen}
            onChange={e => setFilterGen(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="bg-[#600000] text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none flex-shrink-0">
            <option value="all">Tất cả</option>
            {Array.from({ length: maxGen }, (_, i) => i + 1).map(g => (
              <option key={g} value={g}>Đời {g}</option>
            ))}
          </select>

          {/* Chuông */}
          <button onClick={() => setShowEvents(!showEvents)} className="relative hover:bg-[#600000] rounded-lg p-1.5 flex-shrink-0">
            <Bell size={20} />
            {upcomingEvents.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {upcomingEvents.length}
              </span>
            )}
          </button>

          {/* Admin / Đăng xuất */}
          {isAdmin ? (
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="bg-[#B8860B] text-xs px-2 py-1 rounded-full font-bold">✏️ Admin</span>
              <button onClick={() => signOut(auth)} className="hover:bg-[#600000] rounded-lg p-1.5">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowLoginModal(true)}
              className="flex-shrink-0 bg-[#B8860B] hover:bg-[#996B08] rounded-lg px-3 py-1.5 flex items-center gap-1 text-xs font-bold transition-colors">
              <LogIn size={15} />
              <span>Quản trị</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Banner sự kiện ── */}
      {showEvents && (
        <div className={`px-4 py-2 flex-shrink-0 border-b ${upcomingEvents.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          {upcomingEvents.length > 0 ? (
            <>
              <p className="text-xs font-bold text-yellow-800 mb-1">🔔 Trong 7 ngày tới:</p>
              <div className="flex flex-wrap gap-2">
                {upcomingEvents.map((ev, i) => (
                  <span key={i} className="bg-yellow-200 text-yellow-900 text-xs px-2 py-1 rounded-full">
                    {ev.event}: <strong>{ev.name}</strong> {ev.days === 0 ? '(Hôm nay! 🎉)' : `(còn ${ev.days} ngày)`}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-green-700">✅ Không có ngày giỗ hay sinh nhật nào trong 7 ngày tới.</p>
          )}
        </div>
      )}

      {/* ── Cây phả hệ ── */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes} fitView minZoom={0.05} maxZoom={2}
          fitViewOptions={{ padding: 0.2 }}
        >
          <Controls className="bg-white rounded-lg shadow-lg" showInteractive={false} />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#B8860B" />
        </ReactFlow>
      </div>

      {/* ── Nút thêm (nổi bật, chỉ admin) ── */}
      {isAdmin && (
        <button
          onClick={() => { setEditingMember(null); setIsFormOpen(true); }}
          className="fixed bottom-6 right-6 bg-[#B8860B] text-white rounded-full shadow-2xl hover:bg-[#996B08] transition-all hover:scale-110 flex items-center gap-2 px-5 py-4 z-20 font-bold"
          title="Thêm thành viên mới">
          <Plus size={24} strokeWidth={3} />
          <span className="text-sm">Thêm thành viên</span>
        </button>
      )}

      {/* ── Xem chi tiết ── */}
      {viewingMember && (
        <MemberDetail
          member={viewingMember}
          members={members}
          onClose={() => setViewingMember(null)}
          onEdit={isAdmin ? handleEdit : () => {}}
          isAdmin={isAdmin}
        />
      )}

      {/* ── Form thêm/sửa ── */}
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

      {/* ── Modal đăng nhập ── */}
      {showLoginModal && (
        <AdminLoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
}

export default App;
