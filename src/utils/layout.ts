import dagre from 'dagre';
import { Node, Edge } from 'reactflow';
import { Member } from '../types';

// ── CẤU HÌNH KÍCH THƯỚC (ĐÃ THU NHỎ TỐI ĐA) ──────────────────────────
export const NODE_W = 100; // Giảm từ 200 -> 100 (Rất gọn)
export const NODE_H = 140; // Tăng chiều cao để chứa ảnh + tên dọc
const SPOUSE_GAP = 20;     // Vợ chồng sát rạt nhau (cách 20px)
const RANK_SEP = 120;      // Khoảng cách giữa các đời (ngắn lại chút)
const NODE_SEP = 40;       // Khoảng cách giữa các anh em (gần hơn)
const STAIR_OFFSET = 50;   // Độ lệch bậc thang

// Hàm lấy năm sinh (để sắp xếp)
function getBirthYear(m: Member): number {
  if (!m.birthDate && !m.birthYear) return 9999;
  if (m.birthYear) return Number(m.birthYear);
  const y = parseInt(m.birthDate!.slice(0, 4));
  return isNaN(y) ? 9999 : y;
}

// Sắp xếp thành viên: Đời -> Cha Mẹ -> Năm sinh
// ĐÂY LÀ LOGIC TỰ ĐỘNG SẮP XẾP BẠN CẦN
function sortMembersSecure(members: Member[]): Member[] {
  return [...members].sort((a, b) => {
    // 1. Ưu tiên theo Đời
    if (a.generation !== b.generation) return a.generation - b.generation;
    
    // 2. Gom nhóm theo Cha/Mẹ
    const parentA = a.fatherId || a.motherId || '';
    const parentB = b.fatherId || b.motherId || '';
    if (parentA !== parentB) return parentA.localeCompare(parentB);

    // 3. Cùng cha mẹ -> Anh lớn (năm nhỏ) đứng trước
    const yearA = getBirthYear(a);
    const yearB = getBirthYear(b);
    
    // Nếu năm sinh trùng hoặc thiếu, dùng ID để cố định thứ tự (tránh nhảy lung tung)
    if (yearA === yearB) return a.id.localeCompare(b.id);
    
    return yearA - yearB;
  });
}

export function buildFamilyLayout(
  rawMembers: Member[],
  onNodeClick: (m: Member) => void
): { nodes: Node[]; edges: Edge[] } {
  if (rawMembers.length === 0) return { nodes: [], edges: [] };

  // 1. Sắp xếp ngay từ đầu -> Đảm bảo thêm người mới vào đúng chỗ
  const members = sortMembersSecure(rawMembers);
  const memberMap = new Map(members.map(m => [m.id, m]));

  // 2. Gom nhóm Vợ/Chồng
  const couples: Map<string, string[]> = new Map();
  const memberToCoupleId = new Map<string, string>();
  const processed = new Set<string>();

  members.forEach(m => {
    if (processed.has(m.id)) return;
    const spouse = m.spouseId ? memberMap.get(m.spouseId) : null;
    if (spouse) {
      const isMale = m.gender === 'Nam';
      const main = isMale ? m : spouse;
      const partner = isMale ? spouse : m;
      const coupleId = `couple_${main.id}`;
      couples.set(coupleId, [main.id, partner.id]);
      memberToCoupleId.set(main.id, coupleId);
      memberToCoupleId.set(partner.id, coupleId);
      processed.add(main.id);
      processed.add(partner.id);
    } else {
      const coupleId = `single_${m.id}`;
      couples.set(coupleId, [m.id]);
      memberToCoupleId.set(m.id, coupleId);
      processed.add(m.id);
    }
  });

  // 3. Cấu hình Dagre
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: NODE_SEP, ranksep: RANK_SEP });
  g.setDefaultEdgeLabel(() => ({}));

  // 4. Set Node Size cho Dagre
  couples.forEach((ids, coupleId) => {
    // Chiều rộng = tổng các node + gap nhỏ
    const width = ids.length * NODE_W + (ids.length - 1) * SPOUSE_GAP;
    g.setNode(coupleId, { width: width, height: NODE_H });
  });

  // 5. Thêm Edges (Cha -> Con)
  members.forEach(m => {
    if (!m.fatherId && !m.motherId) return;
    const childCoupleId = memberToCoupleId.get(m.id);
    const parentId = m.fatherId || m.motherId; 
    const parentCoupleId = parentId ? memberToCoupleId.get(parentId) : null;
    if (childCoupleId && parentCoupleId && childCoupleId !== parentCoupleId) {
      if (!g.hasEdge(parentCoupleId, childCoupleId)) {
         g.setEdge(parentCoupleId, childCoupleId);
      }
    }
  });

  dagre.layout(g);

  // 6. Tính toán vị trí cuối cùng
  const finalPositions = new Map<string, { x: number, y: number }>();
  const siblingsGroups = new Map<string, string[]>(); 
  
  // Logic Bậc Thang (Staircase)
  couples.forEach((_, childCoupleId) => {
     const firstMemberId = couples.get(childCoupleId)?.[0];
     const mem = memberMap.get(firstMemberId!);
     const parentId = mem?.fatherId || mem?.motherId;
     const pCid = parentId ? (memberToCoupleId.get(parentId) || 'root') : 'root';
     if (!siblingsGroups.has(pCid)) siblingsGroups.set(pCid, []);
     if (!siblingsGroups.get(pCid)?.includes(childCoupleId)) {
        siblingsGroups.get(pCid)?.push(childCoupleId);
     }
  });

  siblingsGroups.forEach((childCoupleIds) => {
    // Sắp xếp lại theo X để đảm bảo thứ tự Dagre
    childCoupleIds.sort((a, b) => g.node(a).x - g.node(b).x);
    childCoupleIds.forEach((cid, index) => {
      const nodeInfo = g.node(cid);
      nodeInfo.y += (index * STAIR_OFFSET); 
    });
  });

  couples.forEach((ids, coupleId) => {
    const nodeInfo = g.node(coupleId);
    const totalWidth = ids.length * NODE_W + (ids.length - 1) * SPOUSE_GAP;
    const startX = nodeInfo.x - totalWidth / 2;
    ids.forEach((memId, idx) => {
      // Vợ chồng sát nhau
      const posX = startX + idx * (NODE_W + SPOUSE_GAP);
      finalPositions.set(memId, { x: posX, y: nodeInfo.y });
    });
  });

  // 7. Tạo React Flow Nodes
  const flowNodes: Node[] = members.map(m => {
    const pos = finalPositions.get(m.id) || { x: 0, y: 0 };
    return {
      id: m.id,
      type: 'familyNode',
      position: pos,
      data: { ...m, onEdit: onNodeClick },
    };
  });

  // 8. Tạo Edges
  const flowEdges: Edge[] = [];
  const addedLinks = new Set<string>();

  members.forEach(m => {
    // Nối Cha -> Con
    if (m.fatherId && memberMap.has(m.fatherId)) {
      const linkId = `${m.fatherId}-${m.id}`;
      if (!addedLinks.has(linkId)) {
        flowEdges.push({
          id: linkId, source: m.fatherId, target: m.id,
          type: 'smoothstep',
          style: { stroke: '#800000', strokeWidth: 1.5 },
          markerEnd: { type: 'arrowclosed' as any, color: '#800000', width: 15, height: 15 }, 
        });
        addedLinks.add(linkId);
      }
    }
    // Nối Vợ - Chồng
    if (m.spouseId && memberMap.has(m.spouseId)) {
      const [id1, id2] = [m.id, m.spouseId].sort();
      const linkId = `spouse-${id1}-${id2}`;
      if (!addedLinks.has(linkId)) {
        const p1 = finalPositions.get(id1);
        const p2 = finalPositions.get(id2);
        // Chỉ vẽ nếu gần nhau
        if (p1 && p2 && Math.abs(p1.y - p2.y) < 10) {
            flowEdges.push({
            id: linkId, source: id1, target: id2,
            type: 'straight', 
            style: { stroke: '#B8860B', strokeWidth: 1.5 },
            animated: false, zIndex: -1,
          });
          addedLinks.add(linkId);
        }
      }
    }
  });

  return { nodes: flowNodes, edges: flowEdges };
}
