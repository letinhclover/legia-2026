import { useEffect, useState, useCallback } from 'react';
import ReactFlow, { Node, Edge, Controls, Background, useNodesState, useEdgesState, BackgroundVariant } from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { Plus, LogOut, LogIn, Search, Bell, Shield } from 'lucide-react';
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

// ✏️ Thay bằng email admin thật của bạn
const ADMIN_EMAILS = ['admin@legia.com', 'legia2026@gmail.com'];

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 100 });
  nodes.forEach(n => dagreGraph.setNode(n.id, { width: 220, height: 100 }));
  edges.forEach(e => dagreGraph.setEdge(e.source, e.target));
  dagre.layout(dagreGraph);
  return {
    nodes: nodes.map(n => {
      const p = dagreGraph.node(n.id);
      return { ...n, position: { x: p.x - 110, y: p.y - 50 } };
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

// ── Modal đăng nhập admin gọn nhẹ ──────────────────────────────────────────
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
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch {
      setError('Email hoặc mật khẩu không đúng');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="bg-[#800000] text-white p-4 rounded-t-2xl flex items-center gap-2">
          <Shield size={20} />
          <h3 className="font-bold">Đăng nhập Quản trị viên</h3>
        </div>
        <form onSubmit={handleLogin} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-[#800000] focus:outline-none text-sm"
              placeholder="admin@email.com" required autoFocus />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Mật khẩu</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-[#800000] focus:outline-none text-sm"
              required />
          </div>
          {error && <p className="text-red-600 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border-2 border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-50">
              Hủy
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-[#800000] text-white py-2 rounded-lg text-sm font-bold hover:bg-[#600000] disabled:opacity-60">
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── App chính ───────────────────────────────────────────────────────────────
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

  const isAdmin = ADMIN_EMAILS.includes(user?.email || '');

  // Lắng nghe trạng thái đăng nhập — không chặn xem trang
  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u ? { uid: u.uid, email: u.email, displayName: u.displayName } : null);
      setLoading(false);
    });
  }, []);

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
      if (m.fatherId && filteredIds.has(m.fatherId)) {
        flowEdges.push({ id: `f-${m.fatherId}-${m.id}`, source: m.fatherId, target: m.id, type: 'smoothstep', style: { stroke: '#800000', strokeWidth: 2 } });
      } else if (m.motherId && filteredIds.has(m.motherId) && !m.fatherId) {
        flowEdges.push({ id: `m-${m.motherId}-${m.id}`, source: m.motherId, target: m.id, type: 'smoothstep', style: { stroke: '#BE185D', strokeWidth: 2, strokeDasharray: '5,5' } });
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

  // Load dữ liệu ngay khi mở trang — không cần đăng nhập
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
        <div className="text-5xl mb-4">🏛️</div>
        <div className="text-[#800000] text-lg font-semibold">Đang tải Gia Phả...</div>
      </div>
    </div>
  );

  const maxGen = Math.max(...members.map(m => m.generation), 1);
  const upcomingEvents = getUpcomingEvents(members);

  return (
    <div className="h-screen w-screen bg-[#FFFDD0] flex flex-col">
      {/* ── Header ── */}
      <div className="bg-[#800000] text-white px-4 py-3 z-10 shadow-lg flex-shrink-0">
        <div className="flex items-center justify-between gap-3">

          {/* Tên dòng họ */}
          <div className="flex-shrink-0">
            <h1 className="text-lg font-bold leading-tight">Gia Phả Dòng Họ Lê</h1>
            <p className="text-[#B8860B] text-xs">{members.length} thành viên</p>
          </div>

          {/* Tìm kiếm */}
          <div className="flex-1 max-w-xs relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm tên, tên húy..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-gray-800 text-sm focus:outline-none" />
          </div>

          {/* Lọc đời */}
          <select value={filterGen}
            onChange={e => setFilterGen(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="bg-[#600000] text-white text-sm rounded-lg px-2 py-1.5 focus:outline-none">
            <option value="all">Tất cả đời</option>
            {Array.from({ length: maxGen }, (_, i) => i + 1).map(g => (
              <option key={g} value={g}>Đời {g}</option>
            ))}
          </select>

          {/* Chuông sự kiện */}
          <button onClick={() => setShowEvents(!showEvents)} className="relative hover:bg-[#600000] rounded-lg p-1.5">
            <Bell size={20} />
            {upcomingEvents.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {upcomingEvents.length}
              </span>
            )}
          </button>

          {/* Nút Admin / Đăng xuất */}
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <span className="bg-[#B8860B] text-xs px-2 py-0.5 rounded-full font-bold hidden sm:inline">
                ✏️ Admin
              </span>
              <button onClick={() => signOut(auth)}
                className="hover:bg-[#600000] rounded-lg p-1.5 flex items-center gap-1 text-xs">
                <LogOut size={16} />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          ) : (
            <button onClick={() => setShowLoginModal(true)}
              className="hover:bg-[#600000] rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold border border-[#B8860B]">
              <LogIn size={16} />
              <span className="hidden sm:inline">Quản trị</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Banner sự kiện ── */}
      {showEvents && (
        <div className={`px-4 py-2 flex-shrink-0 border-b ${upcomingEvents.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          {upcomingEvents.length > 0 ? (
            <>
              <p className="text-xs font-bold text-yellow-800 mb-1">🔔 Sự kiện trong 7 ngày tới:</p>
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
        >
          <Controls className="bg-white rounded-lg shadow-lg" />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#B8860B" />
        </ReactFlow>
      </div>

      {/* ── Nút thêm (chỉ admin) ── */}
      {isAdmin && (
        <button
          onClick={() => { setEditingMember(null); setIsFormOpen(true); }}
          className="fixed bottom-6 right-6 bg-[#B8860B] text-white w-14 h-14 rounded-full shadow-2xl hover:bg-[#996B08] transition-all hover:scale-110 flex items-center justify-center z-20"
          title="Thêm thành viên mới">
          <Plus size={28} strokeWidth={3} />
        </button>
      )}

      {/* ── Popup xem chi tiết ── */}
      {viewingMember && (
        <MemberDetail
          member={viewingMember}
          members={members}
          onClose={() => setViewingMember(null)}
          onEdit={isAdmin ? handleEdit : () => {}}
          isAdmin={isAdmin}
        />
      )}

      {/* ── Form thêm/sửa (chỉ admin) ── */}
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

      {/* ── Modal đăng nhập admin ── */}
      {showLoginModal && (
        <AdminLoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
}

export default App;
