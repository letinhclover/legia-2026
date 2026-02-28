import { useMemo } from 'react';
import ReactFlow, { Controls, Background, BackgroundVariant, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
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

export default function TreeTab({ members, filterGen, isAdmin, onNodeClick, onAddMember }: Props) {
  const filtered = filterGen === 'all' ? members : members.filter(m => m.generation === filterGen);

  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildFamilyLayout(filtered, onNodeClick),
    [filtered.map(m => m.id + m.spouseId).join(',')]
  );

  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.04}
        maxZoom={2.5}
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
      >
        <Controls className="bg-white rounded-xl shadow-md !border-0" showInteractive={false} />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#C9A96E" opacity={0.35} />
      </ReactFlow>

      {/* Chú thích màu đường nối */}
      <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-md px-3 py-2 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-[#800000]" />
          <span className="text-gray-500">Cha → Con</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 border-t-2 border-dashed border-pink-500" />
          <span className="text-gray-500">Mẹ → Con</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 border-t-2 border-dashed border-yellow-600" />
          <span className="text-gray-500">Vợ — Chồng</span>
        </div>
      </div>

      {/* FAB thêm thành viên */}
      {isAdmin && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onAddMember}
          className="absolute bottom-4 right-4 text-white font-bold rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2 z-20"
          style={{ background: 'linear-gradient(135deg, #B8860B, #8B6914)' }}
        >
          <Plus size={20} strokeWidth={3} />
          <span className="text-sm">Thêm</span>
        </motion.button>
      )}
    </div>
  );
}
