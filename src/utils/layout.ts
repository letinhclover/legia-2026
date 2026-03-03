import dagre from 'dagre';
import { Node, Edge } from 'reactflow';
import { Member } from '../types';

// ── CẤU HÌNH KÍCH THƯỚC ──────────────────────────────────────────────
export const NODE_W = 200; // Tăng chiều rộng để hiển thị đẹp hơn
export const NODE_H = 110; // Chiều cao node
const SPOUSE_GAP = 50;     // Khoảng cách giữa Vợ - Chồng
const RANK_SEP = 180;      // Khoảng cách giữa các Đời (Cha - Con)
const NODE_SEP = 80;       // Khoảng cách giữa các anh em/cặp đôi
const STAIR_OFFSET = 60;   // ĐỘ LỆCH BẬC THANG (Em thấp hơn Anh 60px)

// ── Helper: Lấy năm sinh an toàn ─────────────────────────────────────
function getBirthYear(m: Member): number {
  if (!m.birthDate) return 9999; // Không có năm sinh thì đẩy xuống cuối
  const y = parseInt(m.birthDate.slice(0, 4));
  return isNaN(y) ? 9999 : y;
}

// ── Helper: Sắp xếp thành viên (Quan trọng) ──────────────────────────
// Sắp xếp theo: Đời -> Cha Mẹ -> Năm sinh
function sortMembersSecure(members: Member[]): Member[] {
  return [...members].sort((a, b) => {
    // 1. Ưu tiên theo Đời (Generation)
    if (a.generation !== b.generation) {
      return a.generation - b.generation;
    }
    
    // 2. Gom nhóm theo Cha/Mẹ (để anh em đứng cạnh nhau)
    const parentA = a.fatherId || a.motherId || '';
    const parentB = b.fatherId || b.motherId || '';
    if (parentA !== parentB) {
      return parentA.localeCompare(parentB);
    }

    // 3. Cùng cha mẹ -> Xếp theo Năm sinh (Anh trước, Em sau)
    return getBirthYear(a) - getBirthYear(b);
  });
}

// ─── MAIN LAYOUT FUNCTION ─────────────────────────────────────────────
export function buildFamilyLayout(
  rawMembers: Member[],
  onNodeClick: (m: Member) => void
): { nodes: Node[]; edges: Edge[] } {
  if (rawMembers.length === 0) return { nodes: [], edges: [] };

  // 1. Sắp xếp danh sách đầu vào chuẩn chỉ
  const members = sortMembersSecure(rawMembers);
  const memberMap = new Map(members.map(m => [m.id, m]));

  // 2. Gom nhóm Vợ/Chồng (Couple Grouping)
  // Ý tưởng: Coi (Chồng + Vợ) là 1 NODE TO trong mắt Dagre để không bị tách rời
  const couples: Map<string, string[]> = new Map(); // Key: ID đại diện, Value: [ID1, ID2]
  const memberToCoupleId = new Map<string, string>();
  const processed = new Set<string>();

  members.forEach(m => {
    if (processed.has(m.id)) return;

    const spouse = m.spouseId ? memberMap.get(m.spouseId) : null;
    if (spouse) {
      // Có vợ/chồng -> Tạo nhóm
      // Logic: Ưu tiên Nam làm Key, hoặc người có quan hệ huyết thống
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
      // Độc thân -> Nhóm 1 mình
      const coupleId = `single_${m.id}`;
      couples.set(coupleId, [m.id]);
      memberToCoupleId.set(m.id, coupleId);
      processed.add(m.id);
    }
  });

  // 3. Cấu hình Dagre (Thư viện vẽ cây)
  const g = new dagre.graphlib.Graph();
  g.setGraph({ 
    rankdir: 'TB', // Top-to-Bottom
    nodesep: NODE_SEP, 
    ranksep: RANK_SEP 
  });
  g.setDefaultEdgeLabel(() => ({}));

  // 4. Thêm Node vào Dagre (Node ở đây là Cặp đôi)
  couples.forEach((ids, coupleId) => {
    // Chiều rộng = Tổng chiều rộng các thành viên + khoảng cách
    const width = ids.length * NODE_W + (ids.length - 1) * SPOUSE_GAP;
    g.setNode(coupleId, { width: width, height: NODE_H });
  });

  // 5. Thêm Edge (Quan hệ Cha Mẹ -> Con) vào Dagre
  // Lưu ý: Nối từ "Nhóm Cha Mẹ" -> "Nhóm Con"
  members.forEach(m => {
    if (!m.fatherId && !m.motherId) return;
    
    const childCoupleId = memberToCoupleId.get(m.id);
    const parentId = m.fatherId || m.motherId; // Ưu tiên cha
    const parentCoupleId = parentId ? memberToCoupleId.get(parentId) : null;

    if (childCoupleId && parentCoupleId && childCoupleId !== parentCoupleId) {
      // Chỉ thêm edge nếu chưa có để tránh duplicate
      const edgeName = `${parentCoupleId}-${childCoupleId}`;
      if (!g.hasEdge(parentCoupleId, childCoupleId)) {
         g.setEdge(parentCoupleId, childCoupleId);
      }
    }
  });

  // 6. Chạy thuật toán Dagre để tính toạ độ cơ bản
  dagre.layout(g);

  // 7. HẬU XỬ LÝ: BẬC THANG (STAIRCASE EFFECT) & GIẢI NÉN TOẠ ĐỘ
  const finalPositions = new Map<string, { x: number, y: number }>();
  
  // Duyệt qua từng nhóm anh em để tạo hiệu ứng bậc thang
  // Gom nhóm anh em theo Cha Mẹ
  const siblingsGroups = new Map<string, string[]>(); // Key: ParentCoupleId, Value: List ChildCoupleId
  
  couples.forEach((_, childCoupleId) => {
     const node = g.node(childCoupleId);
     // Hack: Dagre không lưu parent info, ta phải dò lại
     // Tìm xem couple này là con của ai
     // (Logic đơn giản hóa: Lấy ID người đầu tiên trong couple, check father)
     const firstMemberId = couples.get(childCoupleId)?.[0];
     const mem = memberMap.get(firstMemberId!);
     const parentId = mem?.fatherId || mem?.motherId;
     
     if (parentId) {
       const pCid = memberToCoupleId.get(parentId) || 'root';
       if (!siblingsGroups.has(pCid)) siblingsGroups.set(pCid, []);
       if (!siblingsGroups.get(pCid)?.includes(childCoupleId)) {
          siblingsGroups.get(pCid)?.push(childCoupleId);
       }
     } else {
       // Root nodes (Cụ tổ)
       if (!siblingsGroups.has('root')) siblingsGroups.set('root', []);
       siblingsGroups.get('root')?.push(childCoupleId);
     }
  });

  // Áp dụng offset bậc thang
  siblingsGroups.forEach((childCoupleIds) => {
    // Sắp xếp lại anh em theo X (để đảm bảo thứ tự Dagre đã tính: Trái -> Phải)
    childCoupleIds.sort((a, b) => g.node(a).x - g.node(b).x);

    childCoupleIds.forEach((cid, index) => {
      const nodeInfo = g.node(cid);
      // Hiệu ứng bậc thang: Người em (index cao) sẽ thấp hơn người anh
      // offsetY = index * STAIR_OFFSET
      nodeInfo.y += (index * STAIR_OFFSET); 
    });
  });

  // 8. Tính toạ độ cuối cùng cho từng thành viên
  couples.forEach((ids, coupleId) => {
    const nodeInfo = g.node(coupleId);
    // nodeInfo.x là tâm của cả nhóm. Cần tính toán lại góc trái trên.
    const totalWidth = ids.length * NODE_W + (ids.length - 1) * SPOUSE_GAP;
    const startX = nodeInfo.x - totalWidth / 2;

    ids.forEach((memId, idx) => {
      // Vợ chồng nằm ngang hàng nhau (cùng Y)
      // Người thứ 2 (Vợ) sẽ nằm bên phải người thứ 1
      const posX = startX + idx * (NODE_W + SPOUSE_GAP);
      const posY = nodeInfo.y;
      
      finalPositions.set(memId, { x: posX, y: posY });
    });
  });

  // 9. Tạo React Flow Nodes
  const flowNodes: Node[] = members.map(m => {
    const pos = finalPositions.get(m.id) || { x: 0, y: 0 };
    // Lấy tên vợ/chồng để hiển thị phụ (nếu cần)
    const spouse = m.spouseId ? memberMap.get(m.spouseId) : null;
    
    return {
      id: m.id,
      type: 'familyNode', // Custom Node Component
      position: pos,
      data: { 
        ...m, 
        spouseName: spouse?.name, // Truyền tên vợ vào để hiển thị (tuỳ chọn)
        onEdit: onNodeClick 
      },
    };
  });

  // 10. Tạo React Flow Edges (Đường nối)
  const flowEdges: Edge[] = [];
  const addedLinks = new Set<string>();

  members.forEach(m => {
    // A. Nối Cha -> Con
    // Logic mới: Nối từ "Nhóm Cha Mẹ" xuống "Con"
    if (m.fatherId && memberMap.has(m.fatherId)) {
      const linkId = `${m.fatherId}-${m.id}`;
      if (!addedLinks.has(linkId)) {
        flowEdges.push({
          id: linkId,
          source: m.fatherId,
          target: m.id,
          type: 'smoothstep', // Đường vuông góc đẹp
          style: { stroke: '#800000', strokeWidth: 2 },
          // Marker mũi tên
          markerEnd: { type: 'arrowclosed' as any, color: '#800000' }, 
        });
        addedLinks.add(linkId);
      }
    }

    // B. Nối Vợ - Chồng (Đường nét đứt màu hồng)
    if (m.spouseId && memberMap.has(m.spouseId)) {
      // Chỉ vẽ 1 lần cho mỗi cặp
      const [id1, id2] = [m.id, m.spouseId].sort();
      const linkId = `spouse-${id1}-${id2}`;
      
      if (!addedLinks.has(linkId)) {
        const p1 = finalPositions.get(id1);
        const p2 = finalPositions.get(id2);
        
        // Chỉ vẽ nếu 2 người nằm cạnh nhau (Logic gom nhóm đã đảm bảo việc này)
        if (p1 && p2 && Math.abs(p1.y - p2.y) < 10) {
            flowEdges.push({
            id: linkId,
            source: id1,
            target: id2,
            type: 'straight', // Đường thẳng
            style: { stroke: '#BE185D', strokeWidth: 2, strokeDasharray: '5,5' },
            animated: false,
            zIndex: -1, // Nằm dưới node
          });
          addedLinks.add(linkId);
        }
      }
    }
  });

  return { nodes: flowNodes, edges: flowEdges };
}
