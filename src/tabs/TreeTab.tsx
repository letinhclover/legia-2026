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

function TreeInner({ members, filterGen: filterGenProp, isAdmin, onNodeClick, onAddMember, darkMode, onRefresh, initialHighlightId }: Props) {
  const [ready, setReady]               = useState(false);
  const [highlightId, setHighlightId]   = useState<string | null>(initialHighlightId ?? null);
  const [refreshing, setRefreshing]     = useState(false);
  const [localFilter, setLocalFilter]   = useState<number | 'all'>(filterGenProp);
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pull-to-refresh state
  const pullStartY = useRef<number>(0);
  const pulling = useRef(false);
  const [pullDelta, setPullDelta] = useState(0);

  const { fitView } = useReactFlow();

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(
    () => localFilter === 'all' ? members : members.filter(m => m.generation === localFilter),
    [members, localFilter]
  );

  const maxGen = useMemo(() => Math.max(...members.map(m => m.generation), 1), [members]);

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
  const bgColor    = darkMode ? '#0f1724' : '#F5F0E8';
  const dotColor   = darkMode ? '#5C3A1E' : '#B8A07A';
  const cardBg     = darkMode ? 'rgba(20,30,46,0.97)' : 'rgba(255,253,247,0.97)';
  const cardBorder = darkMode ? '#2d3d52'              : '#E2D8CA';
  const cardText   = darkMode ? '#8A9BB0'              : '#6B5E52';

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
              <RefreshCw size={14} color="#B8860B" />
            </motion.div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#B8860B', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
              {refreshing ? 'Đang tải lại...' : pullDelta > 60 ? 'Thả để tải lại' : 'Kéo xuống để tải lại'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating chip bar lọc đời ── */}
      <div style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        zIndex: 20, display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 6px',
        background: darkMode ? 'rgba(15,23,36,0.88)' : 'rgba(255,253,247,0.90)',
        backdropFilter: 'blur(12px)',
        borderRadius: 999,
        border: `1px solid ${darkMode ? 'rgba(212,175,55,0.2)' : 'rgba(212,175,55,0.3)'}`,
        boxShadow: '0 4px 16px rgba(28,20,16,0.14)',
        maxWidth: 'calc(100vw - 100px)',
        overflowX: 'auto',
      }}>
        {(['all', ...Array.from({ length: maxGen }, (_, i) => i + 1)] as (number | 'all')[]).map(g => {
          const isActive = localFilter === g;
          return (
            <motion.button
              key={g}
              whileTap={{ scale: 0.88 }}
              onClick={() => setLocalFilter(g)}
              style={{
                padding: '5px 12px',
                borderRadius: 999,
                border: 'none',
                background: isActive
                  ? 'linear-gradient(135deg, #800000, #B8860B)'
                  : 'transparent',
                color: isActive
                  ? 'white'
                  : darkMode ? '#8A9BB0' : '#6B5E52',
                fontSize: 12,
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: "'Be Vietnam Pro', sans-serif",
                transition: 'background 0.18s, color 0.18s',
                flexShrink: 0,
              }}
            >
              {g === 'all' ? 'Tất cả' : `Đời ${g}`}
            </motion.button>
          );
        })}
      </div>

      {/* ── Empty State ── */}
      {members.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 15,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 20, padding: '0 40px',
        }}>
          {/* SVG minh hoạ cây gia phả đơn giản */}
          <svg width="140" height="120" viewBox="0 0 140 120" fill="none">
            {/* Gốc cây */}
            <rect x="62" y="90" width="16" height="24" rx="4" fill={darkMode ? '#2d3d52' : '#E2D8CA'}/>
            {/* Thân cây */}
            <rect x="65" y="50" width="10" height="44" rx="5" fill={darkMode ? '#3d5a70' : '#D4AF37'} opacity="0.6"/>
            {/* Tán lá */}
            <ellipse cx="70" cy="40" rx="38" ry="32" fill={darkMode ? '#1D4ED8' : '#800000'} opacity="0.12"/>
            <ellipse cx="70" cy="38" rx="28" ry="24" fill={darkMode ? '#1D4ED8' : '#800000'} opacity="0.18"/>
            <ellipse cx="70" cy="35" rx="18" ry="18" fill={darkMode ? '#1D4ED8' : '#800000'} opacity="0.25"/>
            {/* Node người */}
            <circle cx="70" cy="32" r="12" fill={darkMode ? '#1a2535' : '#FFF5F5'} stroke={darkMode ? '#D4AF37' : '#800000'} strokeWidth="2"/>
            <text x="70" y="37" textAnchor="middle" fontSize="12" fill={darkMode ? '#D4AF37' : '#800000'}>👤</text>
            {/* Nhánh trái */}
            <line x1="70" y1="54" x2="36" y2="74" stroke={darkMode ? '#3d5a70' : '#D4AF37'} strokeWidth="2" strokeDasharray="4 3" opacity="0.5"/>
            <circle cx="30" cy="78" r="10" fill={darkMode ? '#1a2535' : '#FFF5F5'} stroke={darkMode ? '#3d5a70' : '#E2D8CA'} strokeWidth="1.5" opacity="0.6"/>
            {/* Nhánh phải */}
            <line x1="70" y1="54" x2="104" y2="74" stroke={darkMode ? '#3d5a70' : '#D4AF37'} strokeWidth="2" strokeDasharray="4 3" opacity="0.5"/>
            <circle cx="110" cy="78" r="10" fill={darkMode ? '#1a2535' : '#FFF5F5'} stroke={darkMode ? '#3d5a70' : '#E2D8CA'} strokeWidth="1.5" opacity="0.6"/>
          </svg>

          <div style={{ textAlign: 'center' }}>
            <h3 style={{
              fontSize: 20, fontWeight: 900, color: darkMode ? '#E8DDD0' : '#1C1410',
              fontFamily: "'Merriweather', serif", marginBottom: 8,
            }}>
              Chưa có thành viên
            </h3>
            <p style={{
              fontSize: 14, color: darkMode ? '#8A9BB0' : '#6B5E52',
              fontFamily: "'Be Vietnam Pro', sans-serif", lineHeight: 1.6,
            }}>
              Bắt đầu xây dựng gia phả bằng cách thêm người đầu tiên trong dòng họ.
            </p>
          </div>

          {isAdmin && onAddMember && (
            <motion.button
              whileTap={{ scale: 0.93 }}
              whileHover={{ scale: 1.04, y: -2 }}
              onClick={onAddMember}
              style={{
                background: 'linear-gradient(135deg, #800000, #B8860B)',
                color: 'white',
                border: 'none', borderRadius: 16,
                padding: '14px 32px',
                fontSize: 15, fontWeight: 800,
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(128,0,0,0.3)',
                fontFamily: "'Be Vietnam Pro', sans-serif",
              }}
            >
              <Plus size={20} strokeWidth={2.5} />
              Thêm thành viên đầu tiên
            </motion.button>
          )}
        </div>
      )}

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
              background: darkMode ? '#0a1220' : '#FFF4E0',
              border: `2px solid ${darkMode ? '#3d5a70' : '#D4AF37'}`,
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(28,20,16,0.18)',
            }}
            position="bottom-right"
            nodeColor={n => {
              if (bloodlineIds) {
                if (!bloodlineIds.has(n.id)) return darkMode ? '#1a2535' : '#DDD6CA';
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
          onClick={() => fitView({ padding: 0.08, duration: 400 })}
          className="flex items-center justify-center rounded-2xl font-black text-white"
          style={{
            width: 52, height: 52,
            background: cardBg,
            border: `1.5px solid ${cardBorder}`,
            boxShadow: '0 4px 16px rgba(28,20,16,0.12)',
            fontSize: 26,
            color: darkMode ? '#E8DDD0' : '#1C1410',
          }}
          title="Phóng to vừa màn hình"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </motion.button>

        {/* Nút − thu nhỏ */}
        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.88 }}
          onClick={() => fitView({ padding: 0.5, duration: 400 })}
          className="flex items-center justify-center rounded-2xl"
          style={{
            width: 52, height: 52,
            background: cardBg,
            border: `1.5px solid ${cardBorder}`,
            boxShadow: '0 4px 16px rgba(28,20,16,0.12)',
            color: darkMode ? '#E8DDD0' : '#1C1410',
          }}
          title="Thu nhỏ toàn cảnh"
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
              style={{
                background: cardBg,
                border: `1.5px solid #D4AF37`,
                boxShadow: '0 4px 16px rgba(212,175,55,0.2)',
                minWidth: 52,
              }}
            >
              <div className="w-3 h-3 rounded-full border-2 border-yellow-500 flex-shrink-0" />
              <span style={{
                fontSize: 10, color: '#D4AF37',
                fontFamily: "'Be Vietnam Pro', sans-serif", fontWeight: 700,
                whiteSpace: 'nowrap',
              }}>
                Huyết thống
              </span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => {
                  setHighlightId(null);
                  lastTapRef.current = null; // Reset double-tap khi tắt highlight thủ công
                }}
                className="ml-auto flex-shrink-0 rounded-lg p-0.5"
                title="Tắt highlight"
              >
                <Minimize2 size={12} style={{ color: cardText }} />
              </motion.button>
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
