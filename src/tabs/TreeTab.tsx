import { useMemo, useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Controls, Background, BackgroundVariant, MiniMap,
  useNodesState, useEdgesState, useReactFlow,
  ReactFlowProvider, Node, Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Sun, Moon, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Member } from '../types';
import FamilyNode from '../components/FamilyNode';
import { buildFamilyLayout } from '../utils/layout';

const nodeTypes = { familyNode: FamilyNode };

interface Props {
  members: Member[];
  filterGen: number | 'all';
  isAdmin: boolean;
  onNodeClick: (m: Member) => void;
  onAddMember: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

const PAPER_TEXTURE: React.CSSProperties = {
  position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'repeat', backgroundSize: '300px 300px',
  opacity: 0.055, mixBlendMode: 'multiply',
};

function TreeSkeleton({ dark }: { dark: boolean }) {
  return (
    <div className="w-full h-full flex items-center justify-center animate-pulse"
      style={{ background: dark ? '#0f1724' : '#FAFAF4' }}>
      <div className="space-y-8 text-center">
        {[2,4,3].map((n, row) => (
          <div key={row} className="flex justify-center gap-4">
            {Array(n).fill(0).map((_, i) => (
              <div key={i} className="rounded-2xl" style={{
                width: 145, height: 148,
                background: dark ? '#253040' : '#e8e0d0'
              }} />
            ))}
          </div>
        ))}
        <p className="text-sm" style={{ color: dark ? '#64748b' : '#9CA3AF' }}>Đang tải…</p>
      </div>
    </div>
  );
}

// ── Helper: tìm tất cả node kết nối với 1 node (huyết thống) ─────────────
function getBloodlineIds(memberId: string, members: Member[]): Set<string> {
  const ids = new Set<string>();
  const memberMap = new Map(members.map(m => [m.id, m]));

  // Đi ngược lên (tổ tiên)
  function goUp(id: string) {
    if (ids.has(id)) return;
    ids.add(id);
    const m = memberMap.get(id);
    if (!m) return;
    if (m.fatherId) goUp(m.fatherId);
    if (m.motherId) goUp(m.motherId);
    if (m.spouseId) ids.add(m.spouseId);
  }

  // Đi xuống (con cháu)
  function goDown(id: string) {
    if (ids.has(id)) return;
    ids.add(id);
    const m = memberMap.get(id);
    if (!m) return;
    if (m.spouseId) ids.add(m.spouseId);
    members.filter(c => c.fatherId === id || c.motherId === id).forEach(c => goDown(c.id));
  }

  goUp(memberId);
  goDown(memberId);
  return ids;
}

// ── Inner component ────────────────────────────────────────────────────────
function TreeInner({ members, filterGen, isAdmin, onNodeClick, onAddMember, darkMode, onToggleDark }: Props) {
  const [ready, setReady] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const { fitView } = useReactFlow();

  useEffect(() => { const t = setTimeout(() => setReady(true), 100); return () => clearTimeout(t); }, []);

  const filtered = filterGen === 'all' ? members : members.filter(m => m.generation === filterGen);

  // Bloodline set
  const bloodlineIds = useMemo(() =>
    highlightId ? getBloodlineIds(highlightId, filtered) : null,
    [highlightId, filtered]
  );

  const handleNodeClick = useCallback((m: Member) => {
    setHighlightId(prev => prev === m.id ? null : m.id); // toggle
    onNodeClick(m);
  }, [onNodeClick]);

  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildFamilyLayout(filtered, handleNodeClick),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered.map(m => `${m.id}:${m.spouseId}:${m.fatherId}:${m.birthDate}`).join(','), darkMode]
  );

  // Inject highlight/dim/darkMode vào node data
  const themedNodes: Node[] = useMemo(() => initNodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      darkMode,
      highlighted: bloodlineIds ? bloodlineIds.has(n.id) : false,
      dimmed: bloodlineIds ? !bloodlineIds.has(n.id) : false,
    },
  })), [initNodes, darkMode, bloodlineIds]);

  // Highlight edges trong bloodline
  const themedEdges: Edge[] = useMemo(() => initEdges.map(e => {
    if (!bloodlineIds) return e;
    const inLine = bloodlineIds.has(e.source) && bloodlineIds.has(e.target);
    return {
      ...e,
      style: {
        ...e.style,
        opacity: inLine ? 1 : 0.12,
        strokeWidth: inLine ? (e.style?.strokeWidth as number ?? 2) + 1 : 1,
      },
    };
  }), [initEdges, bloodlineIds]);

  const [nodes, setNodes, onNodesChange] = useNodesState(themedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(themedEdges);

  useEffect(() => {
    setNodes(themedNodes);
    setEdges(themedEdges);
    if (ready && themedNodes.length > 0)
      requestAnimationFrame(() => fitView({ padding: 0.18, duration: 500 }));
  }, [themedNodes, themedEdges, ready]);

  const bgColor    = darkMode ? '#0f1724' : '#FAFAF4';
  const dotColor   = darkMode ? '#8B5A2B' : '#C9A96E';
  const cardBg     = darkMode ? 'rgba(22,32,48,0.95)' : 'rgba(255,253,248,0.96)';
  const cardBorder = darkMode ? '#2d3d52' : '#E5E7EB';
  const cardText   = darkMode ? '#94a3b8' : '#6B7280';
  const mmBg       = darkMode ? '#192633' : '#FFF8E7';
  const mmFill     = darkMode ? '#4a7080' : '#C9A96E';

  if (!ready || members.length === 0) return <TreeSkeleton dark={darkMode} />;

  return (
    <div className="relative w-full h-full" style={{ background: bgColor }}>
      <div style={PAPER_TEXTURE} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: darkMode
          ? 'radial-gradient(ellipse at 50% 0%, rgba(139,90,43,0.07) 0%, transparent 65%)'
          : 'radial-gradient(ellipse at 50% 0%, rgba(201,169,110,0.10) 0%, transparent 65%)',
      }} />

      {/* ReactFlow */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView fitViewOptions={{ padding: 0.18 }}
          minZoom={0.04} maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          panOnScroll panOnDrag={[1, 2]}
          zoomOnPinch zoomOnScroll
          zoomOnDoubleClick={false}
          selectionOnDrag={false}
          preventScrolling
          nodesDraggable={false}
          nodesConnectable={false}
        >
          <Controls
            className="!rounded-2xl !overflow-hidden !shadow-lg !border"
            style={{ background: cardBg, borderColor: cardBorder }}
            showInteractive={false}
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={22} size={1.2} color={dotColor} style={{ opacity: 0.28 }}
          />

          {/* Mini-map — Đề xuất #1 */}
          <MiniMap
            style={{
              background: mmBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 16,
              overflow: 'hidden',
            }}
            nodeColor={n => {
              if (bloodlineIds && !bloodlineIds.has(n.id)) return darkMode ? '#2a3545' : '#E5E7EB';
              if (n.data?.gender === 'Nam') return '#1D4ED8';
              if (n.data?.gender === 'Nữ') return '#BE185D';
              return mmFill;
            }}
            maskColor={darkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'}
            zoomable pannable
          />
        </ReactFlow>
      </div>

      {/* Legend + toggle — góc dưới trái */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="absolute bottom-4 left-4 rounded-2xl px-3 py-2.5 text-xs space-y-1.5 shadow-md"
        style={{ background: cardBg, border: `1px solid ${cardBorder}`, zIndex: 10 }}
      >
        {[
          { el: <div className="w-7 h-0.5 bg-[#800000]" />, label: 'Cha → Con' },
          { el: <div className="w-7 border-t-2 border-dashed border-pink-500" />, label: 'Mẹ → Con' },
          { el: <div className="w-7 border-t-2 border-dashed border-yellow-600" />, label: 'Vợ — Chồng' },
        ].map(({ el, label }) => (
          <div key={label} className="flex items-center gap-2">
            {el}
            <span style={{ color: cardText }}>{label}</span>
          </div>
        ))}

        {/* Highlight đang bật */}
        {highlightId && (
          <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: cardBorder }}>
            <div className="w-3 h-3 rounded-full border-2 border-yellow-500" />
            <span style={{ color: '#F59E0B' }}>Huyết thống</span>
            <button onClick={() => setHighlightId(null)} className="ml-auto">
              <Minimize2 size={11} style={{ color: cardText }} />
            </button>
          </div>
        )}

        {/* Toggle dark/light */}
        <div className="pt-1 border-t" style={{ borderColor: cardBorder }}>
          <motion.button
            whileTap={{ scale: 0.88 }} onClick={onToggleDark}
            className="flex items-center gap-2 w-full" style={{ color: cardText }}
          >
            {darkMode
              ? <><Sun size={11} className="text-yellow-400" /><span>Chế độ sáng</span></>
              : <><Moon size={11} className="text-blue-500" /><span>Chế độ tối</span></>
            }
          </motion.button>
        </div>
      </motion.div>

      {/* FAB thêm — góc dưới phải */}
      <AnimatePresence>
        {isAdmin && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onAddMember}
            className="absolute text-white font-bold rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #B8860B, #8B6914)',
              zIndex: 10,
              // Để không che mini-map, đặt bottom cao hơn một chút
              bottom: 160, right: 16,
            }}
          >
            <Plus size={20} strokeWidth={3} />
            <span className="text-sm">Thêm</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TreeTab(props: Props) {
  return (
    <ReactFlowProvider>
      <TreeInner {...props} />
    </ReactFlowProvider>
  );
}
