import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
  Controls, Background, BackgroundVariant,
  useNodesState, useEdgesState, useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Sun, Moon } from 'lucide-react';
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

// ── SVG noise texture inline — giấy cổ parchment ──────────────────────────
// Dùng filter SVG để tạo texture không cần URL bên ngoài
const PAPER_TEXTURE_STYLE: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 0,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'repeat',
  backgroundSize: '300px 300px',
  opacity: 0.06,
  mixBlendMode: 'multiply',
};

// ── Loading skeleton ───────────────────────────────────────────────────────
function TreeSkeleton({ dark }: { dark: boolean }) {
  const bg   = dark ? '#1a2030' : '#FAFAF7';
  const card = dark ? '#253040' : '#e8e0d0';
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: bg }}>
      <div className="space-y-8 animate-pulse text-center">
        <div className="flex justify-center gap-5">
          {[1,2].map(i => <div key={i} className="rounded-2xl" style={{ width: 145, height: 148, background: card }} />)}
        </div>
        <div className="flex justify-center gap-5">
          {[1,2,3,4].map(i => <div key={i} className="rounded-2xl" style={{ width: 145, height: 148, background: card }} />)}
        </div>
        <p className="text-sm" style={{ color: dark ? '#94a3b8' : '#9CA3AF' }}>Đang tải cây phả hệ…</p>
      </div>
    </div>
  );
}

// ── Inner component (cần ReactFlowProvider bao ngoài) ─────────────────────
function TreeInner({ members, filterGen, isAdmin, onNodeClick, onAddMember, darkMode, onToggleDark }: Props) {
  const [ready, setReady] = useState(false);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  const filtered = filterGen === 'all' ? members : members.filter(m => m.generation === filterGen);

  // Inject darkMode vào node data để FamilyNode biết theme
  const buildWithTheme = useCallback(
    (ms: Member[], handler: (m: Member) => void) => {
      const result = buildFamilyLayout(ms, handler);
      return {
        ...result,
        nodes: result.nodes.map(n => ({ ...n, data: { ...n.data, darkMode } })),
      };
    },
    [darkMode]
  );

  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildWithTheme(filtered, onNodeClick),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered.map(m => `${m.id}:${m.spouseId}:${m.fatherId}:${m.birthDate}`).join(','), darkMode]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

  // Auto fitView khi nodes thay đổi (CRUD, filter)
  useEffect(() => {
    setNodes(initNodes);
    setEdges(initEdges);
    if (ready && initNodes.length > 0) {
      requestAnimationFrame(() => fitView({ padding: 0.18, duration: 500 }));
    }
  }, [initNodes, initEdges, ready]);

  // Màu nền theo theme
  const bgColor   = darkMode ? '#0f1724' : '#FAFAF4';
  const dotColor  = darkMode ? '#8B5A2B' : '#C9A96E';
  const cardBg    = darkMode ? 'rgba(20,30,45,0.92)' : 'rgba(255,253,248,0.95)';
  const cardText  = darkMode ? '#94a3b8' : '#6B7280';
  const cardBorder= darkMode ? '#2d3d52' : '#E5E7EB';

  if (!ready || members.length === 0) return <TreeSkeleton dark={darkMode} />;

  return (
    <div className="relative w-full h-full" style={{ background: bgColor }}>

      {/* Vintage paper texture overlay */}
      <div style={PAPER_TEXTURE_STYLE} />
      {/* Warm tint overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: darkMode
          ? 'radial-gradient(ellipse at 50% 0%, rgba(139,90,43,0.08) 0%, transparent 70%)'
          : 'radial-gradient(ellipse at 50% 0%, rgba(201,169,110,0.12) 0%, transparent 70%)',
      }} />

      {/* ReactFlow */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.04}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          panOnScroll
          panOnDrag={[1, 2]}
          zoomOnPinch
          zoomOnScroll
          zoomOnDoubleClick={false}
          selectionOnDrag={false}
          preventScrolling
          nodesDraggable={false}
          nodesConnectable={false}
        >
          <Controls
            className="!rounded-2xl !overflow-hidden !shadow-lg !border"
            style={{
              background: cardBg,
              borderColor: cardBorder,
            }}
            showInteractive={false}
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={22} size={1.2}
            color={dotColor}
            style={{ opacity: 0.3 }}
          />
        </ReactFlow>
      </div>

      {/* Chú thích + toggle theme — góc dưới trái */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="absolute bottom-4 left-4 rounded-2xl px-3 py-2.5 text-xs space-y-1.5 shadow-md"
        style={{ background: cardBg, border: `1px solid ${cardBorder}`, zIndex: 10 }}
      >
        {[
          { w: 'w-7 h-0.5 bg-[#800000]', label: 'Cha → Con' },
          { w: 'w-7 border-t-2 border-dashed border-pink-500', label: 'Mẹ → Con' },
          { w: 'w-7 border-t-2 border-dashed border-yellow-600', label: 'Vợ — Chồng' },
        ].map(({ w, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={w} />
            <span style={{ color: cardText }}>{label}</span>
          </div>
        ))}

        {/* Toggle sáng/tối */}
        <div className="pt-1.5 border-t" style={{ borderColor: cardBorder }}>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={onToggleDark}
            className="flex items-center gap-2 w-full"
            style={{ color: cardText }}
          >
            {darkMode
              ? <><Sun size={12} className="text-yellow-400" /><span>Chế độ sáng</span></>
              : <><Moon size={12} className="text-blue-500" /><span>Chế độ tối</span></>
            }
          </motion.button>
        </div>
      </motion.div>

      {/* FAB thêm — góc dưới phải */}
      <AnimatePresence>
        {isAdmin && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onAddMember}
            className="absolute bottom-4 right-4 text-white font-bold rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #B8860B, #8B6914)', zIndex: 10 }}
          >
            <Plus size={20} strokeWidth={3} />
            <span className="text-sm">Thêm</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Export bọc trong Provider ─────────────────────────────────────────────
export default function TreeTab(props: Props) {
  return (
    <ReactFlowProvider>
      <TreeInner {...props} />
    </ReactFlowProvider>
  );
}
