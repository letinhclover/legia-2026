import { useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  Controls, Background, BackgroundVariant,
  useNodesState, useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus } from 'lucide-react';
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
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────
function TreeSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#FAFAF7]">
      <div className="space-y-6 animate-pulse">
        {/* Đời 1 */}
        <div className="flex justify-center gap-4">
          {[1,2].map(i => (
            <div key={i} className="w-52 h-28 bg-gray-200 rounded-2xl" />
          ))}
        </div>
        {/* Đời 2 */}
        <div className="flex justify-center gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="w-52 h-28 bg-gray-200 rounded-2xl" />
          ))}
        </div>
        {/* Đời 3 */}
        <div className="flex justify-center gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="w-52 h-28 bg-gray-200 rounded-2xl" />
          ))}
        </div>
        <p className="text-center text-sm text-gray-400 font-medium">
          Đang tải cây phả hệ...
        </p>
      </div>
    </div>
  );
}

export default function TreeTab({ members, filterGen, isAdmin, onNodeClick, onAddMember }: Props) {
  const [isReady, setIsReady] = useState(false);

  // Delay nhỏ để tránh layout flash khi switch tab
  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 120);
    return () => clearTimeout(t);
  }, []);

  const filtered = filterGen === 'all'
    ? members
    : members.filter(m => m.generation === filterGen);

  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildFamilyLayout(filtered, onNodeClick),
    // Re-layout khi data thay đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered.map(m => `${m.id}:${m.spouseId}:${m.fatherId}:${m.birthDate}`).join(',')]
  );

  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  if (!isReady || members.length === 0) return <TreeSkeleton />;

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18, includeHiddenNodes: false }}
        minZoom={0.04}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}

        // ── Mobile UX mượt hơn ──────────────────────────────────────────
        panOnScroll={true}          // cuộn chuột = pan (desktop)
        panOnDrag={[1, 2]}          // drag chuột trái/giữa = pan
        zoomOnPinch={true}          // pinch 2 ngón = zoom (mobile)
        zoomOnScroll={true}         // scroll = zoom
        zoomOnDoubleClick={false}   // tắt double-tap zoom (hay bị accident)
        selectionOnDrag={false}     // tắt box selection
        preventScrolling={true}     // chặn page scroll khi đang pan cây
        nodesDraggable={false}      // không kéo node lẻ (tránh nhầm lẫn)
        nodesConnectable={false}    // không vẽ edge mới
        elementsSelectable={true}   // cho phép click node
      >
        {/* Controls thu phóng — ẩn interactive (không cần drag node) */}
        <Controls
          className="!bg-white !rounded-2xl !shadow-lg !border-0 !overflow-hidden"
          showInteractive={false}
        />

        {/* Background chấm vàng nhạt — cảm giác gia phả cổ */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.2}
          color="#C9A96E"
          style={{ opacity: 0.3 }}
        />
      </ReactFlow>

      {/* Chú thích màu đường nối */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-4 left-4 bg-white rounded-2xl shadow-md px-3 py-2.5 text-xs space-y-1.5 border border-gray-100"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-0.5 bg-[#800000]" />
          <span className="text-gray-500">Cha → Con</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 border-t-2 border-dashed border-pink-500" />
          <span className="text-gray-500">Mẹ → Con</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 border-t-2 border-dashed border-yellow-600" />
          <span className="text-gray-500">Vợ — Chồng</span>
        </div>
      </motion.div>

      {/* FAB thêm thành viên — chỉ admin */}
      <AnimatePresence>
        {isAdmin && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            onClick={onAddMember}
            className="absolute bottom-4 right-4 text-white font-bold rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2 z-20"
            style={{ background: 'linear-gradient(135deg, #B8860B, #8B6914)' }}
          >
            <Plus size={20} strokeWidth={3} />
            <span className="text-sm">Thêm</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
