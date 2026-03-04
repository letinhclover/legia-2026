import { useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  Controls, Background, BackgroundVariant, MiniMap,
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
  darkMode: boolean;
  onToggleDark: () => void;
}

// Skeleton Loading
function TreeSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#F9F8F4]">
      <div className="space-y-4 animate-pulse text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto" />
        <div className="w-32 h-4 bg-gray-200 rounded mx-auto" />
        <p className="text-xs text-gray-400 mt-2">Đang vẽ cây phả hệ...</p>
      </div>
    </div>
  );
}

export default function TreeTab({ members, filterGen, isAdmin, onNodeClick, onAddMember, darkMode }: Props) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 120);
    return () => clearTimeout(t);
  }, []);

  const filtered = filterGen === 'all'
    ? members
    : members.filter(m => m.generation === filterGen);

  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildFamilyLayout(filtered, onNodeClick),
    [filtered, onNodeClick]
  );

  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  // Update nodes khi layout thay đổi
  useEffect(() => {
    // Logic force update nếu cần thiết
  }, [initNodes, initEdges]);

  if (!isReady || members.length === 0) return <TreeSkeleton />;

  return (
    <div className="relative w-full h-full bg-[#F9F8F4]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, includeHiddenNodes: false }}
        minZoom={0.1}
        maxZoom={2.0}
        proOptions={{ hideAttribution: true }}
        
        // Mobile UX
        panOnScroll={false}
        zoomOnPinch={true}
        preventScrolling={true}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Controls 
          className="!bg-white !rounded-xl !shadow-lg !border-0 !overflow-hidden !mb-20 !ml-2" 
          showInteractive={false} 
        />
        
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#C9A96E"
          style={{ opacity: 0.2 }}
        />

        {/* MiniMap - Bản đồ thu nhỏ (Góc dưới trái) */}
        <MiniMap 
          nodeStrokeColor="transparent"
          nodeColor={darkMode ? '#475569' : '#cbd5e1'}
          nodeBorderRadius={6}
          maskColor={darkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(249, 248, 244, 0.6)'}
          style={{ 
            height: 100, width: 140, 
            bottom: 80, left: 10, // Tránh BottomNav
            borderRadius: 12, 
            border: '1px solid rgba(0,0,0,0.05)',
            background: darkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.5)' 
          }}
        />

      </ReactFlow>

      {/* Chú thích màu đường nối */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm px-2 py-1.5 text-[10px] border border-white/50"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-0.5 bg-[#800000]" />
          <span className="text-gray-600">Cha Con</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 border-t-2 border-dashed border-[#BE185D]" />
          <span className="text-gray-600">Mẹ Con</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 border-t-2 border-dashed border-[#B8860B]" />
          <span className="text-gray-600">Vợ Chồng</span>
        </div>
      </motion.div>

      {/* FAB thêm thành viên */}
      <AnimatePresence>
        {isAdmin && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onAddMember}
            className="absolute bottom-24 right-4 text-white rounded-full shadow-xl w-12 h-12 flex items-center justify-center z-50"
            style={{ background: 'linear-gradient(135deg, #B8860B, #8B6914)' }}
          >
            <Plus size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
