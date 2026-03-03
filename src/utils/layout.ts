import dagre from 'dagre';
import { Node, Edge } from 'reactflow';
import { Member } from '../types';

// ── KÍCH THƯỚC NODE ────────────────────────────────────────────────────────
export const NODE_W   = 108;   // rộng hơn chút để tên không xuống hàng
export const NODE_H   = 148;
const SPOUSE_GAP      = 16;    // khoảng cách giữa vợ chồng
const RANK_SEP        = 110;   // khoảng cách giữa các đời (dọc)
const NODE_SEP        = 52;    // khoảng cách giữa các cụm (ngang)
// BỎ STAIR_OFFSET — đây là nguyên nhân gây dính chùm & lệch hàng

// ── LẤY NĂM SINH ──────────────────────────────────────────────────────────
function getBirthYear(m: Member): number {
  if (m.birthYear) return Number(m.birthYear);
  if (m.birthDate) {
    const y = parseInt(m.birthDate.slice(0, 4));
    if (!isNaN(y)) return y;
  }
  return 9999;
}

// ── SẮP XẾP THÀNH VIÊN ────────────────────────────────────────────────────
// Logic: Đời → nhóm theo cha mẹ → năm sinh (anh lớn trước)
// LƯU Ý: Chồng của em gái (dù lớn tuổi) vẫn là em — xếp theo spouseId của vợ
function sortMembers(members: Member[]): Member[] {
  return [...members].sort((a, b) => {
    // 1. Đời
    if (a.generation !== b.generation) return a.generation - b.generation;

    // 2. Gom nhóm theo cha/mẹ chính tộc
    // Ưu tiên fatherId, fallback motherId
    const parentKeyA = a.fatherId || a.motherId || '__root__';
    const parentKeyB = b.fatherId || b.motherId || '__root__';
    if (parentKeyA !== parentKeyB) return parentKeyA.localeCompare(parentKeyB);

    // 3. Cùng cha mẹ: xếp theo năm sinh → ID (để ổn định)
    const yearA = getBirthYear(a);
    const yearB = getBirthYear(b);
    if (yearA !== yearB) return yearA - yearB;
    return a.id.localeCompare(b.id);
  });
}

// ── BUILD LAYOUT ───────────────────────────────────────────────────────────
export function buildFamilyLayout(
  rawMembers: Member[],
  onNodeClick: (m: Member) => void
): { nodes: Node[]; edges: Edge[] } {
  if (rawMembers.length === 0) return { nodes: [], edges: [] };

  const members   = sortMembers(rawMembers);
  const memberMap = new Map(members.map(m => [m.id, m]));

  // ── BƯỚC 1: Gom cặp vợ chồng thành "couple node" ─────────────────────
  // Quy tắc: chồng (Nam) là đại diện, vợ đứng bên phải
  // Nếu cả 2 đều Nam hoặc đều Nữ (hiếm), dùng người có ID nhỏ hơn làm đại diện
  const couples           = new Map<string, string[]>();   // coupleId → [id1, id2?]
  const memberToCoupleId  = new Map<string, string>();
  const processed         = new Set<string>();

  members.forEach(m => {
    if (processed.has(m.id)) return;

    const spouse = m.spouseId ? memberMap.get(m.spouseId) : null;
    if (spouse && !processed.has(spouse.id)) {
      // Xác định ai đứng bên trái (chồng / Nam)
      const isHusband = m.gender === 'Nam';
      const left      = isHusband ? m      : spouse;
      const right     = isHusband ? spouse : m;

      const cid = `couple_${left.id}`;
      couples.set(cid, [left.id, right.id]);
      memberToCoupleId.set(left.id,  cid);
      memberToCoupleId.set(right.id, cid);
      processed.add(m.id);
      processed.add(spouse.id);
    } else {
      const cid = `single_${m.id}`;
      couples.set(cid, [m.id]);
      memberToCoupleId.set(m.id, cid);
      processed.add(m.id);
    }
  });

  // ── BƯỚC 2: Dựng đồ thị Dagre ─────────────────────────────────────────
  const g = new dagre.graphlib.Graph({ compound: false });
  g.setGraph({
    rankdir:  'TB',
    nodesep:  NODE_SEP,
    ranksep:  RANK_SEP,
    align:    'UL',   // căn trái-trên → giảm "drift" ngang
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Set kích thước mỗi couple node
  couples.forEach((ids, cid) => {
    const w = ids.length * NODE_W + (ids.length - 1) * SPOUSE_GAP;
    g.setNode(cid, { width: w, height: NODE_H });
  });

  // Thêm edge cha/mẹ → con (dùng coupleId để Dagre xếp hàng đúng)
  // Mỗi cặp edge chỉ thêm 1 lần
  const addedEdges = new Set<string>();
  members.forEach(m => {
    const childCid = memberToCoupleId.get(m.id);
    const parentId = m.fatherId || m.motherId;
    if (!parentId || !childCid) return;

    const parentCid = memberToCoupleId.get(parentId);
    if (!parentCid || parentCid === childCid) return;

    const eKey = `${parentCid}→${childCid}`;
    if (!addedEdges.has(eKey)) {
      g.setEdge(parentCid, childCid);
      addedEdges.add(eKey);
    }
  });

  dagre.layout(g);

  // ── BƯỚC 3: Tính vị trí pixel cuối cùng ─────────────────────────────
  // KHÔNG dùng staircase offset — để Dagre quyết định hoàn toàn
  // Chỉ tách vị trí từng member trong cặp (trái/phải)
  const finalPos = new Map<string, { x: number; y: number }>();

  couples.forEach((ids, cid) => {
    const node       = g.node(cid);
    if (!node) return;

    const totalWidth = ids.length * NODE_W + (ids.length - 1) * SPOUSE_GAP;
    const startX     = node.x - totalWidth / 2;

    ids.forEach((mid, idx) => {
      finalPos.set(mid, {
        x: startX + idx * (NODE_W + SPOUSE_GAP),
        y: node.y - NODE_H / 2,   // Dagre trả về tâm → convert sang góc trên trái
      });
    });
  });

  // ── BƯỚC 4: Tạo React Flow Nodes ─────────────────────────────────────
  const flowNodes: Node[] = members.map(m => ({
    id:       m.id,
    type:     'familyNode',
    position: finalPos.get(m.id) ?? { x: 0, y: 0 },
    data:     { ...m, onEdit: onNodeClick },
  }));

  // ── BƯỚC 5: Tạo React Flow Edges ─────────────────────────────────────
  const flowEdges: Edge[]  = [];
  const addedLinks         = new Set<string>();

  members.forEach(m => {
    // ── Cha → Con ──
    if (m.fatherId && memberMap.has(m.fatherId)) {
      const key = `f_${m.fatherId}_${m.id}`;
      if (!addedLinks.has(key)) {
        flowEdges.push({
          id:     key,
          source: m.fatherId,
          target: m.id,
          type:   'smoothstep',
          style:  { stroke: '#800000', strokeWidth: 1.6 },
          markerEnd: { type: 'arrowclosed' as any, color: '#800000', width: 14, height: 14 },
        });
        addedLinks.add(key);
      }
    }

    // ── Mẹ → Con (chỉ khi không có cha, hoặc cha khác mẹ) ──
    if (m.motherId && memberMap.has(m.motherId) && m.motherId !== m.fatherId) {
      // Nếu đã có edge từ cha rồi, chỉ vẽ thêm nếu mẹ khác cha
      const alreadyHasFather = !!m.fatherId && memberMap.has(m.fatherId);
      // Luôn vẽ edge mẹ → con (kể cả khi có cha) để thể hiện mối quan hệ
      const key = `m_${m.motherId}_${m.id}`;
      if (!addedLinks.has(key) && !alreadyHasFather) {
        // Chỉ vẽ nếu không có cha (tránh vẽ 2 đường từ cùng 1 cặp)
        flowEdges.push({
          id:     key,
          source: m.motherId,
          target: m.id,
          type:   'smoothstep',
          style:  { stroke: '#BE185D', strokeWidth: 1.4, strokeDasharray: '5,4' },
          markerEnd: { type: 'arrowclosed' as any, color: '#BE185D', width: 12, height: 12 },
        });
        addedLinks.add(key);
      }
    }

    // ── Vợ — Chồng (đường ngang) ──
    if (m.spouseId && memberMap.has(m.spouseId)) {
      const [id1, id2] = [m.id, m.spouseId].sort();
      const key = `sp_${id1}_${id2}`;
      if (!addedLinks.has(key)) {
        const p1 = finalPos.get(id1);
        const p2 = finalPos.get(id2);
        // Chỉ vẽ nếu 2 người thực sự nằm cạnh nhau (cùng hàng Y, trong vòng 20px)
        if (p1 && p2 && Math.abs(p1.y - p2.y) < 20) {
          flowEdges.push({
            id:     key,
            source: id1,
            target: id2,
            type:   'straight',
            style:  { stroke: '#B8860B', strokeWidth: 1.5, strokeDasharray: '6,3' },
            zIndex: -1,
          });
          addedLinks.add(key);
        }
      }
    }
  });

  return { nodes: flowNodes, edges: flowEdges };
}
