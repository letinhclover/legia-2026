import dagre from 'dagre';
import { Node, Edge } from 'reactflow';
import { Member } from '../types';

export const NODE_W = 220;
export const NODE_H = 110;
const SPOUSE_GAP = 36;   // khoảng cách ngang giữa vợ và chồng
const RANK_SEP = 160;    // khoảng dọc giữa các đời

// ─── Build toàn bộ layout vợ/chồng đúng vị trí ──────────────────────────────
export function buildFamilyLayout(
  members: Member[],
  onNodeClick: (m: Member) => void
): { nodes: Node[]; edges: Edge[] } {
  if (members.length === 0) return { nodes: [], edges: [] };

  const memberMap = new Map(members.map(m => [m.id, m]));

  // ── Bước 1: Tạo danh sách cặp vợ chồng (duy nhất) ──────────────────────
  const processedSpouse = new Set<string>();
  // groupId → [husbandId, wifeId] hoặc [singleId]
  const coupleGroups: Array<{ id: string; members: string[] }> = [];
  const memberToGroup = new Map<string, string>();

  members.forEach(m => {
    if (processedSpouse.has(m.id)) return;
    const spouse = m.spouseId ? memberMap.get(m.spouseId) : null;

    if (spouse && !processedSpouse.has(spouse.id)) {
      // Tạo cặp — chồng (Nam) đứng trái, vợ đứng phải
      const husband = m.gender === 'Nam' ? m : spouse;
      const wife = m.gender === 'Nam' ? spouse : m;
      const gid = `couple_${husband.id}`;
      coupleGroups.push({ id: gid, members: [husband.id, wife.id] });
      memberToGroup.set(husband.id, gid);
      memberToGroup.set(wife.id, gid);
      processedSpouse.add(m.id);
      processedSpouse.add(spouse.id);
    } else {
      // Không có vợ/chồng — tạo group đơn
      const gid = `single_${m.id}`;
      coupleGroups.push({ id: gid, members: [m.id] });
      memberToGroup.set(m.id, gid);
      processedSpouse.add(m.id);
    }
  });

  // ── Bước 2: Chạy dagre trên các GROUP (không phải individual nodes) ──────
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: NODE_W + 60, ranksep: RANK_SEP });

  // Thêm group nodes vào dagre
  coupleGroups.forEach(group => {
    const w = group.members.length === 2
      ? NODE_W * 2 + SPOUSE_GAP  // cặp vợ chồng: 2 node + khoảng cách
      : NODE_W;                    // node đơn
    g.setNode(group.id, { width: w, height: NODE_H });
  });

  // Thêm edges cha-mẹ → nhóm con
  const addedEdges = new Set<string>();
  members.forEach(child => {
    const childGroup = memberToGroup.get(child.id)!;
    const parents = [child.fatherId, child.motherId].filter(Boolean) as string[];

    for (const parentId of parents) {
      const parentGroup = memberToGroup.get(parentId);
      if (!parentGroup || parentGroup === childGroup) continue;
      const edgeKey = `${parentGroup}→${childGroup}`;
      if (!addedEdges.has(edgeKey)) {
        addedEdges.add(edgeKey);
        g.setEdge(parentGroup, childGroup);
      }
    }
  });

  dagre.layout(g);

  // ── Bước 3: Tính toán vị trí pixel thực cho từng member ─────────────────
  const positions = new Map<string, { x: number; y: number }>();

  coupleGroups.forEach(group => {
    const gPos = g.node(group.id);
    if (!gPos) return;

    if (group.members.length === 2) {
      const [husbandId, wifeId] = group.members;
      const groupLeft = gPos.x - gPos.width / 2;
      // Chồng bên trái
      positions.set(husbandId, {
        x: groupLeft,
        y: gPos.y - NODE_H / 2,
      });
      // Vợ bên phải, ngay cạnh chồng, CÙNG Y
      positions.set(wifeId, {
        x: groupLeft + NODE_W + SPOUSE_GAP,
        y: gPos.y - NODE_H / 2,
      });
    } else {
      positions.set(group.members[0], {
        x: gPos.x - NODE_W / 2,
        y: gPos.y - NODE_H / 2,
      });
    }
  });

  // ── Bước 4: Tạo React Flow nodes ─────────────────────────────────────────
  const flowNodes: Node[] = members.map(m => ({
    id: m.id,
    type: 'familyNode',
    position: positions.get(m.id) ?? { x: 0, y: 0 },
    data: {
      ...m,
      spouseName: m.spouseId ? memberMap.get(m.spouseId)?.name : undefined,
      onEdit: onNodeClick,
    },
  }));

  // ── Bước 5: Tạo edges ─────────────────────────────────────────────────────
  const flowEdges: Edge[] = [];
  const memberIds = new Set(members.map(m => m.id));
  const addedFlowEdges = new Set<string>();
  const addedSpouseEdges = new Set<string>();

  members.forEach(m => {
    // Edge cha → con (đỏ đậm)
    if (m.fatherId && memberIds.has(m.fatherId)) {
      const key = `f-${m.fatherId}-${m.id}`;
      if (!addedFlowEdges.has(key)) {
        addedFlowEdges.add(key);
        flowEdges.push({
          id: key,
          source: m.fatherId,
          target: m.id,
          type: 'smoothstep',
          style: { stroke: '#800000', strokeWidth: 2.5 },
          markerEnd: { type: 'arrowclosed' as any, color: '#800000' },
        });
      }
    }
    // Edge mẹ → con (nếu không có cha, nét đứt hồng)
    if (m.motherId && memberIds.has(m.motherId) && !m.fatherId) {
      const key = `m-${m.motherId}-${m.id}`;
      if (!addedFlowEdges.has(key)) {
        addedFlowEdges.add(key);
        flowEdges.push({
          id: key,
          source: m.motherId,
          target: m.id,
          type: 'smoothstep',
          style: { stroke: '#BE185D', strokeWidth: 1.8, strokeDasharray: '6,3' },
        });
      }
    }

    // Edge vợ chồng (nét đứt, màu vàng đồng, KHÔNG mũi tên, nằm ngang)
    if (m.spouseId && memberIds.has(m.spouseId)) {
      const pairKey = [m.id, m.spouseId].sort().join('|');
      if (!addedSpouseEdges.has(pairKey)) {
        addedSpouseEdges.add(pairKey);
        // Đặt chồng là source, vợ là target
        const husband = m.gender === 'Nam' ? m : memberMap.get(m.spouseId)!;
        const wife = m.gender === 'Nam' ? memberMap.get(m.spouseId)! : m;
        flowEdges.push({
          id: `spouse-${pairKey}`,
          source: husband?.id ?? m.id,
          target: wife?.id ?? m.spouseId,
          type: 'straight',
          style: {
            stroke: '#B8860B',
            strokeWidth: 2,
            strokeDasharray: '8,4',
          },
          markerEnd: undefined,   // KHÔNG mũi tên
          label: '💑',
          labelStyle: { fontSize: 13 },
          labelBgStyle: { fill: 'transparent' },
        });
      }
    }
  });

  return { nodes: flowNodes, edges: flowEdges };
}
