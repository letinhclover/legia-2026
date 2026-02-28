import { useCallback } from 'react';
import ReactFlow, { Node, Edge, Controls, Background, useNodesState, useEdgesState, BackgroundVariant } from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Member } from '../types';
import FamilyNode from '../components/FamilyNode';

const nodeTypes = { familyNode: FamilyNode };
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

export function buildLayout(members: Member[], onNodeClick: (m: Member) => void) {
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 120 });

  const flowNodes: Node[] = members.map(m => ({
    id: m.id, type: 'familyNode', position: { x: 0, y: 0 },
    data: {
      ...m,
      spouseName: m.spouseId ? members.find(x => x.id === m.spouseId)?.name : undefined,
      onEdit: (member: Member) => onNodeClick(member),
    },
  }));

  const filteredIds = new Set(members.map(m => m.id));
  const flowEdges: Edge[] = [];

  members.forEach(m => {
    if (m.fatherId && filteredIds.has(m.fatherId)) {
      flowEdges.push({ id: `f-${m.fatherId}-${m.id}`, source: m.fatherId, target: m.id, type: 'smoothstep', style: { stroke: '#800000', strokeWidth: 2.5 } });
    } else if (m.motherId && filteredIds.has(m.motherId) && !m.fatherId) {
      flowEdges.push({ id: `m-${m.motherId}-${m.id}`, source: m.motherId, target: m.id, type: 'smoothstep', style: { stroke: '#BE185D', strokeWidth: 2, strokeDasharray: '6,3' } });
    }
    if (m.spouseId && filteredIds.has(m.spouseId) && m.id < m.spouseId) {
      flowEdges.push({ id: `s-${m.id}-${m.spouseId}`, source: m.id, target: m.spouseId, type: 'straight', style: { stroke: '#B8860B', strokeWidth: 2, strokeDasharray: '4,4' }, label: '💑', labelStyle: { fontSize: 11 } });
    }
  });

  flowNodes.forEach(n => dagreGraph.setNode(n.id, { width: 240, height: 110 }));
  flowEdges.forEach(e => dagreGraph.setEdge(e.source, e.target));
  dagre.layout(dagreGraph);

  const laidOut = flowNodes.map(n => {
    const p = dagreGraph.node(n.id);
    return { ...n, position: { x: p.x - 120, y: p.y - 55 } };
  });

  return { nodes: laidOut, edges: flowEdges };
}

interface Props {
  members: Member[];
  filterGen: number | 'all';
  isAdmin: boolean;
  onNodeClick: (m: Member) => void;
  onAddMember: () => void;
}

export default function TreeTab({ members, filterGen, isAdmin, onNodeClick, onAddMember }: Props) {
  const filtered = filterGen === 'all' ? members : members.filter(m => m.generation === filterGen);
  const { nodes: initNodes, edges: initEdges } = buildLayout(filtered, onNodeClick);

  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  return (
    <div className="flex flex-col h-full relative">
      {/* Gen filter pills */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-2 pointer-events-none">
        <div className="flex gap-1.5 overflow-x-auto pointer-events-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="bg-white rounded-full px-3 py-1.5 text-xs font-bold shadow-sm border border-gray-100 text-gray-500 whitespace-nowrap">
            {filtered.length} người
          </div>
        </div>
      </div>

      {/* React Flow — user-scalable ON */}
      <div className="flex-1" style={{ touchAction: 'auto' }}>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView minZoom={0.04} maxZoom={2.5}
          fitViewOptions={{ padding: 0.15 }}
        >
          <Controls className="bg-white rounded-xl shadow-md !border-0" showInteractive={false} />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#C9A96E" opacity={0.35} />
        </ReactFlow>
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
          <span className="text-sm">Thêm thành viên</span>
        </motion.button>
      )}
    </div>
  );
}
