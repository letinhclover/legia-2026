import dagre from 'dagre';
import { Node, Edge } from 'reactflow';
import { Member } from '../types';

export const NODE_W = 145;
export const NODE_H = 148;

const SPOUSE_GAP      = 28;
const RANK_SEP        = 200;
const NODE_SEP        = 50;
const SIBLING_STAGGER = 14; // Y stagger nhẹ: anh cả cao nhất

function getBirthYear(m: Member): number {
  if (!m.birthDate) return Infinity;
  const y = parseInt(m.birthDate.slice(0, 4));
  return isNaN(y) ? Infinity : y;
}

function sortByBirth(arr: Member[]): Member[] {
  return [...arr].sort((a, b) =>
    getBirthYear(a) - getBirthYear(b) || a.id.localeCompare(b.id)
  );
}

function buildSortedMembers(members: Member[]): {
  sorted: Member[];
  siblingOrder: Map<string, string[]>;
} {
  // Nhóm anh em theo cha (ưu tiên) hoặc mẹ
  const groups = new Map<string, Member[]>();
  members.forEach(m => {
    const key = m.fatherId ?? m.motherId ?? '__root__';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  });

  // Sort từng nhóm theo birthYear tăng dần (anh cả trước)
  const siblingOrder = new Map<string, string[]>();
  groups.forEach((g, parentId) => {
    const sorted = sortByBirth(g);
    groups.set(parentId, sorted);
    if (parentId !== '__root__') {
      siblingOrder.set(parentId, sorted.map(m => m.id));
    }
  });

  // BFS để tạo thứ tự xử lý
  const visited = new Set<string>();
  const sorted: Member[] = [];
  const roots = sortByBirth(members.filter(m => !m.fatherId && !m.motherId));

  const queue = [...roots];
  while (queue.length) {
    const cur = queue.shift()!;
    if (visited.has(cur.id)) continue;
    visited.add(cur.id);
    sorted.push(cur);
    queue.push(...(groups.get(cur.id) ?? []).filter(c => !visited.has(c.id)));
  }
  members.forEach(m => { if (!visited.has(m.id)) sorted.push(m); });
  return { sorted, siblingOrder };
}

export function buildFamilyLayout(
  members: Member[],
  onNodeClick: (m: Member) => void
): { nodes: Node[]; edges: Edge[] } {
  if (members.length === 0) return { nodes: [], edges: [] };

  const memberMap = new Map(members.map(m => [m.id, m]));
  const { sorted: sortedMembers, siblingOrder } = buildSortedMembers(members);

  // ── Bước 1: Couple groups — chồng trái, vợ phải ──────────────────
  const processedSpouse = new Set<string>();
  const coupleGroups: Array<{ id: string; members: string[] }> = [];
  const memberToGroup = new Map<string, string>();

  sortedMembers.forEach(m => {
    if (processedSpouse.has(m.id)) return;
    const spouse = m.spouseId ? memberMap.get(m.spouseId) : null;
    if (spouse && !processedSpouse.has(spouse.id)) {
      const husband = m.gender === 'Nam' ? m : spouse;
      const wife    = m.gender === 'Nam' ? spouse : m;
      const gid = `couple_${husband.id}`;
      coupleGroups.push({ id: gid, members: [husband.id, wife.id] });
      memberToGroup.set(husband.id, gid);
      memberToGroup.set(wife.id, gid);
      processedSpouse.add(m.id);
      processedSpouse.add(spouse.id);
    } else {
      const gid = `single_${m.id}`;
      coupleGroups.push({ id: gid, members: [m.id] });
      memberToGroup.set(m.id, gid);
      processedSpouse.add(m.id);
    }
  });

  const groupMap = new Map(coupleGroups.map(g => [g.id, g]));

  // ── Bước 2: Dagre layout ──────────────────────────────────────────
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: NODE_SEP, ranksep: RANK_SEP });

  coupleGroups.forEach(group => {
    const w = group.members.length === 2 ? NODE_W * 2 + SPOUSE_GAP : NODE_W;
    g.setNode(group.id, { width: w, height: NODE_H });
  });

  const addedGroupEdges = new Set<string>();
  members.forEach(child => {
    const cg = memberToGroup.get(child.id)!;
    for (const pid of [child.fatherId, child.motherId].filter(Boolean) as string[]) {
      const pg = memberToGroup.get(pid);
      if (!pg || pg === cg) continue;
      const key = `${pg}→${cg}`;
      if (!addedGroupEdges.has(key)) { addedGroupEdges.add(key); g.setEdge(pg, cg); }
    }
  });

  dagre.layout(g);

  // ── Bước 3: Pixel positions từ dagre ────────────────────────────
  const positions = new Map<string, { x: number; y: number }>();
  const groupPositions = new Map<string, { x: number; y: number; width: number }>();

  coupleGroups.forEach(group => {
    const gPos = g.node(group.id);
    if (!gPos) return;
    const baseY = gPos.y - NODE_H / 2;
    const left  = gPos.x - gPos.width / 2;
    groupPositions.set(group.id, { x: left, y: baseY, width: gPos.width });

    if (group.members.length === 2) {
      const [husbandId, wifeId] = group.members;
      positions.set(husbandId, { x: left,                       y: baseY });
      positions.set(wifeId,    { x: left + NODE_W + SPOUSE_GAP, y: baseY });
    } else {
      positions.set(group.members[0], { x: gPos.x - NODE_W / 2, y: baseY });
    }
  });

  // ── Bước 4: FIX SIBLING X ORDER — đây là fix quan trọng nhất ─────
  // Dagre không đảm bảo thứ tự X của anh em theo birthYear.
  // Ta lấy tập X positions mà dagre đã chọn cho anh em,
  // sort theo birthYear, gán lại: anh cả → X nhỏ nhất (trái nhất)
  siblingOrder.forEach(ids => {
    if (ids.length < 2) return;

    // Lấy groupId của mỗi anh em
    const sibGroupIds = ids.map(id => memberToGroup.get(id)).filter(Boolean) as string[];
    // Loại trùng (vì 2 người trong 1 couple chỉ cần 1 groupId)
    const uniqueGroupIds = [...new Set(sibGroupIds)];
    if (uniqueGroupIds.length < 2) return;

    // Lấy left-X của mỗi group theo dagre
    const groupXList = uniqueGroupIds.map(gid => ({
      gid,
      leftX: groupPositions.get(gid)?.x ?? 0,
      y: groupPositions.get(gid)?.y ?? 0,
      width: groupPositions.get(gid)?.width ?? NODE_W,
    }));

    // Sort X positions tăng dần (trái → phải)
    const sortedXList = [...groupXList].sort((a, b) => a.leftX - b.leftX);

    // Sort group IDs theo birthYear của người đại diện (người đầu trong group)
    const sortedGroupsByBirth = [...uniqueGroupIds].sort((gidA, gidB) => {
      const reprA = memberMap.get(groupMap.get(gidA)?.members[0] ?? '');
      const reprB = memberMap.get(groupMap.get(gidB)?.members[0] ?? '');
      const ya = reprA ? getBirthYear(reprA) : Infinity;
      const yb = reprB ? getBirthYear(reprB) : Infinity;
      return ya - yb; // anh cả (năm nhỏ nhất) → index 0 → X nhỏ nhất (trái)
    });

    // Gán lại: group có birthYear nhỏ nhất → X nhỏ nhất (trái nhất)
    sortedGroupsByBirth.forEach((gid, rankIdx) => {
      const targetX = sortedXList[rankIdx].leftX;
      const targetY = groupPositions.get(gid)?.y ?? 0;
      const group   = groupMap.get(gid);
      if (!group) return;

      // Cập nhật groupPositions
      const gp = groupPositions.get(gid);
      if (gp) groupPositions.set(gid, { ...gp, x: targetX });

      // Cập nhật positions của từng member trong group
      if (group.members.length === 2) {
        positions.set(group.members[0], { x: targetX,                       y: targetY });
        positions.set(group.members[1], { x: targetX + NODE_W + SPOUSE_GAP, y: targetY });
      } else {
        positions.set(group.members[0], { x: targetX, y: targetY });
      }
    });

    // ── Bước 5: Stagger Y nhẹ — anh cả cao nhất (Y nhỏ nhất) ────────
    // Sau khi X đã đúng, thêm stagger Y nhẹ theo thứ tự trái→phải
    sortedGroupsByBirth.forEach((gid, rankIdx) => {
      if (rankIdx === 0) return; // anh cả: giữ nguyên Y
      const group = groupMap.get(gid);
      if (!group) return;
      const anchorGroup = groupMap.get(sortedGroupsByBirth[0]);
      if (!anchorGroup) return;
      const anchorY = positions.get(anchorGroup.members[0])?.y ?? 0;
      const newY    = anchorY + rankIdx * SIBLING_STAGGER;
      group.members.forEach(mId => {
        const pos = positions.get(mId);
        if (pos) positions.set(mId, { ...pos, y: newY });
      });
    });
  });

  // ── Bước 6: Anti-overlap cuối cùng per generation ─────────────────
  const byGen = new Map<number, string[]>();
  members.forEach(m => {
    if (!byGen.has(m.generation)) byGen.set(m.generation, []);
    byGen.get(m.generation)!.push(m.id);
  });
  byGen.forEach(ids => {
    ids.sort((a, b) => (positions.get(a)?.x ?? 0) - (positions.get(b)?.x ?? 0));
    for (let i = 1; i < ids.length; i++) {
      const prev = positions.get(ids[i - 1]);
      const cur  = positions.get(ids[i]);
      if (!prev || !cur) continue;
      if (cur.x - prev.x < NODE_W + 12)
        positions.set(ids[i], { x: prev.x + NODE_W + 12, y: cur.y });
    }
  });

  // ── Bước 7: React Flow nodes ──────────────────────────────────────
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

  // ── Bước 8: Edges ─────────────────────────────────────────────────
  const flowEdges: Edge[] = [];
  const memberIds   = new Set(members.map(m => m.id));
  const addedFlow   = new Set<string>();
  const addedSpouse = new Set<string>();

  members.forEach(m => {
    if (m.fatherId && memberIds.has(m.fatherId)) {
      const key = `f-${m.fatherId}-${m.id}`;
      if (!addedFlow.has(key)) {
        addedFlow.add(key);
        flowEdges.push({
          id: key, source: m.fatherId, target: m.id,
          type: 'smoothstep',
          style: { stroke: '#800000', strokeWidth: 2.5 },
          markerEnd: { type: 'arrowclosed' as any, color: '#800000' },
        });
      }
    }
    if (m.motherId && memberIds.has(m.motherId) && !m.fatherId) {
      const key = `m-${m.motherId}-${m.id}`;
      if (!addedFlow.has(key)) {
        addedFlow.add(key);
        flowEdges.push({
          id: key, source: m.motherId, target: m.id,
          type: 'smoothstep',
          style: { stroke: '#BE185D', strokeWidth: 1.8, strokeDasharray: '6,3' },
        });
      }
    }
    if (m.spouseId && memberIds.has(m.spouseId)) {
      const pairKey = [m.id, m.spouseId].sort().join('|');
      if (!addedSpouse.has(pairKey)) {
        addedSpouse.add(pairKey);
        const husband = m.gender === 'Nam' ? m : memberMap.get(m.spouseId)!;
        const wife    = m.gender === 'Nam' ? memberMap.get(m.spouseId)! : m;
        flowEdges.push({
          id: `spouse-${pairKey}`,
          source: husband?.id ?? m.id,
          target: wife?.id ?? m.spouseId,
          type: 'straight',
          style: { stroke: '#B8860B', strokeWidth: 2, strokeDasharray: '8,4' },
          label: '💑', labelStyle: { fontSize: 10 },
          labelBgStyle: { fill: 'transparent' },
        });
      }
    }
  });

  return { nodes: flowNodes, edges: flowEdges };
}
