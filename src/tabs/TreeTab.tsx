import { useMemo, useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Controls, Background, BackgroundVariant, MiniMap,
  useNodesState, useEdgesState, useReactFlow,
  ReactFlowProvider, Node, Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Minimize2, GitBranch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Member } from '../types';
import FamilyNode from '../components/FamilyNode';
import { buildFamilyLayout } from '../utils/layout';

const nodeTypes = { familyNode: FamilyNode };

interface Props {
  members:      Member[];
  filterGen:    number | 'all';
  isAdmin:      boolean;
  onNodeClick:  (m: Member) => void;
  onAddMember?: () => void;
  darkMode:     boolean;
  onToggleDark?: () => void; // optional — toggle đã chuyển lên header
}

const PAPER_TEXTURE: React.CSSProperties = {
  position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23paper)' opacity='1'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'repeat',
  backgroundSize: '400px 400px',
  opacity: 0.045,
  mixBlendMode: 'multiply',
};

function TreeSkeleton({ dark }: { dark: boolean }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: dark ? '#0f1724' : '#F5F0E8' }}
    >
      <div className="space-y-8 text-center">
        {[2, 4, 3].map((n, row) => (
          <div key={row} className="flex justify-center gap-4">
            {Array(n).fill(0).map((_, i) => (
              <motion.div
                key={i}
                className="rounded-2xl"
                style={{ width: 100, height: 130, background: dark ? '#1e2d42' : '#E8DFCF' }}
                animate={{ opacity: [0.5, 0.9, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.15 }}
              />
            ))}
          </div>
        ))}
        <p className="text-sm mt-2" style={{ color: dark ? '#64748b' : '#9C8E82', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
          Đang tải cây gia phả…
        </p>
      </div>
    </div>
  );
}

function getBloodlineIds(memberId: string, members: Member[]): Set<string> {
  const ids = new Set<string>();
  const map = new Map(members.map(m => [m.id, m]));

  function up(id: string) {
    if (ids.has(id)) return;
    ids.add(id);
    const m = map.get(id);
    if (!m) return;
    if (m.fatherId) up(m.fatherId);
    if (m.motherId) up(m.motherId);
    if (m.spouseId) ids.add(m.spouseId);
  }
  function down(id: string) {
    if (ids.has(id)) return;
    ids.add(id);
    const m = map.get(id);
    if (!m) return;
    if (m.spouseId) ids.add(m.spouseId);
    members.filter(c => c.fatherId === id || c.motherId === id).forEach(c => down(c.id));
  }

  up(memberId);
  down(memberId);
  return ids;
}

function TreeInner({ members, filterGen, isAdmin, onNodeClick, onAddMember, darkMode }: Props) {
  const [ready, setReady]             = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  // ── FIX TỰ ĐỘNG CẬP NHẬT CÂY KHI THÊM/SỬA THÀNH VIÊN ──────────────────
  // Dùng useMemo cho filtered để React tracking đúng dependency
  const filtered = useMemo(
    () => filterGen === 'all' ? members : members.filter(m => m.generation === filterGen),
    [members, filterGen]
  );

  const bloodlineIds = useMemo(
    () => highlightId ? getBloodlineIds(highlightId, filtered) : null,
    [highlightId, filtered]
  );

  const handleNodeClick = useCallback((m: Member) => {
    setHighlightId(prev => prev === m.id ? null : m.id);
    onNodeClick(m);
  }, [onNodeClick]);

  // Key bao gồm đầy đủ thông tin để detect mọi thay đổi
  const layoutKey = filtered
    .map(m => `${m.id}|${m.spouseId ?? ''}|${m.fatherId ?? ''}|${m.motherId ?? ''}|${m.generation}|${m.name}`)
    .join(',');

  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildFamilyLayout(filtered, handleNodeClick),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layoutKey]
  );

  const themedNodes: Node[] = useMemo(() =>
    initNodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        darkMode,
        highlighted: bloodlineIds ? bloodlineIds.has(n.id) : false,
        dimmed:      bloodlineIds ? !bloodlineIds.has(n.id) : false,
      },
    })),
    [initNodes, darkMode, bloodlineIds]
  );

  const themedEdges: Edge[] = useMemo(() =>
    initEdges.map(e => {
      if (!bloodlineIds) return e;
      const inLine = bloodlineIds.has(e.source) && bloodlineIds.has(e.target);
      return {
        ...e,
        style: {
          ...e.style,
          opacity:     inLine ? 1 : 0.08,
          strokeWidth: inLine ? ((e.style?.strokeWidth as number ?? 2) + 1) : 1,
        },
      };
    }),
    [initEdges, bloodlineIds]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(themedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(themedEdges);

  useEffect(() => {
    setNodes(themedNodes);
    setEdges(themedEdges);
    if (ready && themedNodes.length > 0)
      requestAnimationFrame(() => fitView({ padding: 0.18, duration: 500 }));
  }, [themedNodes, themedEdges, ready]);

  // ── Màu sắc ─────────────────────────────────────────────────────────────
  const bgColor    = darkMode ? '#0f1724' : '#F5F0E8';
  const dotColor   = darkMode ? '#5C3A1E' : '#B8A07A';
  const cardBg     = darkMode ? 'rgba(20,30,46,0.97)' : 'rgba(255,253,247,0.97)';
  const cardBorder = darkMode ? '#2d3d52'              : '#E2D8CA';
  const cardText   = darkMode ? '#8A9BB0'              : '#6B5E52';
  const mmBg       = darkMode ? '#141e2e'              : '#FFF8EE';
  const mmFill     = darkMode ? '#3d5a70'              : '#B8860B';

  if (!ready || members.length === 0) return <TreeSkeleton dark={darkMode} />;

  return (
    <div className="relative w-full h-full" style={{ background: bgColor }}>

      {/* Texture giấy dó */}
      <div style={PAPER_TEXTURE} />

      {/* Radial gradient */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: darkMode
          ? 'radial-gradient(ellipse at 50% 0%, rgba(128,0,0,0.06) 0%, transparent 60%)'
          : 'radial-gradient(ellipse at 50% 0%, rgba(184,134,11,0.09) 0%, transparent 60%)',
      }} />

      {/* ReactFlow canvas */}
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
          {/* ── Controls Thu phóng — góc TRÊN PHẢI, không đè Legend ── */}
          <Controls
            className="!rounded-2xl !overflow-hidden !shadow-lg !border !bottom-auto !left-auto !top-3 !right-3"
            style={{ background: cardBg, borderColor: cardBorder }}
            showInteractive={false}
          />

          {/* Dot background */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={24} size={1.1}
            color={dotColor}
            style={{ opacity: 0.22 }}
          />

          {/* ── MiniMap — góc dưới phải ── */}
          <MiniMap
            style={{
              background: mmBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(28,20,16,0.10)',
            }}
            position="bottom-right"
            nodeColor={n => {
              if (bloodlineIds && !bloodlineIds.has(n.id))
                return darkMode ? '#1e2d42' : '#D6CCBC';
              if (n.data?.gender === 'Nam') return '#1D3A6B';
              if (n.data?.gender === 'Nữ') return '#8B2252';
              return mmFill;
            }}
            maskColor={darkMode ? 'rgba(0,0,0,0.55)' : 'rgba(245,240,232,0.55)'}
            zoomable
            pannable
          />
        </ReactFlow>
      </div>

      {/* ── LEGEND — góc dưới TRÁI, nhỏ gọn, không có dark toggle ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 300 }}
        className="absolute bottom-4 left-3 rounded-2xl px-3 py-2.5 shadow-lg"
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          zIndex: 10,
          minWidth: 140,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Tiêu đề */}
        <div
          className="flex items-center gap-1.5 pb-1.5 mb-1.5 border-b"
          style={{ borderColor: cardBorder }}
        >
          <GitBranch size={11} style={{ color: '#B8860B' }} />
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#B8860B',
            fontFamily: "'Be Vietnam Pro', sans-serif", letterSpacing: '0.05em'
          }}>
            CHÚ GIẢI
          </span>
        </div>

        {/* Các loại đường — text lớn hơn để dễ đọc */}
        {[
          { el: <div className="w-6 h-0.5 rounded-full" style={{ background: '#800000' }} />,        label: 'Cha → Con' },
          { el: <div className="w-6 border-t-2 border-dashed border-pink-500 opacity-80" />,          label: 'Mẹ → Con'  },
          { el: <div className="w-6 border-t-2 border-dashed" style={{ borderColor: '#B8860B' }} />, label: 'Vợ — Chồng' },
        ].map(({ el, label }) => (
          <div key={label} className="flex items-center gap-2 py-0.5">
            {el}
            <span style={{ fontSize: 11, color: cardText, fontFamily: "'Be Vietnam Pro', sans-serif" }}>
              {label}
            </span>
          </div>
        ))}

        {/* Bloodline indicator */}
        <AnimatePresence>
          {highlightId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 pt-1.5 mt-1 border-t overflow-hidden"
              style={{ borderColor: cardBorder }}
            >
              <div className="w-3 h-3 rounded-full border-2 border-yellow-500 flex-shrink-0" />
              <span style={{
                fontSize: 11, color: '#D4AF37',
                fontFamily: "'Be Vietnam Pro', sans-serif", fontWeight: 600
              }}>
                Huyết thống
              </span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setHighlightId(null)}
                className="ml-auto flex-shrink-0 rounded-lg p-0.5"
                title="Tắt highlight"
              >
                <Minimize2 size={12} style={{ color: cardText }} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── FAB THÊM THÀNH VIÊN — Chỉ dấu +, hình tròn, trên MiniMap ── */}
      <AnimatePresence>
        {isAdmin && onAddMember && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.90 }}
            onClick={onAddMember}
            aria-label="Thêm thành viên"
            className="absolute text-white rounded-full shadow-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #B8860B 0%, #8B6914 100%)',
              zIndex: 10,
              bottom: 168,   // trên minimap (~150px cao + offset)
              right: 12,
              width: 54,
              height: 54,
              boxShadow: '0 6px 20px rgba(184,134,11,0.45)',
            }}
          >
            <Plus size={26} strokeWidth={2.5} />
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
