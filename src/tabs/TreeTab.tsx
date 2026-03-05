import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
  Controls, Background, BackgroundVariant, MiniMap,
  useNodesState, useEdgesState, useReactFlow,
  ReactFlowProvider, Node, Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Minimize2, RefreshCw } from 'lucide-react';
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
  onToggleDark?: () => void;
  onRefresh?:   () => Promise<void>;
  initialHighlightId?: string;
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
      style={{ background: dark ? '#111214' : '#f8fafc' }}
    >
      <div className="space-y-8 text-center">
        {[2, 4, 3].map((n, row) => (
          <div key={row} className="flex justify-center gap-4">
            {Array(n).fill(0).map((_, i) => (
              <motion.div
                key={i}
                className="rounded-2xl"
                style={{ width: 100, height: 130, background: dark ? '#1d1f21' : '#E8DFCF' }}
                animate={{ opacity: [0.5, 0.9, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.15 }}
              />
            ))}
          </div>
        ))}
        <p className="text-sm mt-2" style={{ color: dark ? '#64748b' : '#9C8E82', fontFamily: "'Roboto', sans-serif" }}>
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

function TreeInner({ members, filterGen, isAdmin, onNodeClick, onAddMember, darkMode, onRefresh, initialHighlightId }: Props) {
  const [ready, setReady]             = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(initialHighlightId ?? null);
  const [refreshing, setRefreshing]   = useState(false);
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pull-to-refresh state
  const pullStartY = useRef<number>(0);
  const pulling = useRef(false);
  const [pullDelta, setPullDelta] = useState(0);

  const { fitView, zoomIn, zoomOut } = useReactFlow();

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(
    () => filterGen === 'all' ? members : members.filter(m => m.generation === filterGen),
    [members, filterGen]
  );

  const bloodlineIds = useMemo(
    () => highlightId ? getBloodlineIds(highlightId, filtered) : null,
    [highlightId, filtered]
  );

  // Chạm 1 = highlight, chạm 2 liên tiếp = mở chi tiết
  const handleNodeClick = useCallback((m: Member) => {
    const now = Date.now();
    const last = lastTapRef.current;
    if (last && last.id === m.id && now - last.time < 600) {
      // Double tap -> mở chi tiết
      lastTapRef.current = null;
      setHighlightId(m.id);
      onNodeClick(m);
    } else {
      // Single tap -> chỉ highlight
      lastTapRef.current = { id: m.id, time: now };
      setHighlightId(prev => prev === m.id ? null : m.id);
    }
  }, [onNodeClick]);

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

  // ── Pull-to-refresh handlers ──────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const el = containerRef.current;
    if (!el) return;
    // Only activate when at the very top of scroll (ReactFlow canvas)
    pullStartY.current = e.touches[0].clientY;
    pulling.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current) return;
    const delta = e.touches[0].clientY - pullStartY.current;
    if (delta > 0 && delta < 120) {
      setPullDelta(delta);
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDelta > 60) {
      setRefreshing(true);
      setPullDelta(0);
      try {
        if (onRefresh) await onRefresh();
      } finally {
        fitView({ padding: 0.18, duration: 700 });
        setTimeout(() => setRefreshing(false), 600);
      }
    } else {
      setPullDelta(0);
    }
  }, [pullDelta, fitView, onRefresh]);

  // ── Màu sắc ─────────────────────────────────────────────────────────────
  const bgColor    = darkMode ? '#111214' : '#f8fafc';
  const dotColor   = darkMode ? '#5C3A1E' : '#B8A07A';
  const cardBg     = darkMode ? '#1d1f21' : 'rgba(255,255,255,0.97)';
  const cardBorder = darkMode ? '#2d3748'              : '#e2e8f0';
  const cardText   = darkMode ? '#c0c0c0'              : '#3d3d3d';

  if (!ready || members.length === 0) return <TreeSkeleton dark={darkMode} />;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{ background: bgColor }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {(pullDelta > 10 || refreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: Math.min(pullDelta * 0.5, 40) }}
            exit={{ opacity: 0, y: -40 }}
            style={{
              position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
              zIndex: 50, display: 'flex', alignItems: 'center', gap: 6,
              background: cardBg, borderRadius: 999, padding: '6px 14px',
              border: `1px solid ${cardBorder}`,
              boxShadow: '0 4px 16px rgba(28,20,16,0.12)',
            }}
          >
            <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 0.7 }}>
              <RefreshCw size={14} color="#7A5A00" />
            </motion.div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#7A5A00', fontFamily: "'Roboto', sans-serif" }}>
              {refreshing ? 'Đang tải lại...' : pullDelta > 60 ? 'Thả để tải lại' : 'Kéo xuống để tải lại'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

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
          zoomOnDoubleClick={true}
          selectionOnDrag={false}
          preventScrolling
          nodesDraggable={false}
          nodesConnectable={false}
        >
          {/* Ẩn controls mặc định — dùng custom controls bên dưới */}
          <Controls
            className="!hidden"
            showInteractive={false}
          />

          {/* Dot background */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={24} size={1.1}
            color={dotColor}
            style={{ opacity: 0.22 }}
          />

          {/* ── MiniMap — góc dưới phải, màu sắc nổi bật ── */}
          <MiniMap
            style={{
              background: darkMode ? '#111214' : '#FFF4E0',
              border: `2px solid ${darkMode ? '#3d5a70' : '#D4AF37'}`,
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(28,20,16,0.18)',
            }}
            position="bottom-right"
            nodeColor={n => {
              if (bloodlineIds) {
                if (!bloodlineIds.has(n.id)) return darkMode ? '#1d1f21' : '#DDD6CA';
                // Highlighted nodes: bright colors
                if (n.data?.gender === 'Nam') return '#2563EB';
                if (n.data?.gender === 'Nữ') return '#DB2777';
                return '#D4AF37';
              }
              if (n.data?.gender === 'Nam') return '#1D4ED8';
              if (n.data?.gender === 'Nữ') return '#BE185D';
              return '#D4AF37';
            }}
            nodeStrokeColor={n => {
              if (bloodlineIds && bloodlineIds.has(n.id)) return '#FBBF24';
              return 'transparent';
            }}
            nodeStrokeWidth={3}
            maskColor={darkMode ? 'rgba(0,0,0,0.6)' : 'rgba(245,240,232,0.6)'}
            zoomable
            pannable
          />
        </ReactFlow>
      </div>

      {/* ── CONTROLS THU PHÓNG — góc dưới TRÁI (cạnh vị trí cũ của chú giải), to hơn ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 300 }}
        className="absolute flex flex-col gap-1.5"
        style={{
          bottom: 16,
          left: 12,
          zIndex: 10,
        }}
      >
        {/* Nút + phóng to */}
        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.88 }}
          onClick={() => zoomIn({ duration: 300 })}
          className="flex items-center justify-center rounded-2xl font-black text-white"
          style={{
            width: 52, height: 52,
            background: cardBg,
            border: `1.5px solid ${cardBorder}`,
            boxShadow: '0 4px 16px rgba(28,20,16,0.12)',
            fontSize: 26,
            color: darkMode ? '#f5f5f5' : '#0b0b0b',
          }}
          title="Phóng to"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </motion.button>

        {/* Nút − thu nhỏ */}
        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.88 }}
          onClick={() => zoomOut({ duration: 300 })}
          className="flex items-center justify-center rounded-2xl"
          style={{
            width: 52, height: 52,
            background: cardBg,
            border: `1.5px solid ${cardBorder}`,
            boxShadow: '0 4px 16px rgba(28,20,16,0.12)',
            color: darkMode ? '#f5f5f5' : '#0b0b0b',
          }}
          title="Thu nhỏ"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </motion.button>

        {/* Bloodline indicator */}
        <AnimatePresence>
          {highlightId && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="flex items-center gap-2 rounded-2xl px-3 py-2 mt-1"
              onClick={() => {
                setHighlightId(null);
                lastTapRef.current = null;
              }}
              style={{
                background: cardBg,
                border: `1.5px solid #D4AF37`,
                boxShadow: '0 4px 16px rgba(212,175,55,0.2)',
                minWidth: 52,
                cursor: 'pointer',
              }}
            >
              <div className="w-3 h-3 rounded-full border-2 border-yellow-500 flex-shrink-0" />
              <span style={{
                fontSize: 12, color: '#D4AF37',
                fontFamily: "'Roboto', sans-serif", fontWeight: 700,
                whiteSpace: 'nowrap',
              }}>
                Tắt huyết thống
              </span>
              <Minimize2 size={12} style={{ color: cardText, marginLeft: 'auto' }} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── FAB THÊM THÀNH VIÊN — trên MiniMap ── */}
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
              bottom: 168,
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
