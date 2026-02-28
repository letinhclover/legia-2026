import { useMemo, useState, useEffect } from 'react';
import ReactFlow, { Controls, Background, BackgroundVariant, useNodesState, useEdgesState } from 'reactflow';
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

function TreeSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: '#101922' }}>
      <div className="space-y-8 animate-pulse text-center">
        <div className="flex justify-center gap-6">
          {[1, 2].map(i => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full" style={{ background: '#233648' }} />
              <div className="w-20 h-8 rounded-xl" style={{ background: '#192633' }} />
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full" style={{ background: '#233648' }} />
              <div className="w-18 h-7 rounded-xl" style={{ background: '#192633' }} />
            </div>
          ))}
        </div>
        <p style={{ color: '#92adc9', fontSize: 13 }}>Đang tải cây phả hệ...</p>
      </div>
    </div>
  );
}

export default function TreeTab({ members, filterGen, isAdmin, onNodeClick, onAddMember }: Props) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 100); return () => clearTimeout(t); }, []);

  const filtered = filterGen === 'all' ? members : members.filter(m => m.generation === filterGen);

  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildFamilyLayout(filtered, onNodeClick),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered.map(m => `${m.id}:${m.spouseId}:${m.fatherId}:${m.birthDate}`).join(',')]
  );

  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  if (!ready || members.length === 0) return <TreeSkeleton />;

  return (
    <div className="relative w-full h-full" style={{ background: '#101922' }}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView fitViewOptions={{ padding: 0.2 }}
        minZoom={0.05} maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        panOnScroll panOnDrag={[1, 2]}
        zoomOnPinch zoomOnScroll
        zoomOnDoubleClick={false}
        selectionOnDrag={false}
        preventScrolling
        nodesDraggable={false}
        nodesConnectable={false}
      >
        <Controls className="!rounded-2xl !overflow-hidden"
          style={{ background: '#192633', border: '1px solid #233648' }}
          showInteractive={false} />
        <Background variant={BackgroundVariant.Dots} gap={24} size={1}
          color="#8B5A2B" style={{ opacity: 0.25 }} />
      </ReactFlow>

      {/* Chú thích */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="absolute bottom-20 left-4 rounded-2xl px-3 py-2.5 text-xs space-y-1.5"
        style={{ background: '#192633', border: '1px solid #233648' }}
      >
        {[
          { color: '#D4AF37', label: 'Trưởng chi/tộc', dot: true },
          { color: '#92adc9', label: 'Thành viên',    dot: true },
        ].map(({ color, label, dot }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: color, background: dot ? 'transparent' : color }} />
            <span style={{ color: '#92adc9' }}>{label}</span>
          </div>
        ))}
      </motion.div>

      {/* FAB thêm */}
      <AnimatePresence>
        {isAdmin && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onAddMember}
            className="absolute bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-20"
            style={{ background: '#D4AF37' }}
          >
            <Plus size={26} strokeWidth={3} color="#101922" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
